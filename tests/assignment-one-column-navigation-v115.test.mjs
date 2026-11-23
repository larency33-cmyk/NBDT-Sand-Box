import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {initialAssignmentRoster} from '../src/assignment-roster.mjs';

const require=createRequire(import.meta.url);
const ts=require('typescript');
const source=readFileSync(new URL('../src/assignment-page-v052.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-assignment-v052.css',import.meta.url),'utf8');
const jsx=(type,props)=>({type,props});
const state=[];const refs=[];let stateCursor=0;let refCursor=0;
const react={__esModule:true,default:{},useEffect:()=>{},useMemo:fn=>fn(),
 useState(initial){const index=stateCursor++;if(!(index in state))state[index]=typeof initial==='function'?initial():initial;return[state[index],next=>{state[index]=typeof next==='function'?next(state[index]):next;}];},
 useRef(initial){const index=refCursor++;if(!(index in refs))refs[index]={current:initial};return refs[index];}
};
const icon=()=>null;
const dnd={DndContext:()=>null,PointerSensor:()=>null,KeyboardSensor:()=>null,useDraggable:()=>({attributes:{},listeners:{},setNodeRef:()=>{},isDragging:false}),useDroppable:()=>({setNodeRef:()=>{},isOver:false}),useSensor:()=>null,useSensors:()=>[],DragOverlay:()=>null,pointerWithin:()=>[],rectIntersection:()=>[]};
const rosterMethods={assignmentRows:()=>13,addAssignment:()=>{},editAssignment:()=>{},removeAssignment:()=>{},moveAssignment:()=>{},addAssignmentPerson:()=>{},editAssignmentPerson:()=>{},moveAssignmentPerson:()=>{}};
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const module={exports:{}};
const deps={react,'react-dom':{createPortal:()=>null},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'@dnd-kit/core':dnd,'lucide-react':new Proxy({},{get:()=>icon}),'./assignment-roster.mjs':rosterMethods};
vm.runInNewContext(code,{module,exports:module.exports,require:name=>{if(!Object.hasOwn(deps,name))throw Error('Unexpected import '+name);return deps[name];},window:{},document:{body:{}},ResizeObserver:undefined,console,Date,Set,Math},{timeout:3000});
const {assignmentPageStarts,assignmentOwnerWidth,AssignmentPage}=module.exports;
const collect=(node,found=[])=>{if(Array.isArray(node)){node.forEach(n=>collect(n,found));return found;}if(!node||typeof node!=='object')return found;if(node.type)found.push(node);collect(node.props?.children,found);return found;};
const flatten=(node)=>Array.isArray(node)?node.map(flatten).join(''):node===null||node===undefined||typeof node==='boolean'?'':typeof node==='object'?flatten(node.props?.children):String(node);
const reset=()=>{state.length=0;refs.length=0;stateCursor=0;refCursor=0;};
const render=()=>{stateCursor=0;refCursor=0;const root=AssignmentPage({roster:initialAssignmentRoster(),isAdmin:true,onChange:()=>{},onAuth:()=>{}});const nodes=collect(root);const nav=nodes.find(n=>n.props?.className==='nb114-navigation');return {root,nodes,nav,buttons:collect(nav).filter(n=>n.type==='button'),caption:flatten(nodes.find(n=>n.props?.className==='nb114-nav-counter')),grid:nodes.find(n=>n.props?.className==='nb52-grid-scroll')};};

test('each arrow step moves one employee while the viewport remains seven columns',()=>{
 assert.deepEqual(Array.from(assignmentPageStarts(13,true,7)),[0,1,2,3,4,5,6,7]);
 assert.deepEqual(Array.from(assignmentPageStarts(13,false,7)),[0,1,2,3,4,5,6]);
 assert.deepEqual(Array.from(assignmentPageStarts(7,true,7)),[0,1]);
 assert.deepEqual(Array.from(assignmentPageStarts(4,true,7)),[0]);
 assert.deepEqual(Array.from(assignmentPageStarts(13,true,1)),Array.from({length:14},(_,i)=>i));
});

test('clicking Next then Next without waiting for the first smooth scroll advances two individual columns',()=>{
 reset();let view=render();assert.equal(view.caption,'Showing 1–7 of 13');
 const calls=[];const grid={scrollLeft:0,scrollTo:v=>calls.push(v)};
 refs[0].current=grid;
 view.buttons[1].props.onClick();
 view=render();assert.equal(view.caption,'Showing 2–8 of 13');
 assert.equal(calls[0].left,167);
 // A partially completed smooth scroll must not reset the intended destination.
 grid.scrollLeft=50;view.grid.props.onScroll();
 view=render();assert.equal(view.caption,'Showing 2–8 of 13');
 view.buttons[1].props.onClick();view=render();
 assert.equal(view.caption,'Showing 3–9 of 13');
 assert.deepEqual(calls.map(v=>v.left),[167,334]);
 grid.scrollLeft=334;view.grid.props.onScroll();
 view=render();assert.equal(view.caption,'Showing 3–9 of 13');
 view.buttons[0].props.onClick();view=render();
 assert.equal(view.caption,'Showing 2–8 of 13');
 assert.equal(calls.at(-1).left,167);
});

test('navigation reaches the final owner without skipping; all rows and typography remain untouched',()=>{
 reset();let view=render();
 for(let index=1;index<=7;index++){view.buttons[1].props.onClick();view=render();assert.equal(view.caption,`Showing ${index+1}–${Math.min(13,index+7)} of 13`);}
 assert.equal(view.caption,'Showing 8–13 of 13');
 assert.equal(view.buttons[1].props.disabled,true);
 assert.match(source,/title="Next employee column"/);
 assert.match(source,/title="Previous employee column"/);
 assert.match(css,/\.nb52-assignment-name\{[^}]*font-size:10px/);
 assert.match(css,/\.nb52-project-row\{[^}]*height:49px/);
 assert.match(source,/moveAssignment\(state,id,personId/);
});
