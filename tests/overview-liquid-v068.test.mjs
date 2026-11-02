import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-overview-v068.css',import.meta.url),'utf8');
const section=ui.split('<div className="nb-overview-kpi-grid">')[1].split('<div className="nb-overview-layout')[0];
test('release v0.6.68 applies only after previous KPI stylesheet',()=>{
 assert.ok(app.includes("import './nbdt-overview-v068.css';"));
 assert.ok(app.indexOf('v067.css')<app.indexOf('v068.css'));
 assert.ok(css.includes('.nb-overview-premium .nb66-liquid-ring'));
});
test('secondary percentage arc matches primary percentage without altering counted values',()=>{
 assert.match(section,/const innerCircumference=2\*Math\.PI\*41\.5/);
 assert.match(section,/className="nb68-secondary-arc"/);
 assert.match(section,/percent\/100\*innerCircumference/);
 assert.match(section,/percent\/100\*circumference/);
 assert.match(section,/stroke=\{item\.colors\.light\}/);
});
test('glass rim, optical reflection and two water contours are clipped within sphere',()=>{
 for(const name of ['nb68-liquid-refraction','nb68-liquid-undertow','nb68-glass-reflection','nb68-glass-rim'])assert.ok(section.includes(name),name);
 for(const keyframe of ['nb68-refraction-flow','nb68-undertow-flow','nb68-reflection-breathe'])assert.ok(css.includes(`@keyframes ${keyframe}`));
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.nb66-liquid-chamber\s*\{[\s\S]*?inset/);
 assert.match(section,/percent===0\?'nb66-liquid-ring--empty'/);
});
