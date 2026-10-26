const fs=require('fs'),path=require('path'),http=require('http'),assert=require('assert/strict');
const esbuild=require(process.env.ESBUILD_MODULE||'esbuild');const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
(async()=>{const root=path.resolve(__dirname,'../..'),out=path.join(root,'.browser-test');fs.mkdirSync(out,{recursive:true});const results=[];let browser,server,page;
try{await esbuild.build({entryPoints:[path.join(__dirname,'harness.tsx')],bundle:true,outfile:path.join(out,'test.js'),platform:'browser',format:'iife',jsx:'transform',nodePaths:(process.env.TEST_NODE_PATHS||'').split(path.delimiter).filter(Boolean),define:{'process.env.NODE_ENV':'"production"'}});
const css=fs.readFileSync(path.join(root,'redesign.css'),'utf8').replace(/^@(import|source).*$/gm,'');
server=http.createServer((req,res)=>{if(req.url==='/test.js'){res.setHeader('Content-Type','application/javascript');res.end(fs.readFileSync(path.join(out,'test.js')));}else{res.setHeader('Content-Type','text/html');res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Isolated NBDT component test</title><style>body{margin:0;font:14px Arial}*{box-sizing:border-box}'+css+'</style><div id="root"></div><script src="/test.js"></script>');}});await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port;
browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_PATH||undefined,args:['--no-sandbox']});const context=await browser.newContext({viewport:{width:1672,height:941}});page=await context.newPage();page.setDefaultTimeout(7000);const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept());await page.goto(url);await page.waitForFunction(()=>typeof window.mount==='function');
const mount=async(name,admin=true,fail=false)=>{await page.evaluate(([n,a,f])=>window.mount(n,a,f),[name,admin,fail]);await page.waitForTimeout(80);};
const test=async(name,fn)=>{await fn();results.push({name,status:'PASS'});console.log('PASS '+name);};
await test('System guide opens directly into technical details and configuration stages',async()=>{
 await mount('guide');
 assert.equal(await page.getByRole('heading',{name:'Test System'}).count(),1);
 assert.equal(await page.getByText('Technical essentials',{exact:true}).count(),1);
 assert.equal(await page.getByText('Configuration checklists',{exact:true}).count(),1);
});
await test('Obsolete system-guide UI is absent in viewer and edit modes',async()=>{
 for (const admin of [true,false]){
  await mount('profiles',admin);
  for(const text of ['Endpoint profile','Add endpoint profile','Guide preview · Select a device to record completion','Register an actual device','No reviewed guide has been published','Legacy system checklist · not device completion','Demo mode. Local record versions']){
   assert.equal(await page.getByText(text,{exact:false}).count(),0,`${text} should be hidden`);
  }
 }
});
await test('Read-only preview remains protected without selected device',async()=>{
 await mount('guide',false);
 assert.equal(await page.locator('.nb-check-row input[type=checkbox]').first().isDisabled(),true);
 assert.equal(await page.getByRole('button',{name:/Ready for Deployment/}).count(),1);
});
await test('Endpoint profiles and device records remain in saved project data',async()=>{
 await mount('profiles');
 const source=await page.evaluate(()=>window.getProject().systems[0]);
 assert.equal(source.endpointProfiles.length,1);
 assert.equal(source.devices.length,1);
});
await test('Task Owner and Helpers save together',async()=>{await mount('task');await page.getByRole('button',{name:/Test Owner: 1 assignments/}).click();await page.getByRole('button',{name:'More options for Test task'}).click();await page.getByRole('menuitem',{name:'Edit',exact:true}).click();await page.getByLabel('Task title',{exact:true}).fill('Updated test task');await page.getByRole('button',{name:'Save changes',exact:true}).click();assert.equal(await page.evaluate(()=>window.getProject().tasks[0].label),'Updated test task');assert.deepEqual(await page.evaluate(()=>window.getProject().tasks[0].helperIds),['b']);});
await test('Task save failure retains draft and displays error',async()=>{await mount('task',true,true);await page.getByRole('button',{name:/Test Owner: 1 assignments/}).click();await page.getByRole('button',{name:'More options for Test task'}).click();await page.getByRole('menuitem',{name:'Edit',exact:true}).click();await page.getByLabel('Task title',{exact:true}).fill('Unsaved test task');await page.getByRole('button',{name:'Create and open guide',exact:true}).click();await page.getByRole('alert').filter({hasText:'Injected test save failure'}).waitFor();assert.equal(await page.getByLabel('Task title',{exact:true}).inputValue(),'Unsaved test task');});
await test('Guide saves technical details in the guide; failed writes retain draft',async()=>{
 await mount('guide',true,true);
 await page.getByRole('button',{name:'Edit guide',exact:true}).click();
 await page.getByLabel('Hardware / model',{exact:true}).fill('Edited hardware from guide');
 await page.getByRole('button',{name:'Save guide changes',exact:true}).click();
 await page.getByRole('status').filter({hasText:'Save failed: Injected test save failure'}).waitFor();
 assert.equal(await page.getByLabel('Hardware / model',{exact:true}).inputValue(),'Edited hardware from guide');
});
await test('System creation save failure remains visible',async()=>{await mount('editor',true,true);await page.getByLabel('System name',{exact:true}).fill('Unsaved system');await page.getByRole('button',{name:'Create and open guide',exact:true}).click();await page.getByRole('alert').filter({hasText:'Injected test save failure'}).waitFor();});
await test('Tracker shows one task for both Owner and Helper in Overview-only mode',async()=>{await mount('tracker');assert.equal(await page.locator('.nb-mini-task').count(),2);assert.equal(await page.getByText('Overview',{exact:true}).count(),1);assert.equal(await page.getByRole('button',{name:'List',exact:true}).count(),0);assert.equal(await page.locator('.nb-task-list').count(),0);});
await test('Report columns can be hidden',async()=>{await mount('report');await page.getByText('Columns',{exact:true}).click();await page.getByLabel('Qty',{exact:true}).uncheck();assert.equal(await page.locator('.nb-report-table').first().locator('th[hidden]').count(),1);});
await test('IndexedDB saves and reloads records',async()=>{await page.evaluate(async()=>{await window.store.initDemoStore();await window.store.commitRecord('test-record','first');});assert.equal(await page.evaluate(()=>window.store.demoStorage.getItem('test-record')),'first');});
await test('Cross-tab optimistic conflict rejects overwrite',async()=>{const second=await context.newPage();await second.goto(url);await second.waitForFunction(()=>typeof window.store==='object');await second.evaluate(()=>window.store.initDemoStore());await page.evaluate(()=>window.store.commitRecord('test-record','second'));const error=await second.evaluate(async()=>{try{await window.store.commitRecord('test-record','stale');return '';}catch(e){return e.message;}});assert.match(error,/another tab/);await second.close();});
await test('Demo audit records committed writes',async()=>{const n=await page.evaluate(async()=>(await window.store.auditLog()).length);assert.ok(n>=2);});
await test('New components render at required viewport sizes',async()=>{for(const [width,height] of [[1672,941],[1440,900],[1280,800],[768,1024],[390,844],[320,740]]){await page.setViewportSize({width,height});for(const name of ['guide','tracker','report','task']){await mount(name);const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+2);assert.equal(overflow,false,`${name} overflows at ${width}`);}if(width===1672){await mount('guide');await page.screenshot({path:path.join(root,'verification','guide-component-test.png'),fullPage:true});}}});
assert.deepEqual(errors,[]);results.push({name:'No browser page errors',status:'PASS'});
} catch(e){results.push({name:'Browser test failure',status:'FAIL',error:e.stack});console.error(e.stack);if(page)console.error((await page.locator('body').innerText()).slice(0,1500));process.exitCode=1;}finally{if(browser)await browser.close();if(server)await new Promise(r=>server.close(r));fs.mkdirSync(path.join(root,'verification'),{recursive:true});fs.writeFileSync(path.join(root,'verification','browser-results.json'),JSON.stringify({scope:'Isolated new components only, synthetic fixture, no full Vite app or Tailwind compilation',results},null,2));fs.rmSync(out,{recursive:true,force:true});}})();
