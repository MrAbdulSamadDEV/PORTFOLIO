/**
 * Generates every image asset the site references, using sharp:
 *   profile, project thumbnails, OG image, favicons, logo.
 * All artwork is procedurally drawn (SVG → raster) so the repo needs no
 * binary sources. Rerunnable: `npm run assets`.
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const OUT = path.resolve("client/public");
const PINK = "#ffb6c1";
const PINK_DEEP = "#f26d86";
const DARK = "#222222";

/* ------------------------------------------------------------------ */
/* SVG helpers                                                         */
/* ------------------------------------------------------------------ */

function gradientRect(w, h, stops, angle = 135) {
  const id = "g";
  const stopsSvg = stops
    .map(([color, offset]) => `<stop offset="${offset}" stop-color="${color}"/>`)
    .join("");
  return `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(${angle} 0.5 0.5)">${stopsSvg}</linearGradient></defs>
  <rect width="${w}" height="${h}" fill="url(#${id})"/>`;
}

function dotsPattern(step = 56, radius = 2.5, color = "rgba(255,255,255,0.55)") {
  return `<defs><pattern id="dots" width="${step}" height="${step}" patternUnits="userSpaceOnUse"><circle cx="${step / 2}" cy="${step / 2}" r="${radius}" fill="${color}"/></pattern></defs>`;
}

function decorativeCircles(w, h, color = "rgba(255,255,255,0.18)") {
  return [
    `<circle cx="${w * 0.85}" cy="${h * 0.15}" r="${Math.min(w, h) * 0.28}" fill="${color}"/>`,
    `<circle cx="${w * 0.12}" cy="${h * 0.85}" r="${Math.min(w, h) * 0.2}" fill="${color}"/>`,
    `<circle cx="${w * 0.92}" cy="${h * 0.9}" r="${Math.min(w, h) * 0.1}" fill="${color}"/>`,
  ].join("");
}

/* ------------------------------------------------------------------ */
/* Raster targets                                                      */
/* ------------------------------------------------------------------ */

const PROJECTS = [
  { slug: "furnecher", from: "#ffd3dc", to: "#f26d86", glyph: "F" },
];

/* ------------------------------------------------------------------ */
/* Drawers                                                             */
/* ------------------------------------------------------------------ */

function drawCard({ w, h, from, to, glyph }) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${gradientRect(w, h, [[from, "0%"], [to, "100%"]], 135)}
    ${dotsPattern(64, 3, "rgba(255,255,255,0.35)")}
    <rect width="${w}" height="${h}" fill="url(#dots)"/>
    ${decorativeCircles(w, h, "rgba(255,255,255,0.16)")}
    <rect x="${w * 0.055}" y="${h * 0.075}" width="${w * 0.89}" height="${h * 0.85}" rx="24" fill="rgba(255,255,255,0.16)" stroke="rgba(255,255,255,0.6)" stroke-width="2"/>
    <circle cx="${w / 2}" cy="${h / 2}" r="${Math.min(w, h) * 0.21}" fill="rgba(255,255,255,0.92)"/>
    <text x="${w / 2}" y="${h / 2 + Math.min(w, h) * 0.075}" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="${Math.min(w, h) * 0.13}" font-weight="700" fill="#222222">${glyph}</text>
    <circle cx="${w * 0.78}" cy="${h * 0.28}" r="10" fill="#ffb6c1"/>
    <circle cx="${w * 0.8}" cy="${h * 0.3}" r="4" fill="rgba(255,255,255,0.9)"/>
  </svg>`;
}

function drawProfile(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${gradientRect(size, size, [["#ffd3dc", "0%"], ["#f26d86", "100%"]], 135)}
    ${dotsPattern(72, 3.5, "rgba(255,255,255,0.3)")}
    <circle cx="${size * 0.82}" cy="${size * 0.18}" r="${size * 0.3}" fill="rgba(255,255,255,0.22)"/>
    <circle cx="${size * 0.1}" cy="${size * 0.9}" r="${size * 0.22}" fill="rgba(255,255,255,0.18)"/>
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.455}" fill="rgba(255,255,255,0.92)"/>
    <circle cx="${size * 0.5}" cy="${size * 0.5}" r="${size * 0.455}" fill="none" stroke="rgba(255,255,255,0.85)" stroke-width="6"/>
    <circle cx="${size * 0.5}" cy="${size * 0.42}" r="${size * 0.15}" fill="#222222"/>
    <path d="M ${size * 0.5 - 0.3 * size} ${size * 0.95} a ${size * 0.31} ${size * 0.26} 0 0 1 ${size * 0.6} 0 z" fill="#222222"/>
    <circle cx="${size * 0.36}" cy="${size * 0.35}" r="5" fill="#ffb6c1"/>
  </svg>`;
}

