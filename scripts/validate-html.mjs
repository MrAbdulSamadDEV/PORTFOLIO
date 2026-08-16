import { spawn } from "node:child_process";

const PORT = 3457;
const BASE = `http://127.0.0.1:${PORT}`;

const server = spawn(process.execPath, ["dist/server/app.js"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "pipe", "pipe"],
});

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function waitFor() {
  for (let i = 0; i < 40; i++) {
    try {
      const r = await fetch(BASE + "/");
      if (r.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error("no server");
}

function validateJsonLd(html, pageName) {
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  console.log(`\n[${pageName}] ${blocks.length} JSON-LD blocks`);
  let ok = true;
  for (const [, raw] of blocks) {
    try {
      const parsed = JSON.parse(raw);
      const types = Array.isArray(parsed) ? parsed.map((o) => o["@type"]).join(", ") : parsed["@type"];
      console.log(`  valid JSON-LD: ${types}`);
    } catch (error) {
      ok = false;
      console.log(`  INVALID JSON-LD: ${error.message}`);
      console.log(`  snippet: ${raw.slice(0, 160)}`);
    }
  }
  return ok;
}

const structureChecks = (html, pageName) => {
  const issues = [];
  const required = ["<!DOCTYPE html>", '<html lang="en"', 'class="skip-link"', "ld+json", 'rel="canonical"', "og:image"];
  for (const marker of required) {
    if (!html.includes(marker)) issues.push(`missing: ${marker}`);
  }
  const openDivs = (html.match(/<div\b/g) ?? []).length;
  const closeDivs = (html.match(/<\/div>/g) ?? []).length;
  if (openDivs !== closeDivs) issues.push(`div imbalance: ${openDivs} open / ${closeDivs} close`);
  const openSections = (html.match(/<section\b/g) ?? []).length;
  const closeSections = (html.match(/<\/section>/g) ?? []).length;
  if (openSections !== closeSections) issues.push(`section imbalance: ${openSections}/${closeSections}`);
  const imgs = [...html.matchAll(/<img\b([^>]*)\/?>/g)];
  for (const m of imgs) {
    if (!/\salt=/.test(m[1])) issues.push(`img without alt`);
    if (!/\swidth=/.test(m[1]) || !/\sheight=/.test(m[1])) issues.push(`img without dimensions`);
  }
  const links = [...html.matchAll(/<a\b([^>]*)\/?>([\s\S]*?)<\/a>/g)];
  for (const m of links) {
    const attrs = m[1];
    const inner = m[2];
    const href = /href="([^"]+)"/.exec(attrs)?.[1] ?? "";
    if (href === "") issues.push(`a without href`);
    if (attrs.includes('target="_blank"') && !attrs.includes("rel=")) issues.push(`external link missing rel`);
    if (href && !href.startsWith("#") && !href.startsWith("/") && !/^[a-z]+:/i.test(href)) issues.push(`weird href: ${href}`);
    const visibleText = inner.replace(/<[^>]+>/g, "").trim();
    if (!/\saria-label=/.test(attrs) && visibleText.length === 0) issues.push(`link without accessible name: ${href}`);
  }
  if (issues.length === 0) console.log(`[${pageName}] structure OK (${imgs.length} imgs, ${links.length} links)`);
  else issues.forEach((i) => console.log(`  [${pageName}] ${i}`));
  return issues.length === 0;
};

async function main() {
  await waitFor();
  let allOk = true;
  for (const [route, name] of [["/", "home"], ["/nope", "404"]]) {
    const html = await (await fetch(BASE + route)).text();
    allOk = validateJsonLd(html, name) && allOk;
    allOk = structureChecks(html, name) && allOk;
  }
  server.kill();
  await sleep(200);
  process.exit(allOk ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  server.kill();
  await sleep(200);
  process.exit(1);
});
