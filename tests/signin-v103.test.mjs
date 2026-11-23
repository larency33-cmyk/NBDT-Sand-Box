import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../src/signin-v099.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/signin-v099.css',import.meta.url),'utf8');

test('SSO remains clickable and copy is grouped separately for visual alignment',()=>{
  assert.match(page,/<button type="button" className="nb99-sso" onClick=\{onEnter\} disabled=\{busy\}/);
  assert.match(page,/<div className="nb103-copy">[\s\S]*?Together, we bring ships to life\.[\s\S]*?From first configuration to first sailing\./);
  assert.doesNotMatch(page,/Your team's deployment workspace/);
});
test('viewport alignment uses exact 30px below-button to cloud clearance',()=>{
  assert.match(page,/cloudTop-30-buttonBox\.bottom/);
  assert.match(page,/scene\.getScreenCTM\(\)/);
  assert.match(page,/sceneOrigin\.matrixTransform\(ctm\)\.y/);
  assert.match(page,/targetCenter=\(logoBottom\+buttonBox\.top\+targetShift\)\/2/);
  assert.match(page,/room<textHeight\+2\*minimalMargin/);
  assert.match(page,/if\(window\.innerWidth<=720\)\{lowerLogoByGap\(\);return;\}/);
});
test('movement uses transforms and preserves image scene dimensions and corporate lockup',()=>{
  assert.match(css,/\.nb103-copy\{[\s\S]*?width:var\(--nb102-column-width\)/);
  assert.match(css,/\.nb99-sso\{transform:translateY\(var\(--nb103-button-shift,0px\)\)\}/);
  assert.ok(page.includes('<div className="nb99-panorama"><DeploymentScene/>'));
});
