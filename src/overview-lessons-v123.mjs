import {normalizeLesson,isLessonPopulated} from './lessons-learned.mjs';
import {getLessonReview} from './lesson-review.mjs';
export function overviewLessonsStats(project){
 const systems=Array.isArray(project?.systems)?project.systems:[];
 const projectId=project?.id;
 const summary={total:0,confirmed:0,pending:0,inProgress:0,withoutLessons:0,systemsWithLessons:0,fullyReviewedSystems:0,systemsNeedingReview:0};
 const needingAttention=[];
 for(const sys of systems){
  const raw=Array.isArray(sys?.lessonsLearnedItems)?sys.lessonsLearnedItems:sys?.lessonsLearned?[{id:'legacy-lesson-'+sys.id,text:String(sys.lessonsLearned)}]:[];
  const lessons=raw.map((lesson,index)=>normalizeLesson(lesson,index)).filter(isLessonPopulated);
  const statuses={pending:0,inProgress:0,confirmed:0};
  for(const lesson of lessons){
   const status=getLessonReview(lesson,projectId).status;
   if(status==='confirmed')statuses.confirmed++;
   else if(status==='in-progress')statuses.inProgress++;
   else statuses.pending++;
  }
  const remaining=statuses.pending+statuses.inProgress;
  summary.total+=lessons.length;
  summary.confirmed+=statuses.confirmed;
  summary.pending+=statuses.pending;
  summary.inProgress+=statuses.inProgress;
  if(!lessons.length)summary.withoutLessons++;
  else{summary.systemsWithLessons++;if(!remaining)summary.fullyReviewedSystems++;else summary.systemsNeedingReview++;}
  if(!lessons.length||remaining)needingAttention.push({id:sys.id,name:sys.name||'Unnamed system',total:lessons.length,confirmed:statuses.confirmed,pending:statuses.pending,inProgress:statuses.inProgress,remaining,kind:!lessons.length?'missing':statuses.inProgress?'in-progress':'pending'});
 }
 const priority={'in-progress':0,pending:1,missing:2};
 needingAttention.sort((a,b)=>priority[a.kind]-priority[b.kind]||b.remaining-a.remaining||a.name.localeCompare(b.name));
 return {...summary,remaining:summary.pending+summary.inProgress,systemCount:systems.length,percent:summary.total?Math.round(summary.confirmed/summary.total*100):null,needingAttention};
}
