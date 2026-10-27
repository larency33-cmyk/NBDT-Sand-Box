/** Date-only, timezone-safe helpers for the editable project start calendar.
 * Calendar navigation is presentation-only: this module never changes projects. */
export const CALENDAR_MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];
export const CALENDAR_WEEKDAYS=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const pad=(v)=>String(v).padStart(2,'0');
export function calendarMonthFromISO(iso){
 const match=/^(\d{4})-(\d{2})-\d{2}$/.exec(String(iso||''));
 if(!match)return {year:2026,month:8};
 return {year:Number(match[1]),month:Number(match[2])-1};
}
export function calendarMoveMonth(view,delta){
 const index=view.year*12+view.month+delta;
 const year=Math.floor(index/12),month=((index%12)+12)%12;
 if(year<1000||year>9999)return {...view};
 return {year,month};
}
export function calendarMoveYear(view,delta){
 const year=view.year+delta;
 return year>=1000&&year<=9999?{...view,year}:{...view};
}
export function calendarYearOptions(year){
 const start=Math.max(1000,year-30),end=Math.min(9999,year+30);
 return Array.from({length:end-start+1},(_,i)=>start+i);
}
export function calendarDays(view){
 const first=new Date(Date.UTC(2000,view.month,1,12));
 first.setUTCFullYear(view.year);
 const offset=(first.getUTCDay()+6)%7; // Monday starts the week.
 first.setUTCDate(first.getUTCDate()-offset);
 return Array.from({length:42},(_,index)=>{
  const day=new Date(first);
  day.setUTCDate(first.getUTCDate()+index);
  const year=day.getUTCFullYear(),month=day.getUTCMonth(),date=day.getUTCDate();
  return {iso:`${pad(year).padStart(4,'0')}-${pad(month+1)}-${pad(date)}`,date,inside:year===view.year&&month===view.month};
 });
}
export function calendarDisplayDate(iso){
 const match=/^(\d{4})-(\d{2})-(\d{2})$/.exec(String(iso||''));
 return match?`${match[2]}/${match[3]}/${match[1]}`:String(iso||'');
}
