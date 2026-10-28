import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {spawnSync} from 'node:child_process';
const root=new URL('../',import.meta.url);
const text=file=>fs.readFileSync(new URL(file,root),'utf8');
const packageJSON=JSON.parse(text('package.json'));

test('runtime symbol gate catches use-before-declaration errors (TS2448), not just imports',()=>{
 const checker=text('scripts/check-symbols.cjs');
 assert.match(checker,/2448/);
 assert.match(checker,/2454/);
 assert.match(packageJSON.scripts.build,/check-symbols\.cjs\s*&&\s*vite build/);
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'nbdt-check-v055-'));
 try{
  fs.mkdirSync(path.join(dir,'src'));
  fs.writeFileSync(path.join(dir,'index.tsx'), 'function Page(){const effect=[people.length];const people=[1,2];return <div>{effect[0]}</div>};');
  const result=spawnSync(process.execPath,[new URL('scripts/check-symbols.cjs',root).pathname],{cwd:dir,encoding:'utf8'});
  assert.notEqual(result.status,0,'Broken JSX must be rejected before production');
  assert.match(result.stderr,/TS2448.*people/);
 }finally{fs.rmSync(dir,{force:true,recursive:true});}
});
test('Assignment hook dependencies are declared before they are evaluated',()=>{
 const assignment=text('src/assignment-page-v052.tsx');
 assert.ok(assignment.indexOf('const people=useMemo(')<assignment.indexOf('},[roster.people.length,people.length,rowCount])'));
 assert.ok(assignment.indexOf('const rowCount=Math.max(')<assignment.indexOf('},[roster.people.length,people.length,rowCount])'));
});
test('React render errors show a recovery screen instead of blank page',()=>{
 const entry=text('index.tsx');
 assert.match(entry,/class NBDTRenderBoundary extends React\.Component/);
 assert.match(entry,/getDerivedStateFromError/);
 assert.match(entry,/data-testid="nbdt-render-error"/);
 assert.match(entry,/<NBDTRenderBoundary><App\/><\/NBDTRenderBoundary>/);
});
test('release automation tests built routes in a real browser',()=>{
 const smoke=text('scripts/smoke-production.cjs');
 for(const route of ['/overview','/tracker','/systems','/issues','/reports/configuration','/assignment'])assert.ok(smoke.includes(route),`Missing ${route}`);
 assert.match(smoke,/page\.on\('pageerror'/);
 assert.match(smoke,/chromium\.launch/);
 assert.equal(packageJSON.scripts['smoke:production'],'node scripts/smoke-production.cjs');
});
