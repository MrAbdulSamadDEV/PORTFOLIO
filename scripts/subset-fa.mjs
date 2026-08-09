/**
 * Builds a Font Awesome subset for the icons the site actually uses:
 *  - client/public/css/fa-subset.min.css (few KB of CSS, down from 88 KB)
 *  - client/public/webfonts/fa-solid-900.woff2 and fa-brands-400.woff2
 *    containing only the used glyphs (a few KB, down from ~115 KB each)
 *
 * Run after editing any template that references an icon class.
 */
import { readFileSync, writeFileSync } from "node:fs";
import subsetFont from "subset-font";

const FULL = new URL("../client/public/css/fontawesome.min.css", import.meta.url);
const OUT = new URL("../client/public/css/fa-subset.min.css", import.meta.url);
const FONT_DIR = new URL("../client/public/webfonts/", import.meta.url);

const ICONS = [
  /* fa-solid */
  "arrow-right", "arrow-up", "arrow-up-right-from-square", "award", "bars",
  "bullseye", "check", "clock", "cloud", "cloud-arrow-up", "code", "copy",
  "diagram-project", "envelope", "eraser", "file-code", "file-word",
  "folder-open", "ghost", "hand-pointer", "hashtag", "house", "laptop-code",
  "layer-group", "location-dot", "magnifying-glass", "moon", "paper-plane",
  "phone", "robot", "rocket", "route", "server", "star", "sun", "tag",
  "terminal", "user", "xmark",
  /* fa-brands */
  "css3-alt", "github", "html5", "js", "linkedin", "linux", "node-js",
  "python", "x-twitter", "youtube",
];

const css = readFileSync(FULL, "utf8");

/* Base rule (family defaults + ::before content resolution). */
const baseMarker = ':before{content:var(--fa)/""}';
const base = css.slice(0, css.indexOf(baseMarker) + baseMarker.length);
const supports = css.slice(css.indexOf("@supports"), css.indexOf("@supports") + css.slice(css.indexOf("@supports")).indexOf("}}") + 2);

/* Family + @font-face blocks (brands, classic/solid). */
const brandsStart = css.indexOf(":host,:root{--fa-family-brands");
const brandsEnd = css.indexOf("--fa-style:400}") + "--fa-style:400}".length;
const brands = css.slice(brandsStart, brandsEnd);

const classicStart = css.indexOf(":host,:root{--fa-family-classic");
const classicEnd = css.indexOf("--fa-style:900}") + "--fa-style:900}".length;
const classic = css.slice(classicStart, classicEnd);

/* Per-icon --fa definitions (aliases come first in each selector list,
   so match rules whose selector list contains the icon name). */
const used = new Set(ICONS.map((name) => `fa-${name}`));
const missing = [];
const iconRules = [];
for (const rule of css.matchAll(/([^{}]+)\{--fa:"[^"]*"\}/g)) {
  const [full, selectors] = rule;
  const classes = selectors.split(",").map((s) => s.trim().replace(/^\./, ""));
  const hit = classes.find((c) => used.has(c));
  if (hit) {
    iconRules.push(full);
    used.delete(hit);
  }
}

if (used.size) {
  throw new Error(`subset-fa: icons missing from fontawesome.min.css: ${[...used].join(", ")}`);
}

const subset = `${base}${supports}${brands}${classic}${iconRules.join("")}`;
writeFileSync(OUT, subset);

/* Map every icon name to the glyph it resolves to (alias rules included). */
const codeByIcon = new Map();
for (const rule of iconRules) {
  const code = rule.match(/\{--fa:"\\?([^"]+)"\}/)[1];
  const classes = rule.slice(0, rule.indexOf("{")).split(",").map((s) => s.trim().replace(/^\./, ""));
  for (const c of classes) codeByIcon.set(c, code);
}
const toGlyph = (name) => {
  const raw = codeByIcon.get(`fa-${name}`);
  const hex = raw.match(/^([0-9a-fA-F]{1,6})\s?$/);
  return hex ? String.fromCodePoint(parseInt(hex[1], 16)) : raw;
};
const BRANDS = ["css3-alt", "github", "html5", "js", "linkedin", "linux", "node-js", "python", "x-twitter", "youtube"];

/* Subset the icon fonts to the glyphs actually used. */
for (const [file, names] of [
  ["fa-solid-900.woff2", ICONS.filter((n) => !BRANDS.includes(n))],
  ["fa-brands-400.woff2", BRANDS],
]) {
  const fullFont = readFileSync(new URL(file, FONT_DIR));
  const slim = await subsetFont(fullFont, names.map(toGlyph).join(""), { targetFormat: "woff2" });
  writeFileSync(new URL(file, FONT_DIR), slim);
  console.log(
    `[subset-fa] ${file}: ${(fullFont.length / 1024).toFixed(0)} KB -> ${(slim.length / 1024).toFixed(0)} KB (${names.length} glyphs)`,
  );
}

console.log(`[subset-fa] ${FULL.pathname.split("/").pop()} -> ${OUT.pathname.split("/").pop()} (${subset.length} bytes, ${ICONS.length} icons)`);
