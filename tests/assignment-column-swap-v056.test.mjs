// Historical test filename retained so this change ships as an overwrite via GitHub ZIP.
// v0.6.57 replaces the former swap behavior with insertion before or after an employee.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {initialAssignmentRoster,moveAssignmentPerson,resolveAssignmentOwner,addAssignmentPerson,addAssignment} from '../src/assignment-roster.mjs';
const text=filename=>readFileSync(new URL(filename,import.meta.url),'utf8');
const ids=roster=>roster.people.map(person=>person.id);

test('Inserting a whole column between employees shifts others instead of swapping people',()=>{
 const before=initialAssignmentRoster();const snapshot=JSON.stringify(before);
 const first=before.people[0],third=before.people[2];
 const after=moveAssignmentPerson(before,first.id,third.id,'before');
 assert.deepEqual(ids(after),[before.people[1].id,before.people[0].id,...ids(before).slice(2)]);
 assert.deepEqual(after.items,before.items);
 assert.equal(after.people.length,13);assert.equal(after.items.length,108);
 assert.equal(JSON.stringify(before),snapshot,'original state must be immutable');
 assert.equal(resolveAssignmentOwner(after,'OHC - SPMS').label,resolveAssignmentOwner(before,'OHC - SPMS').label);
 assert.equal(resolveAssignmentOwner(after,'Digital Signage').label,'CLAUDIO MONTEIRO');
});

test('Insert before and after supports first, middle, last and adjacent columns, with correct no-ops',()=>{
 const original=initialAssignmentRoster(),a=original.people[0].id,b=original.people[1].id,c=original.people[2].id,last=original.people.at(-1).id;
 assert.deepEqual(ids(moveAssignmentPerson(original,a,c,'after')).slice(0,4),[b,c,a,original.people[3].id]);
 assert.deepEqual(ids(moveAssignmentPerson(original,last,a,'before')).slice(0,3),[last,a,b]);
 assert.equal(ids(moveAssignmentPerson(original,a,last,'after')).at(-1),a);
 assert.equal(moveAssignmentPerson(original,a,b,'before'),original,'already before its neighbor');
 assert.equal(moveAssignmentPerson(original,b,a,'after'),original,'already after its neighbor');
 assert.equal(moveAssignmentPerson(original,a,a,'after'),original,'self drop');
 assert.throws(()=>moveAssignmentPerson(original,'missing',a,'before'),/not found/i);
 assert.throws(()=>moveAssignmentPerson(original,a,'missing','after'),/not found/i);
 assert.throws(()=>moveAssignmentPerson(original,a,b,'center'),/invalid insertion/i);
});

test('Persisted new column positions survive later assignment and person creation',()=>{
 let roster=initialAssignmentRoster();
 roster=addAssignmentPerson(roster,{name:'TEST MEMBER',position:'ITSS',startDate:'2027-04-11'});
 const last=roster.people.at(-1),second=roster.people[1];
 roster=moveAssignmentPerson(roster,last.id,second.id,'before');
 assert.equal(roster.people[1].id,last.id);
 roster=addAssignment(roster,last.id,'Unique Test System');
 assert.equal(roster.people[1].id,last.id);
 assert.equal(roster.items.find(x=>x.name==='Unique Test System').personId,last.id);
 assert.equal(resolveAssignmentOwner(roster,'Unique Test System').label,'TEST MEMBER');
 assert.deepEqual(ids(structuredClone(roster)),ids(roster));
});

