/** Real production welcome, seamless boundary, responsive layout and legacy login. */
const assert=require('node:assert/strict');
const {spawn}=require('node:child_process');
const net=require('node:net');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'../..');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function freePort(){const server=net.createServer();await new Promise((ok,no)=>server.once('error',no).listen(0,'127.0.0.1',ok));const port=server.address().port;await new Promise(r=>server.close(r));return port;}
(async()=>{
 const port=await freePort(),origin=`http://127.0.0.1:${port}`;
 const server=spawn(process.execPath,[path.join(root,'node_modules/vite/bin/vite.js'),'preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:'ignore'});
 let browser;
 try{
  let ready=false;
  for(let i=0;i<80;i++){try{if((await fetch(origin)).ok){ready=true;break;}}catch{}await sleep(200);}
  assert.ok(ready,'preview server started');
  browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH?{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH}:{}),args:process.env.PLAYWRIGHT_CHROMIUM_ARGS?JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS):['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1671,height:941}}),page=await context.newPage();
  const errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  await page.goto(origin+'/projects/legend-ots/assignment',{waitUntil:'networkidle'});
  await page.locator('.nb99-scene.is-ready').waitFor();
  assert.equal(await page.locator('input').count(),0,'welcome has no credential fields');
  assert.equal(await page.locator('.nb-app-root').count(),0,'workspace not mounted behind welcome');
  assert.equal(requests.some(url=>/\/assets\/nbdt-signin-[^/]+\.js/.test(url)),false,'heavy workspace chunk stays deferred');
  assert.deepEqual(await page.evaluate(()=>indexedDB.databases()),[],'welcome does not create an empty incompatible database');
  const running=await page.evaluate(()=>document.querySelector('.nb99-scene').getAnimations({subtree:true}).map(a=>a.playState));
  assert.ok(running.length>15&&running.every(s=>s==='running'),'scene animations run');
  await page.getByRole('button',{name:'Pause animation',exact:true}).click();
  const first=await page.evaluate(()=>document.querySelector('.nb99-cart').getAnimations()[0].currentTime);
  await page.waitForTimeout(150);
  const second=await page.evaluate(()=>document.querySelector('.nb99-cart').getAnimations()[0].currentTime);
  assert.ok(Math.abs(first-second)<1,'pause freezes shared clock');
  const setTime=time=>page.evaluate(t=>document.querySelector('.nb99-scene').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=t;}),time);
  await setTime(0);const start=await page.locator('.nb99-scene-canvas').screenshot();
  await setTime(20000);const end=await page.locator('.nb99-scene-canvas').screenshot();
  assert.ok(start.equals(end),'visible frame at 20 seconds exactly matches frame zero');
  await setTime(9500);const cartBefore=await page.locator('.nb99-cart').boundingBox();
  await setTime(11000);const cartAfter=await page.locator('.nb99-cart').boundingBox();
  assert.ok(cartAfter.x>cartBefore.x+30,'shipment actually moves forward');
  for(const viewport of [{width:390,height:844},{width:1366,height:768},{width:3440,height:1440},{width:5120,height:1440}]){
   await page.setViewportSize(viewport);await page.waitForTimeout(80);
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,`no horizontal overflow at ${viewport.width}`);
   const button=await page.locator('.nb99-sso').boundingBox();assert.ok(button.width>200&&button.x>=0&&button.x+button.width<=viewport.width+1,'SSO remains usable');
   if(viewport.width===390)assert.ok((await page.locator('.nb99-scene-canvas').getAttribute('viewBox')).includes('940'),'mobile scene reflows vertically');
  }
  await page.setViewportSize({width:1450,height:900});
  await page.getByRole('button',{name:'Sign in with corporate SSO'}).click();
  await page.getByRole('heading',{name:'Assignment',exact:true}).waitFor();
  assert.ok(page.url().endsWith('/projects/legend-ots/assignment'),'original deep link preserved');
  assert.equal(await page.evaluate(()=>sessionStorage.getItem('nbdt_poc_session_v047')),null,'SSO placeholder does not grant admin');
  assert.equal(await page.locator('.nb99-scene').count(),0,'scene unmounted after entering');
  await page.getByRole('button',{name:'Sign in',exact:true}).click();
  await page.getByRole('heading',{name:'Sign in to NBDT',exact:true}).waitFor();
  assert.equal(await page.locator('input[autocomplete="username"]').count(),1,'existing administrator username field preserved');
  assert.equal(await page.locator('input[autocomplete="current-password"]').count(),1,'existing administrator password field preserved');
  await page.getByRole('button',{name:'Close',exact:true}).click();
  await page.reload();await page.getByRole('heading',{name:'Assignment',exact:true}).waitFor();
  assert.equal(await page.locator('[data-testid="nbdt-welcome"]').count(),0,'same-tab refresh preserves entry');
  await page.evaluate(async()=>{
   const db=await new Promise((resolve,reject)=>{const r=indexedDB.open('nbdt-demo-v03',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
   await new Promise((resolve,reject)=>{const tx=db.transaction('records','readwrite');tx.objectStore('records').put({key:'nbdt_assignment_roster_v052',value:JSON.stringify({people:[{id:'real-person',name:'CURRENT PERSON',loginDisplayName:'Current teammate'}],items:[]}),version:1});tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);});db.close();
  });
  await page.goto(origin+'/signin',{waitUntil:'networkidle'});await page.locator('.nb99-scene.is-ready').waitFor();
  await page.waitForFunction(()=>document.querySelector('.nb99-scene').textContent.includes('Current teammate'));
  assert.equal(await page.locator('.nb99-name-bubble').count(),3,'fixed slots retain synchronized animations');
  assert.equal(await page.locator('.nb99-name-bubble:visible').count()>0,true);
  await page.emulateMedia({reducedMotion:'reduce'});await page.waitForTimeout(100);
  assert.ok((await page.evaluate(()=>document.querySelector('.nb99-scene').getAnimations({subtree:true}).map(a=>a.playState))).every(s=>s==='paused'),'reduced motion freezes scene');
  assert.deepEqual(errors,[],'no browser runtime errors');
  console.log('PASS welcome: deferred workspace, credential-free entry, preserved deep links and administrator login');
  console.log('PASS animation: shared pause, forward shipment, exact 0/20-second frame match and reduced motion');
  console.log('PASS layouts: mobile, laptop, ultrawide, 32:9; names read from saved Assignment');
 }finally{if(browser)await browser.close();server.kill('SIGTERM');}
})().catch(error=>{console.error(error.stack||error);process.exitCode=1;});
