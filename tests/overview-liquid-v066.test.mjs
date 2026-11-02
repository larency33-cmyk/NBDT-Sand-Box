import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const source=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const kpi=source.split('<div className="nb-overview-kpi-grid">')[1].split('<div className="nb-overview-layout')[0];
const css=readFileSync(new URL('../nbdt-overview-v066.css',import.meta.url),'utf8');
const entry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const smoke=readFileSync(new URL('../scripts/smoke-production.cjs',import.meta.url),'utf8');
test('new CSS water animation is loaded after legacy SVG styles',()=>{
 assert.ok(entry.indexOf("nbdt-overview-v065.css")<entry.indexOf("nbdt-overview-v066.css"));
 assert.match(kpi,/className="nb66-liquid-chamber"/);
 assert.match(kpi,/className="nb66-liquid-fill"/);
 for(const value of ['nb66-wave-front','nb66-wave-rear','nb66-water-breathe','nb66-bubble-rise','nb66-gloss-breathe']){
  assert.ok(css.includes(`@keyframes ${value}`),value);
 }
 assert.doesNotMatch(kpi,/<animateTransform\b/);
});
test('subtle theme-matched fluid is clipped and progress remains accurate',()=>{
 assert.match(kpi,/className="nb66-liquid-chamber"/);
 assert.match(css,/\.nb-overview-premium \.nb66-liquid-chamber\{/);
 assert.match(css,/overflow:hidden/);
 for(const key of ['--nb66-primary','--nb66-light','--nb66-track','--nb66-fill'])assert.ok(kpi.includes(key),key);
 assert.match(css,/height:var\(--nb66-fill,0%\)/);
 assert.match(kpi,/strokeDasharray=\{`\$\{\(percent\/100\*circumference\)\.toFixed\(3\)\} \$\{circumference\.toFixed\(3\)\}`\}/);
 assert.match(kpi,/percent===0\?'nb66-liquid-ring--empty'/);
 assert.match(css,/\.nb66-liquid-ring--empty \.nb66-liquid-fill\{display:none\}/);
});
test('bubbles are gentle, colored progress is explicit, accessibility protected',()=>{
 assert.match(css,/opacity:\.64/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/animation:none!important/);
 assert.match(kpi,/stopColor=\{item\.colors\.primary\}/);
 assert.match(kpi,/stroke=\{item\.colors\.track\}/);
 assert.match(kpi,/role="img" aria-label=/);
});
test('release browser smoke test measures actual fluid movement',()=>{
 assert.match(smoke,/nb69-water-wave--front/);
 assert.match(smoke,/first\.transform===second\.transform/);
 assert.match(smoke,/ringCount!==4/);
});
