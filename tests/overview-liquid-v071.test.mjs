import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../nbdt-overview-v071.css", import.meta.url), "utf8");
const indexTsx = fs.readFileSync(new URL("../index.tsx", import.meta.url), "utf8");

test("v0.6.71 imports the new CSS", () => {
  assert.match(indexTsx, /nbdt-overview-v071\.css/);
});

test("v0.6.71 uses seamless water-loop animations", () => {
  assert.match(css, /nb70-water-wave--shade1\{animation:nb71-layer-1/);
  assert.match(css, /nb69-water-wave--back\{animation:nb71-wave-back/);
  assert.match(css, /nb70-liquid-ring--base \.nb70-water-stack\{animation:nb71-stack-base/);
  assert.match(css, /@keyframes nb71-wave-front\{/);
  assert.ok(!css.includes('alternate;'));
});

test("v0.6.71 keeps reduced-motion fallback", () => {
  assert.match(css, /prefers-reduced-motion: reduce/);
});
