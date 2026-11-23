import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,statSync} from 'node:fs';
const source=readFileSync(new URL('../src/signin-v099.tsx',import.meta.url),'utf8');
const scene=readFileSync(new URL('../src/signin-scene-v099.tsx',import.meta.url),'utf8');
const css=readFileSync(new URL('../src/signin-v099.css',import.meta.url),'utf8');
test('uploaded corporate lockup replaces plain-text footer brands',()=>{
  assert.match(source,/royal-caribbean-group-lockup-v101\.png/);
  assert.match(source,/<footer className="nb99-footer"><img/);
  assert.doesNotMatch(source,/<p className="nb99-group">/);
  assert.ok(statSync(new URL('../src/assets/royal-caribbean-group-lockup-v101.png',import.meta.url)).size>1000);
});
test('viewport scaling reserves the remaining height for the SVG scene',()=>{
  assert.match(css,/\.nb99-signin\{height:100svh;min-height:0/);
  assert.match(css,/\.nb99-panorama\{flex:1 1 auto;min-height:0/);
  assert.match(css,/\.nb99-scene-canvas\{display:block;width:100%;height:100%;/);
});
test('clouds tile seamlessly to the right, rack and water effects remain pauseable',()=>{
  assert.match(scene,/\[0,-1670\]\.map/);
  assert.match(css,/@keyframes nb101-cloud-right\{from\{transform:translateX\(0\)\}to\{transform:translateX\(1670px\)\}\}/);
  assert.match(scene,/<RackIndicators phase="configure"\/>/);
  assert.match(scene,/<RackIndicators phase="deploy"\/>/);
  assert.match(scene,/<WaterHighlights from=\{c.from\} width=\{c.width\}\/>/);
  assert.match(css,/nb101-led-status 4s steps\(1,end\) infinite paused/);
  assert.match(css,/nb101-water-glint 4s ease-in-out infinite paused/);
});
