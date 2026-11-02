/**
 * Pick the next actionable deployment stage for one system.
 *
 * Base → Ready → Deployed is the default order. A stage at >=95% can yield
 * attention to the next stage if that next stage is substantially unfinished.
 * Crucially, the percentage and pending count always refer to the SAME stage.
 * Counts are clamped because imported report samples may contain inconsistent
 * values (e.g. ready > base). The report's stored data is never mutated.
 */
export const ATTENTION_NEAR_COMPLETE_RATIO = .95;

const STAGES = Object.freeze([
  {key:'base', label:'Base Configuration', className:'base', pendingText:'need base configuration'},
  {key:'ready', label:'Ready for Deployment', className:'ready', pendingText:'pending ready for deployment'},
  {key:'deployed', label:'Deployed', className:'deployed', pendingText:'pending deployment'}
]);

/** @returns {null | {key:string,label:string,className:string,complete:number,total:number,pending:number,percent:number,description:string,rank:number}} */
export function selectAttentionStage(raw) {
  const total=Math.max(0,Math.floor(Number(raw?.total)||0));
  if(!total) return null;
  const completed=STAGES.map(({key})=>Math.max(0,Math.min(total,Math.floor(Number(raw?.[key])||0))));
  const ratios=completed.map(n=>n/total);
  if(completed.every(n=>n===total))return null;

  // Base has priority until done/nearly done; while nearly done, focus on the
  // next substantially unfinished step. Never skip an incomplete stage if
  // the next step is already marked 100% in inconsistent imported data.
  let index=STAGES.findIndex((_,i)=>completed[i]<total);
  if(index<2 && ratios[index]>=ATTENTION_NEAR_COMPLETE_RATIO){
    const next=index+1;
    if(ratios[next]<ATTENTION_NEAR_COMPLETE_RATIO)index=next;
  }
  if(index===1 && ratios[1]>=ATTENTION_NEAR_COMPLETE_RATIO && ratios[2]<ATTENTION_NEAR_COMPLETE_RATIO){
    index=2;
  }
  const stage=STAGES[index];
  const complete=completed[index];
  const pending=total-complete;
  // Do not accidentally print 100% when a small number still remains.
  const exactPercent=complete/total*100;
  const percent=complete<total && Math.round(exactPercent)===100
    ? Math.min(99.99,Number(exactPercent.toFixed(2)))
    : Math.round(exactPercent);
  return {
    key:stage.key,label:stage.label,className:stage.className,
    rank:index,complete,total,pending,percent,
    description:`${pending} ${pending===1?'device':'devices'} ${pending===1?stage.pendingText.replace(/^need /,'needs '):stage.pendingText}`
  };
}

export function attentionForSystem(sys,counts){
  const c=counts(sys);
  const stage=selectAttentionStage(c);
  return stage?{sys,c,stage}:null;
}

/** All actionable systems, ordered by sequential stage priority, then size of backlog. */
export function getAttentionRows(systems,counts){
  return (systems||[]).map(s=>attentionForSystem(s,counts)).filter(Boolean)
    .sort((a,b)=>a.stage.rank-b.stage.rank || b.stage.pending-a.stage.pending || String(a.sys.name).localeCompare(String(b.sys.name)));
}
