/**
 * Client bundler: replaces the per-module tsc emit with three tiny esbuild
 * bundles so the browser loads 4 JS files instead of 17:
 *
 *   client/public/js/
 *     main.js                  entry: main.ts (nav, cursor, background, theme…)
 *     theme-init.js            first-paint theme bootstrap (classic script)
 *     components/AI/ai.js      MAX AI widget (lazy chunk, fetched on open)
 *     components/AI/engine.js  MAX AI answer engine (shared with tests)
 *     components/Shared/command-palette.js  command palette (lazy chunk)
 *
 * main.js keeps `import("./components/AI/ai.js")` and
 * `import("./components/Shared/command-palette.js")` as external dynamic
 * imports, and ai.js keeps `import("./engine.js")` external, so both
 * interactive features load lazily and never touch initial page load.
 *
 * Type errors are caught earlier by `tsc -p tsconfig.client.json --noEmit`,
 * which runs before this script in `npm run build:client`.
 */
import { build } from "esbuild";
import { rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "client", "src");
const OUT = path.join(ROOT, "client", "public", "js");

const common = {
  bundle: true,
  format: "esm",
  target: "es2020",
  minify: true,
  sourcemap: false,
  logLevel: "warning",
};

async function main() {
  await rm(OUT, { recursive: true, force: true });

  await build({
    ...common,
    entryPoints: { "main": path.join(SRC, "main.ts") },
    external: ["./components/AI/ai.js", "./components/Shared/command-palette.js"],
    outdir: OUT,
  });

  await build({
    ...common,
    entryPoints: { "components/Shared/command-palette": path.join(SRC, "components", "Shared", "command-palette.ts") },
    outdir: OUT,
  });

  await build({
    ...common,
    entryPoints: { "components/AI/ai": path.join(SRC, "components", "AI", "ai.ts") },
    external: ["./engine.js"],
    outdir: OUT,
  });

  await build({
    ...common,
    entryPoints: { "components/AI/engine": path.join(SRC, "components", "AI", "engine.ts") },
    outdir: OUT,
  });

  await build({
    ...common,
    entryPoints: { "theme-init": path.join(SRC, "theme-init.ts") },
    outdir: OUT,
  });

  console.log("[build-client] bundled main.js, components/AI/{ai,engine}.js, components/Shared/command-palette.js, theme-init.js");
}

main().catch((error) => {
  console.error("[build-client] failed:", error);
  process.exit(1);
});
