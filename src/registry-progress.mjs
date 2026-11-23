/** NBDT v0.6.108 — System Registry status is derived exclusively from saved
 * Guide checklist verification and current-project Lessons Learned review.
 * Device run deployment counts deliberately remain separate.
 */
import {STAGES, stageComplete} from './model.mjs';
import {loadGuideReview} from './guide-review.mjs';
import {normalizeLesson,isLessonPopulated} from './lessons-learned.mjs';
import {getLessonReview} from './lesson-review.mjs';

export const REGISTRY_STATUS_FILTERS = Object.freeze([
  {value:'completed',label:'Completed'},
  {value:'in-progress',label:'In progress'},
  {value:'not-started',label:'Not started'},
]);
export const REGISTRY_PROGRESS_SECTIONS = Object.freeze([
  {key:'configuration',shortLabel:'Base',name:'Base Configuration'},
  {key:'readyForDeployment',shortLabel:'Ready',name:'Ready for Deployment'},
  {key:'deployment',shortLabel:'Deploy',name:'Deployment'},
  {key:'lessons',shortLabel:'Lessons',name:'Lessons Learned'},
]);

// Same Guide selection and legacy fallback as beginGuideEdit in workspace.tsx.
// This must describe the Guide that Open guide edits, not an old published snapshot.
export function registryCurrentGuide(system){
  const base=system?.guideDraft||system?.publishedGuide||{stages:{}};
  const stages=base.stages||{};
  const hasSteps=Object.values(stages).some(items=>Array.isArray(items)&&items.length>0);
  if(hasSteps)return {...base,stages};
  const legacy=Object.fromEntries(STAGES.map(stage=>[
    stage,(system?.checkSheetData?.[stage]||[]).map((item,i)=>typeof item==='string'
      ?{id:`legacy-${stage}-${i}`,label:item,required:true}
      :{...item,id:item.id||`legacy-${stage}-${i}`,label:item.label||item.title||String(item),required:item.required!==false}),
  ]));
  return {...base,stages:{...stages,...legacy}};
}

export function registrySystemProgress(system,projectId){
  const guide=registryCurrentGuide(system);
  const saved=loadGuideReview(system?.guideReview,guide);
  const sections=STAGES.map(stage=>{
    const items=Array.isArray(guide.stages?.[stage])?guide.stages[stage]:[];
    const checked=items.filter(item=>{
      const result=saved.results?.[item.id];
      return saved.checks?.[item.id]===true || (result?.state==='not_applicable'&&item.allowNA===true&&String(result.reason||'').trim());
    }).length;
    const complete=!!saved.accepted?.[stage] && stageComplete({...saved,snapshot:guide},stage);
    return {key:stage,status:complete?'completed':checked>0?'in-progress':'not-started',
      total:items.length,done:checked,accepted:complete};
  });
  const sourceLessons=Array.isArray(system?.lessonsLearnedItems)
    ?system.lessonsLearnedItems
    :system?.lessonsLearned?[{id:`legacy-lesson-${system.id}`,text:String(system.lessonsLearned)}]:[];
  const lessons=sourceLessons.map(normalizeLesson).filter(isLessonPopulated);
  const lessonStatuses=lessons.map(item=>getLessonReview(item,projectId).status);
  const confirmed=lessonStatuses.filter(value=>value==='confirmed').length;
  const started=lessonStatuses.some(value=>value!=='pending');
  sections.push({key:'lessons',status:lessons.length&&confirmed===lessons.length?'completed':started?'in-progress':'not-started',
    total:lessons.length,done:confirmed,accepted:!!lessons.length&&confirmed===lessons.length});
  const completedCount=sections.filter(item=>item.status==='completed').length;
  const status=completedCount===4?'completed'
    :sections.some(item=>item.status!=='not-started')?'in-progress':'not-started';
  return {status,completedCount,totalCount:4,sections};
}

export function registryMatchesStatus(progress,filter){
  return !filter || progress.status===filter;
}
