import {STAGES,setCheck,acceptStage,canAccept} from './model.mjs';

/** Checklist verification attached to a Guide, never to a physical device run.
 * Device deployment counts remain based exclusively on deviceRuns.
 */
export const guideReviewKey = guide => STAGES.map(stage =>
  `${stage}:`+(guide?.stages?.[stage]||[]).map(item => `${item.id}:${item.label}:${item.required!==false}:${!!item.evidenceRequired}:${!!item.allowNA}`).join('|')
).join(' / ');

export function loadGuideReview(saved,guide) {
 const key=guideReviewKey(guide);
 if(!saved||saved.guideKey!==key)return {guideKey:key,checks:{},results:{},accepted:{}};
 const ids=new Set(STAGES.flatMap(stage=>(guide.stages?.[stage]||[]).map(item=>item.id)));
 return {guideKey:key,checks:Object.fromEntries(Object.entries(saved.checks||{}).filter(([id])=>ids.has(id))),results:Object.fromEntries(Object.entries(saved.results||{}).filter(([id])=>ids.has(id))),accepted:{...saved.accepted}};
}
export function changeGuideCheck(review,guide,stage,id,value){
 const next=setCheck({...review,snapshot:guide},stage,id,value);
 const {snapshot,...saved}=next;
 return saved;
}
export function acceptGuideReviewStage(review,guide,stage){
 const current={...review,snapshot:guide};
 if(!canAccept(current,stage))throw Error('Complete required steps and accept previous stages first');
 const {snapshot,...saved}=acceptStage(current,stage);
 return saved;
}
