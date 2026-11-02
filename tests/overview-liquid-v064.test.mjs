import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const overview=source.split('export function Overview(')[1];
const kpi=overview.slice(overview.indexOf('<div className="nb-overview-kpi-grid">'),overview.indexOf('<div className="nb-overview-layout'));
const css=readFileSync(new URL('../nbdt-overview-v064.css',import.meta.url),'utf8');
const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('all four indicators retain data, routing and matching Configuration Report icons',()=>{
 for(const [name,icon] of [['Base Configuration','Settings2'],['Ready for Deployment','Rocket'],['Deployed','Layers3'],['Cyber Approved','ShieldCheck']]){
  assert.ok(overview.includes(`label:'${name}'`));
  assert.ok(overview.includes(`Icon:${icon}`));
 }
 assert.match(kpi,/onClick=\{\(\)=>onNavigate\(item\.tab\)\}/);
});

test('large icons are before the percentage, not in the heading',()=>{
 assert.match(kpi,/<h3>\{item\.label\}<\/h3>/);
 assert.match(kpi,/<div className="nb64-kpi-reading">\s*<span className="nb64-kpi-symbol"[^>]*><item\.Icon size=\{37\}/);
 assert.ok(kpi.indexOf('nb64-kpi-symbol') < kpi.indexOf('<strong>{percent}%</strong>'));
 assert.match(css,/\.nb64-kpi-symbol svg\{width:37px;height:37px/);
});

test('rings are precise SVG strokes with a clipped animated liquid layer',()=>{
 assert.match(kpi,/circumference=2\*Math\.PI\*48/);
 assert.match(kpi,/strokeDasharray=\{`\$\{\(percent\/100\*circumference\)\.toFixed\(3\)\} \$\{circumference\.toFixed\(3\)\}`\}/);
 assert.match(kpi,/strokeLinecap=\{percent>=100\?'butt':'round'\}/);
 assert.match(kpi,/const percent=Math\.max\(0,Math\.min\(100,Number\(item\.value\)\|\|0\)\)/);
 assert.match(kpi,/<clipPath id=\{waveId\}>/);
 assert.match(kpi,/nb64-liquid-wave--front/);
 assert.match(kpi,/nb64-liquid-wave--back/);
 assert.doesNotMatch(kpi,/conic-gradient/);
});

test('four theme-matched liquid colors and reduced-motion accessibility exist',()=>{
 for(const color of ['base','ready','deployed','cyber']) assert.match(css,new RegExp(`\\.nb64-kpi-card--${color}\\{--nb64-accent:`));
 assert.match(css,/@keyframes nb64-water-front/);
 assert.match(css,/@keyframes nb64-water-back/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(kpi,/role="img" aria-label=\{`\$\{item\.label\}: \$\{percent\}% complete`\}/);
 assert.match(entry,/import '\.\/nbdt-overview-v064\.css'/);
});
