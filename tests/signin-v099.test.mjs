import test from 'node:test';
import assert from 'node:assert/strict';
import {WELCOME_SESSION_KEY,hasEnteredWelcome,rememberWelcomeEntry,welcomeTarget,landingNames,namesForCycle,readLandingNames,initialLandingNames} from '../src/signin-model-v099.mjs';

test('welcome dismissal never creates an administrator identity',()=>{
  const map=new Map([['nbdt_poc_session_v047','existing-admin-session']]);
  const storage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
  assert.equal(hasEnteredWelcome(storage),false);rememberWelcomeEntry(storage);
  assert.equal(hasEnteredWelcome(storage),true);
  assert.deepEqual([...map.keys()],['nbdt_poc_session_v047',WELCOME_SESSION_KEY]);
  assert.equal(map.get('nbdt_poc_session_v047'),'existing-admin-session');
  const blocked={getItem:()=>{throw Error('blocked');},setItem:()=>{throw Error('blocked');}};
  assert.equal(hasEnteredWelcome(blocked),false);assert.doesNotThrow(()=>rememberWelcomeEntry(blocked));
});
test('welcome preserves deep links and rejects external return targets',()=>{
  assert.equal(welcomeTarget('https://hub.test/projects/legend-ots/systems?device=pos#guide'),null);
  assert.equal(welcomeTarget('https://hub.test/signin?returnTo=%2Fprojects%2Flegend-ots%2Fassignment'),'/projects/legend-ots/assignment');
  for(const target of ['https://evil.test','//evil.test','/\\evil.test','/signin'])assert.equal(welcomeTarget('https://hub.test/signin?returnTo='+encodeURIComponent(target)),'/');
});
test('names follow actual Assignment people, handle aliases/removals, and never duplicate slots',()=>{
  assert.deepEqual(initialLandingNames().slice(0,3),['Homesh','Apple','Nilson']);
  const names=landingNames({people:[{id:'1',name:'APPLE ESQUIVEL'},{id:'2',name:'OTHER PERSON',loginDisplayName:'Alex'},{id:'3',name:'APPLE SECOND'},{id:'4',name:'PRIVATE PERSON',showOnSignIn:false}]});
  assert.deepEqual(names,['Apple','Alex']);
  assert.deepEqual(namesForCycle(names,0),['Apple','Alex']);
  assert.deepEqual(namesForCycle(names,1),['Alex','Apple']);
  assert.deepEqual(namesForCycle([],5),[]);
  assert.deepEqual(landingNames({people:[]}),[]);
  assert.deepEqual(landingNames(null),[]);
});
test('new browsers and missing IndexedDB safely use the initial roster',async()=>{
  assert.deepEqual(await readLandingNames(null),initialLandingNames());
  assert.deepEqual(await readLandingNames({open(){throw Error('unavailable');}}),initialLandingNames());
});
