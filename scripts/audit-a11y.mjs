import { spawn } from "node:child_process";
import puppeteer from "puppeteer-core";

const PORT = 3472;
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

async function audit() {
  await waitForServer();
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });
  try {
    for (const route of ["/", "/projects", "/contact"]) {
      const page = await browser.newPage();
      await page.setViewport({ width: 1440, height: 900 });
      await page.goto(BASE + route, { waitUntil: "networkidle0", timeout: 60000 });
      await sleep(300);
      const report = await page.evaluate(() => {
        const issues = [];
        const nameOf = (el) =>
          el.getAttribute("aria-label") ||
          el.getAttribute("title") ||
          (el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 40) ||
          (el.getAttribute("src") || "").split("/").pop();

        for (const el of document.querySelectorAll("a[href], button, input, textarea, select, [role='button']")) {
          const hasText = (el.textContent || "").trim().length > 0;
          const ariaLabel = el.getAttribute("aria-label");
          const ariaHidden = el.getAttribute("aria-hidden") === "true";
          const title = el.getAttribute("title");
          const type = el.tagName.toLowerCase();
          const isIconLink = type === "a" && !hasText;
          if (type === "input" || type === "textarea" || type === "select") {
            const id = el.id;
            const labelled = ariaLabel || (id && document.querySelector(`label[for="${id}"]`)) || el.closest("label");
            if (!labelled) issues.push(`control missing label: <${type} id="${id}" name="${el.name}">`);
            continue;
          }
          if (ariaHidden) continue;
          if (el.disabled) continue;
          if (!ariaLabel && !hasText && !title) issues.push(`no accessible name: <${type} ${el.className.slice(0, 30)}>`);
          if (!hasText && isIconLink && !ariaLabel && !title) issues.push(`icon link no aria-label: href=${el.getAttribute("href")}`);
        }

        const buttons = Array.from(document.querySelectorAll("button")).filter((b) => !b.disabled && b.type !== "submit");
        for (const b of buttons) {
          if (!b.getAttribute("aria-expanded") && b.classList.contains("is-toggle")) issues.push(`toggle missing aria-expanded: ${b.className}`);
        }

        const h1 = document.querySelector("h1");
        const landmarks = {
          header: !!document.querySelector("header"),
          main: !!document.querySelector("main"),
          footer: !!document.querySelector("footer"),
          nav: !!document.querySelector("nav[aria-label]"),
        };
        return { issues, landmarks, htmlLang: document.documentElement.lang };
      });
      console.log(`\n=== ${route} ===`);
      console.log("landmarks:", JSON.stringify(report.landmarks), "| html lang:", report.htmlLang);
      console.log("issues:", report.issues.length ? report.issues.join("\n  ") : "none");
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
