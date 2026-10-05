/* Full report presentation + authenticated cloud reviews.
 * Retains the report builder's evidence DOM. No localStorage/manual-demo fallback:
 * only session.js handles authentication persistence; unsaved edits stay in memory.
 */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const labels = {pass: '通过', fail: '失败', skip: '待复核 / 未就绪'};
  const identityKeys = ['report_id', 'run_id', 'environment', 'source_digest'];
  const filterKeys = ['environment', 'status', 'module', 'scenario', 'priority', 'category', 'search'];
  const cloudSchema = 'ai_assistant.cloud_review.v1';
  const sourceContextText = $('review-source-context')?.textContent || '当前展示源报告；尚未读取云端复核。';
  const esc = value => String(value ?? '—').replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  const integer = value => Number.isSafeInteger(value) && value >= 0;
  const fields = (value, keys) => plain(value) && Object.keys(value).sort().join(',') === [...keys].sort().join(',');
  const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
  const blank = value => /^[\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028-\u2029\u202f\u205f\u3000]*$/u.test(value);
  const text = (value, limit, multiline = false) => typeof value === 'string' && [...value].length <= limit && !(multiline ? /[\u0000-\u0008\u000b-\u001f\u007f-\u009f]/ : /[\u0000-\u001f\u007f-\u009f]/).test(value);
  const validTime = value => text(value, 64) && /(?:Z|[+-]\d{2}:\d{2})$/.test(value) && Number.isFinite(Date.parse(value));
  const time = value => value ? new Date(value).toLocaleString('zh-CN', {hour12: false}) : '未修改';
  const percent = (n, d) => d ? (100 * n / d).toFixed(1) + '%' : '未评测';
  const duration = value => value == null ? '未观测' : (value / 1000).toFixed(1) + 's';
  const drafts = new Map();
  let report = null, base = null, config = null, identity = null, baseline = [], rows = [];
  let state = null, session = null, currentEdit = null, busy = false, configured = false, epoch = 0;
  let noticeText = '正在校验报告与云端连接配置；尚未读取云端结果。', noticeError = false;

  function invalid(message) { const error = Error(message); error.invalidSnapshot = true; return error; }
  function equalIdentity(value) { return fields(value, identityKeys) && identityKeys.every(key => value[key] === identity[key]); }
  function validOverride(value) {
    return value === null || (fields(value, ['business_status', 'business_reason', 'failure_categories']) &&
      Object.hasOwn(labels, value.business_status) && text(value.business_reason, 6000, true) && !blank(value.business_reason) &&
      Array.isArray(value.failure_categories) && value.failure_categories.length <= 20 &&
      value.failure_categories.every(item => text(item, 100) && !blank(item)) &&
      new Set(value.failure_categories).size === value.failure_categories.length &&
      (value.business_status === 'fail' || value.failure_categories.length === 0));
  }
  function sameOverride(a, b) {
    if (a === null || b === null) return a === b;
    return a.business_status === b.business_status && a.business_reason === b.business_reason && JSON.stringify(a.failure_categories) === JSON.stringify(b.failure_categories);
  }
  function sameEvent(a, b) {
    return ['revision', 'case_id', 'actor', 'actor_name', 'at'].every(key => a[key] === b[key]) && sameOverride(a.before, b.before) && sameOverride(a.after, b.after);
  }
  function original(row, key) { return Object.hasOwn(row, 'original_' + key) ? row['original_' + key] : row[key]; }

  async function validateDocuments(source, rawBase, rawConfig) {
    if (!plain(source) || !plain(source.review_context) || !Array.isArray(source.rows) || !source.rows.length || source.rows.length > 5000 || !plain(source.summary)) throw invalid('完整报告格式无效，已停止连接。');
    identity = Object.fromEntries(identityKeys.map(key => [key, source.review_context[key]]));
    if (!/^review-[a-f0-9]{24}$/.test(identity.report_id) || !text(identity.run_id, 200) || blank(identity.run_id) || !['test', 'pre', 'prod'].includes(identity.environment) || !/^[a-f0-9]{64}$/.test(identity.source_digest) || source.run_id !== identity.run_id || source.environment !== identity.environment) throw invalid('完整报告身份不一致，已停止连接。');
    // This is the canonical JSON used by identity_for(...), not JavaScript's compact JSON.
    const canonical = `{"environment": ${JSON.stringify(identity.environment)}, "run_id": ${JSON.stringify(identity.run_id)}, "source_digest": ${JSON.stringify(identity.source_digest)}}`;
    const hash = [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(canonical)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    if (identity.report_id !== 'review-' + hash.slice(0, 24)) throw invalid('报告身份指纹校验失败，已停止连接。');
    if (!plain(rawBase) || !equalIdentity(rawBase.identity) || !Array.isArray(rawBase.rows) || rawBase.rows.length !== source.rows.length) throw invalid('原始基准与完整报告的身份或用例集合不一致。');
    const originals = new Map();
    for (const row of rawBase.rows) {
      if (!plain(row) || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,99}$/.test(row.case_id) || originals.has(row.case_id) || !Object.hasOwn(labels, row.status) || typeof row.reason !== 'string' || !Array.isArray(row.failure_categories) || !row.failure_categories.every(item => typeof item === 'string')) throw invalid('原始基准包含无效或重复用例。');
      originals.set(row.case_id, row);
    }
    const seen = new Set();
    const fullBaseline = source.rows.map(row => {
      const first = originals.get(row.case_id);
      if (!first || seen.has(row.case_id) || !Object.hasOwn(labels, row.status) || typeof row.reason !== 'string' || !Array.isArray(row.failure_categories) || row.environment !== identity.environment) throw invalid('完整报告用例集合或业务结果无效。');
      seen.add(row.case_id);
      const expected = {...row, status: original(row, 'status'), reason: original(row, 'reason'), failure_categories: original(row, 'failure_categories') || [], kind: original(row, 'kind')};
      for (const key of ['status', 'reason', 'title', 'module', 'scenario', 'latency_ms']) if ((expected[key] ?? null) !== (first[key] ?? null)) throw invalid(`用例 ${row.case_id} 的原始基准与报告不一致。`);
      if (JSON.stringify(expected.failure_categories) !== JSON.stringify(first.failure_categories)) throw invalid('原始失败分类不一致，已停止连接。');
      const card = typeof row.detail_anchor === 'string' ? $(row.detail_anchor) : null;
      if (!card?.classList.contains('case-card') || card.dataset.case !== row.case_id) throw invalid('报告用例明细与数据不对应，已停止连接。');
      return expected;
    });
    if (!fields(rawConfig, ['project_url', 'publishable_key', 'report_id', 'source_digest']) || rawConfig.report_id !== identity.report_id || rawConfig.source_digest !== identity.source_digest) throw invalid('云端配置与本报告身份不一致。');
    report = source; base = rawBase; baseline = fullBaseline;
    if (!rawConfig.project_url || !rawConfig.publishable_key) throw Error('尚未配置 Supabase 项目地址和公开密钥；当前仅展示源报告，没有使用模拟云端。');
    if (typeof rawConfig.project_url !== 'string' || !/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(rawConfig.project_url)) throw invalid('只允许官方 HTTPS Supabase 项目地址。');
    const key = rawConfig.publishable_key;
    let allowed = typeof key === 'string' && /^sb_publishable_[A-Za-z0-9_-]{10,300}$/.test(key);
    if (!allowed && typeof key === 'string' && key.length < 10000 && /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(key)) {
      try {
        const part = key.split('.')[1];
        const decoded = JSON.parse(atob(part.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(part.length / 4) * 4, '=')));
        allowed = decoded.role === 'anon' && decoded.ref === new URL(rawConfig.project_url).hostname.split('.')[0];
      } catch { allowed = false; }
    }
    if (!allowed) throw invalid('配置只接受 Publishable Key 或旧版 anon key；禁止管理员密钥。');
    return clone(rawConfig);
  }

  function validateSnapshot(value) {
    if (!fields(value, ['schema', 'identity', 'revision', 'current_actor', 'cases', 'history']) || value.schema !== cloudSchema || !equalIdentity(value.identity) || !integer(value.revision) || !Array.isArray(value.cases) || !Array.isArray(value.history)) throw invalid('云端快照身份或字段格式无效；未应用更改。');
    const actor = value.current_actor;
    if (!fields(actor, ['id', 'name', 'role']) || !uuid(actor.id) || actor.id !== session?.userId || !text(actor.name, 100) || blank(actor.name) || !['reviewer', 'viewer'].includes(actor.role)) throw invalid('云端身份或成员权限无效；已清除本页登录状态。');
    const ids = new Set(baseline.map(row => row.case_id)), seen = new Set(), latest = new Map(), versions = new Map();
    if (value.cases.length !== ids.size || value.history.length !== value.revision) throw invalid('云端用例或完整审计记录缺失；停止读取。');
    for (const row of value.cases) {
      if (!fields(row, ['case_id', 'version', 'override', 'updated_by', 'updated_at']) || !ids.has(row.case_id) || seen.has(row.case_id) || !integer(row.version) || row.version > value.revision || !validOverride(row.override) || !(row.updated_by === null || uuid(row.updated_by)) || !(row.updated_at === null || validTime(row.updated_at))) throw invalid('云端用例数据重复或无效；未应用更改。');
      seen.add(row.case_id);
    }
    for (const [index, item] of value.history.entries()) {
      if (!fields(item, ['revision', 'case_id', 'actor', 'actor_name', 'at', 'before', 'after']) || item.revision !== index + 1 || !ids.has(item.case_id) || !uuid(item.actor) || !text(item.actor_name, 100) || blank(item.actor_name) || !validTime(item.at) || !validOverride(item.before) || !validOverride(item.after) || sameOverride(item.before, item.after)) throw invalid('云端审计事件无效；未应用更改。');
      if (!sameOverride(item.before, latest.get(item.case_id)?.after ?? null)) throw invalid('云端审计修改前后不连续；停止读取。');
      latest.set(item.case_id, item); versions.set(item.case_id, (versions.get(item.case_id) || 0) + 1);
    }
    for (const row of value.cases) {
      const last = latest.get(row.case_id);
      if (row.version !== (versions.get(row.case_id) || 0) || !sameOverride(row.override, last?.after ?? null) || row.updated_by !== (last?.actor ?? null) || row.updated_at !== (last?.at ?? null)) throw invalid('云端结果与完整审计回放不一致；停止读取。');
    }
    if (state && (value.revision < state.revision || state.history.some((item, index) => !sameEvent(item, value.history[index])))) throw invalid('云端版本回退或既有审计被改写；已拒绝覆盖。');
    return clone(value);
  }

  const hasSession = () => !!session?.authenticated && Number.isFinite(session.deadline) && session.deadline > Date.now();
  const connected = () => hasSession() && !!state && state.current_actor.id === session.userId;
  const canWrite = () => connected() && state.current_actor.role === 'reviewer';
  function notice(message, error = false) { noticeText = message; noticeError = error; controls(); }
  function controls() {
    $('review-sync-status').textContent = noticeText;
    $('review-sync-status').classList.toggle('error', noticeError);
    for (const id of ['login-submit', 'login-email', 'login-password']) $(id).disabled = busy || !configured;
    $('login-form').hidden = hasSession(); $('signed-in').hidden = !hasSession();
    $('logout').disabled = busy || !hasSession();
    $('refresh').disabled = busy || !hasSession(); $('export-snapshot').disabled = busy || !connected();
    $('connection-badge').textContent = connected() ? '已连接真实云端' : hasSession() ? '已登录，尚未读取报告' : configured ? '未登录云端' : '云端尚未就绪';
    $('connection-badge').classList.toggle('connected', connected());
    $('actor-label').textContent = connected() ? `${state.current_actor.name} · ${canWrite() ? '复核员（可修改）' : '只读账号'}` : hasSession() ? '身份已认证，请读取本报告最新结果。' : '';
    $('session-expiry').textContent = hasSession() ? `登录有效期至 ${time(session.deadline)}（首次登录起固定 48 小时）` : '未登录';
    $('session-note').textContent = hasSession() ? session.persistent ? '此浏览器已记住登录。Cookie 仅保存会话标识与截止时间，认证令牌由登录组件保存在此浏览器；请勿在共用设备上保留登录。' : '浏览器未允许记住登录，当前仅本页有效；刷新后需要重新登录。' : '登录可在此浏览器记住最多 48 小时。网络恢复后可刷新页面重试恢复，不会自动修改任何复核结果。';
    $('cloud-version').textContent = connected() ? `云端 r${state.revision}` : '未读取云端';
    if ($('review-source-context')) $('review-source-context').textContent = connected() ? `当前按原始裁判＋真实云端 r${state.revision} 的人工覆盖展示。源报告快照、执行证据和 GPT 结论仍保留；源报告的本地人工修改不会自动写入云端。` : sourceContextText;
    const count = connected() ? state.cases.filter(row => row.override !== null).length : 0;
    $('review-revision').textContent = connected() ? `云端版本 r${state.revision} · 人工覆盖 ${count} 条${drafts.size ? ' · 当前页面有未提交草稿' : ''} · 尚不代表已同步到本地` : '当前展示源报告，不是云端实时结果。';
    for (const button of document.querySelectorAll('[data-edit-case]')) button.disabled = busy || !canWrite();
    for (const id of ['edit-save', 'edit-refresh', 'edit-status', 'edit-categories']) $(id).disabled = busy || !canWrite();
    $('edit-reason').disabled = busy || !canWrite() || $('edit-status').value === 'reset';
    $('review-dialog-cancel').disabled = busy;
    $('review-metric-note').hidden = !rows.some(row => row.manual);
  }
  function preserveDraft() {
    if (currentEdit) drafts.set(`${currentEdit.actor_id}:${currentEdit.case_id}`, {...currentEdit, status: $('edit-status').value, reason: $('edit-reason').value, categories: $('edit-categories').value});
  }
  function invalidated() {
    preserveDraft(); epoch++; state = null; currentEdit = null;
    if ($('review-dialog').open) $('review-dialog').close();
    recompute();
    notice('登录状态已清除或失效，当前显示源报告。未提交草稿仅留在本页内存中；重新登录同一账号可继续，不要刷新页面。', true);
  }
  function fatal(error) {
    return error.invalidSnapshot || [401, 403].includes(error.status) || error.code === '42501' || error.message === 'SOURCE_MISMATCH' || error.code === 'SOURCE_MISMATCH';
  }
  function errorMessage(error) {
    if (error.status === 409 || (error.code === 'P0001' && error.message === 'VERSION_CONFLICT')) return '版本冲突：其他复核员已修改此用例。草稿已保留；请查看最新版本、核对后再明确保存。';
    return error.message || '云端操作失败，未使用本地模拟数据代替。';
  }
  async function operation(action) {
    if (busy) return;
    busy = true; controls();
    try { await action(); }
    catch (error) {
      preserveDraft();
      if (fatal(error)) session?.clear();
      const message = errorMessage(error);
      if (currentEdit && $('review-dialog').open) { $('edit-error').textContent = message; $('edit-refresh').hidden = false; }
      notice(message, true);
    } finally { busy = false; controls(); }
  }
  async function request(path, payload) {
    if (!configured || !hasSession()) {
      session?.clear();
      throw Error('登录已失效，请重新登录同一账号后继续。');
    }
    const requestedEpoch = epoch, actor = session.userId;
    const result = await session.request(path, payload);
    if (requestedEpoch !== epoch || !hasSession() || actor !== session.userId) throw invalid('请求期间登录状态发生变化，未应用返回的数据。');
    return result;
  }
  const snapshot = () => request('/rest/v1/rpc/ai_review_snapshot', {p_report_id: identity.report_id, p_source_digest: identity.source_digest});
  function accept(value) {
    if (!hasSession()) throw invalid('当前登录已失效，不能应用云端快照。');
    state = validateSnapshot(value);
    if (currentEdit && !canWrite()) { preserveDraft(); $('review-dialog').close(); currentEdit = null; }
    recompute();
  }
  function effectiveRows() {
    if (!report) return [];
    if (!connected()) return report.rows.map(row => ({...row, manual: !!row.manual_review, task_completion_rate: row.status === 'pass' ? 100 : row.status === 'fail' ? 0 : null}));
    const remote = new Map(state.cases.map(row => [row.case_id, row]));
    return baseline.map(first => {
      const cloud = remote.get(first.case_id), edit = cloud.override;
      const status = edit?.business_status ?? first.status;
      return {...first, status, reason: edit?.business_reason ?? first.reason, failure_categories: edit?.failure_categories ?? first.failure_categories,
        kind: edit ? 'manual_review' : first.kind, manual: !!edit, task_completion_rate: status === 'pass' ? 100 : status === 'fail' ? 0 : null,
        version: cloud.version, updated_by: cloud.updated_by, updated_at: cloud.updated_at, override: edit};
    });
  }
  function metric(label, value, detail) { return `<div class="metric"><span>${esc(label)}</span><b>${esc(value)}</b><small>${esc(detail)}</small></div>`; }
  function recompute() {
    if (!report) { controls(); return; }
    rows = effectiveRows();
    const passed = rows.filter(row => row.status === 'pass').length, failed = rows.filter(row => row.status === 'fail').length;
    const assessed = passed + failed, skipped = rows.length - assessed, s = report.summary;
    const manualCount = rows.filter(row => row.manual).length;
    const sourceNote = connected() ? `已读取真实云端 r${state.revision}；未提交草稿不计入汇总。` : '以下为源报告结果，尚未读取本次云端复核。';
    $('summary-banner').innerHTML = `<b>本轮结论${manualCount ? '（含人工复核）' : ''}</b><p>选定 ${rows.length} 条，已发起 ${esc(s.attempted)} 条；通过 ${passed} 条、失败 ${failed} 条、待复核 ${skipped} 条。任务完成率 <b>${percent(passed, assessed)}</b>（${passed}/${assessed}）。待复核不计分母；原始 GPT 裁判与执行证据未改写。</p><p class="muted">${esc(sourceNote)}</p>`;
    $('summary-kpis').innerHTML = metric('选定用例', rows.length, '仅本轮运行范围') + metric('已发起', s.attempted, `未发起 ${s.not_executed ?? '—'}`) + metric('任务完成率', percent(passed, assessed), `通过 ${passed} / 可判定 ${assessed}`) + metric('待复核', skipped, '不纳入通过率分母') + metric('问答流程完成', `${s.execution_completed}/${s.attempted}`, '仍按原始执行证据统计') + metric('内部 Trace', `${s.trace_captured}/${s.attempted}`, '原始 Run 保持不变');
    $('task-success-summary').textContent = `任务完成率 ${percent(passed, assessed)}（${passed} 通过 / ${assessed} 可判定）；${manualCount} 条人工结果覆盖业务判定，原始证据与 GPT 各维度评分不变。${connected() ? '来自当前云端快照。' : '当前尚未读取云端。'}`;
    for (const cell of document.querySelectorAll('[data-success-cost]')) {
      const key = cell.dataset.successCost, value = report.resources?.metrics?.[key];
      const amount = passed && typeof value?.total === 'number' && Number.isFinite(value.total) ? value.total / passed : null;
      const displayed = amount === null ? '—' : key === 'e2e_ms' ? duration(amount) : amount.toLocaleString('en-US', {minimumFractionDigits: key === 'cost_usd' ? 4 : 1, maximumFractionDigits: key === 'cost_usd' ? 4 : 1});
      cell.textContent = amount !== null && value.per_success_is_lower_bound ? '≥ ' + displayed : displayed;
    }
    const failures = rows.filter(row => row.status === 'fail');
    $('failure-index-content').innerHTML = failures.length ? `<p>失败 ${failures.length} 条，点击定位明细。</p><div class="table-wrap"><table><thead><tr><th>用例</th><th>模块</th><th>场景</th><th>失败分类</th><th>耗时</th><th>判定来源</th></tr></thead><tbody>${failures.map(row => `<tr><td><a href="#${esc(row.detail_anchor)}">${esc(row.case_id)}</a></td><td>${esc(row.module)}</td><td>${esc(row.scenario)}</td><td>${esc(row.failure_categories.join('、') || '未分类')}</td><td>${duration(row.latency_ms)}</td><td>${row.manual ? connected() ? '云端人工复核' : '源报告人工复核' : '原始裁判'}</td></tr>`).join('')}</tbody></table></div>` : '<p>当前没有已判定失败的用例。</p>';
    const originalById = new Map(baseline.map(row => [row.case_id, row]));
    const lastByCase = new Map((state?.history || []).map(item => [item.case_id, item]));
    for (const row of rows) {
      const card = $(row.detail_anchor), first = originalById.get(row.case_id);
      card.classList.remove('pass', 'fail', 'skip'); card.classList.add(row.status);
      const badge = card.querySelector('[data-business-status]'); badge.className = 'status ' + row.status; badge.textContent = labels[row.status] + (row.manual ? ' · 人工' : '');
      card.querySelector('[data-task-completion]').textContent = row.task_completion_rate === null ? '待评估' : row.task_completion_rate + '%';
      card.querySelector('[data-business-tags]').textContent = row.failure_categories.join('、') || '无失败分类';
      card.querySelector('[data-business-reason]').textContent = row.reason;
      card.querySelector('[data-original-verdict]').textContent = `原始裁判：${labels[first.status]} · ${first.reason}`;
      card.querySelector('[data-original-verdict]').hidden = !row.manual;
      const last = connected() ? lastByCase.get(row.case_id) : null;
      card.querySelector('[data-review-source]').textContent = row.manual ? `${connected() ? '云端' : '源报告'}人工业务结果${last ? ` · ${last.actor_name} · v${row.version}` : ''}（逐轮 GPT 仍保留原结论）` : last ? `已恢复原裁判 · ${last.actor_name} · v${row.version}` : '原始业务裁判';
    }
    for (const row of [...rows].sort((a, b) => ({fail: 0, skip: 1, pass: 2}[a.status] - {fail: 0, skip: 1, pass: 2}[b.status]) || a.case_id.localeCompare(b.case_id))) $('case-details').appendChild($(row.detail_anchor));
    $('audit-count').textContent = connected() ? `${state.history.length} 条记录 · 点击记录可定位用例明细` : '未读取云端';
    $('audit-list').innerHTML = !connected() ? '<li>登录并获得本报告授权后，可读取完整云端复核记录。</li>' : !state.history.length ? '<li>尚无云端人工复核修改。</li>' : [...state.history].reverse().map(item => `<li><a class="audit-jump" href="#${esc(originalById.get(item.case_id).detail_anchor)}" aria-label="${esc(item.case_id)}，查看用例明细"><strong>${esc(item.actor_name)}</strong> · ${esc(item.case_id)} · ${esc(labels[item.before?.business_status] || '原始裁判')} → ${esc(labels[item.after?.business_status] || '恢复原判')} <time>${esc(time(item.at))}</time><small>云端 r${item.revision} · ${esc(item.after?.business_reason || '移除人工覆盖；原始裁判恢复，历史记录保留。')} · 查看用例明细 ↓</small></a></li>`).join('');
    populateFilters(); render(); controls();
  }
  function populateFilters() {
    for (const key of ['environment', 'module', 'scenario', 'priority', 'category']) {
      const select = $(key), previous = select.value;
      const values = key === 'category' ? rows.flatMap(row => row.failure_categories || []) : rows.map(row => row[key]);
      while (select.options.length > 1) select.remove(1);
      for (const value of [...new Set(values)].filter(Boolean).sort()) select.add(new Option(value, value));
      select.value = previous; if (select.selectedIndex < 0) select.selectedIndex = 0;
    }
  }
  function render() {
    const val = id => $(id).value, query = val('search').trim().toLowerCase();
    const selected = rows.filter(row => (!val('environment') || row.environment === val('environment')) && (!val('status') || row.status === val('status')) && (!val('module') || row.module === val('module')) && (!val('scenario') || row.scenario === val('scenario')) && (!val('priority') || row.priority === val('priority')) && (!val('category') || row.failure_categories.includes(val('category'))) && (!query || JSON.stringify(row).toLowerCase().includes(query)));
    const visible = new Set(selected.map(row => row.case_id));
    $('result-count').textContent = `显示 ${selected.length} / ${rows.length} 条（点击用例查看明细）`;
    $('results-body').innerHTML = selected.map(row => `<tr><td><span class="badge">${esc(row.environment)}</span></td><td><a href="#${esc(row.detail_anchor)}">${esc(row.case_id)}</a></td><td>${esc(row.module)}</td><td>${esc(row.scenario)}</td><td>${esc(row.priority)}</td><td><span class="status ${esc(row.status)}">${labels[row.status]}</span><small>${row.manual ? connected() ? '云端人工复核' : '源报告人工复核' : '原始裁判'}${connected() ? ` · v${row.version}` : ''}</small><button data-edit-case="${esc(row.case_id)}" ${busy || !canWrite() ? 'disabled' : ''}>修改结果</button></td><td>${row.task_completion_rate === null ? '待评估' : row.task_completion_rate + '%'}</td><td>${esc(row.automatic_status)}</td><td>${esc(row.trace_runs)} Run</td><td>${esc(row.model)}<small>${esc(row.prompt_version)}</small></td><td>${duration(row.latency_ms)}</td><td>${esc(row.reason)}</td></tr>`).join('');
    for (const card of document.querySelectorAll('.case-card')) card.hidden = !visible.has(card.dataset.case);
    for (const button of document.querySelectorAll('[data-edit-case]')) button.disabled = busy || !canWrite();
  }
  function formMode() {
    $('edit-reason').required = $('edit-status').value !== 'reset';
    $('categories-field').hidden = $('edit-status').value !== 'fail';
    controls();
  }
  function originalAndCurrent(row) {
    const first = baseline.find(item => item.case_id === row.case_id);
    $('review-original').textContent = `原始结果：${labels[first.status]} · ${first.reason}`;
    $('edit-current').textContent = `云端当前结果：${labels[row.status]} · v${row.version}\n${row.reason}`;
    $('edit-version').textContent = `草稿基于用例版本 v${currentEdit.base_version}`;
  }
  function openEdit(id) {
    if (busy || !canWrite()) return;
    const row = rows.find(item => item.case_id === id); if (!row) return;
    currentEdit = {case_id: id, base_version: row.version, actor_id: session.userId};
    $('review-dialog-title').textContent = `人工复核 · ${id}`; $('edit-question').textContent = row.title;
    $('edit-status').value = row.status; $('edit-reason').value = ''; $('edit-categories').value = row.failure_categories.join('，');
    $('edit-error').textContent = ''; $('edit-refresh').hidden = true;
    const draft = drafts.get(`${session.userId}:${id}`);
    if (draft) {
      currentEdit.base_version = draft.base_version;
      $('edit-status').value = draft.status; $('edit-reason').value = draft.reason; $('edit-categories').value = draft.categories;
      $('edit-error').textContent = '已恢复当前页面内存中的未提交草稿。';
      if (draft.base_version !== row.version) { $('edit-error').textContent += ' 云端版本已变化，请先核对最新结果。'; $('edit-refresh').hidden = false; }
    }
    originalAndCurrent(row); formMode(); $('review-dialog').showModal();
  }

  $('login-form').addEventListener('submit', event => {
    event.preventDefault(); if (busy || !configured) return;
    const email = $('login-email').value.trim(), password = $('login-password').value;
    $('login-password').value = '';
    operation(async () => {
      preserveDraft(); state = null; currentEdit = null; epoch++; recompute();
      await session.login(email, password);
      accept(await snapshot());
      notice(`已读取真实云端 r${state.revision}。${canWrite() ? '保存会记录你的登录身份；未提交草稿不影响报告统计。' : '此账号只有查看权限。'}${session.persistent ? '此浏览器已记住登录，最长 48 小时。' : '当前浏览器未保留 Cookie，仅本页登录有效。'}`);
    });
  });
  $('logout').onclick = () => operation(async () => {
    preserveDraft();
    let revoked = false;
    try { revoked = await session.logout(); }
    finally { if (state || currentEdit) invalidated(); $('login-password').value = ''; }
    notice(revoked ? '已退出登录并清除登录 Cookie。未提交草稿仅保留在当前页面内存中。' : '已清除本浏览器的登录 Cookie。云端撤销尚未确认，其他设备的会话可能仍有效；本页未提交草稿仍在内存中。', !revoked);
  });
  $('review-form').addEventListener('submit', event => {
    event.preventDefault(); if (busy || !canWrite() || !currentEdit) return;
    const status = $('edit-status').value;
    const override = status === 'reset' ? null : {business_status: status, business_reason: $('edit-reason').value.trim(), failure_categories: status === 'fail' ? [...new Set($('edit-categories').value.split(/[,，、\n]/).map(value => value.trim()).filter(Boolean))] : []};
    if (!validOverride(override)) { $('edit-error').textContent = '请填写有效理由（最多 6000 字）；失败分类最多 20 项，每项最多 100 字。'; return; }
    preserveDraft(); const edit = {...currentEdit};
    operation(async () => {
      const result = await request('/rest/v1/rpc/ai_review_save', {p_report_id: identity.report_id, p_source_digest: identity.source_digest, p_case_id: edit.case_id, p_base_version: edit.base_version, p_override: override});
      accept(result);
      drafts.delete(`${edit.actor_id}:${edit.case_id}`); currentEdit = null; $('review-dialog').close();
      notice(`已保存到真实云端 r${state.revision}，报告业务结果、任务完成率、失败索引与成功成本已更新。尚未同步到本地；原始 Trace / Gold / GPT 证据保持不变。`);
    });
  });
  $('edit-refresh').onclick = () => operation(async () => {
    if (!currentEdit || !canWrite()) return;
    preserveDraft(); const caseId = currentEdit.case_id;
    accept(await snapshot());
    if (!currentEdit || !canWrite()) return;
    const row = rows.find(item => item.case_id === caseId);
    currentEdit.base_version = row.version; originalAndCurrent(row); preserveDraft();
    $('edit-error').textContent = '已读取最新结果，草稿未改动。请核对当前结果，再点击保存；不会自动提交。';
    $('edit-refresh').hidden = true;
  });
  $('review-dialog-cancel').onclick = () => { if (!busy) { preserveDraft(); $('review-dialog').close(); currentEdit = null; } };
  $('review-dialog').addEventListener('cancel', event => { if (busy) event.preventDefault(); else { preserveDraft(); currentEdit = null; } });
  $('edit-status').onchange = () => { formMode(); preserveDraft(); };
  for (const id of ['edit-reason', 'edit-categories']) $(id).oninput = preserveDraft;
  for (const id of filterKeys) $(id).addEventListener(id === 'search' ? 'input' : 'change', render);
  $('reset').onclick = () => { for (const id of filterKeys) $(id).value = ''; render(); };
  $('refresh').onclick = () => operation(async () => { accept(await snapshot()); notice(`已读取真实云端最新版本 r${state.revision}。尚未同步到本地。`); });
  $('export-snapshot').onclick = () => operation(async () => {
    accept(await snapshot());
    const url = URL.createObjectURL(new Blob([JSON.stringify(state, null, 2) + '\n'], {type: 'application/json'})), link = document.createElement('a');
    link.href = url; link.download = `cloud-review-${identity.report_id}-r${state.revision}.json`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    notice(`已导出云端 r${state.revision} 复核快照，不含登录凭据。导出不代表已经同步本地。`);
  });
  function revealHash() {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const card = $(id); if (card?.classList.contains('case-card')) { card.hidden = false; card.scrollIntoView(); }
  }
  window.addEventListener('hashchange', revealHash);
  document.addEventListener('click', event => {
    const button = event.target.closest('[data-edit-case]'); if (button) openEdit(button.dataset.editCase);
    const link = event.target.closest('a[href^="#"]');
    if (link) { let id; try { id = decodeURIComponent(link.hash.slice(1)); } catch { return; } const card = $(id); if (card?.classList.contains('case-card')) card.hidden = false; }
  });
  window.addEventListener('beforeunload', event => { if (busy || drafts.size) { event.preventDefault(); event.returnValue = ''; } });
  setInterval(() => {
    if (session && Number.isFinite(session.deadline) && session.deadline > 0 && session.deadline <= Date.now()) session.clear();
    controls();
  }, 30000);
  operation(async () => {
    const localJson = async name => {
      const response = await fetch(new URL(name, document.baseURI), {credentials: 'omit', cache: 'no-store', redirect: 'error'});
      if (!response.ok) throw Error(`无法读取 ${name}；请通过已部署的 HTTP(S) 页面打开报告。`);
      return response.json();
    };
    const source = JSON.parse($('report-data').textContent);
    const [rawBase, rawConfig] = await Promise.all([localJson('./report-base.json'), localJson('./config.json')]);
    try { config = await validateDocuments(source, rawBase, rawConfig); configured = true; }
    finally { recompute(); revealHash(); }
    if (typeof window.AIReviewSession !== 'function') { configured = false; throw Error('登录组件未加载，云端修改已禁用。'); }
    try { session = new window.AIReviewSession(config, {onInvalidated: invalidated}); }
    catch (error) { configured = false; throw error; }
    $('config-state').textContent = '完整报告已校验。使用真实 Supabase；登录与报告授权通过后才可读取和保存。';
    if (await session.restore()) {
      accept(await snapshot());
      notice(`已从登录 Cookie 恢复身份并读取云端 r${state.revision}。${canWrite() ? '可修改业务结果。' : '当前账号只读。'}登录截止时间不会随刷新延长。`);
    } else notice('完整源报告已加载。尚未登录，没有读取或修改云端数据。');
  });
})();
