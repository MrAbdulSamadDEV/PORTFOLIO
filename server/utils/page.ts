import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { PATHS } from "../config/env.js";
import type { SiteSettings } from "../config/site.js";
import { escapeJsonLd } from "./html.js";

/**
 * Loads client/index.html once at startup and injects the
 * per-page SEO payload (title, meta, canonical, JSON-LD) plus
 * the server-rendered body sections.
 */

export interface PageOptions {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  robots?: string;
  ogType?: string;
  ogTitle?: string;
  ogDescription?: string;
  jsonLd: unknown[];
  bodyClass: string;
  body: string;
  nav: string;
  drawer: string;
  socialRail: string;
  footer: string;
  backToTop: string;
  aiWidget: string;
  /** Only the Home page ships the loading screen markup. */
  showLoader?: boolean;
  /** Only the Home page preloads the hero photo. */
  preloadHero?: boolean;
}

let templateCache: string | null = null;
let criticalCssCache: string | null = null;

/**
 * The loading screen markup is server-rendered on the Home page only, so
 * no other page ever contains it (zero download, zero flash). The client
 * additionally hides it on repeat Home loads within the same session.
 */
function renderLoader(): string {
  return `<div class="page-loader" data-loader aria-hidden="true">
    <div class="page-loader__emblem">
      <span class="page-loader__ring page-loader__ring--outer" aria-hidden="true"></span>
      <span class="page-loader__ring page-loader__ring--arc" aria-hidden="true"></span>
      <span class="page-loader__particle page-loader__particle--1" aria-hidden="true"></span>
      <span class="page-loader__particle page-loader__particle--2" aria-hidden="true"></span>
      <span class="page-loader__particle page-loader__particle--3" aria-hidden="true"></span>
      <span class="page-loader__particle page-loader__particle--4" aria-hidden="true"></span>
      <img class="page-loader__logo" src="/assets/logos/logo.png" alt="" width="52" height="52" fetchpriority="high">
    </div>
    <div class="page-loader__progress" aria-hidden="true"><span class="page-loader__bar"></span></div>
    <p class="page-loader__text">Preparing Experience...</p>
  </div>`;
}

function loadTemplate(): string {
  if (templateCache === null) {
    templateCache = readFileSync(PATHS.template, "utf8");
  }
  return templateCache;
}

/**
 * All site CSS plus the Font Awesome subset (only the icons this site
 * uses, ~3 KB) is inlined into a single <style> block in every page.
 * This removes every render-blocking stylesheet request from the critical
 * path; the whole inline stylesheet is still the exact same rules the
 * browser would have downloaded, so no CSS needs to be duplicated.
 */
function loadCriticalCss(): string {
  if (criticalCssCache === null) {
    const ordered = ["fonts.css", "base.css", "layout.css", "components.css", "sections.css", "effects.css", "responsive.css"];
    criticalCssCache = readdirSync(PATHS.styles)
      .filter((file) => ordered.includes(file))
      .sort((a, b) => ordered.indexOf(a) - ordered.indexOf(b))
      .map((file) => readFileSync(join(PATHS.styles, file), "utf8"))
      .concat(readFileSync(join(PATHS.public, "css", "fa-subset.min.css"), "utf8"))
      .join("\n");
  }
  return criticalCssCache;
}

/** Derives the Twitter/X handle (e.g. @username) from the socials list. */
function twitterHandle(site: SiteSettings): string {
  const x = site.socials.find((social) => social.name === "X");
  const match = x?.url.match(/x\.com\/([^/]+)/) ?? x?.url.match(/twitter\.com\/([^/]+)/);
  return match ? `@${match[1]}` : "";
}

export function renderPage(site: SiteSettings, options: PageOptions): string {
  const domain = site.site.domain;
  // PNG Open Graph image: every social platform (Facebook, WhatsApp,
  // LinkedIn, Telegram) renders PNG reliably; WebP support is inconsistent.
  const ogImage = `${domain}${site.site.ogImagePng}`;
  const twitter = twitterHandle(site);

  const replacements: Record<string, string> = {
    "%%HTML_LANG%%": site.site.language,
    "%%PAGE_TITLE%%": options.title,
    "%%PAGE_DESCRIPTION%%": options.description,
    "%%PAGE_KEYWORDS%%": options.keywords,
    "%%PAGE_AUTHOR%%": site.site.author,
    "%%PAGE_ROBOTS%%": options.robots ?? "index, follow, max-image-preview:large",
    "%%THEME_COLOR%%": site.site.themeColor,
    "%%CRITICAL_CSS%%": loadCriticalCss(),
    "%%PAGE_CANONICAL%%": options.canonical,
    "%%OG_TYPE%%": options.ogType ?? "website",
    "%%OG_SITE_NAME%%": `${site.site.name} — Portfolio`,
    "%%OG_TITLE%%": options.ogTitle ?? options.title,
    "%%OG_DESCRIPTION%%": options.ogDescription ?? options.description,
    "%%OG_IMAGE%%": ogImage,
    "%%OG_IMAGE_ALT%%": site.site.ogImageAlt,
    "%%OG_LOCALE%%": "en_US",
    "%%TWITTER_HANDLE%%": twitter,
    "%%PAGE_JSONLD%%": escapeJsonLd(options.jsonLd),
    "%%BODY_CLASS%%": options.bodyClass,
    "%%MAIN_CONTENT%%": options.body,
    "%%NAV%%": options.nav,
    "%%MOBILE_DRAWER%%": options.drawer,
    "%%SOCIAL_RAIL%%": options.socialRail,
    "%%FOOTER%%": options.footer,
    "%%BACK_TO_TOP%%": options.backToTop,
    "%%AI_WIDGET%%": options.aiWidget,
    "%%LOADER%%": options.showLoader === true ? renderLoader() : "",
    "%%HERO_PRELOAD%%": options.preloadHero === true ? '<link rel="preload" href="/assets/hero/hero.webp" as="image" media="(min-width: 768px)">' : "",
  };

  let html = loadTemplate();
  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }
  return html;
}
