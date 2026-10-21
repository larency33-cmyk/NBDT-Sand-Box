/** Calendar model: the project's actual start date is retained; visible planning weeks use ISO Mondays. */
export const DAY_MS=86400000;
export function validDate(value){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(String(value||'')))return false;
 const [y,m,d]=value.split('-').map(Number);
 const dt=new Date(Date.UTC(y,m-1,d,12));
 return dt.getUTCFullYear()===y&&dt.getUTCMonth()===m-1&&dt.getUTCDate()===d;
}
export function mondayOf(dateString){
 if(!validDate(dateString))throw Error('Invalid project start date');
 const [y,m,d]=dateString.split('-').map(Number);
 const dt=new Date(Date.UTC(y,m-1,d,12));
 dt.setUTCDate(dt.getUTCDate()-(dt.getUTCDay()+6)%7);
 return dt;
}
export function isoDate(date){return `${date.getUTCFullYear()}-${String(date.getUTCMonth()+1).padStart(2,'0')}-${String(date.getUTCDate()).padStart(2,'0')}`;}
export function projectWeekDate(start,index){const d=mondayOf(start);d.setUTCDate(d.getUTCDate()+index*7);return isoDate(d);}
export function shiftISODate(date,days){if(!validDate(date))return date;const [y,m,d]=date.split('-').map(Number);const value=new Date(Date.UTC(y,m-1,d,12));value.setUTCDate(value.getUTCDate()+days);return isoDate(value);}
export function weekIndexFromDate(start,date){if(!validDate(date))return null;const a=mondayOf(start),b=mondayOf(date);return Math.round((b-a)/(7*DAY_MS));}
export function todayInTimezone(timezone='Europe/Paris', now=new Date()){
 try{const parts=new Intl.DateTimeFormat('en-GB',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now);
 const get=t=>parts.find(p=>p.type===t)?.value;
 return `${get('year')}-${get('month')}-${get('day')}`;
 }catch{return now.toISOString().slice(0,10);}
}
export function currentWeekIndex(start,timezone='Europe/Paris',now=new Date()){return weekIndexFromDate(start,todayInTimezone(timezone,now));}
export function projectDateRange(start,index){const a=projectWeekDate(start,index),b=shiftISODate(a,6);return {from:a,to:b};}
