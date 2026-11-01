/** Offline render guard against white-screen runtime regressions on Overview. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import vm from 'node:vm';
import {buildOverviewData} from '../src/overview-metrics.mjs';
import {gaugeGeometry} from '../src/overview-gauge.mjs';
import {initialAssignmentRoster} from '../src/assignment-roster.mjs';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const source=readFileSync(new URL('../src/overview-v061.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const jsx=(type,props)=>({type,props});
const Icon=()=>null;
const imports={
 'react':{default:{},useMemo:fn=>fn(),useEffect:()=>{},useState:v=>[typeof v==='function'?v():v,()=>{}]},
 'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},
 'lucide-react':new Proxy({}, {get:()=>Icon}),
 './overview-metrics.mjs':{buildOverviewData},
 './overview-gauge.mjs':{gaugeGeometry},
 './demo-store.mjs':{auditLog:async()=>[]},
};
const fakeProject={id:'legend-ots',startDate:'2026-09-28',timezone:'Europe/Paris',systems:[],issues:[],tasks:[]};
function render(){const m={exports:{}};vm.runInNewContext(code,{module:m,exports:m.exports,require:name=>{if(!(name in imports))throw Error('Unknown '+name);return imports[name];},console,Date,Math,Intl,window:{setInterval:()=>0,clearInterval:()=>{}},document:{}},{filename:'overview-v061.compiled.cjs',timeout:3000});return m.exports.OverviewDashboard({project:fakeProject,roster:initialAssignmentRoster(),onNavigate:()=>{},onInspectSystem:()=>{},onOpenIssue:()=>{}});}
test('Overview real component render boots without white-screen JS exceptions',()=>{const el=render();assert.equal(el.type,'section');assert.equal(el.props.className,'nb61-overview');});
function flattenJSX(node, result=[]){
 if(Array.isArray(node)){for(const child of node)flattenJSX(child,result);return result;}
 if(!node||typeof node!=='object')return result;
 result.push(node);
 flattenJSX(node.props?.children,result);
 return result;
}
test('Overview mounts exactly four KPI gauges without triggering runtime errors',()=>{
 const nodes=flattenJSX(render());
 const kpiContainer=nodes.find(node=>node.props?.className==='nb61-kpis');
 assert.ok(kpiContainer,'KPI group is present');
 const children=flattenJSX(kpiContainer);
 const gauges=children.filter(node=>typeof node.type==='function'&&node.props?.title&&'value' in node.props);
 assert.equal(gauges.length,4);
 for(const gauge of gauges){
  const svg=gauge.type(gauge.props);
  assert.equal(svg.type,'svg');
  assert.equal(svg.props.role,'img');
  assert.match(svg.props['aria-label'],/no applicable records|% complete/);
 }
});
