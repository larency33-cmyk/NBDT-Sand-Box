import {weekIndexFromDate,projectWeekParam} from './schedule.mjs';
/** Shareable client-side locations. No user-supplied route text is used as HTML. */
const safeDecode = value => { try { return decodeURIComponent(value); } catch { return ''; } };
const SECTIONS = {overview:'overview',roadmap:'tracker',systems:'systems',issues:'issues','config-report':'reports/configuration',sync:'sync',assignment:'assignment',administration:'administration'};
export function readAppRoute(input) {
  const url = input instanceof URL ? input : new URL(String(input));
  const parts = url.pathname.split('/').filter(Boolean);
  let projectId = null, tab = 'overview', systemId = null;
  if (parts[0] === 'projects' && parts[1]) {
    projectId = safeDecode(parts[1]);
    if (parts[2] === 'systems') {
      tab = 'systems';
      if (parts[3] && parts[4] === 'guide') systemId = safeDecode(parts[3]);
    } else if (parts[2] === 'tracker') tab = 'roadmap';
    else if (parts[2] === 'issues') tab = 'issues';
    else if (parts[2] === 'reports' && parts[3] === 'configuration') tab = 'config-report';
    else if (parts[2] === 'sync') tab = 'sync';
    else if (parts[2] === 'assignment') tab = 'assignment';
    else if (parts[2] === 'administration') tab = 'administration';
  } else {
    const legacy = url.hash.slice(1).split('?')[0];
    if (legacy in SECTIONS) tab = legacy;
  }
  const stage = ['configuration','readyForDeployment','deployment'].includes(url.searchParams.get('stage')) ? url.searchParams.get('stage') : 'configuration';
  return { projectId, tab, systemId, profileId:url.searchParams.get('profile')||null, deviceId:url.searchParams.get('device')||null, stage, week:url.searchParams.get('week') };
}
export function sectionPath(projectId, tab, week = null) {
  const suffix = SECTIONS[tab] || SECTIONS.overview;
  const url = `/projects/${encodeURIComponent(projectId)}/${suffix}`;
  return tab === 'roadmap' && week ? `${url}?week=${encodeURIComponent(week)}` : url;
}
export function guidePath(projectId, systemId, {profileId,deviceId,stage} = {}) {
  const path = `/projects/${encodeURIComponent(projectId)}/systems/${encodeURIComponent(systemId)}/guide`;
  const params = new URLSearchParams();
  if (profileId) params.set('profile',profileId);
  if (deviceId) params.set('device',deviceId);
  if (stage && stage !== 'configuration') params.set('stage',stage);
  return path+(params.size?'?'+params:'');
}
/** Index relative to a Monday-anchored project. Supports all real ISO years. */
export function weekIndexFromIso(start,week) {
  const projectIndex=projectWeekParam(start,week);
  if(projectIndex!==null)return projectIndex;
  const match=/^(\d{4})-W(\d{2})$/.exec(week||'');
  if(!match)return null;
  const year=Number(match[1]),n=Number(match[2]);
  if(n<1||n>53)return null;
  const jan4=new Date(Date.UTC(year,0,4,12));
  jan4.setUTCDate(jan4.getUTCDate()-((jan4.getUTCDay()+6)%7)+(n-1)*7);
  const thursday=new Date(jan4);thursday.setUTCDate(thursday.getUTCDate()+3);
  if(thursday.getUTCFullYear()!==year)return null;
  const monday=jan4.toISOString().slice(0,10);
  let weekIndex=weekIndexFromDate(start,monday);
  // For old bookmarked links, a calendar week beginning just before the project
  // start still intersects project Week 1.
  const sunday=new Date(jan4);sunday.setUTCDate(sunday.getUTCDate()+6);
  if(weekIndex===-1&&sunday.toISOString().slice(0,10)>=start)weekIndex=0;
  // Legacy ISO deep links point at the Monday of their ISO week. Map that Monday
  // to the project week containing it, without reintroducing calendar-week labels.
  return weekIndex!==null&&weekIndex>=0&&weekIndex<520?weekIndex:null;
}
