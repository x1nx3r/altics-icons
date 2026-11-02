import { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

const SETS = [
  { label: "UI", source: "icons", out: "src/icons", rootFill: "none" },
  { label: "Tech mono", source: "icons/tech/mono", out: "src/tech/mono", rootFill: "currentColor" },
  { label: "Tech color", source: "icons/tech/color", out: "src/tech/color", rootFill: "currentColor" },
];

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
  ["font-family", "fontFamily"],
  ["font-weight", "fontWeight"],
  ["font-style", "fontStyle"],
  ["text-anchor", "textAnchor"],
  ["dominant-baseline", "dominantBaseline"],
  ["alignment-baseline", "alignmentBaseline"],
  ["baseline-shift", "baselineShift"],
  ["letter-spacing", "letterSpacing"],
  ["word-spacing", "wordSpacing"],
  ["text-decoration", "textDecoration"],
  ["xlink:href", "xlinkHref"],
];

// CSS declarations that React can accept as SVG attributes.
const STYLE_ATTR_MAP = {
  "stop-color": "stopColor",
  "stop-opacity": "stopOpacity",
  fill: "fill",
  "fill-rule": "fillRule",
  "fill-opacity": "fillOpacity",
  stroke: "stroke",
  "stroke-width": "strokeWidth",
  "stroke-opacity": "strokeOpacity",
  "stroke-linecap": "strokeLinecap",
  "stroke-linejoin": "strokeLinejoin",
  "font-family": "fontFamily",
  "font-weight": "fontWeight",
  "font-style": "fontStyle",
  color: "color",
  overflow: "overflow",
};

// CSS declarations that must stay in a style object.
const STYLE_OBJECT_MAP = {
  "mask-type": "maskType",
  "mix-blend-mode": "mixBlendMode",
};

function styleToJsx(tag, css) {
  const attrs = [];
  const styleEntries = [];

  for (const declaration of css.split(";")) {
    const colon = declaration.indexOf(":");
    if (colon === -1) continue;
    const property = declaration.slice(0, colon).trim();
    const value = declaration.slice(colon + 1).trim();
    if (!property || !value) continue;

    const attr = STYLE_ATTR_MAP[property];
    if (attr) {
      // A real attribute wins over a duplicate style declaration.
      if (!new RegExp(`\\s${attr}=`).test(tag)) {
        attrs.push(`${attr}="${value.replaceAll('"', "&quot;")}"`);
      }
      continue;
    }

    const objectProperty = STYLE_OBJECT_MAP[property];
    if (objectProperty) {
      styleEntries.push(`${objectProperty}: ${JSON.stringify(value)}`);
    }
    // Other declarations are text defaults that do not affect icons.
  }

  if (styleEntries.length > 0) {
    attrs.push(`style={{ ${styleEntries.join(", ")} }}`);
  }
  return attrs.join(" ");
}

// Convert SVG presentation attributes and CSS style strings to JSX props.
function jsxAttrs(svgInner) {
  let out = svgInner.replace(
    /<([a-zA-Z][\w:-]*)([^>]*?)\sstyle="([^"]*)"([^>]*)>/g,
    (tag, tagName, before, css, after) => {
      const attrs = styleToJsx(tag, css);
      return `<${tagName}${before}${attrs ? ` ${attrs}` : ""}${after}>`;
    },
  );
  out = ATTR_MAP.reduce((acc, [from, to]) => acc.replaceAll(`${from}=`, `${to}=`), out);
  return out;
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
  inner = inner.replace(/<title>[\s\S]*?<\/title>/g, "");
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

function componentSource(componentName, viewBox, inner, rootFill) {
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
      fill="${rootFill}"
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

function generateSet({ label, source, out, rootFill }) {
  if (!existsSync(source)) {
    console.error(`Missing icon source directory: ${source}`);
    process.exitCode = 1;
    return;
  }

  const files = readdirSync(source)
    .filter((file) => file.toLowerCase().endsWith(".svg"))
    .sort();

  if (files.length === 0) {
    console.error(`No SVG files found in ${source}/`);
    process.exitCode = 1;
    return;
  }

  mkdirSync(out, { recursive: true });

  const seen = new Map();
  const components = [];
  let written = 0;
  let skipped = 0;

  for (const file of files) {
    const raw = readFileSync(join(source, file), "utf8");
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
    const target = join(out, `${componentName}.tsx`);

    if (writeIfChanged(target, componentSource(componentName, viewBox, inner, rootFill))) {
      written += 1;
    } else {
      skipped += 1;
    }
    components.push(componentName);
  }

  // Remove stale components from deleted or renamed SVG files.
  const wanted = new Set(components.map((name) => `${name}.tsx`));
  let removed = 0;
  for (const entry of readdirSync(out)) {
    if (!entry.endsWith(".tsx")) continue;
    if (!wanted.has(entry)) {
      rmSync(join(out, entry));
      removed += 1;
    }
  }

  const barrel = components
    .map((name) => `export { ${name}, type ${name}Props } from "./${name}.js";`)
    .join("\n");

  if (
    writeIfChanged(
      join(out, "index.ts"),
      `// GENERATED CODE - DO NOT MODIFY BY HAND.\n// Run: npm run generate\n${barrel}\n`,
    )
  ) {
    written += 1;
  } else {
    skipped += 1;
  }

  console.log(
    `${label}: ${components.length} total, ${written} written, ${skipped} unchanged, ${removed} removed -> ${out}/`,
  );
}

for (const set of SETS) {
  generateSet(set);
}
