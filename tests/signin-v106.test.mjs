import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../src/signin-v099.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/signin-v099.css',import.meta.url),'utf8');
const scene=readFileSync(new URL('../src/signin-scene-v099.tsx',import.meta.url),'utf8');

test('CTA is raised exactly 80% of the rendered subtitle-to-button gap',()=>{
  assert.match(page,/root\.style\.setProperty\('--nb106-button-lift','0px'\)/);
  assert.match(page,/const existingGap=Math\.max\(0,/);
  assert.match(page,/button\.getBoundingClientRect\(\)\.top\+buttonShift-/);
  assert.match(page,/subtitle\.getBoundingClientRect\(\)\.bottom\+copyShift/);
  assert.match(page,/const lift=existingGap\*0\.8/);
  assert.match(page,/liftSsoByGap\(copyShift,targetShift\)/);
  assert.match(page,/if\(window\.innerWidth<=720\)\{lowerLogoByGap\(\);liftSsoByGap\(\);return;\}/);
  assert.match(css,/transform:translateY\(calc\(var\(--nb103-button-shift,0px\) - var\(--nb106-button-lift,0px\)\)\)/);
  assert.match(page,/onClick=\{onEnter\} disabled=\{busy\}/);
});
test('bonus cart retains original 20s delivery clock and makes exactly +30% trips',()=>{
  assert.match(css,/\.nb99-cart\{animation:nb99-deliver 20s linear infinite paused/);
  assert.match(scene,/className="nb106-extra-cart" data-extra-delivery="true"/);
  assert.match(css,/\.nb106-extra-cart\{[\s\S]*?animation:nb106-bonus-deliver 200s linear infinite paused/);
  const keyframes=css.match(/@keyframes nb106-bonus-deliver\{([\s\S]*?)\n\}/)?.[1]??'';
  for(const start of ['6.7%','36.7%','66.7%'])assert.ok(keyframes.includes(start),`bonus start ${start}`);
  assert.equal((keyframes.match(/visibility:visible;opacity:1;transform:translateX\(0\)/g)||[]).length,3);
  assert.match(css,/\.nb99-cart,\.nb99-pack-box,\.nb99-system-ready/);
});
test('deployment illustration and hero content are preserved',()=>{
  assert.match(page,/<TeamLogo\/>/);
  assert.match(page,/Together, we bring ships to life\./);
  assert.match(page,/From first configuration to first sailing\./);
  assert.match(page,/<div className="nb99-panorama"><DeploymentScene\/>/);
  assert.match(page,/royalCaribbeanGroupLockup/);
});
