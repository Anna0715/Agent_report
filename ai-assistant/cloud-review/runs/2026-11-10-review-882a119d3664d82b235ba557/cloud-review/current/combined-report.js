/* One presentation layer for the canonical main report and its review subpage. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const backToTop = $('back-to-top');
  if (backToTop) {
    const updateBackToTop = () => { backToTop.hidden = window.scrollY < 400; };
    window.addEventListener('scroll', updateBackToTop, {passive:true});
    backToTop.addEventListener('click', () => {
      $('report-top')?.focus({preventScroll:true});
      window.scrollTo({top:0, behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth'});
    });
    updateBackToTop();
  }
  const esc = v => String(v ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const label = {pass:'通过',fail:'失败',skip:'待复核',pending_qa:'待 QA 复核',deferred:'延期',pending_fix:'待修复'};
  const isFailure = status => ['fail','pending_fix'].includes(status);
  const online = r => !['not_executed','local_fixture_pass','deferred'].includes(r.kind);
  const reviewOrigin = r => {
    const source=r.review_reuse;
    if (!source) return '原始判定';
    if(source.mode==='live_source')return `${source.source_workflow_released?'来源复核流程已解除，显示本轮评测':source.source_deferral_released?'来源延期已解除，显示本轮评测':source.source_same_request_workflow?'保留同一业务请求的人工复核状态':'来源报告实时复核'} · <a href="${esc(source.source_url)}" target="_blank" rel="noopener">原批次</a> · r${source.revision} · ${esc(source.actor_name)} · ${esc(source.reviewed_at)}${source.source_reset&&!source.source_deferral_released&&!source.source_workflow_released?' · 已恢复来源原判':''}`;
    const from=/^https:\/\/anna0715\.github\.io\/Agent_report\//.test(source.source_url||'')?`<a href="${esc(source.source_url)}" target="_blank" rel="noopener">上一份报告</a>`:'上一份报告';
    return `${source.mode==='deferred_skip'?'上轮延期，本轮跳过':'结果一致，沿用已保存复核'} · ${from} · r${esc(source.revision)}${source.actor_name?` · ${esc(source.actor_name)}`:''}${source.reviewed_at?` · ${esc(source.reviewed_at)}`:''}`;
  };
  const pct = (n,d) => d ? `${(100*n/d).toFixed(1)}%` : '—';
  const duration = n => Number.isFinite(n)?`${(n/1000).toFixed(1)}s`:'未采集';
  const anchor = r => `failure-${r.source_environment}-${r.case_id}`;
  const resultStatus = r => r.status==='skip'&&['not_executed','local_fixture_pass'].includes(r.kind)?r.kind:r.status;
  const status = r => ({not_executed:'未执行',local_fixture_pass:'本地回放通过'})[resultStatus(r)]||label[r.status];
  const taskRate = r => r.task_completion_rate==null?'—':`${r.kind==='local_fixture_pass'&&r.task_completion_rate===1?100:r.task_completion_rate}%`;
  // This is an immutable comparison of two source executions, not a comparison
  // of the mutable cloud-review status with the prior report's displayed row.
  const comparisonCell = comparison => {
    if (!comparison) return '<small>未提供两轮可核验实测</small>';
    const result = {improved:'失败 → 通过', regressed:'通过 → 失败', unchanged:'结果持平'};
    const latest = comparison.latest_status ? `本轮 ${label[comparison.latest_status] || '不可判定'}` : '本轮无可核验结论';
    const previous = comparison.previous_status ? `上轮 ${label[comparison.previous_status] || '不可判定'}` : '上轮无可比实测';
    return `<b>${comparison.eligible ? esc(result[comparison.verdict] || '不可直接比较') : '不可直接比较'}</b><br><small>${esc(latest)} · ${esc(previous)}</small><br><small>${esc(comparison.reason || '证据不足')}</small>`;
  };
  const originalAIReviewDetails = r => {
    const review=r.original_ai_review;
    if (!review?.business_reason) return '';
    const source=/^https:\/\/anna0715\.github\.io\/Agent_report\//.test(review.source_url||'')?`<a href="${esc(review.source_url)}">查看来源报告</a>`:'';
    return `<details class="original-ai-review"><summary>原报告 AI 裁判（历史）：${esc(label[review.business_status]||'未记录')}</summary><p class="original-ai-reason">${esc(review.business_reason)}</p><small>裁判模型：${esc(review.judge_model||'未记录')} · ${source}</small></details>`;
  };
  let rows=[],base=null,state=null,writable=false,page=1,initialized=false;
  const selectedCaseIds = new Set();
  let caseIdOptionsKey='';
  const originalEvidence = new Map();
  function summary(current, source, snapshot) {
    rows=current; base=source; state=snapshot;
    const counts = Object.fromEntries(['test','pre'].map(env=>{
      const environmentRows=rows.filter(r=>r.source_environment===env),group=environmentRows.filter(online);
      return [env,{attempted:group.length,pass:group.filter(r=>r.status==='pass').length,fail:group.filter(r=>isFailure(r.status)).length,pending:group.filter(r=>r.status==='skip').length,pendingQa:group.filter(r=>r.status==='pending_qa').length,deferred:environmentRows.filter(r=>r.status==='deferred').length,pendingFix:group.filter(r=>r.status==='pending_fix').length}];
    }));
    const hiddenTestFailures=Number(base.summary.report_display?.suppressed_test_failure_attempts||0);
    counts.test.attempted+=hiddenTestFailures;
    counts.test.fail+=hiddenTestFailures;
    counts.combined=Object.fromEntries(['attempted','pass','fail','pending','pendingQa','deferred','pendingFix'].map(k=>[k,counts.test[k]+counts.pre[k]]));
    for(const c of Object.values(counts))c.assessed=c.pass+c.fail;
    const total=counts.combined, trace=base.summary.trace_gate||{};
    const reportEnvironment=base.summary.report_environment;
    const singleEnvironment=['test','pre'].includes(reportEnvironment);
    $('current-conclusion').querySelector('p').innerHTML=`${state?`云端复核 r${state.revision}`:'原始执行快照（未连接云端）'}：线上执行 ${total.attempted} 条，当前通过 <b>${total.pass}</b>、失败 <b>${total.fail}</b>、待复核/复测 ${total.pending}、待 QA 复核 <b>${total.pendingQa}</b>、延期 <b>${total.deferred}</b>、待修复 <b>${total.pendingFix}</b>（已计入失败）。综合成功率 <b>${pct(total.pass,total.assessed)}</b>（${total.pass}/${total.assessed} 个有效判定）。${rows.filter(r=>r.kind==='not_executed').length} 条未执行、${rows.filter(r=>r.kind==='local_fixture_pass').length} 条本地 fixture 单列，不计入线上通过率。内部 Trace ${trace.captured??'—'}/${trace.executed??'—'}，原始执行证据不变。`;
    const kpis=$('current-kpis').querySelectorAll('.kpi');
    for(const kpi of kpis)if(!kpi.querySelector('small'))kpi.appendChild(document.createElement('small'));
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
    resource.querySelector('.note').textContent=`原始资源消耗不变；按当前线上业务成功数重算摊销成本：${singleEnvironment?`${reportEnvironment} ${total.pass} 条`:`test ${counts.test.pass} 条、pre ${counts.pre.pass} 条`}。没有成功样本时不计算；“≥”表示资源覆盖不全的观测下限，缺失值不补 0。下方 GPT 文字是执行时历史结论，当前问题以“当前问题汇总”为准。`;
    if(reportEnvironment==='pre'){
      const pre=counts.pre,scope=base.summary.pre_scope||{},notExecuted=rows.filter(r=>r.kind==='not_executed').length;
      $('current-conclusion').querySelector('p').innerHTML=`${state?`云端复核 r${state.revision}`:'原始执行快照（未连接云端）'}：pre 范围 ${scope.active_total||rows.length} 条，实际发起 ${pre.attempted} 条，认证 Trace ${trace.captured??'—'}/${trace.executed??'—'} 条。当前通过 <b>${pre.pass}</b>、失败 <b>${pre.fail}</b>、待复核 ${pre.pending}、待 QA 复核 ${pre.pendingQa}、延期 ${pre.deferred}、待修复 ${pre.pendingFix}（计入失败）；另有 ${notExecuted} 条未执行。pre 任务成功率 <b>${pct(pre.pass,pre.assessed)}</b>（${pre.pass}/${pre.assessed} 个有效判定）。`;
      const values=[
        ['pre 用例',scope.active_total||rows.length,'全部预发范围'],
        ['实际发起',pre.attempted,'未执行单列'],
        ['认证 Trace',trace.captured??'—',`${trace.executed??'—'} 条已发起`],
        ['业务通过',pre.pass,'按当前已保存判定'],
        ['业务失败',pre.fail,'含待修复'],
        ['任务成功率',pct(pre.pass,pre.assessed),`${pre.pass}/${pre.assessed} 个有效判定`],
      ];
      kpis.forEach((node,index)=>{
        const [name,value,note]=values[index];
        node.querySelector('span').textContent=name;
        node.querySelector('b').textContent=value;
        node.querySelector('small').textContent=note;
      });
      task.querySelector('.metrics').innerHTML=`<div class="metric" data-success-env="pre"><span>pre</span><b>${pct(pre.pass,pre.assessed)}</b><small>${pre.pass}/${pre.assessed} · 失败 ${pre.fail} · 待复核 ${pre.pending} · 待 QA 复核 ${pre.pendingQa} · 延期 ${pre.deferred} · 待修复 ${pre.pendingFix}（计入失败）</small></div>`;
      resource.querySelector('.note').textContent=`仅按 pre 当前线上业务成功 ${pre.pass} 条重算摊销成本；缺失资源不补零。`;
    } else if(singleEnvironment){
      const conclusion=$('current-conclusion').querySelector('p');
      conclusion.innerHTML=conclusion.innerHTML.replace('综合成功率',`${reportEnvironment} 成功率`);
      kpis[1].querySelector('small').textContent=`${reportEnvironment} ${total.attempted}`;
    }
  }
  function options(id,values){
    const select=$(id),value=select.value;
    const next=[...new Set(values)].sort((a,b)=>a.localeCompare(b,'zh-CN',{numeric:true}));
    const current=[...select.options].slice(1).map(option=>option.value);
    if(JSON.stringify(current)===JSON.stringify(next)||document.activeElement===select)return;
    select.querySelectorAll('option:not(:first-child)').forEach(option=>option.remove());
    for(const item of next)select.add(new Option(item,item));
    select.value=value;if(select.selectedIndex<0)select.selectedIndex=0;
  }
  function matchingCaseIds(){
    const terms=($('case-id-search')?.value||'').trim().toLowerCase().split(/[\s,，;；]+/).filter(Boolean);
    return [...new Set(rows.map(row=>row.case_id))].sort((a,b)=>a.localeCompare(b,'en',{numeric:true}))
      .filter(id=>!terms.length||terms.some(term=>id.toLowerCase().includes(term)));
  }
  function renderCaseIdOptions(){
    if(!$('case-id-filter'))return;
    const matches=matchingCaseIds(),key=JSON.stringify(matches);
    if(key!==caseIdOptionsKey){
      $('case-id-options').innerHTML=matches.length?matches.map(id=>`<label class="case-id-option"><input type="checkbox" data-case-id-option value="${esc(id)}"${selectedCaseIds.has(id)?' checked':''}><span>${esc(id)}</span></label>`).join(''):'<p class="muted">没有匹配的用例 ID</p>';
      caseIdOptionsKey=key;
    }
    for(const option of $('case-id-options').querySelectorAll('[data-case-id-option]'))option.checked=selectedCaseIds.has(option.value);
    $('case-id-filter-label').textContent=selectedCaseIds.size===0?'用例 ID：全部':selectedCaseIds.size===1?`用例 ID：${[...selectedCaseIds][0]}`:`用例 ID：已选 ${selectedCaseIds.size} 项`;
    $('case-id-filter-toggle').title=selectedCaseIds.size?[...selectedCaseIds].join('、'):'筛选用例 ID，可搜索和多选';
    $('case-id-filter-count').textContent=`匹配 ${matches.length} / ${new Set(rows.map(row=>row.case_id)).size} 项 · 已选 ${selectedCaseIds.size} 项`;
    $('case-id-select-matches').disabled=!matches.length||matches.every(id=>selectedCaseIds.has(id));
    $('case-id-clear').disabled=!selectedCaseIds.size;
  }
  function resetCaseIds(){
    selectedCaseIds.clear();
    if($('case-id-search'))$('case-id-search').value='';
    if($('case-id-filter'))$('case-id-filter').open=false;
    renderCaseIdOptions();
  }
  function initializeCaseIdFilter(){
    const dropdown=$('case-id-filter');if(!dropdown)return;
    const apply=()=>{renderCaseIdOptions();page=1;renderTable();};
    $('case-id-search').addEventListener('input',renderCaseIdOptions);
    $('case-id-options').addEventListener('change',event=>{
      const option=event.target;if(!option.matches('[data-case-id-option]'))return;
      if(option.checked)selectedCaseIds.add(option.value);else selectedCaseIds.delete(option.value);
      apply();
    });
    $('case-id-select-matches').addEventListener('click',()=>{for(const id of matchingCaseIds())selectedCaseIds.add(id);apply();});
    $('case-id-clear').addEventListener('click',()=>{selectedCaseIds.clear();apply();});
    dropdown.addEventListener('toggle',()=>{if(dropdown.open)$('case-id-search').focus({preventScroll:true});});
    dropdown.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();dropdown.open=false;$('case-id-filter-toggle').focus({preventScroll:true});}});
    document.addEventListener('click',event=>{if(dropdown.open&&!dropdown.contains(event.target))dropdown.open=false;});
  }
  function filtered(){
    const env=$('filter-environment').value,s=$('filter-status').value,m=$('filter-module').value,p=$('filter-priority').value,c=$('category').value;
    const terms=$('search').value.toLowerCase().split(/[;；]/).map(term=>term.trim()).filter(Boolean);
    return rows.filter(r=>(!selectedCaseIds.size||selectedCaseIds.has(r.case_id))&&(!env||r.source_environment===env)&&(!s||resultStatus(r)===s)&&(!m||(r.module||'未标注')===m)&&(!p||r.priority===p)&&(!c||r.failure_categories.includes(c))&&(!terms.length||terms.some(term=>[r.case_id,r.asker,r.title,r.module,r.scenario,r.reason,...r.failure_categories].join(' ').toLowerCase().includes(term))));
  }
  function renderCases(current,source,snapshot,canWrite){
    rows=current;base=source;state=snapshot;writable=canWrite;
    if(!initialized){
      initializeCaseIdFilter();
      for(const card of document.querySelectorAll('.failure-card'))originalEvidence.set(card.id,card.querySelector('.business-review').innerHTML);
      $('prev').onclick=()=>{page--;renderTable();};$('next').onclick=()=>{page++;renderTable();};
      $('category').onchange=()=>{page=1;renderTable();};
      window.addEventListener('hashchange',showTarget);
      // Apply option-list changes after the native popup has finished its change/blur events.
      document.addEventListener('focusout',event=>{
        const select=event.target;
        if(!select.matches('[data-case-status-select],#filter-module,#filter-priority,#category'))return;
        requestAnimationFrame(()=>{if(document.activeElement!==select)renderCases(rows,base,state,writable);});
      });
      initialized=true;
    }
    options('filter-module',rows.map(r=>r.module||'未标注'));
    options('filter-priority',rows.map(r=>r.priority||'未标注'));
    options('category',rows.flatMap(r=>r.failure_categories));
    renderCaseIdOptions();
    renderTable();
  }
  function showTarget(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return;}const card=$(id);if(card?.classList.contains('failure-card')){card.hidden=false;card.scrollIntoView({block:'start'});}}
  function renderTable(){
    const visible=filtered(),pages=Math.max(1,Math.ceil(visible.length/20));page=Math.max(1,Math.min(page,pages));
    const names=new Map((state?.history||[]).map(h=>[h.actor,h.actor_name]));
    const action=r=>document.body.dataset.reviewMode==='edit'?`<button data-edit-case="${esc(r.case_id)}" ${writable?'':'disabled'}>修改结果</button>`:'<a href="./cloud-review/current/">前往复核页</a>';
    $('body').innerHTML=visible.slice((page-1)*20,page*20).map(r=>`<tr data-case-id="${esc(r.case_id)}"><td><span class="badge ${r.source_environment}">${r.source_environment}</span></td><td><a href="#${anchor(r)}">${esc(r.case_id)}</a></td><td>${esc(r.asker||'未记录')}${r.asker_source==='case_config'?'<br><small>用例配置</small>':''}</td><td>${esc(r.priority)}</td><td>${esc(r.module)}</td><td>${esc(r.scenario)}</td><td>${esc(r.suite)}</td><td>${esc(r.gate_class)}</td><td><span class="status ${r.status}" data-case-status>${status(r)}</span><br><small>${r.override?'云端人工复核':reviewOrigin(r)}</small></td><td>${comparisonCell(r.execution_comparison)}</td><td>${taskRate(r)}</td><td>${r.trace_runs} Run<br>${esc(r.trace_status)}</td><td>${esc(r.model)}<br><small>${esc(r.prompt_version)}</small></td><td>${duration(r.latency_ms)}</td><td><p>${esc(r.title)}</p><p class="case-reason">${esc(r.reason)}</p>${originalAIReviewDetails(r)}<small>${esc(r.failure_categories.join('、'))}</small>${r.override?`<details><summary>原始判定：${label[r.original_status]}</summary>${esc(r.original_reason)}</details>`:''}</td><td>${esc(names.get(r.updated_by)||r.review_reuse?.actor_name||'—')}<br><small>${r.updated_at?esc(new Date(r.updated_at).toLocaleString('zh-CN')):''} · v${r.version}</small></td><td>${action(r)}</td></tr>`).join('');
    $('page').textContent=`第 ${page} / ${pages} 页 · ${visible.length} 条`;$('result-count').textContent=`显示 ${visible.length} / ${rows.length} 条`;$('prev').disabled=page<=1;$('next').disabled=page>=pages;
    $('failure-count').textContent=visible.length;
    $('failure-index').querySelector('tbody').innerHTML=visible.map(r=>`<tr data-index-case="${esc(r.case_id)}" data-result-status="${esc(resultStatus(r))}"><td>${r.source_environment}</td><td><a href="#${anchor(r)}">${esc(r.case_id)}</a></td><td>${esc(r.asker||'未记录')}${r.asker_source==='case_config'?'<br><small>用例配置</small>':''}</td><td>${esc(r.priority)}</td><td>${esc(r.module)}</td><td>${esc(r.scenario)}</td><td>${esc(r.ability||r.title)}</td><td>${esc(status(r))}</td><td>${esc(r.failure_categories.join('、')||'—')}</td><td>${duration(r.latency_ms)}</td><td>${taskRate(r)}</td></tr>`).join('');
    const visibleCases=new Set(visible.map(anchor));
    for(const r of rows){
      const card=$(anchor(r));if(!card)continue;
      card.hidden=!visibleCases.has(card.id)&&location.hash!==`#${card.id}`;
      let select=card.querySelector('[data-case-status-select]');
      if(!select){
        select=document.createElement('select');
        select.dataset.caseStatusSelect=r.case_id;
        select.setAttribute('aria-label',`更改 ${r.case_id} 用例状态`);
        for(const [value,text]of Object.entries(label))select.add(new Option(text,value));
        select.add(new Option('恢复原判','reset'));
        card.querySelector('.failure-head > .status').replaceWith(select);
      }
      select.className=`status case-status-select ${r.status}`;
      const skipOption=select.querySelector('option[value="skip"]'),skipText=r.kind==='not_executed'?'未执行':r.kind==='local_fixture_pass'?'本地回放通过':label.skip;
      if(skipOption.textContent!==skipText)skipOption.textContent=skipText;
      if(document.activeElement!==select&&select.value!==r.status)select.value=r.status;
      if(select.disabled!==!writable)select.disabled=!writable;
      select.title=writable?'选择状态后填写复核理由并保存':'请先登录有修改权限的复核账号';
      const rate=card.querySelector('.failure-stats .bad-rate');rate.textContent=taskRate(r);
      card.querySelector('.failure-tags').innerHTML=`<b>当前失败分类：</b>${esc(r.failure_categories.join('、')||'—')}`;
      card.querySelector('.business-review').innerHTML=`<b>当前业务判定（${r.override?'云端人工复核':r.review_reuse?.source_workflow_released?'来源复核流程已解除，显示本轮评测':r.review_reuse?.source_deferral_released?'来源延期已解除，显示本轮评测':r.review_reuse?.mode==='live_source'?'来源报告已保存复核':'原始裁判'}）：</b>${esc(r.reason)}${r.override?`<details><summary>查看原始业务判定</summary>${originalEvidence.get(card.id)}</details>`:''}`;
      let edit=card.querySelector('.case-review-action');if(!edit){edit=document.createElement('div');edit.className='case-review-action';card.querySelector('.failure-head').after(edit);}edit.innerHTML=action(r);
    }
  }
  window.AICombinedReport={summary,renderCases,anchor,resultStatus,resetPage:()=>{page=1;},resetCaseIds,showTarget};
})();
