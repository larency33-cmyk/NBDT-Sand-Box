import React from 'react';
/** Shared device glyph: System Registry and Guide must show the same selected type. */
export function DeviceTypeIcon({type,className=''}:{type:string,className?:string}){
  switch(type) {
    case 'Phone':
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2.5" width="10" height="19" rx="2.4"/><line x1="10" y1="5.5" x2="14" y2="5.5"/><circle cx="12" cy="18.2" r="0.9"/></svg>;
    case 'Tablet':
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.3" y="5.2" width="17.4" height="13.6" rx="2.1"/><circle cx="18.2" cy="12" r="0.55"/></svg>;
    case 'PC':
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="10.5" rx="1.6"/><line x1="12" y1="15.5" x2="12" y2="19"/><line x1="8.2" y1="19" x2="15.8" y2="19"/></svg>;
    case 'Laptop':
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="6" width="14" height="8.8" rx="1.2"/><path d="M3.5 17.2h17l-1.15 2.3H4.65l-1.15-2.3Z"/></svg>;
    case 'Kiosk':
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="8" y="3.5" width="8" height="10" rx="1.2"/><line x1="12" y1="13.5" x2="12" y2="18"/><path d="M8.3 20h7.4"/></svg>;
    case 'POS':
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3.2" y="6.2" width="12.5" height="8.5" rx="1.2"/><line x1="8.8" y1="14.7" x2="8.8" y2="17.2"/><line x1="5.8" y1="17.2" x2="11.8" y2="17.2"/><rect x="17.2" y="8.2" width="3.9" height="8.1" rx="0.8"/></svg>;
    case 'App only':
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="3"/><rect x="7.2" y="7.2" width="3.4" height="3.4" rx="0.45"/><rect x="13.4" y="7.2" width="3.4" height="3.4" rx="0.45"/><rect x="7.2" y="13.4" width="3.4" height="3.4" rx="0.45"/><rect x="13.4" y="13.4" width="3.4" height="3.4" rx="0.45"/></svg>;
    default:
      return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="10.5" rx="1.6"/><line x1="12" y1="15.5" x2="12" y2="19"/><line x1="8.2" y1="19" x2="15.8" y2="19"/></svg>;
  }
}
