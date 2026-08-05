import { readFileSync } from "node:fs";
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
}

let templateCache: string | null = null;

function loadTemplate(): string {
  if (templateCache === null) {
    templateCache = readFileSync(PATHS.template, "utf8");
  }
  return templateCache;
}

export function renderPage(site: SiteSettings, options: PageOptions): string {
  const domain = site.site.domain;
  const ogImage = `${domain}${site.site.ogImage}`;

  const replacements: Record<string, string> = {
    "%%HTML_LANG%%": site.site.language,
    "%%PAGE_TITLE%%": options.title,
    "%%PAGE_DESCRIPTION%%": options.description,
    "%%PAGE_KEYWORDS%%": options.keywords,
    "%%PAGE_AUTHOR%%": site.site.author,
    "%%PAGE_ROBOTS%%": options.robots ?? "index, follow, max-image-preview:large",
    "%%THEME_COLOR%%": site.site.themeColor,
    "%%PAGE_CANONICAL%%": options.canonical,
    "%%OG_TYPE%%": options.ogType ?? "website",
    "%%OG_SITE_NAME%%": `${site.site.name} — Portfolio`,
    "%%OG_TITLE%%": options.ogTitle ?? options.title,
    "%%OG_DESCRIPTION%%": options.ogDescription ?? options.description,
    "%%OG_IMAGE%%": ogImage,
    "%%OG_LOCALE%%": "en_US",
    "%%PAGE_JSONLD%%": escapeJsonLd(options.jsonLd),
    "%%BODY_CLASS%%": options.bodyClass,
    "%%MAIN_CONTENT%%": options.body,
    "%%NAV%%": options.nav,
    "%%MOBILE_DRAWER%%": options.drawer,
    "%%SOCIAL_RAIL%%": options.socialRail,
    "%%FOOTER%%": options.footer,
    "%%BACK_TO_TOP%%": options.backToTop,
    "%%AI_WIDGET%%": options.aiWidget,
  };

  let html = loadTemplate();
  for (const [token, value] of Object.entries(replacements)) {
    html = html.split(token).join(value);
  }
  return html;
}
