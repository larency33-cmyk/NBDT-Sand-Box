import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {prioritizeRegistrySearchResults} from '../src/registry-search-order.mjs';

function names(items){ return items.map(system=>system.name); }
const source=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('systems with matching NAMES always precede description-only matches',()=>{
  const filtered=[
    {name:'Stateroom App',description:'Supports mobile tablets'},
    {name:'Mobile Telehealth',description:'Medical services onboard'},
    {name:'Crew Debit Kiosk',description:'Mobile point of sale'},
    {name:'POS – Mobility',description:'POS mobile devices'},
    {name:'Device Operations',description:'Mobile applications'}
  ];
  const ordered=prioritizeRegistrySearchResults(filtered,'mob');
  assert.deepEqual(names(ordered),['Mobile Telehealth','POS – Mobility','Stateroom App','Crew Debit Kiosk','Device Operations']);
  assert.deepEqual(names(filtered),['Stateroom App','Mobile Telehealth','Crew Debit Kiosk','POS – Mobility','Device Operations']);
});

test('search priority is case insensitive and trims outer whitespace',()=>{
  const filtered=[{name:'A',description:'POS'},{name:'PoS Terminal'},{name:'POS – Mobility'},{name:'B',os:'POS'}];
  assert.deepEqual(names(prioritizeRegistrySearchResults(filtered,'  pOs  ')),['PoS Terminal','POS – Mobility','A','B']);
});

test('substring match anywhere in the name outranks earlier description matches',()=>{
  const filtered=[{name:'Alpha',description:'health'},{name:'Telehealth Mobile'},{name:'Health Diagnostics'},{name:'Beta',description:'health'}];
  assert.deepEqual(names(prioritizeRegistrySearchResults(filtered,'HEALTH')),['Telehealth Mobile','Health Diagnostics','Alpha','Beta']);
});

test('unchanged search keeps original order without filtering',()=>{
  const filtered=[{name:'B'}, {name:'A'}, {name:'C'}];
  assert.strictEqual(prioritizeRegistrySearchResults(filtered,'   '),filtered);
  assert.deepEqual(names(prioritizeRegistrySearchResults(filtered,'zzzz')),names(filtered));
});

test('only previously filtered systems can appear in the results',()=>{
  const filtered=[{name:'A',description:'crew'}, {name:'Crew Debit Kiosk',owner:'Rob'}];
  const ordered=prioritizeRegistrySearchResults(filtered,'crew');
  assert.equal(ordered.length,2);
  assert.ok(ordered.every(item=>filtered.includes(item)));
});

test('System Registry applies priority after all search and owner/status/device/platform/connection filters',()=>{
  assert.match(source,/const matchesAllFilters = project\.systems\.filter\(s => \{/);
  assert.match(source,/matchesSearch && deviceTypeMatch && osMatch && netMatch && assigneeMatch && progressMatch/);
  assert.match(source,/return prioritizeRegistrySearchResults\(matchesAllFilters, systemSearch\)/);
  assert.match(source,/filteredSystems\.map\(sys=>/);
});
