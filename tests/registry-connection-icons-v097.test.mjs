import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const registryStyles=readFileSync(new URL('../nbdt-registry-v096.css',import.meta.url),'utf8');

test('Connection filter presents a Wi-Fi icon for Wi-Fi and a cable icon for Wired',()=>{
 assert.match(index,/options=\{\[\{value:'WiFi',label:'Wi-Fi',icon:Wifi\},\{value:'Wired',label:'Wired',icon:Cable\}\]\}/);
 assert.match(index,/\bWifi,\s*WifiOff,/);
 assert.match(index,/\bCable,/);
});

test('Custom dropdown supports icons per option, with the original icon as fallback',()=>{
 assert.match(index,/options:\{value:string,label:string,icon\?:any\}\[\]/);
 assert.match(index,/const OptionIcon=item\.icon\|\|Icon;/);
 assert.match(index,/<OptionIcon size=\{18\} aria-hidden="true"\/>/);
 assert.match(index,/className="nb-type-filter-option-icon nb-tone-blue"/);
 assert.match(index,/const TriggerIcon=selected\?\.icon\|\|Icon;/);
 assert.match(index,/<TriggerIcon size=\{20\} aria-hidden="true"\/>/);
});

test('Default All connections retains the general connection symbol',()=>{
 assert.match(index,/<RegistryDropdownFilter label="Connection" placeholder="All connections" icon=\{Network\}/);
 assert.match(index,/<span className="nb-type-filter-option-all"><Icon size=\{18\} aria-hidden="true"\/><\/span>/);
});

test('Connection values, filtering, selected checkmark and keyboard dismissal remain intact',()=>{
 assert.match(index,/value=\{activeFilters\.find\(f=>\['WiFi','Wired'\]\.includes\(f\)\)\|\|''\}/);
 assert.match(index,/onChange=\{value=>setActiveFilters\(prev=>\[\.\.\.prev\.filter\(f=>!\['WiFi','Wired'\]\.includes\(f\)\)/);
 assert.match(index,/aria-selected=\{value===item\.value\}/);
 assert.match(index,/value===item\.value&&<Check size=\{16\}/);
 assert.match(index,/if\(event\.key==='Escape'\)/);
});

test('All connection menu options retain approved Device Type styling',()=>{
 assert.match(index,/className="nb-type-filter-menu" role="listbox"/);
 assert.match(index,/className=\{'nb-type-filter-option'/);
 assert.match(registryStyles,/\.nb-registry-page \.nb96-dropdown-filter/);
});
