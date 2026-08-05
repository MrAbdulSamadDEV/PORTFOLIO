import path from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";

/**
 * Finds the project root by walking up from this module until a directory
 * containing package.json and client/ is found. Works both under tsx
 * (server/config/env.ts) and compiled output (dist/server/config/env.js).
 */
function findProjectRoot(): string {
  let current = path.dirname(fileURLToPath(import.meta.url));
  while (path.dirname(current) !== current) {
    if (existsSync(path.join(current, "package.json")) && existsSync(path.join(current, "client"))) {
      return current;
    }
    current = path.dirname(current);
  }
  throw new Error("Could not locate project root (package.json + client/ not found)");
}

export const PROJECT_ROOT = findProjectRoot();

export const PATHS = {
  projectRoot: PROJECT_ROOT,
  client: path.join(PROJECT_ROOT, "client"),
  data: path.join(PROJECT_ROOT, "client", "data"),
  public: path.join(PROJECT_ROOT, "client", "public"),
  styles: path.join(PROJECT_ROOT, "client", "styles"),
  template: path.join(PROJECT_ROOT, "client", "index.html"),
} as const;

export const PORT = Number(process.env.PORT ?? 3000);

export const NODE_ENV = process.env.NODE_ENV ?? "development";
export const IS_PRODUCTION = NODE_ENV === "production";
