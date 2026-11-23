import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const page=readFileSync(new URL('../src/signin-v099.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/signin-v099.css',import.meta.url),'utf8');
test('only logo is visually lowered without changing its dimensions or flow',()=>{
  assert.match(css,/v0\.6\.104[\s\S]*?\.nb99-team-logo\s*\{\s*position:relative;\s*top:clamp\(14px,3\.6svh,32px\)/);
  assert.match(css,/@media\(max-width:720px\)\s*\{\s*\.nb99-team-logo\{top:clamp\(0px,\.7svh,6px\)\}/);
  assert.match(css,/@media\(max-height:520px\)\s*\{\s*\.nb99-team-logo\{top:0\}/);
});
test('centering uses unshifted logo baseline and does not move copy/button',()=>{
  assert.match(page,/logoVisualOffset=Number\.parseFloat\(getComputedStyle\(logo\)\.top\)\|\|0/);
  assert.match(page,/logoBottom=logo\.getBoundingClientRect\(\)\.bottom-logoVisualOffset/);
  assert.match(page,/cloudTop-30-buttonBox\.bottom/);
  assert.match(page,/targetCenter=\(logoBottom\+buttonBox\.top\+targetShift\)\/2/);
});
test('SSO click handler and unchanged scene still present',()=>{
  assert.match(page,/<button type="button" className="nb99-sso" onClick=\{onEnter\} disabled=\{busy\}/);
  assert.ok(page.includes('<div className="nb99-panorama"><DeploymentScene/>'));
  assert.match(page,/royalCaribbeanGroupLockup/);
});
