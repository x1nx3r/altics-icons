import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const MANIFEST = "tool/tech-icons.json";
const MONO_OUT = "icons/tech/mono";
const COLOR_OUT = "icons/tech/color";

const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

function readSimpleIcon(slug) {
  const path = join("node_modules/simple-icons/icons", `${slug}.svg`);
  if (!existsSync(path)) return null;
  return readFileSync(path, "utf8");
}

function findDeviconVariant(folder, variants) {
  const dir = join("node_modules/devicon/icons", folder);
  if (!existsSync(dir)) return null;
  for (const variant of variants) {
    const path = join(dir, `${folder}-${variant}.svg`);
    if (existsSync(path)) return path;
  }
  return null;
}

function cleanSvg(svg) {
  return (
    svg
      .replace(/<\?xml[\s\S]*?\?>/g, "")
      .replace(/<title>[\s\S]*?<\/title>/g, "")
      .replace(/\sclass="[^"]*"/g, "")
      .trim() + "\n"
  );
}

function toMonoSvg(svg) {
  return (
    cleanSvg(svg)
      .replace(/fill="(?!none\b)[^"]*"/g, 'fill="currentColor"')
      .replace(/stroke="(?!none\b)[^"]*"/g, 'stroke="currentColor"')
      .trim() + "\n"
  );
}

const names = new Set();
for (const entry of manifest) {
  if (names.has(entry.name)) {
    console.error(`Duplicate icon name in ${MANIFEST}: ${entry.name}`);
    process.exit(1);
  }
  names.add(entry.name);
}

mkdirSync(MONO_OUT, { recursive: true });
mkdirSync(COLOR_OUT, { recursive: true });

const wantedMono = new Set();
const wantedColor = new Set();
const errors = [];
const noColor = [];

for (const entry of manifest) {
  let monoSource = entry.mono ? readSimpleIcon(entry.mono) : null;

  if (!monoSource && entry.monoDevicon) {
    const path = findDeviconVariant(entry.monoDevicon, ["plain", "line"]);
    if (path) monoSource = readFileSync(path, "utf8");
  }

  if (!monoSource) {
    errors.push(`${entry.name}: no mono source (mono=${entry.mono}, monoDevicon=${entry.monoDevicon})`);
    continue;
  }

  const file = `${entry.name}.svg`;
  writeFileSync(join(MONO_OUT, file), toMonoSvg(monoSource));
  wantedMono.add(file);

  if (!entry.color) continue;

  const colorPath = findDeviconVariant(entry.color, ["original", "plain", "line"]);
  if (!colorPath) {
    noColor.push(`${entry.name} (${entry.color})`);
    continue;
  }

  writeFileSync(join(COLOR_OUT, file), cleanSvg(readFileSync(colorPath, "utf8")));
  wantedColor.add(file);
}

function removeStale(dir, wanted) {
  let removed = 0;
  for (const file of readdirSync(dir)) {
    if (!file.endsWith(".svg")) continue;
    if (!wanted.has(file)) {
      rmSync(join(dir, file));
      removed += 1;
    }
  }
  return removed;
}

const removedMono = removeStale(MONO_OUT, wantedMono);
const removedColor = removeStale(COLOR_OUT, wantedColor);

if (errors.length > 0) {
  console.error("Missing mono sources:");
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log(`Tech mono: ${wantedMono.size} icons -> ${MONO_OUT}/ (${removedMono} removed)`);
console.log(`Tech color: ${wantedColor.size} icons -> ${COLOR_OUT}/ (${removedColor} removed)`);
if (noColor.length > 0) {
  console.log(`No color variant (${noColor.length}): ${noColor.join(", ")}`);
}
