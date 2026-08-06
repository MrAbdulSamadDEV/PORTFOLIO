/**
 * Vercel Build Output API (v3) generator.
 *
 * Produces .vercel/output from the standard `npm run build` artifacts:
 *
 *   .vercel/output/
 *     config.json                 v3 routing (static first, rest to lambda)
 *     static/                     client/public + styles (as /css) + data (as /data)
 *     functions/index.func/       self-contained Express SSR lambda
 *       index.js                  esbuild bundle of dist/server/app.js
 *       .vc-config.json           nodejs20.x runtime
 *       package.json, client/     runtime assets (JSON data, HTML template, static fallback)
 *
 * Static assets are served from Vercel's CDN; every other request is routed
 * to the Express lambda, which performs SSR and also serves any asset that
 * missed the static layer (mirrors the local express.static behavior).
 */
import { build } from "esbuild";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(ROOT, ".vercel", "output");
const STATIC = path.join(OUT, "static");
const FUNC = path.join(OUT, "functions", "index.func");

const CLIENT = path.join(ROOT, "client");
const DIST_SERVER = path.join(ROOT, "dist", "server");

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(path.join(FUNC, "client"), { recursive: true });
  await mkdir(STATIC, { recursive: true });

  // 1. Static assets served by Vercel's CDN (paths match the Express mounts).
  await cp(path.join(CLIENT, "public"), STATIC, { recursive: true });
  await cp(path.join(CLIENT, "styles"), path.join(STATIC, "css"), { recursive: true });
  await cp(path.join(CLIENT, "data"), path.join(STATIC, "data"), { recursive: true });

  // 2. Bundle the whole Express SSR app into one self-contained ESM file.
  await build({
    entryPoints: [path.join(DIST_SERVER, "app.js")],
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node20",
    minify: true,
    sourcemap: false,
    logLevel: "info",
    banner: {
      js: `import { createRequire as __vercelCreateRequire } from "node:module";\nconst require = __vercelCreateRequire(import.meta.url);`,
    },
    outfile: path.join(FUNC, "index.js"),
  });

  // 3. Runtime files the server reads (JSON data, HTML template, static
  //    fallback) plus package.json so findProjectRoot() locates the root.
  await cp(path.join(ROOT, "package.json"), path.join(FUNC, "package.json"));
  await cp(CLIENT, path.join(FUNC, "client"), { recursive: true });

  // 4. Function runtime descriptor.
  await writeFile(
    path.join(FUNC, ".vc-config.json"),
    JSON.stringify({ runtime: "nodejs20.x", handler: "index.js", launcherType: "Nodejs" }, null, 2),
  );

  // 5. Routing: static files first (served by the edge CDN), then every
  //    remaining request to the SSR lambda at /index.
  const config = {
    version: 3,
    routes: [{ handle: "filesystem" }, { src: "/(.*)", dest: "/index" }],
  };
  await writeFile(path.join(OUT, "config.json"), JSON.stringify(config, null, 2));

  const funcBytes = (await readFile(path.join(FUNC, "index.js"))).length;
  console.log(`[vercel-build] SSR lambda bundle: ${(funcBytes / 1024).toFixed(0)} KiB`);
  console.log("[vercel-build] Build Output API written to .vercel/output");
}

main().catch((error) => {
  console.error("[vercel-build] failed:", error);
  process.exit(1);
});
