import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const source=fs.readFileSync(new URL('../index.tsx',import.meta.url),'utf8');
const pkg=JSON.parse(fs.readFileSync(new URL('../package.json',import.meta.url),'utf8'));
test('Assignment navigation icon Users has an explicit lucide-react import',()=>{
 const lucideImports=/import\s*\{([^}]+)\}\s*from\s*['"]lucide-react['"]/.exec(source)?.[1]||'';
 assert.match(source,/<Users\s/,'The new sidebar entry must keep its icon');
 assert.match(lucideImports,/(?:^|,)\s*Users\s*(?:,|$)/,'Users must be declared in the lucide-react import');
});
test('production build runs missing-symbol preflight before Vite',()=>{
 assert.match(pkg.scripts.build,/check-symbols\.cjs\s*&&\s*vite build/);
 assert.equal(pkg.version,'0.6.53');
});
