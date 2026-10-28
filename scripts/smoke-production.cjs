/** Release gate: launch the actual Vite production output and visit every main route.
 * Usage: npm run build && npm run smoke:production
 * Requires: npm install and npx playwright install chromium (for CI).
 */
const {spawn} = require('node:child_process');
const net = require('node:net');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const root = path.resolve(__dirname,'..');
const routes = [
 ['Overview','/projects/legend-ots/overview','Legend OTS'],
 ['Weekly Tracker','/projects/legend-ots/tracker','Weekly Tracker'],
 ['System Registry','/projects/legend-ots/systems','System Registry'],
 ['Issue Tracker','/projects/legend-ots/issues','Issue Tracker'],
 ['Configuration Report','/projects/legend-ots/reports/configuration','Configuration Report'],
 ['Assignment','/projects/legend-ots/assignment','Assignment'],
];
const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function freePort(){const server=net.createServer();await new Promise((ok,no)=>server.once('error',no).listen(0,'127.0.0.1',ok));const port=server.address().port;await new Promise(r=>server.close(r));return port;}
(async()=>{
 if(!fs.existsSync(path.join(root,'dist','index.html')))throw Error('Production output missing: first run npm run build.');
 const port=await freePort();const url=`http://127.0.0.1:${port}`;
 const vite=spawn(process.execPath,[path.join(root,'node_modules','vite','bin','vite.js'),'preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdio:['ignore','pipe','pipe']});
 let output='';vite.stdout.on('data',d=>output+=d);vite.stderr.on('data',d=>output+=d);
 let browser=null,failures=[];
 try{
  let ready=false;
  for(let i=0;i<80;i++){if(vite.exitCode!==null)break;try{const response=await fetch(url);if(response.ok){ready=true;break;}}catch{}await sleep(250);}
  if(!ready)throw Error('Vite preview server did not start: '+output.slice(-1000));
  browser=await chromium.launch({headless:true,args:['--no-sandbox']});
  const context=await browser.newContext({viewport:{width:1450,height:900}});
  for(const [label,route,expected] of routes){
   const page=await context.newPage();const errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   try{
    await page.goto(url+route,{waitUntil:'domcontentloaded',timeout:20000});
    await page.waitForFunction((text)=>{
      return Boolean(document.querySelector('[data-testid="nbdt-render-error"]')) ||
        document.body.innerText.toLowerCase().includes(text.toLowerCase());
    },expected,{timeout:20000});
    await page.waitForTimeout(500);
    const failScreen=await page.locator('[data-testid="nbdt-render-error"]').count();
    const title=await page.locator('h1').first().innerText().catch(()=>'(no heading)');
    if(failScreen||errors.length||!documentedTitle(title,expected))
      throw Error(`${label}: heading=${JSON.stringify(title)}, error screen=${failScreen}, page errors=${JSON.stringify(errors)}`);
    console.log('PASS browser boot: '+label);
   }catch(e){
    failures.push(e.message);
    const dir=path.join(root,'verification');fs.mkdirSync(dir,{recursive:true});
    await page.screenshot({path:path.join(dir,'smoke-failure-'+label.replace(/\W/g,'-')+'.png'),fullPage:true}).catch(()=>{});
    console.error('FAIL browser boot: '+label+' — '+e.message);
   }finally{await page.close();}
  }
 }finally{
  if(browser)await browser.close();vite.kill('SIGTERM');
 }
 if(failures.length)throw Error('Production route smoke test failed:\n'+failures.join('\n'));
 console.log('PASS: all '+routes.length+' production routes rendered without page errors.');
})().catch(e=>{console.error(e.stack||e);process.exitCode=1;});
function documentedTitle(actual,expected){return actual.toLowerCase().includes(expected.toLowerCase());}
