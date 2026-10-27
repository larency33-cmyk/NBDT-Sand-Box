import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const component=readFileSync(new URL('../src/access-control-v047.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../nbdt-access-v048.css',import.meta.url),'utf8');
test('role indicator rendered exactly once inside sidebar footer, not on page',()=>{
  assert.equal((root.match(/<AccessChip\b/g)||[]).length,1);
  const footer=root.indexOf('className="nb48-sidebar-bottom');
  const account=root.indexOf('<AccessChip');
  const collapse=root.indexOf('onClick={() => setIsSidebarExpanded(!isSidebarExpanded)}');
  const closingAside=root.indexOf('</aside>',footer);
  const openingMain=root.indexOf('<main className=',closingAside);
  assert.ok(footer>0 && footer<account && account<collapse && collapse<closingAside && closingAside<openingMain);
});
test('sandbox status visual badge removed and controls still available',()=>{
  assert.doesNotMatch(root,/Local UI sandbox|LOCAL UI SANDBOX|Local UI Sandbox/);
  assert.doesNotMatch(root,/Sync Status Overlay Removed - Moved to Sidebar/);
  assert.match(root,/onLogin=\{openLogin\}/);
  assert.match(root,/onLogout=\{/);
  assert.match(root,/onManage=\{\(\)=>setActiveTab\('administration'\)\}/);
});
test('Guest and Admin remain actionable in expanded and collapsed layouts',()=>{
  assert.match(component,/expanded\?<>/);
  assert.match(component,/!user\?<button className="nb48-account-action nb48-signin"/);
  assert.match(component,/nb48-avatar-button.*onClick=\{onLogin\}/);
  assert.match(component,/nb48-account-popout/);
  assert.match(component,/Manage admins/);
  assert.match(component,/Sign out/);
});
test('sidebar layout retains scroll and page toolbar is unblocked',()=>{
  assert.match(root,/import '\.\/nbdt-access-v048.css';/);
  assert.match(css,/nbdt-redesign\.nb-app-root>aside \{ overflow:visible!important; \}/);
  assert.match(css,/margin-right:0!important/);
  assert.match(css,/nb48-account-collapsed/);
  assert.match(css,/right:15px!important/);
});
