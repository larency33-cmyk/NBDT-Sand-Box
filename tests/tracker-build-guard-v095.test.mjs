import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const src=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const guard=readFileSync(new URL('../scripts/check-symbols.cjs',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('Reassign modal and preserved historical-task dialog use independent React error states',()=>{
 assert.equal((src.match(/const \[reassignError,setReassignError\]=useState\(''\)/g)||[]).length,1);
 assert.equal((src.match(/const \[historicalReassignError,setHistoricalReassignError\]=useState\(''\)/g)||[]).length,1);
 assert.match(src,/className="nb94-transfer-error">\{reassignError\}/);
 assert.match(src,/className="nb93-unlinked-error">\{historicalReassignError\}/);
});

test('Historical task recovery uses only its own error setter',()=>{
 const start=src.indexOf('const reassignHistoricalTask=async');
 const end=src.indexOf('const ',start+6);
 assert.ok(start>=0);
 const fn=src.slice(start,end>start?end:start+520);
 assert.match(fn,/setHistoricalReassignError\(''\)/);
 assert.match(fn,/setHistoricalReassignError\(error\?\.message\|\|/);
 assert.doesNotMatch(fn,/[^A-Za-z]setReassignError\(/);
 assert.match(src,/onClick=\{\(\)=>\{setHistoricalReassignError\(''\);setShowUnlinkedTasks\(true\);\}\}/);
});

test('New task Reassign action, destination form and saving callback remain connected',()=>{
 assert.match(src,/Reassign<\/button>/);
 assert.match(src,/onOpenReassign\(task,sourceWeek\)/);
 assert.match(src,/reassignTask&&createPortal/);
 assert.match(src,/await onQuickTaskTransfer\(reassignTask\.id,reassignMember,reassignWeek\)/);
 assert.match(src,/project\.members\.map\(\(member:any\)=><option/);
 assert.match(app,/onQuickTaskTransfer=\{async\(taskId:string,memberId:string,startWeek:number\)=>/);
});

test('Build preflight rejects duplicate variable and identifier declarations',()=>{
 assert.match(guard,/const fatalCodes = new Set\(\[[^\]]*2451[^\]]*2300\]\)/);
 assert.match(guard,/program\.getSemanticDiagnostics\(\)\.filter/);
 assert.match(guard,/duplicate declarations, missing symbols/);
});
