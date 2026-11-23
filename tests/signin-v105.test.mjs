import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../src/signin-v099.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/signin-v099.css',import.meta.url),'utf8');
test('measure the original logo-to-headline gap and close exactly 80% of it',()=>{
  assert.match(page,/root\.style\.setProperty\('--nb105-logo-shift','0px'\)/);
  assert.match(page,/currentGap=Math\.max\(0,title\.getBoundingClientRect\(\)\.top\+copyShift-logo\.getBoundingClientRect\(\)\.bottom\)/);
  assert.match(page,/extraShift=window\.innerHeight<=520\?0:currentGap\*0\.8/);
  assert.match(css,/\.nb99-team-logo\s*\{\s*transform:translateY\(var\(--nb105-logo-shift,0px\)\)/);
});
test('preserve original copy centering and original button cloud clearance as a baseline',()=>{
  assert.match(page,/targetShift=cloudTop-30-buttonBox\.bottom/);
  assert.match(page,/const copyShift=targetCenter-textCenter/);
  assert.match(page,/lowerLogoByGap\(copyShift\)/);
  assert.match(page,/onClick=\{onEnter\} disabled=\{busy\}/);
  assert.match(page,/<div className="nb99-panorama"><DeploymentScene\/>/);
});
test('skip logo shift on short landscape and preserve mobile scene layout',()=>{
  assert.match(page,/window\.innerWidth<=720\)\{lowerLogoByGap\(\);liftSsoByGap\(\);return;\}/);
  assert.match(page,/window\.innerHeight<=520\?0:currentGap\*0\.8/);
});
