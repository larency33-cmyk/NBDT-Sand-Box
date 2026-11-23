import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {initialAssignmentRoster} from '../src/assignment-roster.mjs';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const read=path=>readFileSync(new URL(path,import.meta.url),'utf8');
const src=read('../src/assignment-page-v052.tsx');
const css=read('../nbdt-assignment-v052.css');
const jsx=(type,props)=>({type,props});
const react={__esModule:true,default:{},useEffect:()=>{},useMemo:fn=>fn(),useState:value=>[typeof value==='function'?value():value,()=>{}],useRef:v=>({current:v})};
const icon=()=>null;
const dnd={DndContext:()=>null,PointerSensor:()=>null,KeyboardSensor:()=>null,useDraggable:()=>({attributes:{},listeners:{},setNodeRef:()=>{},isDragging:false}),useDroppable:()=>({setNodeRef:()=>{},isOver:false}),useSensor:()=>null,useSensors:()=>[],DragOverlay:()=>null,pointerWithin:()=>[],rectIntersection:()=>[]};
const mockRoster={assignmentRows:()=>13,addAssignment:()=>{},editAssignment:()=>{},removeAssignment:()=>{},moveAssignment:()=>{},addAssignmentPerson:()=>{},editAssignmentPerson:()=>{},moveAssignmentPerson:()=>{}};
const code=ts.transpileModule(src,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const module={exports:{}};
const deps={'react':react,'react-dom':{createPortal:()=>null},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'@dnd-kit/core':dnd,'lucide-react':new Proxy({}, {get:()=>icon}),'./assignment-roster.mjs':mockRoster};
vm.runInNewContext(code,{module,exports:module.exports,require:name=>{if(!Object.hasOwn(deps,name))throw Error('Unexpected import: '+name);return deps[name];},window:{},document:{body:{}},ResizeObserver:undefined,console,Date,Set,Math}, {timeout:3000});
const {assignmentOwnerWidth,assignmentVisibleColumns,assignmentPageStarts,AssignmentPage}=module.exports;
const own=x=>Array.from(x);
const collect=(node,found=[])=>{if(Array.isArray(node)){node.forEach(v=>collect(v,found));return found;}if(!node||typeof node!=='object')return found;if(node.type)found.push(node);collect(node.props?.children,found);return found;};

test('13 owners plus Add person are presented as two groups of exactly seven desktop columns',()=>{
 assert.deepEqual(own(assignmentPageStarts(13,true,7)),[0,7]);
 assert.deepEqual(own(assignmentPageStarts(13,false,7)),[0,6]);
 assert.deepEqual(own(assignmentPageStarts(7,true,7)),[0,1]);
 assert.deepEqual(own(assignmentPageStarts(2,true,7)),[0]);
 assert.deepEqual(own(assignmentPageStarts(14,true,7)),[0,7,8]);
});
test('seven unchanged-font owner columns fit wide viewports, narrow ones scroll instead of shrinking text',()=>{
 for(const width of [1320,1440,1510,1750]){
  const ownWidth=assignmentOwnerWidth(width);
  assert.ok(ownWidth>=158);
  assert.equal(assignmentVisibleColumns(width,ownWidth),7);
  assert.ok(106+7*ownWidth>=width);
 }
 assert.equal(assignmentVisibleColumns(390,assignmentOwnerWidth(390)),1);
 assert.equal(assignmentOwnerWidth(390),158);
});
test('only one previous/next arrow pair is rendered, with seven-column range and existing full matrix',()=>{
 const root=AssignmentPage({roster:initialAssignmentRoster(),isAdmin:true,onChange:()=>{},onAuth:()=>{}});
 const nodes=collect(root);
 const nav=nodes.filter(x=>x.props?.className==='nb114-navigation');
 assert.equal(nav.length,1);
 const buttons=collect(nav[0]).filter(x=>x.type==='button');
 assert.equal(buttons.length,2);
 assert.deepEqual(buttons.map(x=>x.props['aria-label']),['Previous owner columns','Next owner columns']);
 assert.equal(buttons[0].props.disabled,true);
 assert.equal(buttons[1].props.disabled,false);
 const caption=nodes.find(x=>x.props?.className==='nb114-nav-counter');
 assert.ok(caption);
 const text=String(collect(caption).length);assert.ok(text.length>0);
 const cells=nodes.filter(x=>x.type?.name==='AssignmentCell');
 assert.equal(cells.length,13*13,'all owner cells stay mounted for cross-page drag and drop');
 assert.ok(nodes.find(x=>x.type===dnd.DndContext),'DndContext retained');
 assert.ok(nodes.find(x=>x.props?.className==='nb54-new-person'),'Add person remains accessible on last page');
});
test('original font sizes, row heights and drag controls are preserved',()=>{
 assert.match(css,/\.nb52-person strong\{[^}]*font-size:10px/);
 assert.match(css,/\.nb52-assignment-name\{[^}]*font-size:10px/);
 assert.match(css,/\.nb52-project-row\{[^}]*height:49px/);
 assert.match(css,/\.nb54-page \.nb52-table tbody tr\{height:max\(49px/);
 assert.match(css,/\.nb114-page \.nb52-person,\.nb114-page \.nb52-cell/);
 assert.match(css,/\.nb114-page \.nb54-horizontal-rail\{display:none\}/);
 assert.match(src,/moveAssignment\(state,id,personId/);
 assert.match(src,/moveAssignmentPerson\(current,source,target,placement\)/);
 assert.match(src,/onDragStart=\{onDraggingStarted\}/);
 assert.match(src,/onDragEnd=\{onDragFinished\}/);
});
