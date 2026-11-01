import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const css=readFileSync(new URL('../nbdt-overview-v065.css',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const dashboard=readFileSync(new URL('../src/overview-v061.tsx',import.meta.url),'utf8');

test('v0.6.65 style imports last and targets Overview alone',()=>{
 const existing=app.indexOf("import './nbdt-overview-kpi-v063.css';");
 const newLayer=app.indexOf("import './nbdt-overview-v065.css';");
 assert.ok(existing>=0&&newLayer>existing,'Versioned override must load after existing KPI styles');
 assert.doesNotMatch(css,/\.nb-sidebar|\.nb-side-menu|\.nb61-overview\s*\+|:root\s*\{/);
 for(const block of css.split('}')){
  const start=block.lastIndexOf('{');if(start<0)continue;
  const selector=block.slice(0,start).trim().split('\n').at(-1).trim();
  if(!selector||selector.startsWith('@')||selector.includes('/*'))continue;
  assert.ok(block.includes('.nb61-overview'),`Unexpected global selector ${selector}`);
 }
});

test('v0.6.65 KPI design keeps one data-derived semicircle and slow moving wave',()=>{
 assert.match(css,/backdrop-filter:\s*blur\(22px\)/);
 assert.match(css,/\.nb61-overview \.nb61-kpis \.nb61-kpi::before/);
 assert.match(css,/\.nb61-overview \.nb61-kpis \.nb61-kpi::after/);
 assert.match(css,/prefers-reduced-motion:\s*reduce/);
 const kpis=dashboard.slice(dashboard.indexOf('className="nb61-kpis"'),dashboard.indexOf('className="nb61-grid-top"'));
 assert.match(kpis,/<SemiGauge value=\{k.percent\}/);
 assert.doesNotMatch(kpis,/<StatBar/);
 assert.match(kpis,/formatter\(k.value\)/);
});

test('v0.6.65 lower panels are three columns on large displays and reflow at smaller widths',()=>{
 assert.match(css,/grid-template-areas:\s*"readiness recent coverage"/);
 assert.match(css,/@media \(max-width: 1599px\)/);
 assert.match(css,/@media \(max-width: 1170px\)/);
 assert.match(css,/@media \(max-width: 760px\)/);
 assert.match(css,/grid-template-areas: "readiness" "recent" "coverage"/);
 assert.match(css,/\.nb61-readiness-table \{ min-width: 480px; \}/);
});

test('Overview does not reintroduce demo tools or fake stats; existing linked data remains',()=>{
 const overviewRender=app.split("activeTab==='overview' &&").at(-1).split('\n')[0];
 assert.ok(overviewRender.includes('OverviewDashboard'));
 assert.ok(!overviewRender.includes('DataTools'));
 assert.match(dashboard,/buildOverviewData\(project,roster,clock\)/);
 assert.match(dashboard,/data\.readiness\.slice\(0,5\)/);
 assert.match(dashboard,/data\.coverage\.(unique|shared|none)/);
 assert.match(dashboard,/onNavigate\('assignment'\)/);
 assert.match(dashboard,/onOpenIssue\(item.issueId\)/);
});
