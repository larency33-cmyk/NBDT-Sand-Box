import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {reorderTrackerMember,trackerDropPlacement} from '../src/tracker-team.mjs';

const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-tracker-v090.css',import.meta.url),'utf8');
const project=()=>({
 members:[{id:'lead',name:'TEAM LEAD'}],
 trackerMembers:['Sergiu','Ronny','Nilson','Rob','Claudio'].map(name=>({id:name,name})),
 tasks:[{id:'old',label:'Digital Signage',memberId:'Ronny',startWeek:1,status:'Completed'}],
 trackerNotOnSite:{'Ronny:0':true},
 trackerTeamSynced:true
});
const order=proj=>proj.trackerMembers.map(item=>item.id);

test('Drop position uses upper/lower half of actual hovered row',()=>{
 assert.equal(trackerDropPlacement(100,100,100),'before');
 assert.equal(trackerDropPlacement(149,100,100),'before');
 assert.equal(trackerDropPlacement(150,100,100),'after');
 assert.equal(trackerDropPlacement(199,100,100),'after');
});

test('Dropping a row above another row inserts before it',()=>{
 const p=project();
 const updated=reorderTrackerMember(p,'Ronny','Sergiu','before');
 assert.deepEqual(order(updated),['Ronny','Sergiu','Nilson','Rob','Claudio']);
 assert.equal(reorderTrackerMember(updated,'Ronny','Sergiu','before'),updated,'Moving to same adjacent boundary is a no-op');
 assert.deepEqual(order(p),['Sergiu','Ronny','Nilson','Rob','Claudio'],'The original order is not mutated');
});

test('Dropping a row below another row inserts after it even when moving downward',()=>{
 const p=project();
 const updated=reorderTrackerMember(p,'Sergiu','Rob','after');
 assert.deepEqual(order(updated),['Ronny','Nilson','Rob','Sergiu','Claudio']);
 assert.deepEqual(order(reorderTrackerMember(p,'Ronny','Sergiu','after')),order(p),'No-op when already immediately after');
});

test('Drop position is correct when moving upward into the bottom half of a row',()=>{
 const p=project();
 const updated=reorderTrackerMember(p,'Claudio','Sergiu','after');
 assert.deepEqual(order(updated),['Sergiu','Claudio','Ronny','Nilson','Rob']);
 assert.equal(reorderTrackerMember(p,'Ronny','Ronny','after'),p,'Self drop is no-op');
 assert.throws(()=>reorderTrackerMember(p,'Claudio','Sergiu','middle'),/Invalid drop placement/);
});

test('Reordering does not touch tasks or the stored Not on site status',()=>{
 const p=project(),updated=reorderTrackerMember(p,'Ronny','Rob','after');
 assert.strictEqual(updated.tasks,p.tasks);
 assert.strictEqual(updated.trackerNotOnSite,p.trackerNotOnSite);
 assert.equal(updated.trackerTeamSynced,true);
 assert.equal(updated.trackerMembers.some(m=>m.id==='Ronny'),true);
});

test('The employee drag preview is opaque and follows the mouse instead of the native ghost',()=>{
 assert.match(ui,/setDragImage\(ghost,0,0\)/);
 assert.match(ui,/className="nb91-drag-preview"/);
 assert.match(ui,/dragPreviewRef/);
 assert.match(ui,/dragover',follow,true/);
 assert.match(ui,/dragMember&&createPortal\(<div ref=\{dragPreviewRef\}/);
 assert.match(css,/\.nb91-drag-preview\{/);
 assert.match(css,/opacity:1!important/);
 assert.match(css,/background:#fff!important/);
 assert.match(css,/tbody tr\.nb90-dragging\{opacity:1!important\}/);
});

test('The hover target distinguishes insert before and after with a line between rows',()=>{
 assert.match(ui,/trackerDropPlacement\(event\.clientY,rect\.top,rect\.height\)/);
 assert.match(ui,/nb91-drop-'\+dropMember\.placement/);
 assert.match(ui,/onMemberReorder\(sourceId,targetId,placement\)/);
 assert.match(app,/reorderTrackerMember\(syncTrackerTeam\(prev,assignmentRosterRef\.current\),fromId,toId,placement\)/);
 assert.match(css,/nb91-drop-before>td/);
 assert.match(css,/nb91-drop-after>td/);
 assert.match(css,/box-shadow:inset 0 4px 0 #1678f4!important/);
 assert.match(css,/box-shadow:inset 0 -4px 0 #1678f4!important/);
 assert.match(css,/DROP HERE/);
 assert.match(ui,/event\.key==='ArrowUp'\?'before':'after'/);
});

test('The task action menu renders in document.body above the scrolling drawer',()=>{
 assert.match(ui,/menuOpen&&menuPosition&&createPortal\(<div ref=\{menuPortalRef\}/);
 assert.match(ui,/className="nb-task-action-menu nb91-task-portal-menu"/);
 assert.match(ui,/role="menu" aria-label=\{'Actions for '\+task\.label\} style=\{menuPosition\}/);
 assert.match(css,/\.nb91-task-portal-menu\{/);
 assert.match(css,/position:fixed!important/);
 assert.match(css,/z-index:20010!important/);
 assert.match(ui,/window\.addEventListener\('resize',positionMenu\)/);
 assert.match(ui,/document\.addEventListener\('scroll',positionMenu,true\)/);
 assert.match(ui,/menuPortalRef\.current\?\.contains\(node\)/);
});

test('Edit, Move previous, Move next, Delete and Escape dismissal survive the portaling',()=>{
 const start=ui.indexOf('menuOpen&&menuPosition&&createPortal(');
 const end=ui.indexOf('</div>,document.body)',start);
 assert.ok(start>=0&&end>start);
 const popup=ui.slice(start,end);
 for(const label of ['Edit','Move to previous week','Move to next week','Delete']){
  assert.ok(popup.includes('> '+label+'</button>'),label);
 }
 assert.match(ui,/event\.key==='Escape'/);
 assert.match(ui,/menuRef\.current\?\.querySelector\('button'\)\?\.focus\(\)/);
});
