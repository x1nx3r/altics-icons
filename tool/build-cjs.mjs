import { build } from "esbuild";
import { readdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const outDir = "dist/cjs";
rmSync(outDir, { recursive: true, force: true });

const iconFiles = readdirSync("src/icons").filter((file) => file.endsWith(".tsx"));
const entryPoints = [
  "src/index.ts",
  "src/icons/index.ts",
  ...iconFiles.map((file) => join("src/icons", file)),
];

// Transpile each module separately. Do not bundle: one output file per icon
// keeps imports small and keeps the module graph identical to the ESM build.
await build({
  entryPoints,
  outdir: outDir,
  outbase: "src",
  bundle: false,
  format: "cjs",
  platform: "node",
  target: "es2020",
  jsx: "automatic",
  logLevel: "info",
});

// The package root uses "type": "module". This marker tells Node that the
// files in dist/cjs are CommonJS.
writeFileSync(join(outDir, "package.json"), '{\n  "type": "commonjs"\n}\n');
