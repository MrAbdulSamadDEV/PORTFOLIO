import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

const PORT = 3476;
const BASE = `http://127.0.0.1:${PORT}`;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const server = spawn(process.execPath, ["dist/server/app.js"], {
  env: { ...process.env, PORT: String(PORT) },
  stdio: ["ignore", "ignore", "pipe"],
});
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (let i = 0; i < 50; i++) {
  try {
    if ((await fetch(BASE + "/")).ok) break;
  } catch {}
  await sleep(200);
}

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 412, height: 823 });

const client = await page.createCDPSession();
await client.send("Network.enable");
await client.send("Network.emulateNetworkConditions", {
  offline: false,
  latency: 150,
  downloadThroughput: 200 * 1024,
  uploadThroughput: 200 * 1024,
});
await client.send("Emulation.setCPUThrottlingRate", { rate: 4 });

await page.evaluateOnNewDocument(() => {
  const style = document.createElement("style");
  style.textContent = ".hero__visual, .hero__content > *, .hero__photo, .hero__ring, .hero__badge, .hero__caret { animation: none !important; }";
  document.documentElement.appendChild(style);
  const entries = [];
  window.__entries = entries;
  new PerformanceObserver((list) => {
    for (const e of list.getEntries()) {
      entries.push({
        time: Math.round(e.startTime),
        size: Math.round(e.size),
        id: e.element ? `${e.element.tagName}.${e.element.className}` : "?",
      });
    }
  }).observe({ type: "largest-contentful-paint", buffered: true });
});

await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(() => new Promise((r) => setTimeout(r, 15000)));
const all = await page.evaluate(() => window.__entries);
const img = await page.evaluate(() => {
  const picture = document.querySelector(".hero__photo-frame picture");
  const i = document.querySelector(".hero__photo-img");
  const r = i.getBoundingClientRect();
  const cs = getComputedStyle(i);
  const s = document.querySelector("picture source");
  const probe = { ...{} };
  return {
    complete: i.complete,
    natW: i.naturalWidth,
    natH: i.naturalHeight,
    rect: { top: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
    visibility: cs.visibility,
    opacity: cs.opacity,
    currentSrc: i.currentSrc.split("/").pop(),
    sourceSrc: s?.srcset.split("/").pop(),
  };
});
console.log("img state:", JSON.stringify(img, null, 1));
console.log("all LCP candidates:", JSON.stringify(all, null, 1));

const unwrapped = await page.evaluate(() => {
  const picture = document.querySelector(".hero__photo-frame picture");
  const img = picture?.querySelector("img");
  if (!picture || !img) return "no picture";
  const parent = picture.parentElement;
  img.remove();
  picture.replaceWith(img);
  return img.currentSrc.split("/").pop();
});
await page.evaluate(() => new Promise((r) => setTimeout(r, 4000)));
const after = await page.evaluate(() => window.__entries);
console.log("unwrapped:", unwrapped);
console.log("candidates after unwrap:", JSON.stringify(after.slice(-3), null, 1));
await browser.close();
server.kill();
