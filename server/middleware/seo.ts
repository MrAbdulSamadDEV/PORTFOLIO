import type { NextFunction, Request, Response } from "express";

/**
 * Permanently redirects duplicate URL variants to their canonical forms:
 *   /index.html  → /
 *   /home        → /
 *   /projects    → /#projects   (Projects is now a home-page section)
 *   /contact/    → /#contact    (Contact is now a home-page section)
 * This prevents duplicate-content issues for search engines.
 */
export function canonicalRedirects(req: Request, res: Response, next: NextFunction): void {
  const rawPath = req.path;

  if (rawPath === "/favicon.ico" || rawPath === "/favicon.svg") {
    // Legacy favicon paths browsers request automatically; the site now
    // uses /assets/logos/logo.png as its tab icon (declared via <link rel="icon">).
    res.redirect(301, "/assets/logos/logo.png");
    return;
  }

  // Projects and Contact live on the home page now; keep legacy page URLs
  // alive with 301 redirects to their sections (the client scrolls to the
  // section on load and cleans the hash from the URL).
  const legacySection: Record<string, string> = {
    "/projects": "/#projects",
    "/projects/": "/#projects",
    "/projects.html": "/#projects",
    "/contact": "/#contact",
    "/contact/": "/#contact",
    "/contact.html": "/#contact",
  };
  if (legacySection[rawPath]) {
    res.redirect(301, legacySection[rawPath]);
    return;
  }

  if (rawPath.endsWith(".html")) {
    const clean = rawPath.slice(0, -5);
    const target = clean === "" || clean === "/index" ? "/" : clean;
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

const IMMUTABLE_PREFIXES = ["/assets/", "/js/", "/fonts/", "/webfonts/", "/favicon", "/apple-touch-icon", "/icon-", "/manifest", "/robots.txt", "/sitemap.xml"];
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
