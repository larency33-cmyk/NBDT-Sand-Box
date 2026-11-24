import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
const ts=createRequire(import.meta.url)('typescript');
const source=readFileSync(new URL('../src/assignment-page-v052.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-assignment-v052.css',import.meta.url),'utf8');
const packageInfo=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const module={exports:{}};
const icon=()=>null;
const stubs={react:{__esModule:true,default:{},useState:()=>[null,()=>{}],useEffect:()=>{},useRef:()=>({current:null}),useMemo:fn=>fn()},'react/jsx-runtime':{jsx:()=>null,jsxs:()=>null},'react-dom':{createPortal:()=>null},'@dnd-kit/core':{DndContext:()=>null,PointerSensor:()=>null,KeyboardSensor:()=>null,useDraggable:()=>({}),useDroppable:()=>({}),useSensor:()=>null,useSensors:()=>[],DragOverlay:()=>null,pointerWithin:()=>[],rectIntersection:()=>[]},'lucide-react':new Proxy({},{get:()=>icon}),'./assignment-roster.mjs':{}};
vm.runInNewContext(code,{module,exports:module.exports,require:name=>stubs[name]||(()=>{throw Error('Unknown dependency: '+name)})(),Date,Math,Set},{timeout:5000});
const marker=module.exports.assignmentInsertionMarker;
const roster={people:[{id:'a',name:'Apple'},{id:'b',name:'Bravo'}],items:[
 {id:'a0',personId:'a',order:0},{id:'a1',personId:'a',order:1},{id:'a2',personId:'a',order:2},
 {id:'b0',personId:'b',order:0},{id:'b1',personId:'b',order:1}]};
const plain=v=>v==null?null:JSON.parse(JSON.stringify(v));
test('move to another owner inserts BEFORE the hovered card or first empty slot',()=>{
 assert.deepEqual(plain(marker(roster,'a1','slot:b:1')),{personId:'b',row:1,edge:'before'});
 assert.deepEqual(plain(marker(roster,'a1','slot:b:head')),{personId:'b',row:0,edge:'before'});
 assert.deepEqual(plain(marker(roster,'a1','slot:b:12')),{personId:'b',row:2,edge:'before'});
});
test('downward same-owner move shows a line AFTER its intended neighbor',()=>{
 assert.deepEqual(plain(marker(roster,'a0','slot:a:2')),{personId:'a',row:2,edge:'after'});
 assert.deepEqual(plain(marker(roster,'a0','slot:a:1')),{personId:'a',row:1,edge:'after'});
});
test('upward same-owner move marks BEFORE the intended neighbor',()=>{
 assert.deepEqual(plain(marker(roster,'a2','slot:a:0')),{personId:'a',row:0,edge:'before'});
});
test('ignore self, invalid, cancelled and impossible targets',()=>{
 assert.equal(marker(roster,'a1','slot:a:1'),null);
 assert.equal(marker(roster,null,'slot:b:1'),null);
 assert.equal(marker(roster,'a1',null),null);
 assert.equal(marker(roster,'a1','person-insert:b:before'),null);
 assert.equal(marker(roster,'a1','slot:unknown:0'),null);
});
test('DnD exposes and resets the exact hovered slot while retaining existing move logic',()=>{
 assert.match(source,/setDropSlot\(id\.startsWith\('slot:'\)\?id:null\)/);
 assert.match(source,/onDragCancel=\{\(\)=>\{[^}]*setDropSlot\(null\)/);
 assert.match(source,/assignmentInsertionMarker\(roster,dragging,dropSlot\)/);
 assert.match(source,/moveAssignment\(state,id,personId,index==='head'\?0:Number\(index\)\)/);
 assert.match(source,/nb117-insertion-before/);
 assert.match(source,/nb117-insertion-after/);
});
test('approved new visual layout is scoped and preserves original initials sizes',()=>{
 assert.ok(Number(packageInfo.version.split('.').at(-1))>=118);
 assert.match(source,/nb52-page nb54-page nb114-page nb116-page nb117-page/);
 assert.match(css,/\.nb117-page \.nb52-person\{[^}]*border-radius:12px 12px 10px 10px/);
 assert.match(css,/\.nb117-page \.nb52-assignment-name\{[^}]*font-size:12\.5px;[^}]*font-weight:400/);
 assert.match(css,/\.nb52-avatar\{[^}]*width:28px;height:28px/);
 const newCss=(css.split('/* v0.6.117 —')[1]??'').split('/* v0.6.118 —')[0];
 assert.doesNotMatch(newCss,/\.nb52-avatar/);
 assert.match(css,/\.nb117-page \.nb52-add-in-cell,\s*\.nb117-page \.nb52-empty\{[^}]*background:#f5f8fc/);
 assert.match(css,/\.nb117-page \.nb52-cell\.nb117-insertion-before::before/);
 assert.match(css,/\.nb117-page \.nb52-cell\.nb117-insertion-after::before\{top:auto;bottom:-2px\}/);
 assert.match(css,/\.nb52-project-row\{[^}]*height:49px/);
 assert.match(source,/onClick=\{\(\)=>navigateColumns\(-1\)\}/);
 assert.match(source,/onClick=\{\(\)=>navigateColumns\(1\)\}/);
});
