import assert from "node:assert/strict";
import { readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

const require = createRequire(import.meta.url);

function countComponents(dir) {
  return readdirSync(dir).filter((file) => file.endsWith(".tsx")).length;
}

const uiCount = countComponents("src/icons");
const monoCount = countComponents("src/tech/mono");
const colorCount = countComponents("src/tech/color");

function checkIcon(name, Icon, size) {
  assert.equal(typeof Icon, "function", `${name} is not a component`);

  const html = renderToStaticMarkup(createElement(Icon, size === undefined ? {} : { size }));

  assert.match(html, /^<svg /, `${name} did not render an svg element`);
  assert.match(html, /aria-hidden="true"/, `${name} is not hidden from assistive technology`);
  assert.match(html, /focusable="false"/, `${name} is focusable`);

  const expected = size ?? 24;
  assert.match(html, new RegExp(`width="${expected}"`), `${name} has the wrong width`);
  assert.match(html, new RegExp(`height="${expected}"`), `${name} has the wrong height`);

  return html;
}

// UI icons: every icon must be exported and render at 24x24.
const ui = await import("../dist/esm/index.js");
assert.equal(uiCount, 1311, "Unexpected UI icon count");
assert.equal(Object.keys(ui).length, uiCount, `Expected ${uiCount} UI exports, found ${Object.keys(ui).length}`);

for (const name of Object.keys(ui)) {
  const html = checkIcon(name, ui[name]);
  assert.match(html, /viewBox="0 0 24 24"/, `${name} has no 24x24 viewBox`);
}

// Tech mono: every icon must be exported, render, and use currentColor.
const mono = await import("../dist/esm/tech/mono/index.js");
assert.equal(Object.keys(mono).length, monoCount, `Expected ${monoCount} mono exports, found ${Object.keys(mono).length}`);

for (const name of Object.keys(mono)) {
  const html = checkIcon(name, mono[name]);
  assert.match(html, /fill="currentColor"/, `${name} is not monochrome`);
}

// Tech color: every icon must be exported and render.
const color = await import("../dist/esm/tech/color/index.js");
assert.equal(Object.keys(color).length, colorCount, `Expected ${colorCount} color exports, found ${Object.keys(color).length}`);

for (const name of Object.keys(color)) {
  checkIcon(name, color[name]);
}

// Mono icons inherit color and do not bake in a brand color.
const js = checkIcon("JavaScriptIcon", mono.JavaScriptIcon, 32);
assert.match(js, /fill="currentColor"/);
assert.doesNotMatch(js, /#F7DF1E/);
assert.match(js, /viewBox="0 0 24 24"/);

// Color icons keep their brand colors and source viewBox.
const react = checkIcon("ReactIcon (color)", color.ReactIcon, 48);
assert.match(react, /#61DAFB/);
assert.match(react, /viewBox="0 0 128 128"/);

// Props pass through on tech icons too.
const customized = renderToStaticMarkup(
  createElement(mono.JavaScriptIcon, { size: 30, className: "custom", "aria-hidden": "false" }),
);
assert.match(customized, /width="30"/, "size prop did not set the width");
assert.match(customized, /class="custom"/, "className did not pass through");
assert.match(customized, /aria-hidden="false"/, "aria-hidden did not pass through");

// CJS builds: same exports, renderable.
const cjs = require("../dist/cjs/index.js");
assert.equal(Object.keys(cjs).length, uiCount, "CJS UI barrel is incomplete");

const cjsMono = require("../dist/cjs/tech/mono/index.js");
const cjsColor = require("../dist/cjs/tech/color/index.js");
assert.equal(Object.keys(cjsMono).length, monoCount, "CJS tech mono barrel is incomplete");
assert.equal(Object.keys(cjsColor).length, colorCount, "CJS tech color barrel is incomplete");
checkIcon("JavaScriptIcon (CJS)", cjsMono.JavaScriptIcon, 20);
checkIcon("ReactIcon (CJS color)", cjsColor.ReactIcon, 20);

// Package exports map: barrels, subpaths, and self-reference must resolve.
const selfUi = await import("@x1nx3r/altics-react-icons");
const selfMono = await import("@x1nx3r/altics-react-icons/tech");
const selfColor = await import("@x1nx3r/altics-react-icons/tech/color");
assert.equal(Object.keys(selfUi).length, uiCount, "Self-referenced UI barrel is incomplete");
assert.equal(Object.keys(selfMono).length, monoCount, "Self-referenced tech barrel is incomplete");
assert.equal(Object.keys(selfColor).length, colorCount, "Self-referenced color barrel is incomplete");

const monoSubpath = await import("@x1nx3r/altics-react-icons/tech/JavaScriptIcon");
const colorSubpath = await import("@x1nx3r/altics-react-icons/tech/color/ReactIcon");
checkIcon("JavaScriptIcon (subpath)", monoSubpath.JavaScriptIcon, 16);
checkIcon("ReactIcon (subpath color)", colorSubpath.ReactIcon, 16);

const selfCjsMono = require("@x1nx3r/altics-react-icons/tech");
const selfCjsColor = require("@x1nx3r/altics-react-icons/tech/color");
const cjsMonoSubpath = require("@x1nx3r/altics-react-icons/tech/JavaScriptIcon");
const cjsColorSubpath = require("@x1nx3r/altics-react-icons/tech/color/ReactIcon");
assert.equal(Object.keys(selfCjsMono).length, monoCount, "Self-referenced CJS tech barrel is incomplete");
assert.equal(Object.keys(selfCjsColor).length, colorCount, "Self-referenced CJS color barrel is incomplete");
checkIcon("JavaScriptIcon (CJS subpath)", cjsMonoSubpath.JavaScriptIcon, 16);
checkIcon("ReactIcon (CJS color subpath)", cjsColorSubpath.ReactIcon, 16);

console.log(
  `Smoke test passed: ${uiCount} UI icons, ${monoCount} tech mono, ${colorCount} tech color. ESM + CJS + subpaths.`,
);
