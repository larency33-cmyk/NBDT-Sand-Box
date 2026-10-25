/** Reference Configuration Report sample captured from the approved mockup.
 * Aggregated sample counts are NOT registered or verified devices.
 * The 68 systems absent from the screenshot are intentionally not invented.
 */
export const REFERENCE_REPORT_VERSION = 1;
export const REFERENCE_SYSTEMS = [
 {id:'reference-pos-mobility',name:'POS – Mobility',deviceType:'Zebra TC22 WLAN Android',deviceCategory:'Tablet',os:'Android',venue:'MOB',total:194,base:187,ready:194,deployed:80,aw:'Yes',cyberStatus:'Review',owner:'Apple'},
 {id:'reference-point-of-sale',name:'Point of Sale',deviceType:'Aures NINO III Elkhart',deviceCategory:'Kiosk',os:'Windows',venue:'POS',total:231,base:231,ready:13,deployed:0,aw:'No',cyberStatus:'Approved',owner:'Apple'},
 {id:'reference-qcontrol',name:'QControl',deviceType:'Apple 11-inch iPad Air M3',deviceCategory:'Tablet',os:'iOS',venue:'QCO',total:193,base:120,ready:0,deployed:0,aw:'Pending',cyberStatus:'N/A',owner:'Daron'},
 {id:'reference-stateroom-attendant',name:'Stateroom Attendant App',deviceType:'Samsung XCover',deviceCategory:'Phone',os:'Android',venue:'SAA',total:211,base:211,ready:0,deployed:0,aw:'Yes',cyberStatus:'N/A',owner:'Elvan'},
 {id:'reference-digital-signage',name:'Digital Signage',deviceType:'Lenovo Desktop TC',deviceCategory:'PC',os:'Windows',venue:'DIG',total:162,base:162,ready:32,deployed:20,aw:'Yes',cyberStatus:'Approved',owner:'Matthew'},
 {id:'reference-emustering',name:'Emustering',deviceType:'Zebra TC22 WLAN Android',deviceCategory:'Tablet',os:'Android',venue:'EMU',total:109,base:55,ready:55,deployed:109,aw:'Yes',cyberStatus:'N/A',owner:'Junin'},
];
export const REPORT_BACKGROUND = Object.freeze({
 total:709,base:619,ready:168,deployed:0,cyberApplicable:37,cyberApproved:17,
 // Reference mock totals include 68 systems not shown; this is a non-editable
 // unlisted sample subtotal, clearly labelled illustrative in the UI.
 unlistedSystems:68,
});
export const REFERENCE_IDS = new Set(REFERENCE_SYSTEMS.map(s=>s.id));
export function referenceSystem(row,index){
 return {id:row.id,name:row.name,deviceType:row.deviceType,deviceCategory:row.deviceCategory,os:row.os,
  osVersion:'',network:'',vlan:'',serviceAccount:'',userAccount:'',logonType:'',ipScope:'',ipReservation:'',
  domainOU:'',airWatchTags:row.aw,status:'Active',assigneeId:'',reportOwnerName:row.owner,
  reportVenue:row.venue,reportAW:row.aw,reportOrder:index,
  reportMode:'aggregate-sample',reportMetrics:{total:row.total,base:row.base,ready:row.ready,deployed:row.deployed},
  cyberStatus:row.cyberStatus,documentation:'Illustrative reference figures; not verified device runs',
  devices:[],deviceRuns:[]};
}
export function seedReferenceReport(data){
 if(data.id!=='legend-ots'||data.referenceReportVersion>=REFERENCE_REPORT_VERSION)return data;
 const existing=Array.isArray(data.systems)?data.systems:[];
 const identifiers=new Set(existing.map(s=>s.id));
 const additions=REFERENCE_SYSTEMS.filter(s=>!identifiers.has(s.id)).map((s,i)=>referenceSystem(s,i));
 return {...data,referenceReportVersion:REFERENCE_REPORT_VERSION,referenceDemoTotals:true,systems:[...existing,...additions]};
}
export function validateAggregateMetrics(value){
 const total=Number(value.total);const values=['base','ready','deployed'].map(k=>Number(value[k]));
 if(!Number.isSafeInteger(total)||total<0||total>1000000)throw new Error('Quantity must be an integer from 0 to 1,000,000.');
 if(values.some(v=>!Number.isSafeInteger(v)||v<0||v>total))throw new Error('Every progress count must be between 0 and quantity.');
 return {total,base:values[0],ready:values[1],deployed:values[2]};
}
export function reportCounts(project,counts){
 const result={total:0,base:0,ready:0,deployed:0,cyberApproved:0,cyberApplicable:0};
 for(const sys of project.systems||[]){
  const c=counts(sys); for(const key of ['total','base','ready','deployed'])result[key]+=c[key]||0;
  if(sys.cyberStatus&&!['Unknown','N/A'].includes(sys.cyberStatus)){result.cyberApplicable++;if(sys.cyberStatus==='Approved')result.cyberApproved++;}
 }
 if(project.referenceDemoTotals){
  for(const key of ['total','base','ready','deployed'])result[key]+=REPORT_BACKGROUND[key];
  result.cyberApplicable+=REPORT_BACKGROUND.cyberApplicable;
  result.cyberApproved+=REPORT_BACKGROUND.cyberApproved;
 }
 return result;
}
