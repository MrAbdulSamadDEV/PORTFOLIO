/**
 * Regenerates client/public/sitemap.xml and client/public/robots.txt from
 * client/data/settings.json so titles, domain and dates never drift from
 * the live site. Run automatically as part of `npm run build`.
 */
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const SETTINGS = resolve("client/data/settings.json");
const SITEMAP_OUT = resolve("client/public/sitemap.xml");
const ROBOTS_OUT = resolve("client/public/robots.txt");

function escapeXml(value) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

const settings = JSON.parse(await readFile(SETTINGS, "utf8"));
const { domain, name, ogImagePng } = settings.site;
const today = new Date().toISOString().slice(0, 10);
const homeTitle = settings.pages.home.title;

const urls = [
  {
    loc: `${domain}/`,
    changefreq: "monthly",
    priority: "1.0",
    image: { loc: `${domain}${ogImagePng}`, title: homeTitle },
  },
  { loc: `${domain}/projects`, changefreq: "weekly", priority: "0.9" },
  { loc: `${domain}/contact`, changefreq: "yearly", priority: "0.8" },
];

const urlset = urls
  .map(({ loc, changefreq, priority, image }) => {
    const imageXml = image
      ? `
    <image:image>
      <image:loc>${escapeXml(image.loc)}</image:loc>
      <image:title>${escapeXml(image.title)}</image:title>
    </image:image>`
      : "";
    return `  <url>
    <loc>${escapeXml(loc)}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>${imageXml}
  </url>`;
  })
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urlset}
</urlset>
`;

const robots = `User-agent: *
Allow: /

Sitemap: ${domain}/sitemap.xml
`;

await writeFile(SITEMAP_OUT, sitemap);
await writeFile(ROBOTS_OUT, robots);
console.log(`[build-sitemap] wrote sitemap.xml (${urls.length} URLs) + robots.txt for ${name} (${today})`);