function drawFaviconDark(size) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="#121212"/>
    <circle cx="${size / 2}" cy="${size * 0.47}" r="${size * 0.42}" fill="#ffffff"/>
    <circle cx="${size / 2}" cy="${size * 0.41}" r="${size * 0.145}" fill="#222222"/>
    <path d="M ${size * 0.19} ${size * 0.97} a ${size * 0.31} ${size * 0.26} 0 0 1 ${size * 0.62} 0 z" fill="#222222"/>
    <circle cx="${size * 0.37}" cy="${size * 0.36}" r="${size * 0.05}" fill="#f26d86"/>
  </svg>`;
}

function drawOgImage() {
  const w = 1200;
  const h = 630;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    ${gradientRect(w, h, [["#ffffff", "0%"], ["#fff1f4", "70%"], ["#ffd9e0", "100%"]], 90)}
    ${dotsPattern(80, 3.5, "rgba(242,109,134,0.18)")}
    <rect width="${w}" height="${h}" fill="url(#dots)"/>
    <circle cx="1030" cy="120" r="240" fill="rgba(242,109,134,0.16)"/>
    <circle cx="140" cy="560" r="180" fill="rgba(255,182,193,0.35)"/>
    <circle cx="${w - 150}" cy="${h - 90}" r="60" fill="#ffb6c1"/>
    <circle cx="1150" cy="90" r="90" fill="rgba(255,255,255,0.8)"/>
    <circle cx="980" cy="240" r="200" fill="url(#g2)"/>
    <defs><linearGradient id="g2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffd3dc"/><stop offset="1" stop-color="#f26d86"/></linearGradient></defs>
    <circle cx="980" cy="240" r="200" fill="url(#g2)"/>
    <circle cx="980" cy="196" r="70" fill="#222222"/>
    <path d="M 850 430 a 130 110 0 0 1 260 0 z" fill="#222222"/>
    <text x="150" y="270" font-family="Arial, Helvetica, sans-serif" font-size="96" font-weight="700" fill="#222222">Abdul Samad</text>
    <text x="152" y="330" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#444444">Cloud Data Engineering Student</text>
    <text x="152" y="382" font-family="Arial, Helvetica, sans-serif" font-size="40" fill="#444444">Full Stack Developer</text>
    <rect x="152" y="420" width="220" height="14" rx="7" fill="#ffb6c1"/>
    <rect x="390" y="420" width="90" height="14" rx="7" fill="#f26d86"/>
    <text x="152" y="500" font-family="Arial, Helvetica, sans-serif" font-size="26" fill="#666666">mrabdulsamaddev.vercel.app</text>
  </svg>`;
}

function drawAppIcon(size, maskable = false) {
  const pad = maskable ? size * 0.2 : 0;
  const r = maskable ? size * 0.4 : size * 0.46;
  const cx = size / 2;
  const cy = size / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${gradientRect(size, size, [["#ffd3dc", "0%"], ["#f26d86", "100%"]], 135)}
    ${dotsPattern(size / 5, size * 0.006, "rgba(255,255,255,0.3)")}
    <rect width="${size}" height="${size}" fill="url(#dots)"/>
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="rgba(255,255,255,0.95)"/>
    <circle cx="${cx}" cy="${cy - size * 0.1}" r="${r * 0.34}" fill="#222222"/>
    <path d="M ${cx - r * 0.62} ${size} a ${r * 0.62} ${r * 0.5} 0 0 1 ${r * 1.24} 0 z" fill="#222222"/>
    <rect x="${pad}" y="${pad}" width="${size - pad * 2}" height="${size - pad * 2}" rx="${size * 0.22}" fill="none" stroke="rgba(255,255,255,0.9)" stroke-width="${size * 0.02}"/>
  </svg>`;
}

/* ------------------------------------------------------------------ */
/* Output helpers                                                      */
/* ------------------------------------------------------------------ */

const outputPath = (...parts) => path.join(OUT, ...parts);

async function writeRaster(svg, filePath, { width, format }) {
  const sharpImage = sharp(Buffer.from(svg));
  const image =
    width === undefined
      ? sharpImage
      : sharpImage.resize({ width, withoutEnlargement: false });
  const buffer = await image[format]({ quality: format === "webp" ? 86 : 100 }).toBuffer();
  await writeFile(filePath, buffer);
}

async function writePngBuffer(buffer, filePath) {
  await writeFile(filePath, buffer);
}

async function main() {
  const startedAt = Date.now();

  await mkdir(outputPath("assets", "profile"), { recursive: true });
  await mkdir(outputPath("assets", "projects"), { recursive: true });
  await mkdir(outputPath("assets", "logos"), { recursive: true });

  /* Profile (WebP only — PNG fallback no longer shipped) */
  const profileSvg = drawProfile(480);
  await writeRaster(profileSvg, outputPath("assets", "profile", "professional-headshot.webp"), { width: 480, format: "webp" });

  /* Projects */
  for (const project of PROJECTS) {
    const svg = drawCard({ w: 800, h: 500, from: project.from, to: project.to, glyph: project.glyph });
    await writeRaster(svg, outputPath("assets", "projects", `${project.slug}.webp`), { width: 800, format: "webp" });
    await writeRaster(svg, outputPath("assets", "projects", `${project.slug}.png`), { width: 800, format: "png" });
  }

  /* OG image (PNG only — every social platform renders it reliably) */
  const ogSvg = drawOgImage();
  await writeRaster(ogSvg, outputPath("assets", "og-image.png"), { format: "png" });

  /* Dark-theme tab favicon (PNG so Chrome, Edge, Firefox and Safari all
     render it — SVG favicons with embedded rasters are not supported
     everywhere and must never be declared as image/png). */
  const faviconDarkSvg = drawFaviconDark(64);
  await writeRaster(faviconDarkSvg, outputPath("favicon-dark.png"), { format: "png" });

  for (const [name, size] of [
    ["icon-192", 192],
    ["icon-512", 512],
  ]) {
    const svg = drawAppIcon(size);
    await writeRaster(svg, outputPath(`${name}.png`), { format: "png" });
  }

  const maskableSvg = drawAppIcon(512, true);
  await writeRaster(maskableSvg, outputPath("icon-512-maskable.png"), { format: "png" });

  /* App icon raster targets */
  const appleSvg = drawAppIcon(180);
  await writeRaster(appleSvg, outputPath("apple-touch-icon.png"), { format: "png" });

  console.log(`[assets] generated everything in ${Date.now() - startedAt} ms`);
}

main().catch((error) => {
  console.error("[assets] failed:", error);
  process.exitCode = 1;
});
