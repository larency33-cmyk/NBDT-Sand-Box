import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-overview-v070.css',import.meta.url),'utf8');
const section=ui.split('<div className="nb-overview-kpi-grid">')[1].split('<div className="nb-overview-layout')[0];

test('0.6.70 loads after v0.6.69 and keeps flat liquid override last',()=>{
 assert.ok(app.includes("import './nbdt-overview-v070.css';"));
 assert.ok(app.indexOf('v069.css')<app.indexOf('v070.css'));
 assert.match(css,/\.nb70-liquid-ring--base \.nb70-water-stack\{animation:nb70-stack-base/);
 assert.match(css,/\.nb70-liquid-ring--ready \.nb70-water-stack\{animation:nb70-stack-ready/);
 assert.match(css,/\.nb70-liquid-ring--deployed \.nb70-water-stack\{animation:nb70-stack-deployed/);
 assert.match(css,/\.nb70-liquid-ring--cyber \.nb70-water-stack\{animation:nb70-stack-cyber/);
});

test('each KPI ring uses at least five water shades and more bubbles',()=>{
 assert.match(ui,/colors:\{primary:[\s\S]*?shades:\[/);
 assert.match(section,/nb70-water-wave--shade1/);
 assert.match(section,/nb70-water-wave--shade2/);
 assert.match(section,/nb70-water-wave--shade3/);
 assert.match(section,/nb70-water-wave--shade4/);
 assert.match(section,/nb70-water-wave--shade5/);
 assert.match(section,/bubbles\.map\(\(bubble,index\)=>/);
 assert.match(section,/className=\{`nb70-water-bubble nb70-water-bubble--\$\{index%6\}`\}/);
 assert.match(section,/radialGradient id=\{`\$\{ringId\}-water-bubble`\}/);
 assert.match(section,/bubbleDepth\*bubble\.depth/);
 assert.match(section,/linearGradient id=\{`\$\{ringId\}-water-five`\}/);
 assert.match(section,/item\.colors\.shades\.map/);
});

test('legacy moving front wave remains present for smoke checks while enhanced layers are added',()=>{
 assert.match(section,/nb69-water-wave nb69-water-wave--front/);
 assert.match(section,/nb69-water-wave nb69-water-wave--back/);
 assert.match(css,/\.nb69-water-wave--front\{animation:nb69-wave-front/);
 assert.match(css,/\.nb69-water-wave--back\{animation:nb69-wave-back/);
 assert.match(css,/prefers-reduced-motion: reduce/);
});

test('four distinct wave personalities preserve percent-based water level',()=>{
 assert.match(section,/g transform=\{`translate\(0 \$\{waterline\.toFixed\(3\)\}\)`\}/);
 assert.match(section,/g className="nb70-water-stack"/);
 assert.match(section,/className="nb70-water-base"/);
 for(const theme of ['base','ready','deployed','cyber']){
  assert.ok(css.includes(`nb70-liquid-ring--${theme} .nb70-water-stack`),theme);
  assert.match(css,new RegExp('@keyframes nb70-stack-'+theme));
 }
 assert.match(css,/prefers-reduced-motion: reduce/);
});
