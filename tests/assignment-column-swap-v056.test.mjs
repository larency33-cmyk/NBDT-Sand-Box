import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {initialAssignmentRoster,swapAssignmentPeople,resolveAssignmentOwner,addAssignmentPerson,addAssignment} from '../src/assignment-roster.mjs';
const text=filename=>readFileSync(new URL(filename,import.meta.url),'utf8');

test('Swapping whole columns changes only visible employee order, not ownership, personnel or system assignments',()=>{
 const before=initialAssignmentRoster();
 const originalRoster=JSON.stringify(before);
 const first=before.people[0],last=before.people.at(-1);
 const result=swapAssignmentPeople(before,first.id,last.id);
 assert.equal(result.people[0].id,last.id);
 assert.equal(result.people.at(-1).id,first.id);
 assert.deepEqual(result.people.slice(1,-1),before.people.slice(1,-1));
 assert.deepEqual(result.items,before.items);
 assert.equal(result.people.length,13);
 assert.equal(result.items.length,108);
 assert.equal(JSON.stringify(before),originalRoster,'original roster must remain unchanged');
 assert.equal(resolveAssignmentOwner(result,'OHC - SPMS').label,resolveAssignmentOwner(before,'OHC - SPMS').label);
 assert.equal(resolveAssignmentOwner(result,'Digital Signage').label,'CLAUDIO MONTEIRO');
});

test('Unknown employees are rejected; same-column drop is an identity operation',()=>{
 const before=initialAssignmentRoster();
 assert.throws(()=>swapAssignmentPeople(before,'not-a-person',before.people[0].id),/not found/i);
 assert.throws(()=>swapAssignmentPeople(before,before.people[0].id,'not-a-person'),/not found/i);
 assert.equal(swapAssignmentPeople(before,before.people[2].id,before.people[2].id),before);
});

test('Saved column order survives subsequent assignment edits and supports added employees',()=>{
 let roster=initialAssignmentRoster();
 roster=addAssignmentPerson(roster,{name:'TEST MEMBER',position:'ITSS',startDate:'2027-04-11'});
 const custom=roster.people.at(-1),first=roster.people[0];
 roster=swapAssignmentPeople(roster,custom.id,first.id);
 assert.equal(roster.people[0].id,custom.id);
 roster=addAssignment(roster,custom.id,'Synthetic project example');
 assert.equal(roster.people[0].id,custom.id);
 assert.equal(roster.items.find(item=>item.name==='Synthetic project example').personId,custom.id);
 assert.equal(resolveAssignmentOwner(roster,'Synthetic project example').label,'TEST MEMBER');
 assert.deepEqual(structuredClone(roster).people.map(p=>p.id),roster.people.map(p=>p.id),'order is serializable to persistent storage');
});

