(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = {pass:'通过',fail:'失败',skip:'待复核'};
  const schema = 'ai_assistant.cloud_review.v1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const text = (value, limit, multiline = false) => typeof value === 'string' && value.length <= limit && !(multiline ? /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/ : /[\u0000-\u001f\u007f-\u009f]/).test(value);
  const time = value => value ? new Date(value).toLocaleString('zh-CN', {hour12:false}) : '未修改';
  const drafts = new Map(); // Unsaved work stays in memory; never persist credentials or drafts.
  let config = null, base = null, state = null, session = null, busy = false, currentEdit = null;
  let configured = false, connected = false, configError = '';

  function notice(message, error = false) {
    $('status-message').textContent = message;
    $('status-message').classList.toggle('error', error);
  }
  function identityEqual(value) {
    return plain(value) && ['report_id','run_id','environment','source_digest'].every(key => value[key] === base.identity[key]);
  }
  function validOverride(value) {
    if (value === null) return true;
    if (!plain(value) || Object.keys(value).sort().join(',') !== 'business_reason,business_status,failure_categories') return false;
    if (!Object.hasOwn(labels,value.business_status) || !text(value.business_reason,6000,true) || !value.business_reason.trim()) return false;
    if (!Array.isArray(value.failure_categories) || value.failure_categories.length > 20 || !value.failure_categories.every(x => text(x,100) && x.trim())) return false;
    if (new Set(value.failure_categories).size !== value.failure_categories.length) return false;
    return value.business_status === 'fail' || value.failure_categories.length === 0;
  }
  function sameOverride(left, right) {
    if (left === null || right === null) return left === right;
    return left.business_status === right.business_status && left.business_reason === right.business_reason && JSON.stringify(left.failure_categories) === JSON.stringify(right.failure_categories);
  }
  function validateBase(value) {
    if (!plain(value) || !plain(value.identity) || !Array.isArray(value.rows) || !value.rows.length) throw Error('原始报告格式不正确，已停止连接。');
    const i = value.identity;
    if (!/^review-[a-f0-9]{24}$/.test(i.report_id) || !text(i.run_id,200) || !i.run_id || !['test','pre','prod'].includes(i.environment) || !/^[a-f0-9]{64}$/.test(i.source_digest)) throw Error('原始报告身份无效，已停止连接。');
    const ids = new Set();
    for (const row of value.rows) {
      if (!plain(row) || !text(row.case_id,100) || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}$/.test(row.case_id) || ids.has(row.case_id) || !Object.hasOwn(labels,row.status) || !text(row.title,12000,true) || !text(row.reason,100000,true) || !text(row.module,1000,true) || !text(row.scenario,2000,true) || !Array.isArray(row.failure_categories) || !row.failure_categories.every(x=>text(x,1000)) || !(row.latency_ms === null || (Number.isFinite(row.latency_ms) && row.latency_ms >= 0))) throw Error('原始用例数据无效或编号重复，已停止连接。');
      ids.add(row.case_id);
    }
    return value;
  }
  function validateConfig(value) {
    if (!plain(value)) throw Error('配置文件格式不正确。');
    if (value.report_id !== base.identity.report_id || value.source_digest !== base.identity.source_digest) throw Error('配置与原始报告身份不一致，已停止连接。');
    if (!value.project_url || !value.publishable_key) throw Error('尚未配置 Supabase。请提供 Project URL 和 Publishable Key（或 anon key），由管理员初始化数据库及报告授权。无需提供管理员密钥或数据库密码。');
    if (typeof value.project_url !== 'string' || !/^https:\/\/[a-z0-9]{20}\.supabase\.co\/?$/.test(value.project_url)) throw Error('Project URL 必须是官方 https://项目标识.supabase.co 地址。');
    const key = value.publishable_key;
    let allowed = typeof key === 'string' && key.length < 10000 && /^sb_publishable_[A-Za-z0-9_-]{16,}$/.test(key);
    if (!allowed && typeof key === 'string' && key.length < 10000 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
      try { const segment = key.split('.')[1]; const payload = JSON.parse(atob(segment.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(segment.length/4)*4,'='))); allowed = payload.role === 'anon'; } catch { allowed = false; }
    }
    if (!allowed) throw Error('只允许 Publishable Key 或 role=anon 的旧版公开密钥。禁止放入 secret / service_role 管理员密钥。');
    return {...value,project_url:value.project_url.replace(/\/$/,'')};
  }
  function validateSnapshot(value) {
    if (!plain(value) || value.schema !== schema || !identityEqual(value.identity) || !integer(value.revision) || !Array.isArray(value.cases) || !Array.isArray(value.history)) throw Error('云端快照身份或格式不匹配；未应用任何更改。');
    if (!plain(value.current_actor) || !session || value.current_actor.id !== session.userId || !text(value.current_actor.name,254) || !['reviewer','viewer'].includes(value.current_actor.role)) throw Error('云端返回的账号身份或权限无效；已拒绝操作。');
    const ids = new Set(base.rows.map(row => row.case_id)), seen = new Set();
    for (const row of value.cases) {
      if (!plain(row) || !ids.has(row.case_id) || seen.has(row.case_id) || !integer(row.version) || row.version > value.revision || !validOverride(row.override) || !(row.updated_by === null || text(row.updated_by,128)) || !(row.updated_at === null || (text(row.updated_at,100) && Number.isFinite(Date.parse(row.updated_at))))) throw Error('云端用例数据不完整或无效；未应用任何更改。');
      seen.add(row.case_id);
    }
    if (seen.size !== ids.size) throw Error('云端用例集合与原始报告不一致；未应用任何更改。');
    if (value.history.length !== value.revision) throw Error('云端审计记录不完整；未应用任何更改。');
    let prior = 0;
    const latest = new Map(), versions = new Map();
    for (const item of value.history) {
      if (!plain(item) || !integer(item.revision) || item.revision !== prior+1 || item.revision > value.revision || !ids.has(item.case_id) || !text(item.actor,128) || !item.actor || !text(item.actor_name,254) || !text(item.at,100) || !Number.isFinite(Date.parse(item.at)) || !validOverride(item.before) || !validOverride(item.after)) throw Error('云端审计记录无效；未应用任何更改。');
      if (!sameOverride(item.before, latest.get(item.case_id)?.after ?? null)) throw Error('云端审计记录前后结果不连续；未应用任何更改。');
      latest.set(item.case_id,item); versions.set(item.case_id,(versions.get(item.case_id)||0)+1);
      prior = item.revision;
    }
    for (const row of value.cases) {
      const item = latest.get(row.case_id);
      if (row.version !== (versions.get(row.case_id)||0) || !sameOverride(row.override,item?.after ?? null) || row.updated_by !== (item?.actor ?? null) || row.updated_at !== (item?.at ?? null)) throw Error('云端当前结果与完整审计记录不一致；未应用任何更改。');
    }
    // Keep only the documented public review fields; unexpected response fields
    // must never leak into a downloaded snapshot.
    return {
      schema:value.schema,identity:{report_id:base.identity.report_id,run_id:base.identity.run_id,environment:base.identity.environment,source_digest:base.identity.source_digest},revision:value.revision,
      current_actor:{id:value.current_actor.id,name:value.current_actor.name,role:value.current_actor.role},
      cases:value.cases.map(row=>({case_id:row.case_id,version:row.version,override:row.override,updated_by:row.updated_by,updated_at:row.updated_at})),
      history:value.history.map(item=>({revision:item.revision,case_id:item.case_id,actor:item.actor,actor_name:item.actor_name,at:item.at,before:item.before,after:item.after}))
    };
  }
  function effectiveRows() {
    if (!base) return [];
    const byId = new Map((state?.cases || []).map(row => [row.case_id,row]));
    return base.rows.map(original => {
      const remote = byId.get(original.case_id), override = remote?.override;
      return {...original,original_status:original.status,original_reason:original.reason,status:override?.business_status || original.status,reason:override?.business_reason || original.reason,failure_categories:override?.failure_categories || original.failure_categories,version:remote?.version ?? 0,updated_by:remote?.updated_by || null,updated_at:remote?.updated_at || null,override:override || null};
    });
  }
  const canWrite = () => connected && session && state?.current_actor.role === 'reviewer';
  function controls() {
    $('login-submit').disabled = busy || !configured;
    $('login-email').disabled = busy || !configured;
    $('login-password').disabled = busy || !configured;
    $('logout').disabled = busy;
    $('refresh').disabled = busy || !connected;
    $('export-snapshot').disabled = busy || !connected;
    for (const el of document.querySelectorAll('[data-edit-case]')) el.disabled = busy || !canWrite();
    for (const id of ['edit-save','edit-refresh','edit-status','edit-categories']) $(id).disabled = busy || !canWrite();
    $('edit-reason').disabled = busy || !canWrite() || $('edit-status').value === 'reset';
    $('edit-cancel').disabled = busy;
    $('login-form').hidden = connected;
    $('signed-in').hidden = !connected;
    $('connection-badge').textContent = connected ? '已连接真实云端' : configured ? '未登录云端' : '云端尚未配置';
    $('connection-badge').classList.toggle('connected',connected);
  }
  function preserveDraft() {
    if (!currentEdit) return;
    drafts.set(`${currentEdit.actor_id}:${currentEdit.case_id}`, {...currentEdit,status:$('edit-status').value,reason:$('edit-reason').value,categories:$('edit-categories').value});
  }
  function expire() {
    preserveDraft();
    session = null; state = null; connected = false;
    if ($('edit-dialog').open) $('edit-dialog').close();
    currentEdit = null;
    render();
  }
  function requireSession() {
    if (!session || session.expiresAt <= Date.now()) { expire(); throw Error('登录已过期。未提交草稿仍在此页面内存中，请重新登录同一账号后继续。不要刷新页面。'); }
  }
  async function request(path, payload, authenticated = true) {
    if (!configured) throw Error('尚未完成云端配置；没有发出云端请求。');
    if (authenticated) requireSession();
    const controller = new AbortController(), timeout = setTimeout(() => controller.abort(),30000);
    try {
      const headers = {'Content-Type':'application/json',apikey:config.publishable_key};
      if (authenticated) headers.Authorization = `Bearer ${session.accessToken}`;
      const response = await fetch(config.project_url + path, {method:payload === undefined?'GET':'POST',headers,credentials:'omit',cache:'no-store',referrerPolicy:'no-referrer',redirect:'error',signal:controller.signal,body:payload === undefined?undefined:JSON.stringify(payload)});
      if (response.status === 204 && response.ok) return null;
      let result; try { result = await response.json(); } catch { throw Error('云端响应不是有效 JSON。操作结果尚未确认，请先拉取最新结果核对。'); }
      if (!response.ok) {
        const conflict = response.status === 409 || (result?.code === 'P0001' && result?.message === 'VERSION_CONFLICT');
        const sourceMismatch = result?.code === 'P0001' && result?.message === 'SOURCE_MISMATCH';
        const error = Error(conflict ? '版本冲突：另一位复核员已修改此用例。草稿已保留，请核对最新结果后明确提交。' : sourceMismatch ? '云端与原始报告的数据指纹不一致，已拒绝操作。请联系管理员核对报告批次。' : response.status === 401 ? authenticated ? '登录已失效，草稿已保留。请重新登录同一账号。' : '登录失败，请核对邮箱、密码及账号是否已启用。' : response.status === 403 ? '当前账号没有本报告的访问或修改权限，请联系管理员授权。' : response.status === 404 ? '云端报告或复核接口未初始化，请联系管理员核对配置。' : response.status === 429 ? '请求过于频繁，请稍后重试；不会自动重复提交。' : !authenticated ? '登录失败，请核对邮箱、密码及账号是否已启用。' : '云端操作未完成。请核对配置、权限和服务状态；不会回退到模拟数据。');
        error.status = conflict ? 409 : response.status;
        if ((response.status === 401 || response.status === 403) && authenticated) expire();
        throw error;
      }
      return result;
    } catch (error) {
      if (error.name === 'AbortError' || error instanceof TypeError) throw Error('无法确认云端操作结果（网络异常或超时）。草稿已保留；先拉取最新结果核对，不要直接重复提交。');
      throw error;
    } finally { clearTimeout(timeout); }
  }
  async function operation(callback) {
    if (busy) return;
    busy = true; controls();
    try { await callback(); } catch(error) { notice(error.message,true); }
    finally { busy = false; controls(); }
  }
  function accept(value) {
    const validated = validateSnapshot(value);
    if (state && validated.revision < state.revision) throw Error('云端返回旧版本快照，已拒绝回退；请联系管理员核对。');
    state = validated; connected = true; render();
  }
  const snapshot = () => request('/rest/v1/rpc/ai_review_snapshot',{p_report_id:base.identity.report_id,p_source_digest:base.identity.source_digest});
  function render() {
    if (!base) { controls(); return; }
    const rows = effectiveRows(), passed = rows.filter(row=>row.status==='pass').length, failed = rows.filter(row=>row.status==='fail').length, pending = rows.length-passed-failed;
    const metrics = [['用例总数',rows.length,base.identity.environment+' 环境'],['通过',passed,'业务结果'],['失败',failed,'业务结果'],['待复核',pending,'不计通过率分母'],['任务完成率',passed+failed?(100*passed/(passed+failed)).toFixed(1)+'%':'未评估',`${passed} / ${passed+failed} 条可判定`]];
    $('summary').innerHTML = metrics.map(([name,value,note],i)=>`<div class="metric ${i===4?'primary-metric':''}"><span>${name}</span><b>${esc(value)}</b><small>${esc(note)}</small></div>`).join('');
    $('cloud-version').textContent = state ? `云端 r${state.revision}${connected?'':' · 上次读取，当前未连接'}` : '未连接';
    $('results-source').textContent = state ? connected ? `已读取云端 r${state.revision}。原始裁判保留；未提交草稿不计入汇总。` : `以下含上次读取的云端 r${state.revision}，不是当前实时结果。请重新登录。` : '以下为报告原始结果，尚未读取云端复核。';
    $('run-label').textContent = base.identity.run_id;
    $('actor-label').textContent = state ? `${state.current_actor.name} · ${state.current_actor.role==='reviewer'?'复核员（可修改）':'只读账号'}` : '';
    $('audit-count').textContent = state ? `${state.history.length} 条记录` : '';
    $('audit-list').innerHTML = !state ? '<li>登录并获得报告访问授权后，可读取云端修改记录。</li>' : state.history.length ? [...state.history].reverse().map(item=>`<li><strong>${esc(item.actor_name)}</strong> · ${esc(item.case_id)} · ${esc(labels[item.before?.business_status] || '原始裁判')} → ${esc(labels[item.after?.business_status] || '恢复原判')} <time>${esc(time(item.at))}</time><small>云端 r${item.revision} · ${esc(item.after?.business_reason || '移除人工覆盖；原始裁判恢复，历史记录保留。')}</small></li>`).join('') : '<li>尚无人工复核修改。</li>';
    renderCases(); controls();
  }
  function renderCases() {
    const q = $('search').value.trim().toLowerCase(), status = $('filter-status').value, priority = $('filter-priority').value, all = effectiveRows();
    const select = $('filter-priority'), previous = select.value; while(select.options.length>1)select.remove(1); for(const value of [...new Set(all.map(row=>row.priority).filter(Boolean))].sort())select.add(new Option(value,value)); select.value=previous; if(select.selectedIndex<0)select.selectedIndex=0;
    const rows = all.filter(row=>(!status || row.status===status) && (!priority || row.priority===priority) && (!q || [row.case_id,row.title,row.module,row.scenario,row.reason].join(' ').toLowerCase().includes(q)));
    const names = new Map((state?.history || []).map(item=>[item.actor,item.actor_name]));
    $('result-count').textContent = `显示 ${rows.length} / ${all.length} 条`;
    $('case-table').querySelector('tbody').innerHTML = rows.map(row=>`<tr data-case-id="${esc(row.case_id)}"><td><span class="case-id">${esc(row.case_id)}</span><small>${esc(row.module)}</small><small>${esc(row.scenario)}</small></td><td><p class="case-question">${esc(row.title)}</p><p class="case-reason">${esc(row.reason)}</p><details><summary>原始结果：${esc(labels[row.original_status])}</summary><p>${esc(row.original_reason)}</p></details></td><td>${esc(row.priority||'未标注')}</td><td><span data-case-status class="badge ${esc(row.status)}">${esc(labels[row.status])}</span><small>${row.override?'人工复核':row.updated_by?'已恢复原判':'原始裁判'}</small>${row.failure_categories.length?`<small>${esc(row.failure_categories.join('、'))}</small>`:''}</td><td>${row.latency_ms===null?'未观测':(row.latency_ms/1000).toFixed(1)+'s'}</td><td>${esc(names.get(row.updated_by) || (row.updated_by?'已授权复核员':'—'))}<small>${esc(time(row.updated_at))}</small><small>${state?'用例版本 v'+row.version:'未读取云端版本'}</small></td><td><button data-edit-case="${esc(row.case_id)}" ${busy||!canWrite()?'disabled':''}>修改结果</button></td></tr>`).join('');
  }
  function originalAndCurrent(row) {
    $('edit-original').textContent = `${labels[row.original_status]}：${row.original_reason}`;
    $('edit-current').textContent = `${labels[row.status]} · v${row.version}\n${row.reason}`;
    $('edit-version').textContent = `草稿基于 v${currentEdit.base_version}`;
  }
  function formMode() {
    $('edit-reason').required = $('edit-status').value !== 'reset';
    $('categories-field').hidden = $('edit-status').value !== 'fail';
    controls();
  }
  function openEdit(id) {
    if (busy || !canWrite()) return;
    try { requireSession(); } catch(error) { notice(error.message,true); return; }
    const row = effectiveRows().find(item=>item.case_id===id); if (!row) return;
    currentEdit = {case_id:id,base_version:row.version,actor_id:session.userId};
    $('edit-title').textContent = id+' · 人工复核'; $('edit-question').textContent = row.title;
    $('edit-status').value = row.status; $('edit-reason').value = ''; $('edit-categories').value = row.failure_categories.join('，');
    $('edit-feedback').textContent = ''; $('edit-refresh').hidden = true;
    const draft = drafts.get(`${session.userId}:${id}`);
    if (draft) {
      currentEdit.base_version = draft.base_version;
      $('edit-status').value = draft.status; $('edit-reason').value = draft.reason; $('edit-categories').value = draft.categories;
      $('edit-feedback').textContent = '已恢复当前页面内存中的未提交草稿。';
      if (row.version!==draft.base_version) { $('edit-feedback').textContent += ' 云端版本已变化，请先查看最新版本。'; $('edit-refresh').hidden = false; }
    }
    originalAndCurrent(row); formMode(); $('edit-dialog').showModal();
  }
  $('login-form').onsubmit = event => {
    event.preventDefault(); if (busy || !configured) return;
    const email = $('login-email').value.trim(), password = $('login-password').value;
    $('login-password').value = '';
    operation(async()=>{
      session = null; state = null; connected = false; render();
      try {
        const auth = await request('/auth/v1/token?grant_type=password',{email,password},false);
        if (!plain(auth) || typeof auth.access_token!=='string' || !auth.access_token || !plain(auth.user) || !text(auth.user.id,128) || !auth.user.id || !Number.isFinite(auth.expires_in) || auth.expires_in<=0) throw Error('登录响应无效；没有建立云端连接。');
        session = {accessToken:auth.access_token,userId:auth.user.id,expiresAt:Date.now()+auth.expires_in*1000};
        const user = await request('/auth/v1/user');
        if (!plain(user) || user.id!==session.userId) throw Error('无法验证登录身份；没有建立云端连接。');
        const value = await snapshot();
        // Do not carry another account's cached result into a newly authenticated view.
        if (state?.current_actor.id!==session.userId) state = null;
        accept(value);
        notice(`已连接真实云端，报告版本 r${state.revision}。${canWrite()?'保存会写入真实云端，并记录你的登录身份。':'当前账号只有查看权限，不能保存修改。'}`);
      } catch(error) { session = null; connected = false; render(); throw error; }
    });
  };
  $('logout').onclick = () => operation(async()=>{
    preserveDraft();
    let revoked = false;
    try { await request('/auth/v1/logout',{}); revoked = true; } catch { /* Always clear the in-memory session even if server logout is unavailable. */ }
    session = null; state = null; connected = false; currentEdit = null;
    $('login-password').value = ''; render();
    notice(revoked?'已退出登录，页面内的登录凭据已清除。未提交草稿仅保留在此页面内存中。':'已清除本页面登录凭据。云端退出未确认，其他已登录窗口可能仍有效。');
  });
  $('edit-form').onsubmit = event => {
    event.preventDefault(); if (!currentEdit || busy || !canWrite()) return;
    const status = $('edit-status').value, reason = $('edit-reason').value.trim();
    const override = status==='reset'?null:{business_status:status,business_reason:reason,failure_categories:status==='fail'?[...new Set($('edit-categories').value.split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean))]:[]};
    if (!validOverride(override)) { $('edit-feedback').textContent = '请填写有效理由（最多 6000 字）；失败分类最多 20 项，每项不超过 100 字。'; return; }
    preserveDraft();
    const edit = {...currentEdit};
    operation(async()=>{
      try {
        const result = await request('/rest/v1/rpc/ai_review_save',{p_report_id:base.identity.report_id,p_source_digest:base.identity.source_digest,p_case_id:edit.case_id,p_base_version:edit.base_version,p_override:override});
        accept(result);
        drafts.delete(`${edit.actor_id}:${edit.case_id}`);
        $('edit-dialog').close(); currentEdit = null;
        notice(`已保存到真实云端 r${state.revision}。本地尚未同步；请在本机运行同步工具，再生成新报告。`);
      } catch(error) {
        const message = error.message;
        $('edit-feedback').textContent = message;
        $('edit-refresh').hidden = !(session && currentEdit);
        notice(message,true);
      }
    });
  };
  $('edit-refresh').onclick = () => operation(async()=>{
    if (!currentEdit) return;
    accept(await snapshot());
    const row = effectiveRows().find(item=>item.case_id===currentEdit.case_id);
    if (!row) throw Error('当前用例不属于此报告。');
    currentEdit.base_version = row.version; originalAndCurrent(row); preserveDraft();
    $('edit-feedback').textContent = '已读取最新版本，草稿未改变。请核对上方最新结果，确认后再点击保存；不会自动提交。';
    $('edit-refresh').hidden = true;
  });
  $('edit-cancel').onclick = () => { if (!busy) { preserveDraft(); $('edit-dialog').close(); currentEdit = null; } };
  $('edit-dialog').addEventListener('cancel',event=>{if(busy)event.preventDefault();else{preserveDraft();currentEdit=null;}});
  $('edit-status').onchange = () => {formMode();preserveDraft();};
  for (const id of ['edit-reason','edit-categories']) $(id).oninput = preserveDraft;
  $('case-table').onclick = event => {const button=event.target.closest('[data-edit-case]');if(button)openEdit(button.dataset.editCase);};
  $('search').oninput = renderCases; $('filter-status').onchange = renderCases; $('filter-priority').onchange = renderCases;
  $('refresh').onclick = () => operation(async()=>{accept(await snapshot());notice(`已读取真实云端最新版本 r${state.revision}。这不代表已同步到本地。`);});
  $('export-snapshot').onclick = () => operation(async()=>{
    accept(await snapshot());
    const blob = new Blob([JSON.stringify(state,null,2)+'\n'],{type:'application/json'}), url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download=`cloud-review-${base.identity.report_id.replace(/[^a-zA-Z0-9_-]/g,'_')}-r${state.revision}.json`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    notice(`已下载云端 r${state.revision} 快照（不含登录凭据）。这是备份，不代表已同步到本地或生成报告。`);
  });
  window.addEventListener('beforeunload',event=>{if(busy||drafts.size){event.preventDefault();event.returnValue='';}});
  operation(async()=>{
    const localJson = async file => {const response=await fetch(new URL(file,document.baseURI),{credentials:'omit',cache:'no-store',redirect:'error'});if(!response.ok)throw Error('无法读取 '+file+'；请通过 HTTP(S) 打开部署后的页面。');return response.json();};
    const [rawBase,rawConfig]=await Promise.all([localJson('./report-base.json'),localJson('./config.json')]);
    base=validateBase(rawBase);
    try {config=validateConfig(rawConfig);configured=true;$('config-state').textContent='使用已配置的 Supabase 项目。请以管理员授予本报告权限的账号登录。';}
    catch(error){configured=false;configError=error.message;$('config-state').textContent=configError;}
    render();notice(configured?'原始报告已加载。尚未登录，也没有读取或修改云端数据。':configError,!configured);
  });
})();
