import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);
const componentCount = readdirSync("src/icons").filter((file) => file.endsWith(".tsx")).length;

function checkIcon(name, Icon, size) {
  assert.equal(typeof Icon, "function", `${name} is not a component`);

  const html = renderToStaticMarkup(createElement(Icon, size === undefined ? {} : { size }));

  assert.match(html, /^<svg /, `${name} did not render an svg element`);
  assert.match(html, /viewBox="0 0 24 24"/, `${name} has no 24x24 viewBox`);
  assert.match(html, /aria-hidden="true"/, `${name} is not hidden from assistive technology`);
  assert.match(html, /focusable="false"/, `${name} is focusable`);

  const expected = size ?? 24;
  assert.match(html, new RegExp(`width="${expected}"`), `${name} has the wrong width`);
  assert.match(html, new RegExp(`height="${expected}"`), `${name} has the wrong height`);
}

// ESM build: every generated icon must be exported and render.
const esm = await import("../dist/esm/index.js");
const names = Object.keys(esm).sort();

assert.equal(
  names.length,
  componentCount,
  `Expected ${componentCount} ESM exports, found ${names.length}`,
);

for (const name of names) {
  checkIcon(name, esm[name]);
}

// The size prop and passthrough props must work.
const sized = renderToStaticMarkup(
  createElement(esm.ActivityIcon, { size: 32, className: "custom", "aria-hidden": "false" }),
);
assert.match(sized, /width="32"/, "size prop did not set the width");
assert.match(sized, /height="32"/, "size prop did not set the height");
assert.match(sized, /class="custom"/, "className did not pass through");
assert.match(sized, /aria-hidden="false"/, "aria-hidden did not pass through");

// CJS build: same exports, renderable.
const cjs = require("../dist/cjs/index.js");
assert.equal(
  Object.keys(cjs).length,
  componentCount,
  `Expected ${componentCount} CJS exports, found ${Object.keys(cjs).length}`,
);
checkIcon("ActivityIcon (CJS)", cjs.ActivityIcon, 20);

// Package exports map: barrel and per-icon subpath must resolve.
const subpath = await import("@altics/icons/icons/ActivityIcon");
checkIcon("ActivityIcon (subpath)", subpath.ActivityIcon, 16);

const selfEsm = await import("@altics/icons");
assert.equal(Object.keys(selfEsm).length, componentCount, "Self-referenced ESM barrel is incomplete");

const selfCjs = require("@altics/icons");
assert.equal(Object.keys(selfCjs).length, componentCount, "Self-referenced CJS barrel is incomplete");

console.log(`Smoke test passed: ${componentCount} icons, ESM + CJS + subpath exports.`);
