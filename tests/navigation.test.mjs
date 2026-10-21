import test from 'node:test';
import assert from 'node:assert/strict';
import {readAppRoute,guidePath,sectionPath,weekIndexFromIso} from '../src/navigation.mjs';
test('deep guide link roundtrips profile, device, stage',()=>{
 const url='https://nbdt.example'+guidePath('legend-ots','sys /2',{profileId:'ios',deviceId:'asset-a',stage:'deployment'});
 assert.deepEqual(readAppRoute(url),{projectId:'legend-ots',tab:'systems',systemId:'sys /2',profileId:'ios',deviceId:'asset-a',stage:'deployment',week:null});
});
test('unknown stage safely defaults to base',()=>assert.equal(readAppRoute('https://nbdt.example/projects/p/systems/s/guide?stage=bogus').stage,'configuration'));
test('overview and tracker paths resolve',()=>{
 assert.equal(readAppRoute('https://nbdt.example'+sectionPath('p','roadmap','2026-W43')).tab,'roadmap');
 assert.equal(readAppRoute('https://nbdt.example/#issues').tab,'issues');
});
test('ISO 2026 W53 crosses year; invalid W53 rejected',()=>{
 assert.equal(weekIndexFromIso('2026-01-05','2026-W53'),51);
 assert.equal(weekIndexFromIso('2026-01-05','2027-W01'),52);
 assert.equal(weekIndexFromIso('2026-01-05','2027-W53'),null);
});
test('ISO week index returns null on invalid and negative range',()=>{
 assert.equal(weekIndexFromIso('2026-01-05','2026-W00'),null);
 assert.equal(weekIndexFromIso('2026-01-05','2025-W52'),null);
});
