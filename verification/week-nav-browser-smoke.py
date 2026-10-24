"""Browser CSS regression for native-scrollbar overlap on Weekly Tracker.
A small DOM fixture built from actual redesign.css. Not a full React/Vite test.
Requires Python playwright and Chromium; run locally with `python verification/week-nav-browser-smoke.py`.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

root=Path(__file__).resolve().parents[1]
css=(root/'redesign.css').read_text()
html='''<!DOCTYPE html><html><head><meta charset="utf-8"><style>'''+css+'''</style><style>
html,body{height:100%;margin:0}.nbdt-redesign{display:flex;height:100vh;width:100vw}.nbdt-redesign>aside{flex:0 0 210px}.nbdt-redesign>main{min-width:0;flex:1;overflow:auto}.nb-tracker{height:100%;min-width:0}.nb-week-grid{width:1200px!important;min-width:1200px!important}.nb-tracker-table-wrap{height:410px;max-height:410px!important;overflow:auto!important}.nb-week-card-grid{min-width:1200px!important;width:1200px!important} .nb-week-wide-card{height:74px}.nb-week-navigation-right{position:absolute}
</style></head><body><div class="nbdt-redesign"><aside></aside><main><section class="nb-tracker" data-view="overview"><div class="nb-tracker-content"><div class="nb-tracker-table-wrap" tabindex="0"><table class="nb-week-grid"><thead><tr><th>Employee</th><th>Milestone 1</th><th>Milestone 2</th><th>Milestone 3</th><th>Milestone 4</th></tr></thead><tbody>'''+(''.join('<tr><th>Person %d</th>'%i+''.join('<td>Task %d • Status active<br>Additional content</td>'%j for j in range(4))+'</tr>' for i in range(20)))+'''</tbody></table></div></div><footer class="nb-week-footer nb-aligned-week-footer"><div class="nb-week-card-scroller"><div class="nb-week-card-grid"><div class="nb-week-navigation-label"><strong>Project weeks</strong><button class="nb-button nb-weeks-prev" id="prev">‹</button></div>'''+''.join('<button class="nb-week-wide-card" id="wk%d"><strong>Week %d</strong><span class="nb-week-wide-date">19 Oct - 25 Oct 2026</span><span class="nb-week-wide-days">Mon Tue Wed Thu Fri Sat Sun</span></button>'%(i,i) for i in range(1,5))+'''</div></div><div class="nb-week-navigation-right"><button class="nb-button nb-weeks-next" id="next" type="button">›</button><button class="nb-button nb-go-today" id="today" type="button">Today</button></div></footer></section></main></div><script>
let offset=1;
const refresh=()=>document.querySelectorAll('.nb-week-wide-card>strong').forEach((el,i)=>el.textContent='Week '+(offset+i));
document.querySelector('#next').addEventListener('mousedown',e=>e.preventDefault());
document.querySelector('#prev').addEventListener('mousedown',e=>e.preventDefault());
document.querySelector('#next').addEventListener('click',()=>{offset+=1;refresh();});
document.querySelector('#prev').addEventListener('click',()=>{offset=Math.max(1,offset-1);refresh();});
document.querySelector('#today').addEventListener('click',()=>{offset=1;refresh();});
</script></body></html>'''
with sync_playwright() as pw:
 browser=pw.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--disable-dev-shm-usage','--no-sandbox'])
 for width in [1600,960]:
  page=browser.new_page(viewport={'width':width,'height':850},device_scale_factor=1)
  page.set_content(html,wait_until='domcontentloaded')
  before=page.locator('#wk1>strong').inner_text()
  page.get_by_role('button',name='›').click()
  after=page.locator('#wk1>strong').inner_text()
  styles=page.evaluate('''() => {
    const el=document.querySelector('.nb-tracker-table-wrap');
    const css=getComputedStyle(el), nav=getComputedStyle(document.querySelector('.nb-week-navigation-right'));
    return {scrollbarWidth:css.scrollbarWidth,overflowX:css.overflowX,overflowY:css.overflowY,navZ:nav.zIndex,
      stillScrollable:el.scrollHeight>el.clientHeight,htmlScrollbar:getComputedStyle(document.documentElement).scrollbarWidth,
      footerOverflow:getComputedStyle(document.querySelector('.nb-week-card-scroller')).overflowX};
  }''')
  assert before=='Week 1' and after=='Week 2',(before,after)
  assert styles['scrollbarWidth']=='none',styles
  assert styles['htmlScrollbar']=='none',styles
  assert styles['footerOverflow']=='clip',styles
  assert styles['stillScrollable'],styles
  page.locator('.nb-tracker-table-wrap').evaluate('(el)=>el.scrollTop=180')
  assert page.locator('.nb-tracker-table-wrap').evaluate('(el)=>el.scrollTop')>0
  out=root/'verification'/f'week-nav-smoke-{width}.png'
  page.screenshot(path=str(out))
  print(width,styles,'click:',before,'->',after,'screenshot:',out.name)
  page.close()
 browser.close()
