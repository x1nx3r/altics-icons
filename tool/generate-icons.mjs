import { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, basename } from "node:path";

const ICONS_DIR = "icons";
const OUT_DIR = "src/icons";

function toPascalCase(fileName) {
  const base = basename(fileName, ".svg");
  const parts = base.split("-").filter(Boolean);
  let name = parts
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join("");
  if (!name) name = "Icon";
  if (/^[0-9]/.test(name)) name = `Icon${name}`;
  if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name)) {
    name = name.replace(/[^A-Za-z0-9_$]/g, "");
  }
  return name;
}

function toComponentName(fileName) {
  const pascal = toPascalCase(fileName);
  return pascal.endsWith("Icon") ? pascal : `${pascal}Icon`;
}

const ATTR_MAP = [
  ["clip-path", "clipPath"],
  ["clip-rule", "clipRule"],
  ["fill-rule", "fillRule"],
  ["fill-opacity", "fillOpacity"],
  ["stroke-width", "strokeWidth"],
  ["stroke-linecap", "strokeLinecap"],
  ["stroke-linejoin", "strokeLinejoin"],
  ["stroke-dasharray", "strokeDasharray"],
  ["stroke-dashoffset", "strokeDashoffset"],
  ["stroke-miterlimit", "strokeMiterlimit"],
  ["stroke-opacity", "strokeOpacity"],
  ["stop-color", "stopColor"],
  ["stop-opacity", "stopOpacity"],
  ["flood-color", "floodColor"],
  ["flood-opacity", "floodOpacity"],
  ["color-interpolation-filters", "colorInterpolationFilters"],
  ["paint-order", "paintOrder"],
  ["shape-rendering", "shapeRendering"],
  ["vector-effect", "vectorEffect"],
  ["xlink:href", "xlinkHref"],
];

// Convert SVG presentation attributes to JSX prop names.
function jsxAttrs(svgInner) {
  return ATTR_MAP.reduce((out, [from, to]) => out.replaceAll(`${from}=`, `${to}=`), svgInner);
}

function extractViewBox(svg) {
  return /viewBox="([^"]*)"/.exec(svg)?.[1] ?? "0 0 24 24";
}

function extractInner(svg, componentName) {
  // Strip the outer <svg ...> and </svg>.
  let inner = svg
    .replace(/<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "")
    .trim();
  inner = jsxAttrs(inner);
  // Namespace ids per icon. This prevents collisions when a page uses
  // several icons whose source files share generated clip path ids.
  const idMap = new Map();
  inner = inner.replace(/\bid="([^"]+)"/g, (m, id) => {
    const namespaced = `${componentName}-${id}`;
    idMap.set(id, namespaced);
    return `id="${namespaced}"`;
  });
  for (const [oldId, newId] of idMap) {
    inner = inner.split(`url(#${oldId})`).join(`url(#${newId})`);
  }
  return inner;
}

function componentSource(componentName, viewBox, inner) {
  return `import type { SVGProps } from "react";

export type ${componentName}Props = SVGProps<SVGSVGElement> & {
  size?: number;
};

export function ${componentName}({ size = 24, ...props }: ${componentName}Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="${viewBox}"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      ${inner}
    </svg>
  );
}
`;
}

// Write only when the content changed. This keeps mtimes stable, so
// incremental builds do not rebuild unchanged icons.
function writeIfChanged(path, content) {
  let existing = null;
  try {
    existing = readFileSync(path, "utf8");
  } catch {
    existing = null;
  }
  if (existing === content) return false;
  writeFileSync(path, content);
  return true;
}

const files = readdirSync(ICONS_DIR)
  .filter((file) => file.toLowerCase().endsWith(".svg"))
  .sort();

if (files.length === 0) {
  console.error(`No SVG files found in ${ICONS_DIR}/`);
  process.exit(1);
}

mkdirSync(OUT_DIR, { recursive: true });

const seen = new Map();
const components = [];
let written = 0;
let skipped = 0;

for (const file of files) {
  const raw = readFileSync(join(ICONS_DIR, file), "utf8");
  let componentName = toComponentName(file);

  // Deduplicate names when different files map to the same component name.
  let n = 1;
  while (seen.has(componentName)) {
    n += 1;
    componentName = `${toComponentName(file)}${n}`;
  }
  seen.set(componentName, file);

  const viewBox = extractViewBox(raw);
  const inner = extractInner(raw, componentName);
  const target = join(OUT_DIR, `${componentName}.tsx`);

  if (writeIfChanged(target, componentSource(componentName, viewBox, inner))) {
    written += 1;
  } else {
    skipped += 1;
  }
  components.push(componentName);
}

// Remove stale components from deleted or renamed SVG files.
const wanted = new Set(components.map((name) => `${name}.tsx`));
let removed = 0;
for (const entry of readdirSync(OUT_DIR)) {
  if (!entry.endsWith(".tsx")) continue;
  if (!wanted.has(entry)) {
    rmSync(join(OUT_DIR, entry));
    removed += 1;
  }
}

const barrel = components
  .map((name) => `export { ${name}, type ${name}Props } from "./${name}.js";`)
  .join("\n");

if (
  writeIfChanged(
    join(OUT_DIR, "index.ts"),
    `// GENERATED CODE - DO NOT MODIFY BY HAND.\n// Run: npm run generate\n${barrel}\n`,
  )
) {
  written += 1;
} else {
  skipped += 1;
}

console.log(
  `Icons: ${components.length} total, ${written} written, ${skipped} unchanged, ${removed} removed -> ${OUT_DIR}/`,
);
