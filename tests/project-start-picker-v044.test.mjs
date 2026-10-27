import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CALENDAR_MONTHS,calendarDays,calendarMoveMonth,calendarMoveYear,calendarMonthFromISO,calendarDisplayDate,calendarYearOptions} from '../src/project-calendar.mjs';
const picker=readFileSync(new URL('../src/project-start-picker.tsx',import.meta.url),'utf8');
const tracker=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const index=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../weekly-tracker-project-calendar-v044.css',import.meta.url),'utf8');

test('month navigation handles December / January boundaries without committing data',()=>{
 const nov={year:2026,month:10};
 assert.deepEqual(calendarMoveMonth(nov,2),{year:2027,month:0});
 assert.deepEqual(calendarMoveMonth({year:2026,month:0},-1),{year:2025,month:11});
 assert.deepEqual(calendarMoveYear({year:2026,month:1},-1),{year:2025,month:1});
 assert.deepEqual(calendarMonthFromISO('2026-09-28'),{year:2026,month:8});
 assert.equal(calendarDisplayDate('2026-09-28'),'09/28/2026');
 assert.equal(CALENDAR_MONTHS.length,12);
 assert.ok(calendarYearOptions(2026).includes(2026));
});
test('calendar dates start on Monday and have stable seven-column rows, including leap years',()=>{
 const sep=calendarDays({year:2026,month:8});
 assert.equal(sep.length,42);
 assert.equal(sep[0].iso,'2026-08-31'); // Sep 1 is Tuesday.
 assert.ok(sep.some(d=>d.iso==='2026-09-28'&&d.inside));
 assert.equal(new Set(sep.map(d=>d.iso)).size,42);
 assert.ok(calendarDays({year:2028,month:1}).some(d=>d.iso==='2028-02-29'&&d.inside));
 const jan=calendarDays({year:2027,month:0});
 assert.equal(jan[0].iso,'2026-12-28');
});
test('date picker has independent draft, easy month/year navigation, Today and one explicit Apply',()=>{
 for (const label of ['Previous year','Previous month','Next year','Next month','Calendar month','Calendar year','Today','Saved date','Apply date','Cancel'])assert.ok(picker.includes(label),label);
 assert.match(picker,/const \[draft,setDraft\]=useState\(value\)/);
 assert.match(picker,/calendarMoveMonth\(v,[+-]?1\)/);
 assert.match(picker,/calendarMoveYear\(v,[+-]?1\)/);
 assert.match(picker,/await onConfirm\(draft\)/);
 assert.equal((picker.match(/onConfirm\(/g)||[]).length,1,'only one path can persist project start date');
 assert.ok(!picker.includes('window.confirm'));
 assert.ok(!picker.includes('type="date"'));
 assert.match(picker,/aria-pressed=\{draft===day.iso\}/);
 assert.match(picker,/onClick=\{\(\)=>\{pick\(day.iso\)/);
 assert.match(picker,/role="dialog"/);
});
test('tracker keeps change logic but no longer confirms or persists on calendar navigation',()=>{
 const snippet=tracker.slice(tracker.indexOf(' const updateStart='),tracker.indexOf(' const tasks=project.tasks.filter'));
 assert.ok(snippet.includes('await onProjectStartChange(value)'));
 assert.ok(!snippet.includes('window.confirm'));
 assert.ok(tracker.includes('<ProjectStartPicker'));
 assert.ok(!tracker.includes('onChange={e=>{void updateStart(e.target.value);}}'));
 assert.ok(index.includes("import './weekly-tracker-project-calendar-v044.css'"));
 assert.match(css,/\.nb44-calendar-panel/);
 assert.match(css,/z-index:9999/);
});