test('Header halves are distinct drop targets; guests cannot move columns; item drag stays independent',()=>{
 const src=text('../src/assignment-page-v052.tsx'),css=text('../nbdt-assignment-v052.css');
 assert.match(src,/useDraggable\(\{id:`person:\$\{person\.id\}`/);
 assert.match(src,/person-insert:\$\{person\.id\}:before/);
 assert.match(src,/person-insert:\$\{person\.id\}:after/);
 assert.match(src,/isAdmin&&<button type="button" className="nb56-column-grip"/);
 assert.match(src,/moveAssignmentPerson\(current,source,target,placement\)/);
 assert.match(src,/prefix=.*'person-insert:'.*'slot:'/);
 assert.match(src,/columnPerson\?<div className="nb56-column-preview"/);
 assert.match(css,/nb57-insert-before::before/);
 assert.match(css,/nb57-insert-after::after/);
 assert.match(css,/pointer-events:none/);
 assert.match(css,/touch-action:none/);
 assert.doesNotMatch(src,/swapAssignmentPeople|Swap with/);
});

test('Compiled Assignment handles insert-at-edge drops, leaving item movement and Guest restrictions intact',async()=>{
 const require=createRequire(import.meta.url),ts=require('typescript');
 const compiled=ts.transpileModule(text('../src/assignment-page-v052.tsx'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const jsx=(type,props)=>({type,props});
 const dnd={DndContext:()=>null,PointerSensor:()=>null,KeyboardSensor:()=>null,useDraggable:()=>({attributes:{},listeners:{},setNodeRef:()=>{},isDragging:false}),useDroppable:()=>({setNodeRef:()=>{},isOver:false}),useSensor:()=>null,useSensors:()=>[],DragOverlay:()=>null,pointerWithin:()=>[],rectIntersection:()=>[]};
 const react={__esModule:true,default:{},useEffect:()=>{},useMemo:fn=>fn(),useState:value=>[typeof value==='function'?value():value,()=>{}],useRef:v=>({current:v})};
 const realRoster=await import('../src/assignment-roster.mjs');
 const exports={};const module={exports};
 const deps={'react':react,'react-dom':{createPortal:()=>null},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'@dnd-kit/core':dnd,'lucide-react':new Proxy({}, {get:()=>()=>null}),'./assignment-roster.mjs':realRoster};
 vm.runInNewContext(compiled,{module,exports,require:name=>{if(!(name in deps))throw Error('Unexpected import '+name);return deps[name];},window:{setTimeout:()=>0},document:{body:{}},console,ResizeObserver:undefined,Date,Set,Math},{filename:'compiled-assignment.cjs',timeout:4000});
 const find=(element,type)=>{if(!element||typeof element!=='object')return null;if(element.type===type)return element;const children=element.props?.children||[];return (Array.isArray(children)?children:[children]).map(child=>find(child,type)).find(Boolean)||null;};
 const nodes=(node,out=[])=>{if(Array.isArray(node)){node.forEach(child=>nodes(child,out));return out;}if(!node||typeof node!=='object')return out;if(node.type)out.push(node);nodes(node.props?.children,out);return out;};
 let roster=initialAssignmentRoster(),calls=0;
 const update=async(fn)=>{calls++;roster=fn(roster);};
 const render=(admin)=>module.exports.AssignmentPage({roster,isAdmin:admin,onChange:update,onAuth:()=>{}});
 const root=render(true),drag=find(root,dnd.DndContext);
 assert.ok(drag,'expected actual Assignment DndContext');
 const header=nodes(root).find(el=>el.type?.name==='PersonColumnHeader');
 const cell=nodes(root).find(el=>el.type?.name==='AssignmentCell');
 assert.ok(header&&cell);
 const renderedHeader=header.type(header.props);
 assert.equal(renderedHeader.type,'th');
 const headerNodes=nodes(renderedHeader);
 assert.ok(headerNodes.some(el=>el.props?.className==='nb56-column-grip'));
 assert.ok(headerNodes.some(el=>el.props?.className==='nb57-insertion-zone nb57-insertion-before'));
 assert.ok(headerNodes.some(el=>el.props?.className==='nb57-insertion-zone nb57-insertion-after'));
 assert.equal(cell.type(cell.props).type,'td');
 const guestHeader=nodes(render(false)).find(el=>el.type?.name==='PersonColumnHeader');
 assert.ok(!nodes(guestHeader.type(guestHeader.props)).some(el=>el.props?.className==='nb56-column-grip'));
 const first=roster.people[0].id,third=roster.people[2].id;
 await drag.props.onDragEnd({active:{id:`person:${first}`},over:{id:`person-insert:${third}:after`}});
 await new Promise(r=>setImmediate(r));
 assert.deepEqual(ids(roster).slice(0,3),[initialAssignmentRoster().people[1].id,third,first]);
 assert.equal(calls,1);
 await drag.props.onDragEnd({active:{id:`person:${first}`},over:null});
 await new Promise(r=>setImmediate(r));
 assert.equal(calls,1,'dropping outside a target must not reorder');
 const guestDnd=find(render(false),dnd.DndContext);
 await guestDnd.props.onDragEnd({active:{id:`person:${first}`},over:{id:`person-insert:${third}:before`}});
 await new Promise(r=>setImmediate(r));
 assert.equal(calls,1,'Guest must not reorder columns');
});
