import puppeteer from "puppeteer-core";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const URL = "http://localhost:3478/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--no-sandbox", "--disable-gpu"],
});

const page = await browser.newPage();
await page.setCacheEnabled(false);
await page.setViewport({ width: 390, height: 844 });
await page.setRequestInterception(true);
let webpBlocked = 0;
page.on("request", (req) => {
  if (req.url().endsWith(".webp")) {
    webpBlocked++;
    req.abort("blockedbyclient");
  } else req.continue();
});
await page.goto(URL, { waitUntil: "networkidle0", timeout: 30000 });
await page.evaluate(() => document.fonts.ready);
await sleep(300);

const out = await page.evaluate(() => {
  const img = document.querySelector(".hero__photo-img");
  const r = img?.getBoundingClientRect();
  const pic = img?.closest("picture");
  return {
    currentSrc: img?.currentSrc ?? null,
    src: img?.getAttribute("src") ?? null,
    endsWithPng: img?.currentSrc?.endsWith(".png") ?? false,
    complete: img?.complete ?? false,
    naturalWidth: img?.naturalWidth ?? 0,
    naturalHeight: img?.naturalHeight ?? 0,
    visible: !!(r && r.width > 10 && r.height > 10 && r.bottom > 0),
    box: r ? `${Math.round(r.width)}x${Math.round(r.height)}` : null,
    ratioMatch: r ? Math.abs(r.width / r.height - 2 / 3) < 0.02 : false,
    sourceType: pic?.querySelector("source")?.getAttribute("type") ?? null,
  };
});
await page.close();
await browser.close();
console.log(JSON.stringify({ out, webpBlocked }, null, 2));