import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const tsx=readFileSync(new URL('../src/signin-v099.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/signin-v099.css',import.meta.url),'utf8');

test('SSO button and its original click handler remain intact',()=>{
  assert.match(tsx,/<button type="button" className="nb99-sso" onClick=\{onEnter\} disabled=\{busy\}/);
  assert.match(tsx,/Sign in with corporate SSO/);
  assert.match(tsx,/\{error&&<p className="nb99-entry-error" role="alert">/);
});
test('only workspace helper message is removed',()=>{
  assert.doesNotMatch(tsx,/Your team's deployment workspace\./);
  assert.doesNotMatch(tsx,/className="nb99-helper"/);
});
test('hero text, SSO and corporate lockup all follow the shared logo width',()=>{
  assert.match(css,/--nb102-column-width:min\(clamp\(215px,min\(34vw,42svh\),555px\),86vw\)/);
  assert.match(css,/\.nb99-team-logo,\s*\.nb99-hero h1,\s*\.nb99-subtitle,\s*\.nb99-sso\s*\{\s*width:var\(--nb102-column-width\)/);
  assert.match(css,/\.nb101-group-lockup\s*\{\s*width:var\(--nb102-column-width\)/);
  assert.match(css,/\.nb99-sso\s*\{\s*margin-top:clamp\(20px,7svh,62px\)/);
  assert.match(css,/@media\(max-width:720px\)[\s\S]*--nb102-column-width/);
});
