/* Navigation only: never changes case results or cloud review data. */
(() => {
  'use strict';
  if (document.getElementById('report-toc')) return;
  const header = document.querySelector('main > header');
  if (!header) return;
  const headings = [...document.querySelectorAll('main h2')]
    .filter(h => !h.closest('dialog, .failure-card, .auth-panel'));
  const nav = document.createElement('nav');
  nav.id = 'report-toc';
  nav.className = 'panel';
  nav.setAttribute('aria-label', '报告目录');
  const title = document.createElement('h2');
  title.textContent = '报告目录';
  const list = document.createElement('ol');
  headings.forEach((heading, index) => {
    if (!heading.id) {
      let id = `report-section-${index + 1}`;
      while (document.getElementById(id)) id += '-heading';
      heading.id = id;
    }
    heading.classList.add('report-nav-target');
    heading.tabIndex = -1;
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = `#${heading.id}`;
    link.textContent = heading.textContent.trim();
    link.addEventListener('click', () => heading.focus({preventScroll:true}));
    item.append(link);
    list.append(item);
  });
  nav.append(title, list);
  header.after(nav);
  const style = document.createElement('style');
  style.textContent = `
    #report-toc ol{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px 28px;padding-left:24px;margin:16px 0 0}
    #report-toc li{padding-left:4px;line-height:1.6;overflow-wrap:anywhere}
    #report-toc a{display:block;color:var(--accent,#2563eb);text-decoration:none;padding:5px 0}
    #report-toc a:hover{text-decoration:underline}
    #report-toc a:focus-visible{outline:2px solid var(--accent,#2563eb);outline-offset:3px;border-radius:3px}
    .report-nav-target{scroll-margin-top:20px}
    .report-nav-target:focus{outline:none}
    #back-to-top{position:fixed;right:max(20px,env(safe-area-inset-right));bottom:max(20px,env(safe-area-inset-bottom));z-index:100}
    @media(max-width:600px){#report-toc ol{grid-template-columns:1fr}#back-to-top{right:max(12px,env(safe-area-inset-right));bottom:max(12px,env(safe-area-inset-bottom))}}
  `;
  document.head.append(style);
})();
