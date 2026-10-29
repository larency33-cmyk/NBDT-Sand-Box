/** Offline safety check: execute the actual Report render with both user roles.
 * This complements—not replaces—the GitHub Vite/Chromium release gate.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const jsx=(type,props)=>({type,props});
const Icon=()=>null;
const hook={default:{},useEffect:()=>{},useState:init=>[typeof init==='function'?init():init,()=>{}],useRef:value=>({current:value}),useMemo:fn=>fn()};
const noOp=()=>null;
const imports={
 'react':hook,'react-dom':{createPortal:()=>null},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},
 'lucide-react':new Proxy({}, {get:()=>Icon}),
 './reference-report.mjs':{reportCounts:()=>({total:0,base:0,ready:0,deployed:0,cyberApproved:0,cyberApplicable:0}),validateAggregateMetrics:v=>v},
 './cyber-status.mjs':{CYBER_STATUSES:['Not Started','Review','Approved','Blocked','N/A'],normalizeCyberStatus:v=>v||'Not Started'},
 './model.mjs':{counts:()=>({total:0,base:0,ready:0,deployed:0})},
};
function render(isAdmin){
 const mod={exports:{}};
 const context={module:mod,exports:mod.exports,require:name=>imports[name]||new Proxy({}, {get:()=>noOp}),window:{},document:{},console,Set,Date,Math,Intl};
 vm.runInNewContext(code,context,{filename:'workspace.compiled.cjs',timeout:3500});
 return mod.exports.Report({project:{systems:[],members:[]},isAdmin,onRequestAdmin:()=>{},onSystemCreate:()=>Promise.resolve(),onSystemChange:()=>Promise.resolve(),onSystemDelete:()=>Promise.resolve()});
}
for(const role of ['Guest','Admin']) test(`Configuration Report ${role} initial render boots without exceptions`,()=>{
 const el=render(role==='Admin');
 assert.equal(el.type,'section');
 assert.match(el.props.className,/nb-report/);
});
