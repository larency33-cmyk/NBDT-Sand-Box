import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-overview-v124.css',import.meta.url),'utf8');
const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const current=page.slice(page.indexOf('export function Overview('));

test('v124 redesign is scoped to actual Overview and loads after the prior lessons panel',()=>{
 assert.match(entry,/nbdt-overview-lessons-v123\.css';\s*import '\.\/nbdt-overview-v124\.css'/);
 assert.match(current,/nb-overview nb-overview-premium nb124-overview/);
 assert.match(current,/Project overview/);
 assert.match(current,/Deployment snapshot/);
 assert.doesNotMatch(css,/(^|\n)\s*body\s*\{/);
});
test('the four real KPI calculations and existing five-shade liquid animation remain intact',()=>{
 for(const stage of ['Base Configuration','Ready for Deployment','Deployed','Cyber Approved'])assert.ok(current.includes(stage));
 for(const animationClass of ['nb70-water-wave--shade1','nb70-water-wave--shade5','nb69-water-wave--front','nb70-water-bubble','nb70-liquid-ring'])assert.ok(current.includes(animationClass));
 assert.match(current,/reportSummary\.base\/reportSummary\.total/);
 assert.match(current,/reportSummary\.ready\/reportSummary\.total/);
 assert.match(current,/reportSummary\.deployed\/reportSummary\.total/);
 assert.match(current,/reportSummary\.cyberApproved\/reportSummary\.cyberApplicable/);
 assert.match(css,/\.nb69-progress-arc/);
 assert.match(css,/v0\.6\.70\/71/);
});
test('attention panels retain severity order, actual remaining counts and working navigation',()=>{
 assert.match(current,/sort\(\(a:any,b:any\)/);
 assert.match(current,/nb124-issues-column/);
 assert.match(current,/nb124-config-column/);
 assert.match(current,/stage\.pending/);
 assert.match(current,/stage\.percent/);
 assert.match(current,/onNavigate\('issues'\)/);
 assert.match(current,/onNavigate\('config-report'\)/);
 assert.match(current,/onOpenSystem\?onOpenSystem\(sys\.id\)/);
});
test('weekly task completion heatmap depends on actual week task counts, not screenshot numbers',()=>{
 assert.match(current,/const weekTotal=weekStats\.planned\+weekStats\.active\+weekStats\.blocked\+weekStats\.done/);
 assert.match(current,/weekTiles\.map/);
 assert.match(current,/currentWeekTasks=tasks\.filter/);
 assert.match(current,/No milestones this or next week/);
 assert.match(current,/onNavigate\('roadmap'\)/);
 assert.doesNotMatch(current,/>26 \/ 27</);
});
test('readiness heatmap uses actual report counts and handles missing data',()=>{
 assert.match(current,/const heatCell=\(completed:number,total:number/);
 assert.match(current,/if\(!total\)/);
 assert.match(current,/counts\(sys\)/);
 assert.match(current,/heatCell\(c\.base,c\.total,'base'\)/);
 assert.match(current,/heatCell\(c\.deployed,c\.total,'deployed'\)/);
});
test('lesson empty and populated states both use live per-project review counts',()=>{
 assert.match(current,/overviewLessonsStats\(project\)/);
 assert.match(current,/lessonsOverview\.total===0/);
 assert.match(current,/lessonsOverview\.withoutLessons/);
 assert.match(current,/nb124-lessons-action-list/);
 assert.match(current,/onOpenSystem\?onOpenSystem\(row\.id\)/);
});
