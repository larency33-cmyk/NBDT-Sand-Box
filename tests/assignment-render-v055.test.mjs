/** Offline render boot guard: evaluates the actual Assignment function after TSX compilation.
 * Catches runtime initialization mistakes even without node_modules or a browser.
 * Not a replacement for the required real Vite/Chromium smoke test.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {initialAssignmentRoster} from '../src/assignment-roster.mjs';
const require=createRequire(import.meta.url);
const ts=require('typescript');
const source=readFileSync(new URL('../src/assignment-page-v052.tsx',import.meta.url),'utf8');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
const jsx=(type,props)=>({type,props});
const icon=()=>null;
const react={__esModule:true,default:{},useEffect:()=>{},useMemo:fn=>fn(),useState:value=>[typeof value==='function'?value():value,()=>{}],useRef:value=>({current:value})};
const dnd={DndContext:()=>null,PointerSensor:()=>null,KeyboardSensor:()=>null,useDraggable:()=>({attributes:{},listeners:{},setNodeRef:()=>{},isDragging:false}),useDroppable:()=>({setNodeRef:()=>{},isOver:false}),useSensor:()=>null,useSensors:()=>[],DragOverlay:()=>null,pointerWithin:()=>[],rectIntersection:()=>[]};
const rosterLib={assignmentRows:roster=>13,addAssignment:()=>{},editAssignment:()=>{},removeAssignment:()=>{},moveAssignment:()=>{},addAssignmentPerson:()=>{},editAssignmentPerson:()=>{}};
function boot(isAdmin){
 const cjs={exports:{}};
 const deps={'react':react,'react-dom':{createPortal:()=>null},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'@dnd-kit/core':dnd,'lucide-react':new Proxy({}, {get:()=>icon}),'./assignment-roster.mjs':rosterLib};
 const context={module:cjs,exports:cjs.exports,require:name=>{if(!(name in deps))throw Error('Unexpected runtime import '+name);return deps[name];},window:{},document:{body:{}},ResizeObserver:undefined,console,setTimeout:()=>0,Date,Set,Math};
 vm.runInNewContext(code,context,{filename:'assignment-page-v052.compiled.cjs',timeout:3000});
 return cjs.exports.AssignmentPage({roster:initialAssignmentRoster(),isAdmin,onChange:()=>{},onAuth:()=>{}});
}
for(const role of ['Guest','Admin'])test(`Assignment ${role} render function boots without JavaScript exceptions`,()=>{
 const element=boot(role==='Admin');
 assert.equal(element.type,'section');
 assert.match(element.props.className,/nb52-page/);
});
