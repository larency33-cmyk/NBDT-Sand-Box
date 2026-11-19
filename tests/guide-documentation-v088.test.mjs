import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const guide=readFileSync(new URL('../src/workspace.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../guide-approved-v040.css',import.meta.url),'utf8');
const registry=readFileSync(new URL('../index.tsx',import.meta.url),'utf8');

test('Only the internal Configuration Guide documentation link uses the new CTA',()=>{
 assert.match(guide,/url&&<a className="nb-button nb88-guide-documentation"/);
 assert.match(guide,/<FileText size=\{18\} strokeWidth=\{2\} aria-hidden="true"\/>/);
 assert.match(guide,/<span>Documentation<\/span><ExternalLink size=\{14\}/);
 assert.match(guide,/FileText,ExternalLink/);
 assert.doesNotMatch(registry,/nb88-guide-documentation/);
});

test('Documentation link retains target URL and safe new-tab navigation',()=>{
 assert.match(guide,/className="nb-button nb88-guide-documentation" href=\{url\} target="_blank" rel="noopener noreferrer"/);
 assert.match(guide,/const url=safeUrl\(sys\.documentationUrl\)/);
 assert.match(guide,/title="Open system documentation in a new tab"/);
});

test('Guide-specific prominent styling does not affect Registry card button',()=>{
 assert.match(css,/\.nb40-guide-page \.nb-page-header \.nb-actions a\.nb-button\.nb88-guide-documentation\{/);
 assert.match(css,/background:linear-gradient\(135deg,#0874ed 0%,#075ecb 100%\)!important/);
 assert.match(css,/\.nb88-guide-documentation:hover\{/);
 assert.match(css,/\.nb88-guide-documentation:focus-visible\{/);
 assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
 assert.match(registry,/Documentation<\/a>/);
});

test('Back navigation and import button are untouched',()=>{
 assert.match(guide,/Back to systems<\/B>/);
 assert.match(guide,/Import from Excel<\/B>/);
});