test('Column drag is admin-only, shares DnD with system movement and exposes a separate full-column drop target',()=>{
 const source=text('../src/assignment-page-v052.tsx'),styles=text('../nbdt-assignment-v052.css');
 assert.match(source,/useDraggable\(\{id:`person:\$\{person\.id\}`/);
 assert.match(source,/useDroppable\(\{id:`person-target:\$\{person\.id\}`/);
 assert.match(source,/isAdmin&&<button type="button" className="nb56-column-grip"/);
 assert.match(source,/swapAssignmentPeople\(current,source,target\)/);
 assert.match(source,/prefix=.*'person-target:'.*'slot:'/);
 assert.match(source,/columnPerson\?<div className="nb56-column-preview"/);
 assert.match(styles,/nb56-column-destination/);
 assert.match(styles,/nb56-column-source/);
 assert.match(styles,/touch-action:none/);
});

test('Compiled Assignment event handler swaps header columns, while drag of task cells retains its original move handler',async()=>{
 const require=createRequire(import.meta.url),ts=require('typescript');
 const source=text('../src/assignment-page-v052.tsx');
 const compiled=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
 const jsx=(type,props)=>({type,props});
 const dnd={DndContext:()=>null,PointerSensor:()=>null,KeyboardSensor:()=>null,useDraggable:()=>({attributes:{},listeners:{},setNodeRef:()=>{},isDragging:false}),useDroppable:()=>({setNodeRef:()=>{},isOver:false}),useSensor:()=>null,useSensors:()=>[],DragOverlay:()=>null,pointerWithin:()=>[],rectIntersection:()=>[]};
 const react={__esModule:true,default:{},useEffect:()=>{},useMemo:fn=>fn(),useState:value=>[typeof value==='function'?value():value,()=>{}],useRef:v=>({current:v})};
 const realRoster=await import('../src/assignment-roster.mjs');
 const exports={};const module={exports};
 const deps={'react':react,'react-dom':{createPortal:()=>null},'react/jsx-runtime':{jsx,jsxs:jsx,Fragment:'fragment'},'@dnd-kit/core':dnd,'lucide-react':new Proxy({}, {get:()=>()=>null}),'./assignment-roster.mjs':realRoster};
 vm.runInNewContext(compiled,{module,exports,require:name=>{if(!(name in deps))throw Error('Unexpected import '+name);return deps[name];},window:{setTimeout:()=>0},document:{body:{}},console,ResizeObserver:undefined,Date,Set,Math},{filename:'compiled-assignment.cjs',timeout:4000});
 const find=(element,type)=>{if(!element||typeof element!=='object')return null;if(element.type===type)return element;const children=element.props?.children||[];return (Array.isArray(children)?children:[children]).map(child=>find(child,type)).find(Boolean)||null;};
 let roster=initialAssignmentRoster(),calls=0;
 const update=async(fn)=>{calls++;roster=fn(roster);};
 const render=(admin)=>module.exports.AssignmentPage({roster,isAdmin:admin,onChange:update,onAuth:()=>{}});
 const root=render(true),drag=find(root,dnd.DndContext);
 assert.ok(drag,'expected actual Assignment DndContext');
 const allNodes=(node,output=[])=>{
  if(Array.isArray(node)){for(const child of node)allNodes(child,output);return output;}
  if(!node||typeof node!=='object')return output;
  if(node.type)output.push(node);
  allNodes(node.props?.children,output);return output;
 };
 const headerNode=allNodes(root).find(el=>el.type?.name==='PersonColumnHeader');
 const cellNode=allNodes(root).find(el=>el.type?.name==='AssignmentCell');
 assert.ok(headerNode,'an employee-column header must render');
 assert.ok(cellNode,'system cells must still render');
 const renderedHeader=headerNode.type(headerNode.props);
 assert.equal(renderedHeader.type,'th');
 assert.ok(allNodes(renderedHeader).some(el=>el.props?.className==='nb56-column-grip'));
 assert.equal(cellNode.type(cellNode.props).type,'td');
 const guestHeader=allNodes(render(false)).find(el=>el.type?.name==='PersonColumnHeader');
 assert.ok(guestHeader);
 assert.ok(!allNodes(guestHeader.type(guestHeader.props)).some(el=>el.props?.className==='nb56-column-grip'),'guest must not see drag control');
 const first=roster.people[0].id,third=roster.people[2].id;
 await drag.props.onDragEnd({active:{id:`person:${first}`},over:{id:`person-target:${third}`}});
 await new Promise(r=>setImmediate(r));
 assert.equal(roster.people[2].id,first);
 assert.equal(roster.people[0].id,third);
 assert.equal(calls,1);
 await drag.props.onDragEnd({active:{id:`person:${first}`},over:null});
 await new Promise(r=>setImmediate(r));
 assert.equal(calls,1,'dropping outside another employee must not swap');
 const guest=render(false),guestDnd=find(guest,dnd.DndContext);
 assert.ok(guestDnd);
 await guestDnd.props.onDragEnd({active:{id:`person:${first}`},over:{id:`person-target:${third}`}});
 await new Promise(r=>setImmediate(r));
 assert.equal(calls,1,'guests cannot reorder columns');
});
