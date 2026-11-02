import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const kpi=source.split('<div className="nb-overview-kpi-grid">')[1].split('<div className="nb-overview-layout')[0];
const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-overview-v065.css',import.meta.url),'utf8');
test('SVG paint does not rely on unsupported CSS variable in SVG presentation attributes',()=>{
 for(const value of ['item.colors.light','item.colors.primary','item.colors.dark','item.colors.track'])assert.ok(kpi.includes(value),value);
 assert.match(kpi,/stroke=\{item\.colors\.track\}/);
 assert.match(kpi,/stopColor=\{item\.colors\.primary\}/);
 assert.doesNotMatch(kpi,/stopColor="var\(/);
 assert.match(kpi,/fill=\{item\.colors\.light\}/);
});
test('every KPI has a native SVG animation independent of CSS animation availability',()=>{
 assert.equal((kpi.match(/<animateTransform\b/g)||[]).length,2);
 assert.equal((kpi.match(/repeatCount="indefinite"/g)||[]).length,3);
 assert.ok(kpi.includes('clipPath id={waveId}'));
});
test('all four rings have explicit distinct colors, icons left of numbers and remain navigable',()=>{
 for(const name of ['Base Configuration','Ready for Deployment','Deployed','Cyber Approved']){
  const object=source.match(new RegExp(`\\{label:'${name}'[^\\n]+`));
  assert.ok(object?.[0].includes('colors:{primary:'), name);
 }
 assert.match(kpi,/<item\.Icon size=\{37\} color=\{item\.colors\.primary\}/);
 assert.ok(kpi.indexOf('nb64-kpi-symbol') < kpi.indexOf('<strong>{percent}%</strong>'));
 assert.match(kpi,/onClick=\{\(\)=>onNavigate\(item.tab\)\}/);
 assert.match(entry,/import '\.\/nbdt-overview-v065\.css'/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
