from playwright.sync_api import sync_playwright
from pathlib import Path
import json
r=Path(__file__).parent.parent
rows=['TEAM LEAD','HOMESH','JORGE','APPLE / NILSON']
statuses=[['No tasks planned']*4,["OHC - GPS (Embarkation & CIW)|Planned;Test|Active;Test|Done","OHC - GPS|Planned;OHC - Print Shop|Planned;GPS|Blocked","OHC - GPS|Planned;OHC - Print Shop|Planned;OHC - On the Go|Done","OHC - GPS|Planned;OHC - Print Shop|Planned;OHC - On the Go|Done;OHC - Concierges|Done"],["Frictionless Embarkation|Done"]*4,["AffairWhere|Planned"]*4]
headers=''.join(f'''<th class="{'nb-current-week-column' if i==0 else ''}"><div class="nb-week-head"><div class="nb-week-head-top"><div class="nb-week-head-title"><strong>Week {i+1}</strong><small>{['19 Oct - 25 Oct 2026','26 Oct - 1 Nov 2026','2 Nov - 8 Nov 2026','9 Nov - 15 Nov 2026'][i]}</small></div><button class="nb-week-head-select">›</button></div><div class="nb-week-milestones"><button class="nb-milestone-chip {'nb-ms-complete' if i==0 else ''}">⚑ &nbsp; {'DC Handover' if i==0 else 'New milestone'}</button></div></div></th>''' for i in range(4))
body=''
for ri,name in enumerate(rows):
 cols=''
 for i in range(4):
  ss=statuses[ri][i]
  if ss=='No tasks planned':
   content='<div class="nb-week-cell-head"><strong>No tasks planned</strong></div>'
  else:
   tasklist=[k.split('|') for k in ss.split(';')]
   content=f'<div class="nb-week-cell-head"><strong>{len(tasklist)} assignments</strong></div>' + ''.join(f'<span class="nb-mini-task"><span>{k}</span><span class="nb-badge nb-status-{st.lower().replace("active","in-progress").replace("done","completed")}">{st}</span></span>' for k,st in tasklist)
  cols+=f'<td class="{"nb-current-week-cell" if i==0 else ""}"><button class="nb-week-cell">{content}</button></td>'
 body+=f'<tr class="{"nb-no-assignments" if ri==0 else "nb-has-assignments"}"><th><div class="nb-person-cell"><span class="nb-avatar">{name[0]}</span><div class="nb-person-copy"><strong>{name}</strong></div></div></th>{cols}</tr>'
nav=''
for i in range(4):
 days=''.join(f'<span class="nb-week-day {"nb-week-day-today" if i==0 and d==5 else ""}">{v}</span>' for d,v in enumerate('Mon Tue Wed Thu Fri Sat Sun'.split()))
 nav+=f'''<div class="nb-week-nav-shell {'nb-week-nav-first' if i==0 else 'nb-week-nav-last' if i==3 else ''}"><button class="nb-week-wide-card {'nb-week-wide-selected nb-week-wide-current' if i==0 else ''}"><strong>Week {i+1}</strong><span class="nb-week-wide-date">19 Oct - 25 Oct 2026</span><span class="nb-week-wide-days">{days}</span></button>{'<button class="nb-button nb-week-arrow nb-weeks-prev">‹</button>' if i==0 else ''}{'<button class="nb-button nb-week-arrow nb-weeks-next">›</button>' if i==3 else ''}</div>'''
