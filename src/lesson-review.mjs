/** NBDT 0.6.78 — lessons from prior vessels are source records;
 * a current-project acknowledgement is independent of the historical content.
 * The project id prevents a confirmation in a copied project being reused. */
export const LESSON_REVIEW_STATUSES = Object.freeze(['pending','in-progress','confirmed']);
export const LESSON_REVIEW_LABELS = Object.freeze({
 'pending':'Pending review',
 'in-progress':'In progress',
 'confirmed':'Confirmed',
});
const tidy = value => String(value??'').trim();
export function getLessonReview(lesson,projectId){
 const project=tidy(projectId);
 const stored=lesson?.currentShipReview;
 if(!project || !stored || stored.projectId!==project){
  return {projectId:project,status:'pending',reviewedBy:'',note:'',updatedAt:'',confirmedAt:''};
 }
 return {
  projectId:project,
  status:LESSON_REVIEW_STATUSES.includes(stored.status)?stored.status:'pending',
  reviewedBy:tidy(stored.reviewedBy),
  note:tidy(stored.note),
  updatedAt:tidy(stored.updatedAt),
  confirmedAt:tidy(stored.confirmedAt),
 };
}
export function setLessonReview(lesson,projectId,values,at=new Date().toISOString()){
 const project=tidy(projectId);
 if(!project)throw new Error('Project is required to review a lesson.');
 const status=tidy(values?.status);
 if(!LESSON_REVIEW_STATUSES.includes(status))throw new Error('Select a valid review status.');
 const reviewedBy=tidy(values?.reviewedBy), note=tidy(values?.note);
 if(status!=='pending'&&!reviewedBy)throw new Error('Enter who reviewed this lesson before changing its review status.');
 if(!lesson || !lesson.id)throw new Error('Lesson is missing an ID.');
 const old=getLessonReview(lesson,project);
 if(old.status===status && old.reviewedBy===reviewedBy && old.note===note)return lesson;
 return {...lesson,currentShipReview:{
  projectId:project,status,reviewedBy,note,updatedAt:at,
  confirmedAt:status==='confirmed'?(old.status==='confirmed'&&old.confirmedAt||at):'',
 }};
}
export function lessonReviewCounts(items,projectId){
 const result={pending:0,'in-progress':0,confirmed:0};
 for(const lesson of Array.isArray(items)?items:[]){
  if(lesson?.lessonLearned || lesson?.text){result[getLessonReview(lesson,projectId).status]++;}
 }
 return result;
}
