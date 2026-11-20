import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {isTrackerNotOnSite} from '../src/tracker-team.mjs';
import {quickDeleteTask,quickMoveTaskToNextWeek} from '../src/tracker-actions.mjs';

const css=readFileSync(new URL('../nbdt-tracker-v090.css',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const rule=css.slice(css.lastIndexOf('/* v0.6.92'));

const sample=()=>({
 members:[{id:'ronny',name:'RONNY TAPERA'},{id:'sergiu',name:'SERGIU BURU'}],
 trackerMembers:[{id:'ronny',name:'RONNY TAPERA'},{id:'sergiu',name:'SERGIU BURU'}],
 trackerNotOnSite:{'ronny:0':true,'sergiu:0':true},
 tasks:[{id:'digital',label:'Digital Signage',memberId:'ronny',startWeek:0,duration:1,status:'Completed',helperIds:[],checklist:[]},
        {id:'other',label:'Room Automation',memberId:'ronny',startWeek:2,duration:1,status:'Planned'}]
});

test('Moving the last week task leaves the Not on site flag even when another week has assignments',()=>{
 const p=sample();
 const moved=quickMoveTaskToNextWeek(p,'digital',0,'digital-next','digital-cont');
 assert.equal(isTrackerNotOnSite(moved,'ronny',0),true);
 assert.equal(moved.tasks.filter(t=>t.memberId==='ronny'&&t.startWeek===0).length,0);
 assert.ok(moved.tasks.some(t=>t.memberId==='ronny'&&t.startWeek===2),'employee has tasks in another week');
 assert.equal(moved.trackerNotOnSite,p.trackerNotOnSite);
});

test('Deleting the last task preserves weekly absence for an entirely empty employee row',()=>{
 const p=sample();
 const withoutFirst=quickDeleteTask(p,'digital');
 const fullyEmpty=quickDeleteTask(withoutFirst,'other');
 assert.equal(isTrackerNotOnSite(fullyEmpty,'ronny',0),true);
 assert.equal(fullyEmpty.tasks.length,0);
 assert.equal(isTrackerNotOnSite(fullyEmpty,'sergiu',0),true);
 assert.equal(isTrackerNotOnSite(fullyEmpty,'ronny',1),false);
});

test('Rendered off-site class and message are independent from number of tasks',()=>{
 assert.match(ui,/const notOnSite=isTrackerNotOnSite\(project,m\.id,w\)/);
 assert.match(ui,/\(notOnSite\?' nb90-offsite-week':''\)/);
 assert.match(ui,/\{notOnSite\?<div className="nb90-not-on-site-content">/);
});

test('Gray off-site paint wins over important white, odd/even, selected and hover rules for either row type',()=>{
 assert.ok(rule.startsWith('/* v0.6.92'));
 assert.match(rule,/tr:is\(\.nb-has-assignments,\.nb-no-assignments\)/);
 assert.match(rule,/td\.nb90-offsite-week:nth-child\(n\) button\.nb-week-cell/);
 assert.match(rule,/button\.nb-week-cell\.selected/);
 assert.match(rule,/button\.nb-week-cell:hover/);
 assert.match(rule,/background:#edf0f4!important/);
 assert.match(rule,/border:1px dashed #c0cbd8!important/);
 assert.match(rule,/box-shadow:none!important/);
 assert.match(rule,/background:#e5eaf0!important/);
 assert.match(rule,/td\.nb90-offsite-week\.nb-current-week-cell/);
});
