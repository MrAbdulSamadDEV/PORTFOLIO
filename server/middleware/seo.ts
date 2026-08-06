import type { NextFunction, Request, Response } from "express";

/**
 * Permanently redirects duplicate URL variants to their canonical forms:
 *   /index.html  → /
 *   /home        → /
 *   /projects.html → /projects
 *   /projects/   → /projects
 * This prevents duplicate-content issues for search engines.
 */
export function canonicalRedirects(req: Request, res: Response, next: NextFunction): void {
  const rawPath = req.path;

  if (rawPath.endsWith(".html")) {
    const clean = rawPath.slice(0, -5);
    const target = clean === "" ? "/" : clean;
    res.redirect(301, target);
    return;
  }

  if (rawPath === "/home" || rawPath === "/home/") {
    res.redirect(301, "/");
    return;
  }

  if (rawPath !== "/" && rawPath.endsWith("/")) {
    res.redirect(301, rawPath.slice(0, -1));
    return;
  }

  next();
}

const IMMUTABLE_PREFIXES = ["/assets/", "/js/", "/fonts/", "/webfonts/", "/favicon", "/apple-touch-icon", "/icon-", "/manifest", "/browserconfig", "/og-image", "/robots.txt", "/sitemap.xml"];
const NO_CACHE_PREFIXES = ["/data/"];

/** Long cache for hashed/immutable assets, short cache for the generated AI bundle, no-cache for editable data and HTML. */
export function cacheControl(req: Request, res: Response, next: NextFunction): void {
  const pathname = req.path;

  if (pathname === "/data/ai.json") {
    res.setHeader("Cache-Control", "public, max-age=3600");
    next();
    return;
  }

  if (NO_CACHE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    res.setHeader("Cache-Control", "no-store");
    next();
    return;
  }

  if (IMMUTABLE_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    res.setHeader("Cache-Control", "public, max-age=604800");
    next();
    return;
  }

  res.setHeader("Cache-Control", "no-cache");
  next();
}
