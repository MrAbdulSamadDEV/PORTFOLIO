/**
 * Smoke test: boots the built server and validates routes, redirects,
 * headers, structured data, and every asset referenced by the data files.
 * Run with: npm run build && npm run smoke   (or: npm test)
 */

import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";

const PORT = 3456;
const BASE = `http://127.0.0.1:${PORT}`;
const ROOT = path.resolve(".");

const failures = [];
let checks = 0;

function check(label, ok, extra = "") {
  checks += 1;
  if (!ok) {
    failures.push(`${label}${extra ? ` — ${extra}` : ""}`);
    console.error(`  FAIL ${label}${extra ? ` — ${extra}` : ""}`);
  } else {
    console.log(`  ok   ${label}`);
  }
}

async function fetchText(url) {
  const response = await fetch(url);
  return { response, text: await response.text() };
}

function getJson(filePath) {
  return JSON.parse(readFileSync(path.join(ROOT, filePath), "utf8"));
}

/* ------------------------------------------------------------------ */
/* Wait for the server                                                 */
/* ------------------------------------------------------------------ */

const server = spawn(process.execPath, ["dist/server/app.js"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverLogs = "";
server.stdout.on("data", (chunk) => (serverLogs += chunk));
server.stderr.on("data", (chunk) => (serverLogs += chunk));

async function waitForServer(attemptsLeft = 50) {
  if (attemptsLeft <= 0) throw new Error("server did not start");
  try {
    const { response } = await fetchText(BASE + "/");
    if (response.ok) return;
  } catch {
    /* not up yet */
  }
  await new Promise((resolve) => setTimeout(resolve, 200));
  return waitForServer(attemptsLeft - 1);
}

/* ------------------------------------------------------------------ */
/* Tests                                                               */
/* ------------------------------------------------------------------ */

async function main() {
  console.log("[smoke] starting server on port", PORT);
  await waitForServer();

  try {
    /* Pages */
    for (const [route, marker, expectedStatus] of [
      ["/", "data-nav-action", 200],
      ["/projects", "page-projects", 200],
      ["/contact", "page-contact", 200],
      ["/nope-missing-page", "page-404", 404],
    ]) {
      const { response, text } = await fetchText(BASE + route);
      check(`${route} status ${expectedStatus}`, response.status === expectedStatus, `got ${response.status}`);
      check(`${route} markers`, text.includes(marker) && text.includes("Abdul Samad"), "missing markers");
      check(`${route} JSON-LD`, text.includes('application/ld+json'), "no JSON-LD");
    }

    /* Canonical redirects */
    for (const [from, to] of [
      ["/projects.html", "/projects"],
      ["/home", "/"],
      ["/projects/", "/projects"],
      ["/contact.html", "/contact"],
    ]) {
      const response = await fetch(BASE + from, { redirect: "manual" });
      check(`redirect ${from} -> ${to}`, response.status === 301 && response.headers.get("location")?.endsWith(to), `status ${response.status} location ${response.headers.get("location")}`);
    }

    /* Headers */
    const home = await fetchText(BASE + "/");
    check("CSP header", (home.response.headers.get("content-security-policy") ?? "").includes("default-src 'self'"));
    check("no x-powered-by", home.response.headers.get("x-powered-by") === null);
    check("compression gzip", (home.response.headers.get("content-encoding") ?? "").includes("gzip"));

    /* Static assets */
    const staticFiles = [
      "/js/main.js",
      "/css/base.css",
      "/css/layout.css",
      "/css/components.css",
      "/css/sections.css",
      "/css/effects.css",
      "/css/responsive.css",
      "/css/fonts.css",
      "/css/fontawesome.min.css",
      "/webfonts/fa-solid-900.woff2",
      "/fonts/inter-latin-400.woff2",
      "/fonts/space-grotesk-latin-600.woff2",
      "/data/settings.json",
      "/data/projects.json",
      "/data/ai.json",
      "/robots.txt",
      "/sitemap.xml",
      "/manifest.json",
      "/browserconfig.xml",
      "/favicon.ico",
      "/favicon.svg",
      "/apple-touch-icon.png",
      "/icon-192.png",
      "/icon-512.png",
      "/icon-512-maskable.png",
      "/assets/logos/logo.svg",
      "/assets/og-image.webp",
      "/assets/og-image.png",
      "/assets/profile/profile.webp",
      "/assets/profile/profile.png",
    ];
    for (const file of staticFiles) {
      try {
        const response = await fetch(BASE + file);
        check(`static ${file}`, response.status === 200, `got ${response.status}`);
      } catch (error) {
        check(`static ${file}`, false, `fetch failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    /* Every referenced data asset exists on disk and is served */
    const settings = getJson("client/data/settings.json");
    const projects = getJson("client/data/projects.json");
    const aiData = getJson("client/data/ai.json");

    const referencedPaths = [];
    const site = settings.site;
    referencedPaths.push(site.logo, site.profileImage, site.profileImagePng, site.ogImage, site.ogImagePng);
    for (const project of projects) referencedPaths.push(project.image, project.imagePng);

    for (const assetPath of new Set(referencedPaths)) {
      const response = await fetch(BASE + assetPath);
      check(`data asset ${assetPath}`, response.status === 200, `got ${response.status}`);
    }

    /* Content data integrity */
    check("ai.json faqs count >= 100", aiData.faqs.length >= 100, `${aiData.faqs.length}`);
    check("ai.json unique ids", new Set(aiData.faqs.map((f) => f.id)).size === aiData.faqs.length);
    check("projects.json unique ids", new Set(projects.map((p) => p.id)).size === projects.length);
    check("projects.json featured >= 4", projects.filter((p) => p.featured).length >= 4);
    check("settings nav sections unique", new Set(settings.nav.map((n) => n.section)).size === settings.nav.length);
    check("settings socials >= 6", settings.socials.length >= 6);

    /* Nav active state */
    const projectsPage = await fetchText(BASE + "/projects");
    check("nav active on /projects", projectsPage.text.includes('class="site-nav__link is-active"') && projectsPage.text.includes('aria-label="Projects"'), "no active nav link");
    const contactPage = await fetchText(BASE + "/contact");
    check("nav active on /contact", contactPage.text.includes('class="site-nav__link is-active"') && contactPage.text.includes('aria-label="Contact"'), "no active nav link");

    /* Page content completeness */
    const allProjectsHtml = projectsPage.text;
    const cardCount = (allProjectsHtml.match(/data-category="/g) ?? []).length;
    check("projects page renders all 10 cards", cardCount === projects.length, `found ${cardCount}`);
    const homeHtml = home.text;
    for (const section of ["about", "skills", "featured-projects", "contact"]) {
      check(`home has #${section}`, homeHtml.includes(`id="${section}"`));
    }
    const featuredCount = (homeHtml.match(/class="project-card reveal"/g) ?? []).length;
    check("home shows featured projects", featuredCount === projects.filter((p) => p.featured).length, `found ${featuredCount}`);

    /* No duplicate element ids */
    for (const [route, html] of [["/", home.text], ["/projects", allProjectsHtml], ["/contact", contactPage.text]]) {
      const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
      const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
      check(`no duplicate ids on ${route}`, duplicates.length === 0, `dupes: ${[...new Set(duplicates)].join(", ")}`);
    }

    /* Forbidden content rules */
    const forbidden = ["offline", "localhost", "TODO", "lorem ipsum", "placeholder image"];
    for (const route of ["/", "/projects", "/contact", "/nope-missing-page"]) {
      const { text } = await fetchText(BASE + route);
      for (const word of forbidden) {
        check(`no "${word}" on ${route}`, !text.toLowerCase().includes(word));
      }
    }
    const aiPage = await fetchText(BASE + "/");
    const normalizedPage = aiPage.text.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
    check("ai.json welcome used", normalizedPage.includes(aiData.welcome.split(" ").slice(0, 4).join(" ")));

    console.log("\n[smoke] summary:", checks - failures.length, "of", checks, "checks passed");
  } finally {
    server.kill();
  }

  if (failures.length > 0) {
    console.error("\n[smoke] FAILURES:");
    for (const failure of failures) console.error("  -", failure);
    console.error("\n[smoke] server log:\n" + serverLogs.slice(-4000));
    server.kill();
    await new Promise((resolve) => setTimeout(resolve, 200));
    process.exit(1);
  }
  server.kill();
  await new Promise((resolve) => setTimeout(resolve, 200));
  process.exit(0);
}

main().catch(async (error) => {
  console.error("[smoke] crashed:", error);
  console.error("[smoke] server log:\n" + serverLogs.slice(-4000));
  server.kill();
  await new Promise((resolve) => setTimeout(resolve, 200));
  process.exit(1);
});