html=f'''<!DOCTYPE html><html><head><meta charset="UTF-8"><style>html,body{{margin:0;background:#f7fbff}} .shell{{display:flex;height:100vh}} .side{{width:78px;flex:0 0 78px;background:#06264d}}.area{{flex:1;min-width:0}} .nb-tracker{{height:100vh}} </style></head><body><div class="shell nbdt-redesign"><aside class="side"></aside><main class="area"><section class="nb-tracker" data-view="overview"><header class="nb-page-header"><div><h1>Weekly Tracker</h1><p>19 Oct - 25 Oct 2026 — 9 Nov - 15 Nov 2026 · Legend OTS</p></div><div class="nb-actions"><button class="nb-button">Share view</button><button class="nb-button">Edit mode</button></div></header><div class="nb-toolbar"><button class="nb-button nb-primary">Overview</button><button class="nb-button">List</button><label class="nb-project-start">▦ Project start <strong>2026-10-19</strong></label><select><option>All people</option></select><select><option>All statuses</option></select><div class="nb-search-box"><input placeholder="Search tasks or people..."></div></div><div class="nb-summary"><div class="nb-summary-metrics"><span class="nb-summary-pill">♧ 12 people</span><span class="nb-summary-pill nb-selected-summary">▣ Week 1 selected · 13 unique tasks</span><span class="nb-summary-pill">0 blocked in selected week</span><span class="nb-summary-pill">Viewing Weeks 1–4 · 44 unique tasks</span><span class="nb-current-indicator">Current: Week 1</span></div></div><div class="nb-tracker-content"><div class="nb-tracker-table-wrap"><table class="nb-week-grid"><thead><tr><th class="nb-employee-head">Employee</th>{headers}</tr></thead><tbody>{body}</tbody></table></div></div><footer class="nb-week-footer nb-aligned-week-footer nb-approved-week-footer"><div class="nb-week-card-scroller"><div class="nb-week-card-grid"><div class="nb-week-navigation-label nb-week-navigation-home"><strong>Project weeks</strong><button class="nb-button nb-today-action">▣ Today</button></div>{nav}</div></div></footer></section></main></div></body></html>'''
results=[]
with sync_playwright() as p:
 browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox','--disable-dev-shm-usage'])
 for viewport in [1774,1536,1440,1150,900]:
  page=browser.new_page(viewport={'width':viewport,'height':960},device_scale_factor=1)
  page.set_content(html)
  page.add_style_tag(path=str(r/'redesign.css'))
  page.add_style_tag(path=str(r/'weekly-tracker-approved-v016.css'))
  page.evaluate('''() => {let hs=[...document.querySelectorAll('.nb-week-grid thead th')];const g=document.querySelector('.nb-week-card-grid');const widths=hs.map(h=>h.getBoundingClientRect().width);g.style.setProperty('grid-template-columns',widths.map(x=>`${x}px`).join(' '),'important');g.style.setProperty('width',widths.reduce((a,b)=>a+b,0)+'px','important');}''')
  values=page.evaluate('''() => {const ws=[...document.querySelectorAll('.nb-week-head')].map(x=>x.getBoundingClientRect()),bs=[...document.querySelectorAll('.nb-week-wide-card')].map(x=>x.getBoundingClientRect());const ths=[...document.querySelectorAll('.nb-week-grid thead th')].slice(1).map(x=>x.getBoundingClientRect());return {offsets:ws.map((x,i)=>({week:i+1,headerStart:x.x,footerStart:bs[i].x,delta:Math.round((x.x-bs[i].x)*100)/100,headerWidth:x.width,footerWidth:bs[i].width})),topRadius:getComputedStyle(document.querySelector('.nb-week-head')).borderTopLeftRadius,tableOutside:getComputedStyle(document.querySelector('.nb-tracker-table-wrap')).borderTopWidth,prevInside:bs[0].left<=document.querySelector('.nb-weeks-prev').getBoundingClientRect().left, nextInside:document.querySelector('.nb-weeks-next').getBoundingClientRect().right<=bs[3].right,scrollOverflow:document.querySelector('.nb-tracker-table-wrap').scrollWidth>document.querySelector('.nb-tracker-table-wrap').clientWidth}}''')
  values['viewport']=viewport
  results.append(values)
  if viewport==1536:
   page.screenshot(path=str(r/'verification/v016_isolated_chromium_1536.png'),full_page=False)
  page.close()
 browser.close()
(r/'verification/v016_geometry_check.json').write_text(json.dumps(results,indent=2))
for x in results:
 print(x['viewport'], 'deltas', [d['delta'] for d in x['offsets']], 'arrowInside',x['prevInside'],x['nextInside'],'radius',x['topRadius'],'tableOutsideBorder',x['tableOutside'],'overflows',x['scrollOverflow'])
assert all(abs(d['delta'])<=1 for x in results for d in x['offsets'])
assert all(x['prevInside'] and x['nextInside'] for x in results)
assert all(x['tableOutside']=='0px' for x in results)
