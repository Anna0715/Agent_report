/* One presentation layer for the canonical main report and its review subpage. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = {pass:'通过',fail:'失败',skip:'待复核',pending_qa:'待 QA 复核',deferred:'延期',pending_fix:'待修复'};
  const isFailure = status => ['fail','pending_fix'].includes(status);
  const online = r => !['not_executed','local_fixture_pass'].includes(r.kind);
  const pct = (n,d) => d ? `${(100*n/d).toFixed(1)}%` : '—';
  const duration = n => Number.isFinite(n)?`${(n/1000).toFixed(1)}s`:'未采集';
  const anchor = r => `failure-${r.source_environment}-${r.case_id}`;
  const status = r => r.status==='skip'&&r.kind==='not_executed'?'未执行':label[r.status];
  const taskRate = r => r.task_completion_rate==null?'—':`${r.kind==='local_fixture_pass'&&r.task_completion_rate===1?100:r.task_completion_rate}%`;
  let rows=[],base=null,state=null,writable=false,page=1,initialized=false;
  const originalEvidence = new Map();
  function summary(current, source, snapshot) {
    rows=current; base=source; state=snapshot;
    const counts = Object.fromEntries(['test','pre'].map(env=>{
      const group=rows.filter(r=>r.source_environment===env&&online(r));
      return [env,{attempted:group.length,pass:group.filter(r=>r.status==='pass').length,fail:group.filter(r=>isFailure(r.status)).length,pending:group.filter(r=>r.status==='skip').length,pendingQa:group.filter(r=>r.status==='pending_qa').length,deferred:group.filter(r=>r.status==='deferred').length,pendingFix:group.filter(r=>r.status==='pending_fix').length}];
    }));
    const hiddenTestFailures=Number(base.summary.report_display?.suppressed_test_failure_attempts||0);
    counts.test.attempted+=hiddenTestFailures;
    counts.test.fail+=hiddenTestFailures;
    counts.combined=Object.fromEntries(['attempted','pass','fail','pending','pendingQa','deferred','pendingFix'].map(k=>[k,counts.test[k]+counts.pre[k]]));
    for(const c of Object.values(counts))c.assessed=c.pass+c.fail;
    const total=counts.combined, trace=base.summary.trace_gate||{};
    $('current-conclusion').querySelector('p').innerHTML=`${state?`云端复核 r${state.revision}`:'原始执行快照（未连接云端）'}：线上执行 ${total.attempted} 条，当前通过 <b>${total.pass}</b>、失败 <b>${total.fail}</b>、待复核/复测 ${total.pending}、待 QA 复核 <b>${total.pendingQa}</b>、延期 <b>${total.deferred}</b>、待修复 <b>${total.pendingFix}</b>（已计入失败）。综合成功率 <b>${pct(total.pass,total.assessed)}</b>（${total.pass}/${total.assessed} 个有效判定）。${rows.filter(r=>r.kind==='not_executed').length} 条未执行、${rows.filter(r=>r.kind==='local_fixture_pass').length} 条本地 fixture 单列，不计入线上通过率。内部 Trace ${trace.captured??'—'}/${trace.executed??'—'}，原始执行证据不变。`;
    const kpis=$('current-kpis').querySelectorAll('.kpi');
    for(const [i,value,note] of [[1,total.attempted,`test ${counts.test.attempted} + pre ${counts.pre.attempted}`],[2,total.pass,'当前已保存判定'],[3,pct(total.pass,total.assessed),`有效判定 ${total.assessed}；待复核 ${total.pending}，待 QA 复核 ${total.pendingQa}，延期 ${total.deferred} 均不计分母；待修复计入失败`]]){
      kpis[i].querySelector('b').textContent=value; kpis[i].querySelector('small').textContent=note;
    }
    const task=$('task-success');
    task.querySelector('.metrics').innerHTML=['test','pre','combined'].map(env=>{const c=counts[env];return `<div class="metric" data-success-env="${env}"><span>${env==='combined'?'综合':env}</span><b>${pct(c.pass,c.assessed)}</b><small>${c.pass}/${c.assessed} · 失败 ${c.fail} · 待复核 ${c.pending} · 待 QA 复核 ${c.pendingQa} · 延期 ${c.deferred} · 待修复 ${c.pendingFix}（计入失败）</small></div>`;}).join('');
    task.querySelector('p.muted').textContent='分母为线上已执行且当前明确判为通过/失败的用例；待修复计入失败；延期、待复核与待 QA 复核均不进入有效判定分母。未执行和本地 fixture 不因人工改判变成线上执行。';
    for(const card of document.querySelectorAll('.env-card')){
      const env=card.classList.contains('pre')?'pre':'test',c=counts[env],first=card.querySelector('p');
      first.innerHTML=`<b>Task Success Rate ${pct(c.pass,c.assessed)}</b>（${c.pass}/${c.assessed}）· 失败 ${c.fail} · 待复核 ${c.pending} · 待 QA 复核 ${c.pendingQa} · 延期 ${c.deferred} · 待修复 ${c.pendingFix}（计入失败）`;
      const scope=base.summary[env==='test'?'test_scope':'pre_scope']||{};
      card.querySelectorAll('p')[1].textContent=env==='test'
        ?`有效用例 ${scope.active_total??'—'} 条；线上已发起 ${c.attempted} 条，当前有效判定 ${c.assessed}、待复核/复测 ${c.pending}、待 QA 复核 ${c.pendingQa}；本地 fixture ${scope.local_executed??0} 条；未执行 ${scope.not_executed??0} 条。`
        :`数据集 ${scope.active_total??'—'} 条；本轮实跑 ${c.attempted} 条，当前有效判定 ${c.assessed}、待复核/复测 ${c.pending}、待 QA 复核 ${c.pendingQa}；未执行 ${scope.not_executed??0} 条。回答是否生成完成按原始执行证据统计，与人工业务判定分开。`;
    }
    const failures=rows.filter(r=>isFailure(r.status)), changed=rows.filter(r=>r.override), distribution=new Map();
    for(const row of failures)for(const category of row.failure_categories.length?row.failure_categories:['未分类'])distribution.set(category,(distribution.get(category)||0)+1);
    $('current-issues-body').innerHTML=`<p>当前展示失败（含待修复） <b>${failures.length}</b> 条${hiddenTestFailures?`；另有 ${hiddenTestFailures} 条重复 test 失败仅计入原始执行指标，不重复展示`:''}；人工覆盖 ${changed.length} 条，其中失败→通过 ${changed.filter(r=>isFailure(r.original_status)&&r.status==='pass').length} 条、通过→失败 ${changed.filter(r=>r.original_status==='pass'&&isFailure(r.status)).length} 条。${state?'按已保存的云端改判汇总。':'尚未加载云端复核，不代表最新人工结论。'}</p><p>${[...distribution].sort((a,b)=>b[1]-a[1]).map(([k,n])=>`${esc(k)}：${n} 条`).join('；')||'当前没有失败用例。'}${distribution.size?'（一条用例可有多个问题分类）':''}</p><ul>${failures.map(r=>`<li><a href="#${anchor(r)}">${esc(r.case_id)}</a> · ${esc(r.priority)} · ${esc(r.reason)}</li>`).join('')}</ul>`;
    const resource=$('resource-efficiency');
    const keys=['e2e_ms','steps','tool_calls','tokens','cache_token_ratio','cost_usd','retries'];
    resource.querySelectorAll('tbody tr').forEach((tr,i)=>{
      const key=keys[i]; if(!key)return;
      for(const [env,coverageCell,costCell] of [['test',2,3],['pre',5,6]]){
        const m=base.summary.metrics.efficiency.resource_cost[env]?.metrics[key]||{},successes=rows.filter(r=>r.source_environment===env&&online(r)&&r.status==='pass');
        const covered=successes.filter(r=>r.resource_coverage[key]).length;
        tr.children[coverageCell].innerHTML=`${m.valid_n??'—'}/${m.attempted_n??'—'}<br><small>成功样本覆盖 ${covered}/${successes.length}</small>`;
        if(key==='cache_token_ratio'){tr.children[costCell].innerHTML='—<br><small>比例指标不摊销</small>';continue;}
        const bound=Number(m.valid_n)<Number(m.attempted_n)||covered<successes.length;
        const v=Number.isFinite(m.total)&&successes.length ? m.total/successes.length : null;
        const value=v===null?'未能计算':key==='cost_usd'?`$${v.toFixed(4)}`:key==='e2e_ms'?duration(v):v.toLocaleString('zh-CN',{maximumFractionDigits:key==='tokens'?0:1});
        tr.children[costCell].innerHTML=`${v!==null&&bound?'≥':''}${value}<br><small>全部已观测消耗 ÷ 当前线上成功 ${successes.length} 条</small>`;
      }
    });
    resource.querySelector('.note').textContent=`原始资源消耗不变；按当前线上业务成功数重算摊销成本：test ${counts.test.pass} 条、pre ${counts.pre.pass} 条。没有成功样本时不计算；“≥”表示资源覆盖不全的观测下限，缺失值不补 0。下方 GPT 文字是执行时历史结论，当前问题以“当前问题汇总”为准。`;
  }
  function options(id,values){const select=$(id),value=select.value;select.querySelectorAll('option:not(:first-child)').forEach(o=>o.remove());for(const v of [...new Set(values)].sort((a,b)=>a.localeCompare(b,'zh-CN',{numeric:true})))select.add(new Option(v,v));select.value=value;if(select.selectedIndex<0)select.selectedIndex=0;}
  function filtered(){const env=$('filter-environment').value,s=$('filter-status').value,p=$('filter-priority').value,c=$('category').value,q=$('search').value.trim().toLowerCase();return rows.filter(r=>(!env||r.source_environment===env)&&(!s||r.status===s)&&(!p||r.priority===p)&&(!c||r.failure_categories.includes(c))&&(!q||[r.case_id,r.title,r.module,r.scenario,r.reason,...r.failure_categories].join(' ').toLowerCase().includes(q)));}
  function renderCases(current,source,snapshot,canWrite){
    rows=current;base=source;state=snapshot;writable=canWrite;
    if(!initialized){
      for(const card of document.querySelectorAll('.failure-card'))originalEvidence.set(card.id,card.querySelector('.business-review').innerHTML);
      $('prev').onclick=()=>{page--;renderTable();};$('next').onclick=()=>{page++;renderTable();};
      $('category').onchange=()=>{page=1;renderTable();};
      window.addEventListener('hashchange',showTarget);
      initialized=true;
    }
    options('filter-priority',rows.map(r=>r.priority||'未标注'));
    options('category',rows.flatMap(r=>r.failure_categories));
    renderTable();
  }
  function showTarget(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const card=$(id);if(card?.classList.contains('failure-card')){card.hidden=false;card.scrollIntoView({block:'start'});}}
  function renderTable(){
    const visible=filtered(),pages=Math.max(1,Math.ceil(visible.length/20));page=Math.max(1,Math.min(page,pages));
    const names=new Map((state?.history||[]).map(h=>[h.actor,h.actor_name]));
    const action=r=>document.body.dataset.reviewMode==='edit'?`<button data-edit-case="${esc(r.case_id)}" ${writable?'':'disabled'}>修改结果</button>`:'<a href="./cloud-review/current/">前往复核页</a>';
    $('body').innerHTML=visible.slice((page-1)*20,page*20).map(r=>`<tr data-case-id="${esc(r.case_id)}"><td><span class="badge ${r.source_environment}">${r.source_environment}</span></td><td><a href="#${anchor(r)}">${esc(r.case_id)}</a></td><td>${esc(r.priority)}</td><td>${esc(r.module)}</td><td>${esc(r.scenario)}</td><td>${esc(r.suite)}</td><td>${esc(r.gate_class)}</td><td><span class="status ${r.status}" data-case-status>${status(r)}</span><br><small>${r.override?'云端人工复核':'原始判定'}</small></td><td>${taskRate(r)}</td><td>${r.trace_runs} Run<br>${esc(r.trace_status)}</td><td>${esc(r.model)}<br><small>${esc(r.prompt_version)}</small></td><td>${duration(r.latency_ms)}</td><td><p>${esc(r.title)}</p><p class="case-reason">${esc(r.reason)}</p><small>${esc(r.failure_categories.join('、'))}</small>${r.override?`<details><summary>原始判定：${label[r.original_status]}</summary>${esc(r.original_reason)}</details>`:''}</td><td>${esc(names.get(r.updated_by)||'—')}<br><small>${r.updated_at?esc(new Date(r.updated_at).toLocaleString('zh-CN')):''} · v${r.version}</small></td><td>${action(r)}</td></tr>`).join('');
    $('page').textContent=`第 ${page} / ${pages} 页 · ${visible.length} 条`;$('result-count').textContent=`显示 ${visible.length} / ${rows.length} 条`;$('prev').disabled=page<=1;$('next').disabled=page>=pages;
    const failures=visible.filter(r=>isFailure(r.status));$('failure-count').textContent=failures.length;
    $('failure-index').querySelector('tbody').innerHTML=failures.map(r=>`<tr><td>${r.source_environment}</td><td><a href="#${anchor(r)}">${esc(r.case_id)}</a></td><td>${esc(r.priority)}</td><td>${esc(r.module)}</td><td>${esc(r.scenario)}</td><td>${esc(r.ability||r.title)}</td><td>${esc(r.failure_categories.join('、')||'未分类')}</td><td>${duration(r.latency_ms)}</td><td>${taskRate(r)}</td></tr>`).join('');
    const visibleFailures=new Set(failures.map(anchor));
    for(const r of rows){
      const card=$(anchor(r));if(!card)continue;
      card.hidden=!visibleFailures.has(card.id)&&location.hash!==`#${card.id}`;
      const badge=card.querySelector('.failure-head > .status');badge.className=`status ${r.status}`;badge.textContent=status(r);
      const rate=card.querySelector('.failure-stats .bad-rate');rate.textContent=taskRate(r);
      card.querySelector('.failure-tags').innerHTML=`<b>当前失败分类：</b>${esc(r.failure_categories.join('、')||'—')}`;
      card.querySelector('.business-review').innerHTML=`<b>当前业务判定（${r.override?'云端人工复核':'原始裁判'}）：</b>${esc(r.reason)}${r.override?`<details><summary>查看原始业务判定</summary>${originalEvidence.get(card.id)}</details>`:''}`;
      let edit=card.querySelector('.case-review-action');if(!edit){edit=document.createElement('div');edit.className='case-review-action';card.querySelector('.failure-head').after(edit);}edit.innerHTML=action(r);
    }
  }
  window.AICombinedReport={summary,renderCases,anchor,resetPage:()=>{page=1;},showTarget};
})();
