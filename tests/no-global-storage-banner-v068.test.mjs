import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const enhanced = readFileSync(new URL('../src/enhancements.tsx', import.meta.url),'utf8');
const layout = readFileSync(new URL('../index.tsx', import.meta.url),'utf8');
const css = readFileSync(new URL('../redesign.css', import.meta.url),'utf8');
const store = readFileSync(new URL('../src/demo-store.mjs', import.meta.url),'utf8');

test('the top storage banner is absent from every workspace view',()=>{
 assert.doesNotMatch(enhanced,/Demo data · IndexedDB · no shared sync/);
 assert.doesNotMatch(enhanced,/className=\{['"]nb-store-state/);
 assert.doesNotMatch(css,/\.nb-store-state/);
 assert.match(layout,/<main[^>]*>[\s\S]*?<StoreStatus\s*\/>/);
 assert.match(enhanced,/if\(!error\)return null/);
});

test('actual storage failures still surface without consuming layout height',()=>{
 assert.match(enhanced,/event\.detail\?\.state==='error'/);
 assert.match(enhanced,/className="nb-store-error-toast" role="alert"/);
 assert.match(enhanced,/Reload latest/);
 assert.match(css,/\.nb-store-error-toast\s*\{[^}]*position:fixed/);
});

test('IndexedDB persistence and transaction error reporting remain intact',()=>{
 assert.match(store,/indexedDB\.open/);
 assert.match(store,/tx\.objectStore\('audit'\)/);
 assert.match(store,/notice\('error',e\.message\)/);
});
