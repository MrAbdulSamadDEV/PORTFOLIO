import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

const PORT = 3471;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const server = spawn(process.execPath, ["dist/server/app.js"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "ignore", "pipe"],
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      if ((await fetch(BASE + "/")).ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error("server did not start");
}

const routes = ["/", "/projects", "/contact", "/not-found"];

async function audit() {
  await waitForServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });
  try {
    for (const route of routes) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(BASE + route, { waitUntil: "networkidle0", timeout: 60000 });
      await sleep(300);
      const report = await page.evaluate(() => {
        const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map((h) => ({
          tag: h.tagName,
          text: (h.textContent || "").trim().slice(0, 50),
        }));
        let levels = [];
        for (const h of headings) levels.push(parseInt(h.tag[1], 10));
        const skipped = [];
        let expected = 1;
        for (const l of levels) {
          if (l > expected + 1) skipped.push(`h${l} after expected h${expected}`);
          expected = Math.max(expected, l);
        }
        const h1s = headings.filter((h) => h.tag === "H1");
        const imgs = Array.from(document.images).map((img) => ({
          src: img.getAttribute("src") || img.getAttribute("srcset") || "",
          alt: img.getAttribute("alt"),
          w: img.getAttribute("width"),
          h: img.getAttribute("height"),
          lazy: img.getAttribute("loading"),
          fp: img.getAttribute("fetchpriority"),
          ok: img.complete && img.naturalWidth > 0,
        }));
        return { headings, h1Count: h1s.length, skipped, imgs, title: document.title };
      });
      const probs = [];
      if (report.h1Count !== 1) probs.push(`H1 count=${report.h1Count}`);
      if (report.skipped.length) probs.push(`skipped levels: ${report.skipped.join("; ")}`);
      for (const img of report.imgs) {
        if (img.alt === null || img.alt === undefined) probs.push(`img missing alt: ${img.src}`);
        if (!img.w || !img.h) probs.push(`img missing width/height: ${img.src}`);
      }
      console.log(`\n=== ${route} (${report.title.slice(0, 60)}) ===`);
      console.log("H1s:", report.h1Count, "| headings:", report.headings.map((h) => h.tag + (h.text ? `:${h.text}` : "")).join(", "));
      console.log("problems:", probs.length ? probs.join(" | ") : "none");
      for (const img of report.imgs) {
        console.log(`  img alt="${img.alt?.slice(0, 40)}" w=${img.w} h=${img.h} lazy=${img.lazy ?? "-"} fp=${img.fp ?? "-"} loaded=${img.ok} src=${img.src.slice(0, 60)}`);
      }
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
}

audit().catch((e) => {
  console.error(e);
  server.kill();
  process.exit(1);
});
