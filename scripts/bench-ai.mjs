/**
 * MAX AI benchmark + lazy-load audit.
 *
 * Lazy-load audit:
 *   - ai.js / engine.js must NOT be requested during the initial page load
 *   - they must be fetched only after window `load` (network prefetch)
 *   - evaluation must happen only on the first widget open
 *
 * Benchmark (measured in the page):
 *   - open latency:  click -> chat panel visible
 *   - answer latency: submit -> answer fully rendered (composer unlocked)
 *   - main-thread:   long tasks (>50ms) while opening and answering
 */
import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

/* Spawn the production server unless one is already running (BASE_URL set). */
const BASE = process.env.BASE_URL ?? `http://127.0.0.1:${process.env.PORT ?? 3470}`;
const server = process.env.BASE_URL
  ? null
  : spawn(process.execPath, ["dist/server/app.js"], {
      env: { ...process.env, PORT: String(process.env.PORT ?? 3470) },
      stdio: ["ignore", "ignore", "pipe"],
    });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const r = await fetch(BASE + "/");
      if (r.ok) return;
    } catch {}
    await sleep(200);
  }
  throw new Error("server did not start");
}
await waitForServer();

const QUESTION = "where can I find your github?";

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800 });

/* ---------- 1. Lazy-load audit: AI chunks must not be in the critical path ---------- */
await page.goto(BASE + "/", { waitUntil: "domcontentloaded", timeout: 60000 });

/* Wait for the window load event, then read its real timestamp from the
   navigation timing entry (same time base as resource entries, so the
   comparison below is exact). */
await page.evaluate(
  () =>
    new Promise((resolve) => {
      if (document.readyState === "complete") resolve();
      else window.addEventListener("load", () => resolve(), { once: true });
    }),
);
const loadAt = await page.evaluate(() => performance.getEntriesByType("navigation")[0]?.loadEventStart ?? 0);
await new Promise((r) => setTimeout(r, 1200)); /* let the idle prefetch run */

const aiTimings = await page.evaluate(() =>
  performance
    .getEntriesByType("resource")
    .filter((e) => e.name.includes("/js/components/AI/"))
    .map((e) => ({ name: e.name.split("/js/")[1], start: Math.round(e.startTime) })),
);
const criticalChunks = aiTimings.filter((t) => t.start < loadAt);
const loadPhaseOk = criticalChunks.length === 0;
const prefetched = aiTimings.filter((t) => t.start >= loadAt);

/* ---------- 2. Evaluation only on first open ---------- */
const evalAudit = await page.evaluate(() => {
  const boot = performance.now();
  const before = document.querySelectorAll(".ai-msg").length;
  const t0 = performance.now();
  document.querySelector("[data-ai-toggle]")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  const openMs = performance.now() - t0;
  const chatVisible = document.querySelector("[data-ai-chat]")?.hidden === false;
  return { bootMs: Math.round(boot), before, openMs: Math.round(openMs), chatVisible };
});

/* ---------- 3. Benchmark: question -> answer ---------- */
await new Promise((r) => setTimeout(r, 600));
const bench = await page.evaluate(async (q) => {
  const input = document.querySelector(".ai-chat__input");
  const send = () => {
    input.value = q;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.form?.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
  };
  const longTasks = [];
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.duration > 50) longTasks.push(Math.round(entry.duration));
    }
  });
  observer.observe({ entryTypes: ["longtask"] });

  send();
  const submitMs = performance.now();
  const pollStart = submitMs;
  const timeout = pollStart + 30000;
  while (performance.now() < timeout) {
    const inputEl = document.querySelector(".ai-chat__input");
    const unlocked = inputEl && inputEl.disabled === false;
    const last = document.querySelectorAll(".ai-msg--bot");
    const lastText = last.length ? last[last.length - 1].textContent ?? "" : "";
    if (unlocked && lastText.length > 0 && !lastText.includes("Hi, I'm MAX")) break;
    await new Promise((r) => setTimeout(r, 50));
  }
  observer.disconnect();
  const answerMs = performance.now() - submitMs;

  const msgs = Array.from(document.querySelectorAll(".ai-msg--bot .ai-msg__bubble"));
  const answer = msgs[msgs.length - 1]?.textContent ?? "";
  const kbFetches = performance
    .getEntriesByType("resource")
    .filter((e) => e.name.includes("/data/ai.json")).length;
  return {
    answerMs: Math.round(answerMs),
    longTasks,
    answerLength: answer.length,
    answerPreview: answer.slice(0, 70),
    kbFetches,
  };
}, QUESTION);

const openOk = evalAudit.chatVisible && evalAudit.openMs < 50;
const answerOk = bench.answerMs > 0 && bench.answerMs < 30000 && bench.answerLength > 40;
const tbtImpact = Array.isArray(bench.longTasks) ? bench.longTasks : [];

console.log("\n=== MAX AI lazy-load audit ===");
console.log(`chunks in critical path (before load): ${criticalChunks.length === 0 ? "none" : criticalChunks.map((t) => t.name).join(", ")} -> ${loadPhaseOk ? "PASS (lazy)" : "FAIL"}`);
console.log(`chunks prefetched after load:          ${prefetched.length} (${prefetched.map((t) => t.name).join(", ") || "none"}) -> ${prefetched.length === 2 ? "PASS" : "note"}`);
console.log(`chunk evaluation:                      on first open only -> ${evalAudit.before === 0 ? "PASS (not evaluated at boot)" : "FAIL"}`);

console.log("\n=== MAX AI benchmark ===");
console.log(`open latency:      ${evalAudit.openMs} ms (target < 50 ms) -> ${openOk ? "PASS" : "FAIL"}`);
console.log(`answer latency:    ${bench.answerMs} ms (submit -> full answer, includes design delay + typing)`);
console.log(`answer length:     ${bench.answerLength} chars`);
console.log(`answer preview:    ${bench.answerPreview}...`);
console.log(`long tasks (>50ms) while answering: ${tbtImpact.length === 0 ? "none" : tbtImpact.join(", ") + " ms"} -> ${tbtImpact.length === 0 ? "PASS (no main-thread jank)" : "note"}`);
console.log(`knowledge base fetches: ${bench.kbFetches} (must be 1)`);

const pass = loadPhaseOk && openOk && answerOk && bench.kbFetches === 1;
console.log(`\nMAX AI benchmark: ${pass ? "PASS" : "FAIL"}`);
await browser.close();
if (server) server.kill();
process.exitCode = pass ? 0 : 1;
