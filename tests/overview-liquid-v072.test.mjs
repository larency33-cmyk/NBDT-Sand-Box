import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const css = fs.readFileSync(new URL("../nbdt-overview-v072.css", import.meta.url), "utf8");
const indexTsx = fs.readFileSync(new URL("../index.tsx", import.meta.url), "utf8");

test("v0.6.72 imports the new CSS", () => {
  assert.match(indexTsx, /nbdt-overview-v072\.css/);
});

test("v0.6.72 uses neutral empty chamber background", () => {
  assert.match(css, /\.nb69-water-background\{[\s\S]*fill:rgba\(214,221,232,.5\);/);
  assert.match(css, /\.nb69-water-background\{[\s\S]*opacity:1;/);
});

test("v0.6.72 keeps reduced-motion fallback", () => {
  assert.match(css, /prefers-reduced-motion: reduce/);
});
