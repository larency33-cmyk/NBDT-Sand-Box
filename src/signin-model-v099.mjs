import {initialAssignmentRoster,ASSIGNMENT_STORAGE_KEY} from './assignment-roster.mjs';

// This flag records dismissal of a welcome screen, NOT authentication or a role.
export const WELCOME_SESSION_KEY='nbdt_welcome_entered_v099';
export const DEPLOYMENT_CYCLE_MS=20000;
export const NAME_CYCLE_MS=8000;
// Delivery repeats in 20 s; 8 s name fades and 40 s cloud drift align every 40 s.
export const VISUAL_LOOP_MS=40000;

export function hasEnteredWelcome(storage){
  try{return storage?.getItem(WELCOME_SESSION_KEY)==='1';}catch{return false;}
}
export function rememberWelcomeEntry(storage){
  try{storage?.setItem(WELCOME_SESSION_KEY,'1');}catch{/* Entry also works when storage is unavailable. */}
}
export function welcomeTarget(href){
  const url=new URL(href,'https://nbdt.invalid');
  if(!/^\/signin\/?$/.test(url.pathname))return null;
  const target=url.searchParams.get('returnTo');
  if(!target||!target.startsWith('/')||target.startsWith('//')||target.includes('\\'))return '/';
  try{
    const next=new URL(target,url.origin);
    return next.origin===url.origin&&!/^\/signin\/?$/.test(next.pathname)?next.pathname+next.search+next.hash:'/';
  }catch{return '/';}
}

const shortName=name=>{
  const clean=String(name||'').trim().replace(/\s+/g,' ');
  if(/^HOMESHWAR\b/i.test(clean))return 'Homesh';
  const first=clean.split(' ')[0];
  return first?first.charAt(0).toLocaleUpperCase()+first.slice(1).toLocaleLowerCase():'';
};
export function landingNames(roster){
  if(!roster||!Array.isArray(roster.people))return [];
  const names=[],seen=new Set();
  for(const person of roster.people){
    if(!person||person.showOnSignIn===false)continue;
    const name=String(person.loginDisplayName||shortName(person.name)).trim().slice(0,40);
    const key=name.toLocaleLowerCase();
    if(name&&!seen.has(key)){names.push(name);seen.add(key);}
  }
  const priority=['homesh','apple','nilson'];
  return [...names.filter(n=>priority.includes(n.toLocaleLowerCase())).sort((a,b)=>priority.indexOf(a.toLocaleLowerCase())-priority.indexOf(b.toLocaleLowerCase())),...names.filter(n=>!priority.includes(n.toLocaleLowerCase()))];
}
export function namesForCycle(names,cycle,slots=3){
  if(!Array.isArray(names)||!names.length)return [];
  const count=Math.min(slots,names.length);
  const start=(Math.max(0,Math.floor(cycle))*slots)%names.length;
  return Array.from({length:count},(_,i)=>names[(start+i)%names.length]);
}
export const initialLandingNames=()=>landingNames(initialAssignmentRoster());

// Read the existing local Assignment without importing/initializing the workspace.
// Abort creation on a fresh browser, so the workspace can create its own stores.
export async function readLandingNames(factory=globalThis.indexedDB){
  const fallback=initialLandingNames();
  if(!factory)return fallback;
  return new Promise(resolve=>{
    let finished=false,db;
    const finish=names=>{if(finished)return;finished=true;clearTimeout(timer);try{db?.close();}catch{}resolve(names);};
    const timer=setTimeout(()=>finish(fallback),2500);
    let request;
    try{request=factory.open('nbdt-demo-v03',1);}catch{finish(fallback);return;}
    request.onupgradeneeded=()=>{request.transaction?.abort();};
    request.onerror=()=>finish(fallback);
    request.onblocked=()=>finish(fallback);
    request.onsuccess=()=>{
      db=request.result;
      if(finished){db.close();return;}
      try{
        if(!db.objectStoreNames.contains('records')){finish(fallback);return;}
        const tx=db.transaction('records','readonly');
        const record=tx.objectStore('records').get(ASSIGNMENT_STORAGE_KEY);
        record.onsuccess=()=>{
          if(!record.result){finish(fallback);return;}
          try{finish(landingNames(JSON.parse(record.result.value)));}catch{finish(fallback);}
        };
        record.onerror=()=>finish(fallback);
        tx.onabort=()=>finish(fallback);
      }catch{finish(fallback);}
    };
  });
}
