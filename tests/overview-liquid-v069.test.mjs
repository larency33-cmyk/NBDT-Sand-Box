import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const ui=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const app=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-overview-v069.css',import.meta.url),'utf8');
const smoke=readFileSync(new URL('../scripts/smoke-production.cjs',import.meta.url),'utf8');
const section=ui.split('<div className="nb-overview-kpi-grid">')[1].split('<div className="nb-overview-layout')[0];

test('0.6.69 is loaded last, suppresses the heavy glass shell and doubled arcs',()=>{
 assert.ok(app.includes("import './nbdt-overview-v069.css';"));
 assert.ok(app.indexOf('v068.css')<app.indexOf('v069.css'));
 assert.match(css,/\.nb66-liquid-chamber\{\s*display:none !important/);
 assert.match(css,/\.nb68-secondary-arc,/);
 assert.match(css,/\.nb66-liquid-svg > path/);
 assert.match(css,/filter:none !important/);
});
test('progress is a single smooth accurate percentage arc without gradient overlays',()=>{
 assert.match(section,/className="nb69-progress-arc"/);
 assert.match(section,/stroke=\{item\.colors\.primary\}/);
 assert.match(section,/strokeWidth="8"/);
 assert.match(section,/percent\/100\*circumference/);
 assert.match(section,/strokeLinecap=\{percent>=100\?'butt':'round'\}/);
 assert.match(css,/\.nb69-progress-arc\{[\s\S]*?shape-rendering:geometricPrecision/);
});
test('bright, percent-based two-layer water is clipped and animated in flat SVG',()=>{
 assert.match(section,/const waterline=100-percent\*\.8/);
 assert.match(section,/clipPath id=\{`\$\{ringId\}-water-clip`\}/);
 assert.match(section,/nb69-water-wave--front/);
 assert.match(section,/nb69-water-wave--back/);
 assert.match(css,/@keyframes nb69-wave-front/);
 assert.match(css,/@keyframes nb69-wave-back/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(smoke,/nb69-water-wave--front/);
 assert.match(smoke,/first\.transform===second\.transform/);
});
