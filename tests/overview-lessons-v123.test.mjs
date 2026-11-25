import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {overviewLessonsStats} from '../src/overview-lessons-v123.mjs';
const item=(id,status,projectId='ship-a')=>({id,lessonLearned:'Validate network settings',currentShipReview:{projectId,status,reviewedBy:'QA'}});
const system=(id,name,lessonsLearnedItems)=>({id,name,lessonsLearnedItems});
test('counts actual lessons across systems and shows missing lessons separately',()=>{
 const project={id:'ship-a',systems:[system('a','A',[item('a1','confirmed'),item('a2','pending')]),system('b','B',[]),system('c','C',[item('c1','in-progress')]),system('d','D',[item('d1','confirmed')])]};
 const s=overviewLessonsStats(project);
 assert.deepEqual([s.total,s.confirmed,s.pending,s.inProgress,s.remaining,s.withoutLessons,s.systemCount],[4,2,1,1,2,1,4]);
 assert.equal(s.percent,50);assert.equal(s.fullyReviewedSystems,1);assert.equal(s.systemsNeedingReview,2);
 assert.deepEqual(s.needingAttention.map(x=>x.id),['c','a','b']);
});
test('does not transfer lesson confirmation from another project',()=>{
 const s=overviewLessonsStats({id:'ship-b',systems:[system('a','A',[item('a1','confirmed','ship-a')])]});
 assert.equal(s.confirmed,0);assert.equal(s.pending,1);assert.equal(s.remaining,1);
});
test('uses legacy note if structured data is missing; respects structured empty array',()=>{
 const s=overviewLessonsStats({id:'p',systems:[{id:'1',name:'Legacy',lessonsLearned:'Verify permissions'},{id:'2',name:'Empty',lessonsLearned:'old text',lessonsLearnedItems:[]}]});
 assert.equal(s.total,1);assert.equal(s.withoutLessons,1);
});
test('handles zero lessons without pretending any completion',()=>{
 const s=overviewLessonsStats({id:'p',systems:[]});assert.equal(s.total,0);assert.equal(s.percent,null);assert.equal(s.remaining,0);assert.equal(s.systemCount,0);
});
test('does not count incomplete or blank lesson records as content',()=>{
 const s=overviewLessonsStats({id:'p',systems:[system('a','A',[{id:'blank',text:'  '},{id:'valid',issueProfile:'Fix security policy'}])]});
 assert.equal(s.total,1);assert.equal(s.pending,1);
});
test('actual Overview uses live stats and direct System Registry navigation',()=>{
 const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
 const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
 assert.match(ui,/overviewLessonsStats\(project\)/);assert.match(ui,/nb124-lessons-action-list/);
 assert.match(ui,/onOpenSystem\?onOpenSystem\(row.id\)/);
 assert.match(entry,/onOpenSystem=\{\(systemId:string\)/);
 assert.match(entry,/nbdt-overview-lessons-v123\.css/);
});
