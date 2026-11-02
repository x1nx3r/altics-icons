import { build } from "esbuild";
import { readdirSync, writeFileSync, rmSync } from "node:fs";
import { join } from "node:path";

const outDir = "dist/cjs";
rmSync(outDir, { recursive: true, force: true });

function collectSources(dir) {
  const files = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectSources(path));
    } else if (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) {
      files.push(path);
    }
  }
  return files;
}

// Transpile each module separately. Do not bundle: one output file per icon
// keeps imports small and keeps the module graph identical to the ESM build.
await build({
  entryPoints: collectSources("src"),
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
