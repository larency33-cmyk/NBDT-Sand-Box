import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {registryCurrentGuide,registrySystemProgress,registryMatchesStatus,REGISTRY_PROGRESS_SECTIONS} from '../src/registry-progress.mjs';
import {guideReviewKey} from '../src/guide-review.mjs';
import {setLessonReview} from '../src/lesson-review.mjs';
const main=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const styles=readFileSync(new URL('../nbdt-registry-v108.css',import.meta.url),'utf8');
const steps={
 configuration:[{id:'base',label:'Base',required:true}],
 readyForDeployment:[{id:'ready',label:'Ready',required:true}],
 deployment:[{id:'deploy',label:'Deployment',required:true}],
};
function fixture(){
 const sys={id:'sys1',name:'POS',guideDraft:{stages:structuredClone(steps)},lessonsLearnedItems:[{id:'l1',lessonLearned:'Check RFID'}]};
 const guide=registryCurrentGuide(sys);
 sys.guideReview={guideKey:guideReviewKey(guide),checks:{},results:{},accepted:{}};
 return sys;
}
function saveCheck(sys,stage,id){
 sys.guideReview.checks[id]=true;
 sys.guideReview.results[id]={state:'completed'};
 sys.guideReview.accepted[stage]='2026-11-23T08:00:00Z';
}

test('approved set of 4 stages and zero state',()=>{
 const s=registrySystemProgress(fixture(),'project-A');
 assert.deepEqual(REGISTRY_PROGRESS_SECTIONS.map(i=>i.shortLabel),['Base','Ready','Deploy','Lessons']);
 assert.equal(s.status,'not-started');
 assert.equal(s.completedCount,0);
 assert.deepEqual(s.sections.map(s=>s.status),['not-started','not-started','not-started','not-started']);
});
test('partial checked but not accepted stage is in progress and not counted complete',()=>{
 const sys=fixture();
 sys.guideReview.checks.base=true;
 sys.guideReview.results.base={state:'completed'};
 const s=registrySystemProgress(sys,'project-A');
 assert.equal(s.status,'in-progress');
 assert.equal(s.completedCount,0);
 assert.equal(s.sections[0].status,'in-progress');
});
test('accepted checklists count only if every required step is currently valid',()=>{
 const sys=fixture();
 saveCheck(sys,'configuration','base');saveCheck(sys,'readyForDeployment','ready');
 assert.equal(registrySystemProgress(sys,'project-A').completedCount,2);
 sys.guideReview.results.ready.state='stale';
 const s=registrySystemProgress(sys,'project-A');
 assert.equal(s.completedCount,1);
 assert.equal(s.sections[1].status,'in-progress');
});
test('N/A with allowed justification may count as complete only when accepted',()=>{
 const sys=fixture();sys.guideDraft.stages.configuration=[{id:'base',label:'Base',allowNA:true}];
 sys.guideReview.guideKey=guideReviewKey(registryCurrentGuide(sys));
 sys.guideReview.results.base={state:'not_applicable',reason:'No hardware required'};
 sys.guideReview.accepted.configuration='2026-11-23';
 const p=registrySystemProgress(sys,'project-A');
 assert.equal(p.sections[0].status,'completed');
});
test('key mismatch resets outdated stage progress and acceptance',()=>{
 const sys=fixture();saveCheck(sys,'configuration','base');
 sys.guideDraft.stages.configuration=[{id:'different',label:'New check',required:true}];
 assert.equal(registrySystemProgress(sys,'project-A').completedCount,0);
});
test('Lessons are completed only when all populated records are confirmed for THIS project',()=>{
 const sys=fixture();
 saveCheck(sys,'configuration','base');saveCheck(sys,'readyForDeployment','ready');saveCheck(sys,'deployment','deploy');
 let state=registrySystemProgress(sys,'project-A');
 assert.equal(state.completedCount,3);
 assert.equal(state.status,'in-progress');
 const lesson=setLessonReview(sys.lessonsLearnedItems[0],'project-A',{status:'confirmed',reviewedBy:'Owner'});
 sys.lessonsLearnedItems=[lesson];
 state=registrySystemProgress(sys,'project-A');
 assert.equal(state.completedCount,4);
 assert.equal(state.status,'completed');
 assert.equal(registrySystemProgress(sys,'project-B').completedCount,3);
});
test('Mixed pending and confirmed lessons are in progress, not complete',()=>{
 const sys=fixture();
 sys.lessonsLearnedItems=[setLessonReview(sys.lessonsLearnedItems[0],'project-A',{status:'confirmed',reviewedBy:'Owner'}),{id:'l2',lessonLearned:'Check POS'}];
 const s=registrySystemProgress(sys,'project-A');
 assert.equal(s.sections[3].status,'in-progress');
 assert.equal(s.sections[3].done,1);
 assert.equal(s.sections[3].total,2);
});
test('No lessons recorded is never silently completed; pending reviews mean not started',()=>{
 const sys=fixture();sys.lessonsLearnedItems=[];
 assert.equal(registrySystemProgress(sys,'project-A').sections[3].status,'not-started');
 sys.lessonsLearnedItems=[{id:'l1',lessonLearned:'Monitor firmware'}];
 assert.equal(registrySystemProgress(sys,'project-A').sections[3].status,'not-started');
});
test('Legacy checklist and legacy lesson description remain compatible',()=>{
 const sys={id:'legacy',checkSheetData:{configuration:['One step'],readyForDeployment:[],deployment:[]},lessonsLearned:'Inspect printer'};
 const guide=registryCurrentGuide(sys);
 assert.equal(guide.stages.configuration[0].id,'legacy-configuration-0');
 const s=registrySystemProgress(sys,'project-A');
 assert.equal(s.sections[3].total,1);
 assert.equal(s.status,'not-started');
});
test('completed, in progress, not started and combined search filters are exact',()=>{
 const sys=fixture();
 assert.equal(registryMatchesStatus(registrySystemProgress(sys,'A'),'not-started'),true);
 assert.equal(registryMatchesStatus(registrySystemProgress(sys,'A'),'completed'),false);
 assert.equal(registryMatchesStatus(registrySystemProgress(sys,'A'),''),true);
 sys.guideReview.checks.base=true;sys.guideReview.results.base={state:'completed'};
 assert.equal(registryMatchesStatus(registrySystemProgress(sys,'A'),'in-progress'),true);
});
test('approved card layout, stage badges, accessible progressbar and filter are wired',()=>{
 assert.match(main,/const progress = registrySystemProgress\(sys,project.id\)/);
 assert.match(main,/className="nb108-progress"/);
 assert.match(main,/role="progressbar" aria-label=\{`Completed sections for/);
 assert.match(main,/REGISTRY_PROGRESS_SECTIONS\.map/);
 assert.match(main,/label="Completion status" placeholder="All statuses"/);
 assert.match(main,/registryMatchesStatus\(registrySystemProgress\(s,project.id\),systemStatusFilter\)/);
 assert.match(main,/setSystemStatusFilter\(''\)/);
 assert.match(styles,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);
 assert.match(styles,/\.nb108-stage-completed/);
 assert.match(styles,/\.nb108-stage-in-progress/);
 assert.match(styles,/\.nb108-stage-not-started/);
});
