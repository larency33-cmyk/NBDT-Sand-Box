import test from 'node:test';import assert from 'node:assert/strict';
import {profiles,profileView,mergeProfile,migrateRun,validateTask,effectiveStatus,isoWeek,projectToday,csv,validateImport} from '../src/extended-model.mjs';
import {counts,STAGES,setCheck,setResult,canAccept,acceptStage,stageComplete} from '../src/model.mjs';
const system=()=>({id:'s',name:'Test system',os:'Windows',devices:[{id:'a',identity:'TEST-A',profileId:'s'},{id:'b',identity:'TEST-B',profileId:'mobile'}],deviceRuns:[],endpointProfiles:[{id:'mobile',name:'Tablet',os:'iOS'}]});
const run=()=>({id:'r',deviceId:'a',profileId:'s',guideVersion:1,snapshot:{version:1,stages:Object.fromEntries(STAGES.map((s,i)=>[s,[{id:String(i),label:'Test step',required:true}]]))},checks:{},accepted:{}});
const task=()=>({id:'t',label:'Test task',memberId:'a',helperIds:['b'],startWeek:0,duration:1,status:'Planned'});const members=[{id:'a'},{id:'b'}];
test('separate endpoint profiles are discoverable',()=>assert.equal(profiles(system()).length,2));
test('profile view never leaks another profile inventory',()=>assert.deepEqual(profileView(system(),'mobile').devices.map(d=>d.id),['b']));
test('unknown profile is rejected',()=>assert.throws(()=>profileView(system(),'missing')));
test('merging secondary profile preserves primary inventory and platform',()=>{const s=system(),v=profileView(s,'mobile');v.deviceType='Test tablet';const next=mergeProfile(s,v);assert.equal(next.os,'Windows');assert.equal(next.devices.length,2);assert.equal(next.endpointProfiles[0].deviceType,'Test tablet');});
test('migration needs a reason',()=>assert.throws(()=>migrateRun(run(),{version:2},'')));
test('migration resets acceptance and preserves source link',()=>{const r=run();r.checks['0']=true;r.accepted.configuration='time';const next=migrateRun(r,{version:2,stages:{}},'Reviewed update');assert.deepEqual(next.checks,{});assert.deepEqual(next.accepted,{});assert.equal(next.migratedFrom,'r');assert.equal(r.checks['0'],true);});
test('deployed run cannot migrate silently',()=>{const r=run();r.accepted.deployment='time';assert.throws(()=>migrateRun(r,{version:2},'Reason'));});
test('valid Owner and Helper assignments pass',()=>assert.deepEqual(validateTask(task(),members),[]));
test('Owner cannot be duplicated as Helper',()=>assert.ok(validateTask({...task(),helperIds:['a']},members).length));
test('unknown Helper rejected',()=>assert.ok(validateTask({...task(),helperIds:['unknown']},members).length));
test('task duration cannot exceed project',()=>assert.ok(validateTask({...task(),startWeek:519,duration:2},members).length));
test('open linked issue drives effective blocker status',()=>assert.equal(effectiveStatus({...task(),blockerIds:['i']},[{id:'i',status:'Open'}]),'Blocked'));
test('resolved issue does not block',()=>assert.equal(effectiveStatus({...task(),blockerIds:['i']},[{id:'i',status:'Resolved'}]),'Planned'));
test('ISO week year is correct across year boundary',()=>assert.equal(isoWeek('2027-01-01'),'2026-W53'));
test('project date uses configured timezone',()=>assert.equal(projectToday('Europe/Paris',new Date('2026-10-21T23:30:00Z')),'2026-10-22'));
test('CSV escapes spreadsheet formula prefixes',()=>assert.equal(csv([['=1+1','a"b']]),'"\'=1+1","a""b"'));
test('import validates duplicate device identities',()=>{const s=system();s.devices[1].identity='test-a';assert.ok(validateImport({}, {members,tasks:[task()],systems:[s]}).length);});
test('N/A needs explicit permission',()=>assert.throws(()=>setResult(run(),'configuration','0',{state:'not_applicable',reason:'No hardware'})));
test('N/A needs a reason',()=>{const r=run();r.snapshot.stages.configuration[0].allowNA=true;assert.throws(()=>setResult(r,'configuration','0',{state:'not_applicable',reason:''}));});
test('allowed N/A counts only with reason',()=>{const r=run();r.snapshot.stages.configuration[0].allowNA=true;const next=setResult(r,'configuration','0',{state:'not_applicable',reason:'Not installed'});assert.ok(stageComplete(next,'configuration'));});
test('evidence-required item blocks acceptance until recorded',()=>{let r=run();r.snapshot.stages.configuration[0].evidenceRequired=true;r=setCheck(r,'configuration','0',true);assert.equal(canAccept(r,'configuration'),false);r=setResult(r,'configuration','0',{state:'completed',evidenceReference:'Test evidence'});assert.ok(canAccept(r,'configuration'));});
test('stale evidence is not completion',()=>{let r=run();r.checks['0']=true;r.results={'0':{state:'stale'}};assert.equal(stageComplete(r,'configuration'),false);});
test('system counters aggregate profiles without double counting devices',()=>{const s=system(),r=run();s.devices.push({...s.devices[0]});s.deviceRuns=[acceptStage(setCheck(r,'configuration','0',true),'configuration')];assert.deepEqual(counts(s),{total:2,base:1,ready:0,deployed:0});});
test('archived devices excluded from scope',()=>{const s=system();s.devices[0].archivedAt='time';assert.equal(counts(s).total,1);});

test('primary profile merge commits its runs without dropping other devices',()=>{const s=system(),v=profileView(s,'s');v.deviceRuns=[run()];const next=mergeProfile(s,v);assert.equal(next.deviceRuns.length,1);assert.equal(next.devices.length,2);assert.equal(next.devices.find(d=>d.id==='b').profileId,'mobile');});

test('secondary profile does not inherit primary published guide',()=>{const s=system();s.publishedGuide={version:9,platform:'Windows'};assert.equal(profileView(s,'mobile').publishedGuide,null);});
test('secondary profile does not inherit primary hardware',()=>{const s=system();s.deviceType='Test PC';assert.equal(profileView(s,'mobile').deviceType,'');});

test('iPadOS guide cannot publish Windows firmware or Domain Join steps', async()=>{
 const {validateGuide,newGuide}=await import('../src/model.mjs');
 const draft=newGuide();for(const k of STAGES)draft.stages[k]=[{id:k,label:'Review device readiness',required:true}];
 assert.deepEqual(validateGuide({os:'iPadOS'},draft),[]);
 draft.stages.configuration[0].label='Validate TPM and Domain Join';
 assert.match(validateGuide({os:'iPadOS'},draft).join(' '),/Incompatible platform/);
});
test('import rejects two active runs for the same device and profile',()=>{
 const s=system();const r=run();s.deviceRuns=[r,{...r,id:'r2'}];
 assert.match(validateImport({}, {members,tasks:[task()],systems:[s]}).join(' '),/Multiple active runs/);
});
test('import rejects runs pointing to other systems devices',()=>{
 const s=system();const other={...system(),id:'other',devices:[{id:'c',identity:'NEW-C',profileId:'other'}],deviceRuns:[]};
 s.deviceRuns=[{...run(),id:'bad',deviceId:'c'}];
 assert.match(validateImport({}, {members,tasks:[task()],systems:[s,other]}).join(' '),/outside its system/);
});
test('task can schedule beyond the former 28-week limit',()=>{
 assert.deepEqual(validateTask({...task(),startWeek:44,duration:2},members),[]);
});
