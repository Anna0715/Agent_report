(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = {pass:'通过',fail:'失败',skip:'待复核',pending_qa:'待 QA 复核',deferred:'延期',pending_fix:'待修复'};
  const isFailure = status => ['fail','pending_fix'].includes(status);
  const schema = 'ai_assistant.cloud_review.v1';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const text = (value, limit, multiline = false) => typeof value === 'string' && value.length <= limit && !(multiline ? /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/ : /[\u0000-\u001f\u007f-\u009f]/).test(value);
  const time = value => value ? new Date(value).toLocaleString('zh-CN', {hour12:false}) : '未修改';
  const drafts = new Map(); // Unsaved work stays in memory; never persist credentials or drafts.
  let config = null, base = null, state = null, session = null, busy = false, currentEdit = null;
  let configured = false, connected = false, configError = '';
  let auth = null, stale = false, lastSynced = null;
  const full = window.AICombinedReport;
  let channel;
  try { channel = new BroadcastChannel('ai-review-report-updates'); } catch { /* polling fallback */ }
  const broadcast = () => channel?.postMessage({report_id:base.identity.report_id});

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
    return isFailure(value.business_status) || value.failure_categories.length === 0;
  }
  function sameOverride(left, right) {
    if (left === null || right === null) return left === right;
    return left.business_status === right.business_status && left.business_reason === right.business_reason && JSON.stringify(left.failure_categories) === JSON.stringify(right.failure_categories);
  }
  function validateBase(value) {
    if (!plain(value) || !plain(value.identity) || !Array.isArray(value.rows) || !value.rows.length || !plain(value.summary)) throw Error('原始报告格式不正确，已停止连接。');
    const i = value.identity;
    if (document.body.dataset.sourceDigest && document.body.dataset.sourceDigest !== i.source_digest) throw Error('页面与报告数据不是同一批次，请刷新页面后重试；未读取或修改云端。');
    if (!/^review-[a-f0-9]{24}$/.test(i.report_id) || !text(i.run_id,200) || !i.run_id || !['test','pre','prod','combined'].includes(i.environment) || !/^[a-f0-9]{64}$/.test(i.source_digest)) throw Error('原始报告身份无效，已停止连接。');
    const ids = new Set();
    for (const row of value.rows) {
      if (!plain(row) || !text(row.case_id,100) || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}$/.test(row.case_id) || ids.has(row.case_id) || !['test','pre'].includes(row.source_environment) || !Object.hasOwn(labels,row.status) || !text(row.title,12000,true) || !text(row.reason,100000,true) || !text(row.module,1000,true) || !text(row.scenario,2000,true) || !Array.isArray(row.failure_categories) || !row.failure_categories.every(x=>text(x,1000)) || !(row.latency_ms === null || (Number.isFinite(row.latency_ms) && row.latency_ms >= 0)) || !plain(row.resource_coverage) || !Object.values(row.resource_coverage).every(x=>typeof x==='boolean')) throw Error('原始用例数据无效或编号重复，已停止连接。');
      if (row.display_failure_categories !== undefined && (!Array.isArray(row.display_failure_categories) || !row.display_failure_categories.every(x=>text(x,1000)))) throw Error('原始问题分类无效。');
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
      const status = override?.business_status || original.status;
      return {...original,original_status:original.status,original_reason:original.reason,status,reason:override?.business_reason || original.reason,failure_categories:override?.failure_categories || original.display_failure_categories || original.failure_categories,task_completion_rate:override?(status==='pass'?100:isFailure(status)?0:null):original.task_completion_rate,version:remote?.version ?? 0,updated_by:remote?.updated_by || null,updated_at:remote?.updated_at || null,override:override || null};
    });
  }
  const canWrite = () => connected && !stale && session && state?.current_actor.role === 'reviewer' && document.body.dataset.reviewMode !== 'read';
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
    $('connection-badge').textContent = connected ? stale ? '同步异常 · 显示上次确认版本' : `已连接真实云端 · ${lastSynced?time(lastSynced):''}` : configured ? '未登录云端 · 原始快照' : '云端尚未配置';
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
    if (!session || (auth ? !auth.authenticated : session.expiresAt <= Date.now())) { expire(); throw Error('登录已过期。未提交草稿仍在此页面内存中，请重新登录同一账号后继续。不要刷新页面。'); }
  }
  async function request(path, payload, authenticated = true) {
    if (!configured) throw Error('尚未完成云端配置；没有发出云端请求。');
    if (authenticated) requireSession();
    if (authenticated && auth) return auth.request(path,payload);
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
    try { await callback(); } catch(error) { stale=true;render();notice(error.message,true); }
    finally { busy = false; controls(); }
  }
  function accept(value) {
    let validated;
    try { validated = validateSnapshot(value); }
    catch(error) { if(auth)auth.clear('云端快照校验失败，已停止连接。');else expire(); throw error; }
    if (state && validated.revision < state.revision) throw Error('云端返回旧版本快照，已拒绝回退；请联系管理员核对。');
    state = validated; connected = true; stale = false; lastSynced = new Date().toISOString(); render();
  }
  const snapshot = () => request('/rest/v1/rpc/ai_review_snapshot',{p_report_id:base.identity.report_id,p_source_digest:base.identity.source_digest});
  const fmtNumber = (value, digits=1) => value === null || value === undefined || !Number.isFinite(Number(value)) ? '—' : Number(value).toLocaleString('zh-CN',{maximumFractionDigits:digits,minimumFractionDigits:digits});
  const rateText = metric => metric && Number(metric.total)>0 ? `${(100*Number(metric.pass)/Number(metric.total)).toFixed(1)}%` : '—';
  const rateCard = (name, metric) => `<div class="metric"><span>${esc(name)}</span><b>${esc(rateText(metric))}</b><small>${metric&&Number(metric.total)>0?`${esc(metric.pass)}/${esc(metric.total)}`:'未覆盖'}</small></div>`;
  const metricCard = (name, value, note='') => `<div class="metric"><span>${esc(name)}</span><b>${esc(value)}</b><small>${esc(note)}</small></div>`;
  const onlineCase = row => ['test','pre'].includes(row.source_environment) && !['not_executed','local_fixture_pass'].includes(row.kind);
  function resourceValue(key, metric) {
    if (!metric) return '未采集';
    if (key==='e2e_ms') return metric.average==null?'未采集':`平均 ${fmtNumber(metric.average/1000,1)}s / P50 ${fmtNumber((metric.p50||0)/1000,1)}s / P95 ${fmtNumber((metric.p95||0)/1000,1)}s`;
    if (key==='cache_token_ratio') return metric.ratio==null?'未采集':`${(100*Number(metric.ratio)).toFixed(1)}%`;
    if (key==='cost_usd') return metric.total==null?'未采集':`总计 $${fmtNumber(metric.total,4)} / 平均 $${fmtNumber(metric.average,4)}`;
    if (metric.average==null) return '未采集';
    if (['tokens','input_tokens','output_tokens','cached_tokens'].includes(key)) return `平均 ${fmtNumber(metric.average,0)}`;
    return `平均 ${fmtNumber(metric.average,1)}`;
  }
  function renderReportSummary(rows) {
    if (full) { full.summary(rows,base,state); return; }
    const s=base.summary,m=s.metrics,scope=s.test_scope||{},preScope=s.pre_scope||{},local=s.local_fixture||{},reaudit=s.reaudit||{},trace=s.trace_gate||{};
    const online=rows.filter(onlineCase), counts=Object.fromEntries(['test','pre'].map(env=>[env,{pass:online.filter(r=>r.source_environment===env&&r.status==='pass').length,fail:online.filter(r=>r.source_environment===env&&isFailure(r.status)).length,pending:online.filter(r=>r.source_environment===env&&r.status==='skip').length}]));
    for(const env of ['test','pre'])counts[env].assessed=counts[env].pass+counts[env].fail;
    const combined={pass:counts.test.pass+counts.pre.pass,assessed:counts.test.assessed+counts.pre.assessed};
    const combinedRate=combined.assessed?`${(100*combined.pass/combined.assessed).toFixed(1)}%`:'未评估';
    const eff=m.efficiency||{},rob=m.robustness||{},versions=m.versions||{},plan=m.planning_quality||{},planJudge=m.planning_judge||{},op=m.operational_judge||{};
    const testAssistant=versions.test_assistant||{},preAssistant=versions.pre_assistant||{},testJudge=versions.test_judge||{},businessJudge=versions.judge||{},planVersion=versions.planning_judge||{},opVersion=versions.operational_judge||{};
    const preDone=rob.pre_answer_completion||{},blocked=scope.blocked_breakdown||{},source=s.source_basis||{},sourceStatus=source.summary?.status||{};
    const testModel=(testAssistant.models||[]).join('、')||'未观测',preModel=(preAssistant.models||[]).join('、')||'未观测',testPrompt=(testAssistant.prompts||[]).join('、')||'未观测',prePrompt=(preAssistant.prompts||[]).join('、')||'未观测';
    const labelMap={selection:'工具选择',parameters:'参数填写',output_understanding:'输出理解',chain_completeness:'调用链完整'};
    const renderToolMetrics=env=>Object.keys(labelMap).map(k=>rateCard(labelMap[k],m.tool_accuracy?.[env]?.[k]||{})).join('');
    const planLabels={step_correctness:'步骤正确',order:'顺序合理',minimality:'步数最小化',deadloop_avoidance:'Deadloop 避免',hallucinated_plan_avoidance:'幻觉计划避免'};
    const renderPlanMetrics=env=>Object.keys(planLabels).map(k=>rateCard(planLabels[k],plan[env]?.[k]||{})).join('');
    const ratings=op.summary?.robustness?.ratings||{},effRatings=op.summary?.efficiency?.ratings||{},robustScored=Number(ratings.pass||0)+Number(ratings.fail||0),efficiencyScored=['excellent','good','fair','poor'].reduce((n,k)=>n+Number(effRatings[k]||0),0),efficiencyGood=Number(effRatings.excellent||0)+Number(effRatings.good||0);
    const finding=op.resource_efficiency_review||{},resources=eff.resource_cost||{};
    const resourceLabels=[['e2e_ms','E2E 耗时'],['steps','可观测步骤'],['tool_calls','工具调用'],['tokens','总 Token'],['cache_token_ratio','缓存 Token 比例'],['cost_usd','推理成本'],['retries','重试次数']];
    const resourceRows=resourceLabels.map(([key,label])=>{
      const cells=['test','pre'].map(env=>{
        const metric=resources[env]?.metrics?.[key]||{},successes=rows.filter(r=>r.source_environment===env&&onlineCase(r)&&r.status==='pass'),covered=successes.filter(r=>r.resource_coverage?.[key]).length;
        const cost=key==='cache_token_ratio'?'—<br><small>比例指标不摊销</small>':!successes.length||metric.total==null?'未采集':`${metric.per_success_is_lower_bound?'≥':''}${key==='e2e_ms'?`${fmtNumber(Number(metric.total)/successes.length/1000,1)}s`:key==='cost_usd'?`$${fmtNumber(Number(metric.total)/successes.length,4)}`:['tokens','input_tokens','output_tokens','cached_tokens'].includes(key)?fmtNumber(Number(metric.total)/successes.length,0):fmtNumber(Number(metric.total)/successes.length,1)}<br><small>全量已观测消耗÷当前业务成功数</small>`;
        return `<td>${esc(resourceValue(key,metric))}</td><td>${Number(metric.valid_n||0)}/${Number(metric.attempted_n||0)}<br><small>成功样本覆盖 ${covered}/${successes.length}</small></td><td>${cost}</td>`;
      });
      return `<tr><td><b>${esc(label)}</b></td>${cells.join('')}</tr>`;
    }).join('');
    const planJudgeLabel=planJudge.environment?`${esc(planVersion.model||'未执行')} / ${esc(planVersion.prompt_version||'未执行')}`:'未执行',opJudgeLabel=op.environment?`${esc(opVersion.model||'未执行')} / ${esc(opVersion.prompt_version||'未执行')}`:'未执行';
    const recommendations=(op.recommendations||[]).map(x=>`<tr><td>${esc(x.priority||'-')}</td><td>${esc(x.area||'-')}</td><td>${esc(x.action||'-')}</td><td>${esc(x.verification||'-')}</td></tr>`).join('')||'<tr><td colspan="4">GPT 裁判未返回可展示建议。</td></tr>';
    const planSummary=planJudge.summary||{},unavailablePlan=Number(planJudge.unavailable||0),unavailableOps=Number(op.unavailable||0);
    const reportKpi=(name,value,note)=>`<div class="kpi"><span>${esc(name)}</span><b>${esc(value)}</b><small>${esc(note)}</small></div>`;
    const envRate=env=>counts[env].assessed?(100*counts[env].pass/counts[env].assessed).toFixed(1)+'%':'—';
    $('report-summary').innerHTML=`
      <section class="banner"><b>本轮结论</b><p>test 当前有效范围 ${esc(scope.active_total||0)} 条：线上已发起 ${esc(scope.online_executed||0)} 条，其中当前 ${counts.test.assessed} 条可业务判定、${counts.test.pending+Number(scope.online_pending_retest||0)} 条待复核；本地 fixture ${esc(local.pass||0)}/${esc(local.executed||0)} 通过；另有 ${esc(scope.not_executed||0)} 条未具备执行条件。pre 数据集共 ${esc(preScope.active_total||0)} 条，本轮实跑 ${esc(preScope.executed||0)} 条，其中当前 ${counts.pre.assessed} 条可业务判定、${counts.pre.pending} 条待复核，另有 ${esc(preScope.not_executed||0)} 条未执行。内部 Trace ${esc(trace.captured||0)}/${esc(trace.executed||0)} 条。当前综合 Task Success Rate 为 <b>${esc(combinedRate)}</b>（${combined.pass}/${combined.assessed}）。</p></section>
      <section class="kpis">${reportKpi('报告结果行',rows.length,'含 test / pre 用例及本地 fixture')}${reportKpi('实际判定',combined.assessed,`test ${counts.test.assessed} + pre ${counts.pre.assessed}`)}${reportKpi('任务成功',combined.pass,'按当前云端复核结果')}${reportKpi('综合成功率',combinedRate,'待复核与未执行不进入分母')}${reportKpi('pre 回答完成',preDone.pass??'—',preDone.total?`${(100*preDone.pass/preDone.total).toFixed(1)}%`:'未覆盖')}${reportKpi('pre E2E P95',eff.pre?.p95_latency_ms==null?'—':`${fmtNumber(eff.pre.p95_latency_ms/1000,1)}s`,`${eff.pre?.covered??0} 条有耗时`)}</section>
      <section class="grid2"><article class="panel env-card"><span class="badge test">test</span><h2>本次全量可执行范围</h2><p><b>Task Success Rate ${envRate('test')}（${counts.test.pass}/${counts.test.assessed}）</b></p><p>有效用例 ${esc(scope.active_total||0)} 条；线上已发起 ${esc(scope.online_executed||0)} 条（当前可判定 ${counts.test.assessed}、待复核 ${counts.test.pending+Number(scope.online_pending_retest||0)}）；本地 fixture ${esc(scope.local_executed||0)} 条；未执行 ${esc(scope.not_executed||0)} 条。</p><p class="muted">未执行原因：合成账号/Gold 未映射 ${esc(blocked.synthetic_actor_or_gold_mismatch||0)}、ACL fixture 失效 ${esc(blocked.invalid_acl_fixture||0)}、规范待定 ${esc(blocked.spec_pending||0)}、连接器/自动化受控 ${esc(blocked.connector_or_automation_controlled||0)}、SRE 受控 ${esc(blocked.sre_controlled||0)}。<br>助手模型：${esc(testModel)}<br>助手 Prompt：${esc(testPrompt)}</p></article><article class="panel env-card pre"><span class="badge pre">pre</span><h2>本次群聊实跑</h2><p><b>Task Success Rate ${envRate('pre')}（${counts.pre.pass}/${counts.pre.assessed}）</b></p><p>数据集 ${esc(preScope.active_total||0)} 条：本轮实跑 ${esc(preScope.executed||0)} 条，其中 ${esc(preDone.pass||0)} 条取得完整可评回答；当前待复核 ${counts.pre.pending} 条，未执行 ${esc(preScope.not_executed||0)} 条，原因逐条列于用例表。</p><p class="muted">助手模型：${esc(preModel)}<br>助手 Prompt：${esc(prePrompt)}</p></article></section>
      <section class="panel"><h2>失败用例重新核对与修正</h2><div class="metrics">${metricCard('上轮 pre 失败',reaudit.previous_pre_failures??'—','重新核对范围')}${metricCard('复核后转通过',(reaudit.old_fail_to_pass||[]).length,'纠正误判/修正用例后')}${metricCard('仍失败',reaudit.still_failed??'—','保留真实失败')}${metricCard('LIVE 消息依据命中',reaudit.source_ids_found??'—','真实 groupID / clientMsgID')}${metricCard('已移除非法会话 context',reaudit.context_removed??'—','原 ArgsError 根因')}</div><p style="margin-top:12px"><b>由失败转为通过：</b>${esc((reaudit.old_fail_to_pass||[]).join('、')||'无')}<br><b>因数据依据不足转为门禁：</b>${esc((reaudit.old_failure_gated||[]).join('、')||'无')}</p><div class="note">人工复核只改业务判定，不覆盖原始证据断言。当前证据断言状态：通过 ${esc(m.automatic_pre?.pass??0)}、失败 ${esc(m.automatic_pre?.fail??0)}、复核 ${esc(m.automatic_pre?.skip??0)}、执行错误 ${esc(m.automatic_pre?.error??0)}。68/75 与 active_dimensions 百分制用于有九维质量分的追问评分器；本报告不伪造缺失评分。</div></section>
      <section class="panel"><h2>全部 pre 用例数据依据审计</h2><div class="metrics">${metricCard('pre 评测范围',reaudit.source_in_scope??'—','不含无固定真值推荐题')}${metricCard('具备具体消息依据',reaudit.source_backed??'—','原始快照结构校验')}${metricCard('GPT 语义支持',sourceStatus.supported??'—','Gold 与原消息一致')}${metricCard('需要修正',sourceStatus.needs_correction??'—','未修正前不得执行')}${metricCard('受控/运行时依赖',reaudit.source_gated??'—','不伪装成离线已具备')}</div><p class="muted" style="margin-top:10px">数据依据裁判：${esc(source.judge?.model||'未执行')} / ${esc(source.judge?.prompt_version||'未执行')}。结构校验覆盖群名、groupID、clientMsgID、发送人、原文与跨群归属；语义校验复核 Gold 是否由原消息直接支持。另有 ${esc(sourceStatus.insufficient??0)} 条受控故障用例只能由真实注入执行证明。</p></section>
      <section class="panel"><h2>执行版本</h2><div class="table-wrap"><table><thead><tr><th>环境</th><th>助手运行模型</th><th>助手 Prompt</th><th>业务裁判模型 / Prompt</th><th>计划质量裁判模型 / Prompt</th><th>稳定性与效率裁判模型 / Prompt</th></tr></thead><tbody><tr><td><span class="badge test">test</span></td><td>${esc(testModel)}</td><td>${esc(testPrompt)}</td><td>${esc(testJudge.model||'未执行')} / ${esc(testJudge.prompt_version||'未执行')}</td><td>${planJudge.environment==='test'?planJudgeLabel:'未执行'}</td><td>${op.environment==='test'?opJudgeLabel:'未执行'}</td></tr><tr><td><span class="badge pre">pre</span></td><td>${esc(preModel)}</td><td>${esc(prePrompt)}</td><td>${esc(businessJudge.model||'未执行')} / ${esc(businessJudge.prompt_version||'未执行')}</td><td>${planJudge.environment==='pre'?planJudgeLabel:'未执行'}</td><td>${op.environment==='pre'?opJudgeLabel:'未执行'}</td></tr></tbody></table></div><div class="note">业务裁判与 Trace 复核结果来自原始运行快照；pre 助手模型与 Prompt 覆盖 ${esc(preAssistant.model_covered_cases||0)}/${esc(preAssistant.total_cases||0)} 条。未观测数据保持空缺。</div></section>
      <section class="panel"><h2>① 任务成功率（唯一硬指标）</h2><div class="metrics">${metricCard('test',envRate('test'),`${counts.test.pass}/${counts.test.assessed}`)}${metricCard('pre',envRate('pre'),`${counts.pre.pass}/${counts.pre.assessed}`)}${metricCard('综合',combinedRate,`${combined.pass}/${combined.assessed}`)}</div><p class="muted" style="margin-top:10px">待复核与未执行用例、本地 fixture 均单列，不进入线上硬指标分母；保存云端改判后本指标立即重算。</p></section>
      <section class="panel"><h2>② 工具调用正确率</h2><h3><span class="badge test">test</span> ${esc(scope.online_assessed||0)} 条业务样本</h3><div class="metrics">${renderToolMetrics('test')}</div><h3 style="margin-top:16px"><span class="badge pre">pre</span> Trace 实测</h3><div class="metrics">${renderToolMetrics('pre')}</div><p class="muted" style="margin-top:10px">内部 Trace 覆盖 ${esc(trace.captured||0)}/${esc(trace.executed||0)}；${esc(m.tool_accuracy?.pre_observation||'参数和输出理解缺断言时保持未覆盖。')}</p></section>
      <section class="panel"><h2>③ 计划质量</h2><h3><span class="badge test">test</span> ${planJudge.environment==='test'?'GPT + Trace 复评':'Trace 实测'}</h3><div class="metrics">${renderPlanMetrics('test')}</div><h3 style="margin-top:16px"><span class="badge pre">pre</span> ${planJudge.environment==='pre'?'GPT + Trace 复评':'Trace 实测'}</h3><div class="metrics">${renderPlanMetrics('pre')}</div><p class="muted" style="margin-top:10px">${esc(plan.judge_observation||plan.pre_observation||'未执行计划质量裁判。')} 裁判有分 ${esc(planSummary.scored_cases||0)} 条，平均分 ${esc(fmtNumber(planSummary.average_score,1))}；${unavailablePlan} 条因裁判服务错误未完成，按未评测排除。</p></section>
      <section class="panel"><h2>④ 执行稳定性</h2><div class="metrics">${rateCard('回答完成率',rob.pre_answer_completion||{})}${rateCard('Trace 错误恢复',rob.trace_pre?.error_recovery||{})}${rateCard('Trace Loop Avoidance',rob.trace_pre?.loop_avoidance||{})}${rateCard('Trace Step Robustness',rob.trace_pre?.step_robustness||{})}${rateCard('连续 10 步',rob.trace_pre?.survived_10_steps||{})}</div><p class="muted" style="margin-top:10px">pre 连续任务完成率：${esc(rateText(rob.continuous_completion||{}))}。回答完成率按 case 统计；错误恢复与步骤稳定性按 Trace 中可验证的调用/步骤事件统计。</p></section>
      <section class="panel"><h2>⑤ 资源效率</h2><div class="table-wrap"><table><thead><tr><th>指标</th><th><span class="badge test">test</span> 指标值</th><th>test 有效样本数</th><th>test 单条成功用例成本</th><th><span class="badge pre">pre</span> 指标值</th><th>pre 有效样本数</th><th>pre 单条成功用例成本</th></tr></thead><tbody>${resourceRows}</tbody></table></div><div class="note">${esc(resources.pre?.definition||'单条成功用例成本按本轮全部已观测资源消耗除以业务成功数计算。')} 成功样本覆盖与成功成本随人工改判动态重算；“≥”表示资源观测下限，缺失字段不会补 0。</div><h3 style="margin-top:16px">GPT 资源效率结论（原始执行复评）：${esc(finding.rating||'未评测')}</h3><p>${esc(finding.assessment||'未取得独立的资源效率汇总结论。')}</p><ul>${(finding.findings||[]).map(x=>`<li>${esc(x)}</li>`).join('')||'<li>GPT 未返回单独的资源效率发现。</li>'}</ul><p class="muted">GPT 汇总裁判：${esc(finding.model||opVersion.model||'未执行')} / ${esc(finding.prompt_version||opVersion.prompt_version||'未执行')}。</p></section>
      <section class="panel"><h2>GPT 执行稳定性与资源效率复评（${esc(op.environment||'未执行')}）</h2><div class="metrics">${metricCard('稳定性通过',`${ratings.pass||0}/${robustScored}`,'原始稳定性复评')}${metricCard('效率优秀/良好',`${efficiencyGood}/${efficiencyScored}`,'原始效率复评')}${metricCard('稳定性平均分',fmtNumber(op.summary?.robustness?.average_score),`${op.summary?.robustness?.scored_cases||0} 条有分`)}${metricCard('效率平均分',fmtNumber(op.summary?.efficiency?.average_score),`${op.summary?.efficiency?.scored_cases||0} 条有分`)}${metricCard('证据不足',`${ratings.insufficient||0}/${effRatings.insufficient||0}`,'稳定性 / 效率')}</div><p style="margin-top:12px"><b>综合评估：</b>${esc(op.assessment||'未取得 GPT 复评结论')}</p><div class="table-wrap"><table><thead><tr><th>优先级</th><th>领域</th><th>建议</th><th>验收方式</th></tr></thead><tbody>${recommendations}</tbody></table></div><p class="muted" style="margin-top:10px">连续完成只认多次独立运行证据；Token 未采集保持证据不足，不补 0。其中 ${unavailableOps} 条因裁判服务错误未完成，按未评测排除。</p></section>
      <p class="muted">报告生成时间：${esc(s.generated_at||'未记录')}。Trace、计划、稳定性和效率是本批次原始执行指标；人工改判即时更新业务状态、任务成功率、失败索引和成功样本成本。</p>`;
  }
  function render() {
    if (!base) { controls(); return; }
    const rows = effectiveRows();
    renderReportSummary(rows);
    $('cloud-version').textContent = state ? `云端 r${state.revision}${stale?' · 同步异常，不保证最新':connected?'':' · 上次读取，当前未连接'}` : '未连接';
    $('results-source').textContent = state ? connected && !stale ? `已读取云端 r${state.revision}。总结基于已保存改判实时重算；未提交草稿不计入汇总。` : `以下含上次读取的云端 r${state.revision}，不是当前最新结果。请重新登录或拉取云端结果。` : '以下为报告原始结果，尚未读取云端复核。';
    $('run-label').textContent = `${base.identity.run_id} · ${base.identity.report_id}`;
    $('actor-label').textContent = state ? `${state.current_actor.name} · ${state.current_actor.role==='reviewer'?document.body.dataset.reviewMode==='read'?'复核员（在复核页修改）':'复核员（可修改）':'只读账号'}` : '';
    $('audit-count').textContent = state ? `${state.history.length} 条记录` : '';
    $('audit-list').innerHTML = !state ? '<li>登录并获得报告访问授权后，可读取云端修改记录。</li>' : state.history.length ? [...state.history].reverse().map(item=>{const row=base.rows.find(r=>r.case_id===item.case_id);return `<li><strong>${esc(item.actor_name)}</strong> · <a href="#${full?full.anchor(row):esc(item.case_id)}">${esc(item.case_id)}</a> · ${esc(labels[item.before?.business_status] || '原始裁判')} → ${esc(labels[item.after?.business_status] || '恢复原判')} <time>${esc(time(item.at))}</time><small>云端 r${item.revision} · ${esc(item.after?.business_reason || '移除人工覆盖；原始裁判恢复，历史记录保留。')}</small></li>`;}).join('') : '<li>尚无人工复核修改。</li>';
    renderCases(); controls();
  }
  function renderCases() {
    if (full) { full.renderCases(effectiveRows(),base,state,canWrite()); return; }
    const q = $('search').value.trim().toLowerCase(), status = $('filter-status').value, environment=$('filter-environment').value, priority=$('filter-priority').value, all = effectiveRows();
    const prioritySelect=$('filter-priority'), previous=prioritySelect.value;
    while(prioritySelect.options.length>1) prioritySelect.remove(1);
    for(const value of [...new Set(all.map(row=>row.priority||'未标注'))].sort((a,b)=>a.localeCompare(b,'zh-CN',{numeric:true}))) prioritySelect.add(new Option(value,value));
    prioritySelect.value=previous; if(prioritySelect.selectedIndex<0) prioritySelect.selectedIndex=0;
    const rows = all.filter(row=>(!status || row.status===status) && (!environment||row.source_environment===environment) && (!priority||(row.priority||'未标注')===priority) && (!q || [row.case_id,row.title,row.ability,row.module,row.scenario,row.suite,row.gate_class,row.reason].join(' ').toLowerCase().includes(q)));
    const names = new Map((state?.history || []).map(item=>[item.actor,item.actor_name]));
    $('result-count').textContent = `显示 ${rows.length} / ${all.length} 条`;
    const statusText=row=>row.status==='skip'?(row.kind==='not_executed'?'未执行':'待复核'):labels[row.status];
    $('case-table').querySelector('tbody').innerHTML = rows.map(row=>`<tr id="${esc(row.case_id)}" data-case-id="${esc(row.case_id)}"><td><span class="badge ${esc(row.source_environment)}">${esc(row.source_environment)}</span></td><td><b>${esc(row.case_id)}</b></td><td>${esc(row.priority||'未标注')}</td><td>${esc(row.module)}</td><td>${esc(row.scenario)}</td><td>${esc(row.suite||'—')}</td><td>${esc(row.gate_class||'—')}</td><td><span data-case-status class="status ${esc(row.status)}">${esc(statusText(row))}</span><br><small>${row.override?'云端人工复核':row.kind==='not_executed'?'未执行':row.updated_by?'已恢复原判':'原始裁判'}</small>${row.failure_categories.length?`<br><small>${esc(row.failure_categories.join('、'))}</small>`:''}</td><td>${row.task_completion_rate==null?'—':`${esc(row.task_completion_rate)}%`}</td><td>${row.trace_runs?`${esc(row.trace_runs)} Run<br>`:''}<small>${esc(row.trace_status||'未观测')}</small></td><td>${esc(row.model||'未观测')}<br><small>${esc(row.prompt_version||'未观测')}</small></td><td>${row.latency_ms===null?'—':`${(row.latency_ms/1000).toFixed(1)}s`}</td><td><p>${esc(row.title)}</p><p class="case-reason">${esc(row.reason)}</p>${row.override||row.original_status!==row.status?`<details><summary>原始判定：${esc(labels[row.original_status])}</summary><p>${esc(row.original_reason)}</p></details>`:''}</td><td>${esc(names.get(row.updated_by) || (row.updated_by?'已授权复核员':'—'))}<small>${esc(time(row.updated_at))}</small><small>${state?'用例版本 v'+row.version:'未读取云端版本'}</small></td><td><button data-edit-case="${esc(row.case_id)}" ${busy||!canWrite()?'disabled':''}>修改结果</button></td></tr>`).join('');
    const failures=all.filter(row=>isFailure(row.status));
    $('failure-count').textContent=String(failures.length);
    $('failure-table-body').innerHTML=failures.map(row=>`<tr><td><span class="badge ${esc(row.source_environment)}">${esc(row.source_environment)}</span></td><td><a class="case-link" href="#${esc(row.case_id)}" data-failure-jump="${esc(row.case_id)}">${esc(row.case_id)}</a></td><td>${esc(row.priority||'未标注')}</td><td>${esc(row.module)}</td><td>${esc(row.scenario)}</td><td>${esc(row.ability||row.title)}</td><td>${esc(row.failure_categories.join('、')||'未分类')}</td><td>${row.latency_ms===null?'—':`${(row.latency_ms/1000).toFixed(1)}s`}</td><td>${row.task_completion_rate==null?'—':`${esc(row.task_completion_rate)}%`}</td></tr>`).join('');
  }
  function originalAndCurrent(row) {
    $('edit-original').textContent = `${labels[row.original_status]}：${row.original_reason}`;
    $('edit-current').textContent = `${labels[row.status]} · v${row.version}\n${row.reason}`;
    $('edit-version').textContent = `草稿基于 v${currentEdit.base_version}`;
  }
  function formMode() {
    $('edit-reason').required = $('edit-status').value !== 'reset';
    $('categories-field').hidden = !isFailure($('edit-status').value);
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
        if (auth) {
          await auth.login(email,password); session=auth;
          accept(await snapshot()); broadcast();
          notice(`已连接云端 r${state.revision}；${auth.persistent?'本浏览器最多记住登录48小时。':'仅本页保留登录。'}主报告与复核页共享已保存结论。`);
          return;
        }
        const loginResult = await request('/auth/v1/token?grant_type=password',{email,password},false);
        if (!plain(loginResult) || typeof loginResult.access_token!=='string' || !loginResult.access_token || !plain(loginResult.user) || !text(loginResult.user.id,128) || !loginResult.user.id || !Number.isFinite(loginResult.expires_in) || loginResult.expires_in<=0) throw Error('登录响应无效；没有建立云端连接。');
        session = {accessToken:loginResult.access_token,userId:loginResult.user.id,expiresAt:Date.now()+loginResult.expires_in*1000};
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
    if (auth) { await auth.logout(); expire(); broadcast(); notice('已退出登录，云端结果已从页面移除，恢复原始快照。'); return; }
    let revoked = false;
    try { await request('/auth/v1/logout',{}); revoked = true; } catch { /* Always clear the in-memory session even if server logout is unavailable. */ }
    session = null; state = null; connected = false; currentEdit = null;
    $('login-password').value = ''; render();
    notice(revoked?'已退出登录，页面内的登录凭据已清除。未提交草稿仅保留在此页面内存中。':'已清除本页面登录凭据。云端退出未确认，其他已登录窗口可能仍有效。');
  });
  $('edit-form').onsubmit = event => {
    event.preventDefault(); if (!currentEdit || busy || !canWrite()) return;
    const status = $('edit-status').value, reason = $('edit-reason').value.trim();
    const override = status==='reset'?null:{business_status:status,business_reason:reason,failure_categories:isFailure(status)?[...new Set($('edit-categories').value.split(/[,，、\n]/).map(x=>x.trim()).filter(Boolean))]:[]};
    if (!validOverride(override)) { $('edit-feedback').textContent = '请填写有效理由（最多 6000 字）；失败分类最多 20 项，每项不超过 100 字。'; return; }
    preserveDraft();
    const edit = {...currentEdit};
    operation(async()=>{
      try {
        const result = await request('/rest/v1/rpc/ai_review_save',{p_report_id:base.identity.report_id,p_source_digest:base.identity.source_digest,p_case_id:edit.case_id,p_base_version:edit.base_version,p_override:override});
        accept(result);
        drafts.delete(`${edit.actor_id}:${edit.case_id}`);
        $('edit-dialog').close(); currentEdit = null;
        broadcast();
        notice(`已保存到真实云端 r${state.revision}。本页已更新；已登录的主报告自动同步通过率、失败原因、分类与资源摊销成本。`);
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
  document.addEventListener('click', event => {const button=event.target.closest('[data-edit-case]');if(button)openEdit(button.dataset.editCase);});
  $('failure-index').onclick = event => {const link=event.target.closest('[data-failure-jump]');if(!link)return;event.preventDefault();const row=effectiveRows().find(item=>item.case_id===link.dataset.failureJump);if(!row)return;$('filter-environment').value=row.source_environment;$('filter-status').value='fail';$('filter-priority').value='';$('search').value=row.case_id;renderCases();document.getElementById(row.case_id)?.scrollIntoView({behavior:'smooth',block:'center'});};
  const filterChanged=()=>{full?.resetPage();renderCases();};
  $('search').oninput = filterChanged; $('filter-status').onchange = filterChanged; $('filter-environment').onchange=filterChanged; $('filter-priority').onchange=filterChanged;
  $('reset-filters').onclick=()=>{$('search').value='';$('filter-status').value='';$('filter-environment').value='';$('filter-priority').value='';if($('category'))$('category').value='';filterChanged();};
  $('refresh').onclick = () => operation(async()=>{accept(await snapshot());notice(`已读取真实云端最新版本 r${state.revision}，并更新本页报告总结。`);});
  $('export-snapshot').onclick = () => operation(async()=>{
    accept(await snapshot());
    const blob = new Blob([JSON.stringify(state,null,2)+'\n'],{type:'application/json'}), url=URL.createObjectURL(blob), link=document.createElement('a');
    link.href=url;link.download=`cloud-review-${base.identity.report_id.replace(/[^a-zA-Z0-9_-]/g,'_')}-r${state.revision}.json`;link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    notice(`已下载云端 r${state.revision} 快照（不含登录凭据）。这是备份，不代表已同步到本地或生成报告。`);
  });
  window.addEventListener('beforeunload',event=>{if(busy||drafts.size){event.preventDefault();event.returnValue='';}});
  operation(async()=>{
    const localJson = async file => {const response=await fetch(new URL(file,new URL(document.body.dataset.reviewAssets||'./',document.baseURI)),{credentials:'omit',cache:'no-store',redirect:'error'});if(!response.ok)throw Error('无法读取 '+file+'；请通过 HTTP(S) 打开部署后的页面。');return response.json();};
    const [rawBase,rawConfig]=await Promise.all([localJson('./report-base.json'),localJson('./config.json')]);
    base=validateBase(rawBase);
    try {config=validateConfig(rawConfig);configured=true;$('config-state').textContent='使用已配置的 Supabase 项目。请以管理员授予本报告权限的账号登录。';}
    catch(error){configured=false;configError=error.message;$('config-state').textContent=configError;}
    render();notice(configured?'原始报告已加载。尚未登录，也没有读取或修改云端数据。':configError,!configured);
    if (configured && window.AIReviewSession) {
      auth = new window.AIReviewSession(config,{onInvalidated:message=>{expire();notice(message,true);}});
      if (await auth.restore()) {session=auth;accept(await snapshot());notice(`已恢复授权登录，已同步云端 r${state.revision}。`);}
    }
  });
  async function synchronize() {
    if(!configured||busy||document.hidden||$('edit-dialog').open) return;
    busy=true;
    try {
      if(auth&&!auth.authenticated){if(!await auth.restore())return;session=auth;}
      if(!session)return;
      const previousRevision=state?.revision,wasStale=stale;
      accept(await snapshot());
      if(wasStale||previousRevision!==state.revision)notice(`已同步云端 r${state.revision}，报告统计、问题汇总和用例结论已更新。`);
    } catch(error) {
      stale=true;render();notice(`同步未完成：${error.message} 当前显示上次确认的数据，不保证最新。`,true);
    } finally {busy=false;controls();}
  }
  if(channel)channel.onmessage=event=>{if(event.data?.report_id===base?.identity.report_id)synchronize();};
  window.setInterval(synchronize,5000);
  window.addEventListener('focus',synchronize);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)synchronize();});
})();
