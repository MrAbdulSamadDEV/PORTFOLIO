/**
 * Real-browser audit with headless Chrome (puppeteer-core + system Chrome).
 * Verifies the interactive layer the HTTP smoke test cannot:
 *   console errors, MAX AI chat, theme toggle, hero video, contact form,
 *   drawer navigation, reveal animations, cursor, image loading,
 *   scroll-spy, deep links, and the 404 page. Writes screenshots too.
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const PORT = 3460;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOT_DIR = "screenshots";
mkdirSync(SHOT_DIR, { recursive: true });

const CHROME = process.env.CHROME_PATH ?? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const failures = [];
let checks = 0;
const check = (label, ok, extra = "") => {
  checks += 1;
  if (!ok) {
    failures.push(`${label}${extra ? ` — ${extra}` : ""}`);
    console.error(`  FAIL ${label}${extra ? ` — ${extra}` : ""}`);
  } else {
    console.log(`  ok   ${label}`);
  }
};

/* ---------- server ---------- */
const server = spawn(process.execPath, ["dist/server/app.js"], {
  env: { ...process.env, PORT: String(PORT) },
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

async function main() {
  await waitForServer();

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu", "--window-size=1440,900"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1440, height: 900 });

    const consoleErrors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });
    page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));
    page.on("requestfailed", (req) => {
      const url = req.url();
      if (!url.includes("127.0.0.1") && !url.includes("localhost")) return;
      consoleErrors.push(`request failed: ${req.url()} ${req.failure()?.errorText ?? ""}`);
    });

    /* ============ Home page ============ */
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(400);

    check("home loads", await page.title() !== "", "no title");

    /* Retire the first-visit MAX AI tour so its dim overlay can't block
       the interaction checks below (the tour has its own dedicated audit
       in scripts/responsive-audit.mjs). */
    await page.evaluate(() => localStorage.setItem("max-ai-tour-done", "1"));
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(400);

    check("no console errors on home", consoleErrors.length === 0, consoleErrors.slice(0, 3).join(" | "));

    /* JS boot markers */
    check("html.js class", await page.evaluate(() => document.documentElement.classList.contains("js")));
    const revealsBefore = await page.evaluate(() => document.querySelectorAll(".reveal:not(.is-visible)").length);

    /* Images actually load (scroll through the page so lazy images start loading) */
    const stepScroll = async (target) => {
      await page.evaluate((y) => {
        document.documentElement.style.scrollBehavior = "auto";
        window.scrollTo(0, y);
      }, target);
      await sleep(450);
    };
    const maxScroll = await page.evaluate(() => document.documentElement.scrollHeight - window.innerHeight);
    for (const f of [0.15, 0.4, 0.65, 0.85, 1]) await stepScroll(maxScroll * f);
    const brokenImages = await page.evaluate(() =>
      Array.from(document.images)
        .filter((img) => !img.complete || img.naturalWidth === 0)
        .map((img) => img.src),
    );
    check("all images load on home", brokenImages.length === 0, brokenImages.slice(0, 3).join(", "));

    /* Reveal animation */
    await sleep(900);
    const revealsHidden = await page.evaluate(() => document.querySelectorAll(".reveal:not(.is-visible)").length);
    check("reveal: elements start hidden", revealsBefore > 0, `${revealsBefore}`);
    check("reveal: all become visible after scroll", revealsHidden === 0, `${revealsHidden} still hidden`);

    /* Scroll-spy: about link active after scrolling */
    await page.evaluate(() => document.getElementById("about")?.scrollIntoView({ block: "center" }));
    await sleep(700);
    const spyActive = await page.evaluate(() => document.querySelector("[data-nav-scroll='about']")?.classList.contains("is-active"));
    check("scroll-spy highlights About", spyActive === true);

    /* Custom cursor (fine pointer headless → matches (pointer: fine)) */
    const cursor = await page.evaluate(() => {
      const el = document.getElementById("custom-cursor");
      return el ? { exists: true, hasClass: document.documentElement.classList.contains("has-custom-cursor") } : { exists: false };
    });
    check("custom cursor booted", cursor.exists && cursor.hasClass);

    /* Particle canvas */
    const canvasOk = await page.evaluate(() => {
      const canvas = document.getElementById("particle-canvas");
      return canvas !== null && canvas.width > 0 && canvas.height > 0;
    });
    check("particle canvas sized", canvasOk);

    /* MAX AI: open → welcome → ask → answer */
    await page.click("[data-ai-toggle]");
    await sleep(600);
    const welcomeShown = await page.evaluate(() => document.querySelectorAll(".ai-msg--bot").length >= 1);
    check("MAX AI welcome message", welcomeShown);

    const chatVisible = await page.evaluate(() => {
      const chat = document.querySelector("[data-ai-chat]");
      return chat ? chat.hidden === false : false;
    });
    check("chat panel visible", chatVisible);

    await page.type(".ai-chat__input", "where can I find your github?");
    await page.keyboard.press("Enter");
    /* Wait until the answer is fully typed and rendered (composer unlocked).
       Fixed sleeps are flaky: headless/slow machines can stall the main thread. */
    await page
      .waitForFunction(
        () => {
          const msgs = Array.from(document.querySelectorAll(".ai-msg--bot"));
          const last = msgs[msgs.length - 1];
          const input = document.querySelector<HTMLTextAreaElement>(".ai-chat__input");
          if (!last || !input) return false;
          const text = last.querySelector(".ai-msg__bubble")?.textContent ?? "";
          return /github/i.test(text) && input.disabled === false;
        },
        { timeout: 15000, polling: 200 },
      )
      .catch(() => {});
    const aiReply = await page.evaluate(() => {
      const msgs = Array.from(document.querySelectorAll(".ai-msg--bot .ai-msg__bubble"));
      return msgs[msgs.length - 1]?.textContent ?? "";
    });
    check("MAX AI answers github question", /github/i.test(aiReply), `reply: ${aiReply.slice(0, 60)}`);

    const aiLinks = await page.evaluate(() => Array.from(document.querySelectorAll(".ai-msg--bot a")).length);
    check("MAX AI answer has clickable links", aiLinks > 0, `${aiLinks}`);

    /* Theme toggle switches data-theme and persists */
    const themeBefore = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    await page.click("[data-theme-toggle]");
    const themeAfter = await page.evaluate(() => document.documentElement.getAttribute("data-theme"));
    check("theme toggle flips data-theme", themeBefore !== themeAfter, `${themeBefore} -> ${themeAfter}`);
    const themeStored = await page.evaluate(() => localStorage.getItem("portfolio-theme"));
    check("theme choice persists", themeStored === themeAfter, `stored: ${themeStored}`);
    await page.click("[data-theme-toggle]");

    /* Hero visual: image renders with alt text */
    const heroVisual = await page.evaluate(() => {
      const img = document.querySelector(".hero__photo-img");
      return {
        imagePresent: img !== null && img.complete && img.naturalWidth > 0,
        imageAlt: img?.getAttribute("alt") ?? "",
      };
    });
    check("hero image visible", heroVisual.imagePresent && heroVisual.imageAlt.length > 0, JSON.stringify(heroVisual));
    await page.screenshot({ path: `${SHOT_DIR}/hero-visual.png`, fullPage: false });

    /* Font Awesome subset: every icon renders a glyph (content not none) */
    const iconGlyphs = await page.evaluate(() => {
      const icons = Array.from(document.querySelectorAll("i.fa-solid, i.fa-brands"));
      const bad = icons.filter((el) => getComputedStyle(el, "::before").getPropertyValue("content").startsWith("none"));
      return { total: icons.length, bad: bad.length };
    });
    check("all icons render glyphs", iconGlyphs.bad === 0 && iconGlyphs.total > 0, `${iconGlyphs.total} icons, ${iconGlyphs.bad} missing`);

    /* Clear chat re-shows the welcome message */
    await page.click("[data-ai-clear]");
    await sleep(250);
    const cleared = await page.evaluate(() => document.querySelectorAll(".ai-msg").length);
    check("clear chat resets to welcome", cleared === 1, `${cleared} messages`);

    /* Escape closes */
    await page.keyboard.press("Escape");
    await sleep(150);
    const closed = await page.evaluate(() => document.querySelector("[data-ai-chat]")?.hidden === true);
    check("Escape closes chat", closed);

    await page.screenshot({ path: `${SHOT_DIR}/home-top.png`, fullPage: false });

    /* ============ Projects section (home) ============ */
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(600);

    const cardCount = await page.evaluate(() => document.querySelectorAll("[data-category]").length);
    check("all project cards rendered", cardCount >= 1, `${cardCount}`);

    /* Full project description visible (no toggle needed) */
    const descVisible = await page.evaluate(() => {
      const desc = document.querySelector(".project-card__description");
      return desc !== null && desc.getBoundingClientRect().height > 0 && desc.scrollHeight === desc.clientHeight;
    });
    check("project description fully visible", descVisible === true);

    /* GitHub + Live Demo buttons */
    const actionLinks = await page.evaluate(() =>
      Array.from(document.querySelectorAll(".project-card__actions a")).map((a) => ({
        href: a.getAttribute("href"),
        label: (a.textContent ?? "").trim(),
      })),
    );
    const githubLinks = actionLinks.filter((l) => l.href.includes("github.com"));
    const demoLinks = actionLinks.filter((l) => !l.href.includes("github.com") && !l.href.startsWith("mailto:"));
    check("github + demo link per project", githubLinks.length === cardCount && demoLinks.length === cardCount, `${githubLinks.length} / ${demoLinks.length} / ${cardCount}`);
    check("all action links have rel", (await page.evaluate(() => Array.from(document.querySelectorAll(".project-card__actions a")).every((a) => a.rel.includes("noopener")))) === true);

    /* Nav scroll-spy highlights Projects after smooth-scrolling to the section */
    await page.click("[data-nav-scroll='projects']");
    await sleep(1000);
    const navActive = await page.evaluate(() => ({
      label: document.querySelector(".site-nav__link.is-active")?.getAttribute("aria-label") ?? "",
      hash: window.location.hash,
    }));
    check("nav highlights Projects", navActive.label.includes("Projects"), `active: ${navActive.label}`);
    check("scroll link cleans the hash", navActive.hash === "", `hash: ${navActive.hash}`);

    await page.screenshot({ path: `${SHOT_DIR}/projects.png`, fullPage: false });

    /* ============ Contact section form ============ */
    await page.click("[data-nav-scroll='contact']");
    await sleep(1000);

    await page.click(".contact-form__submit");
    await sleep(300);
    const errorsShown = await page.evaluate(() => Array.from(document.querySelectorAll("[data-error-for]")).filter((el) => el.textContent !== "").length);
    check("contact form shows 3 validation errors", errorsShown === 3, `${errorsShown}`);
    const invalidAttr = await page.evaluate(() => Array.from(document.querySelectorAll("input, textarea")).filter((el) => el.getAttribute("aria-invalid") === "true").length);
    check("aria-invalid set", invalidAttr === 3, `${invalidAttr}`);

    await page.type("#contact-name", "Test Visitor");
    await page.type("#contact-email", "visitor@example.com");
    await page.type("#contact-message", "This is a test message that is long enough to pass validation.");
    await page.click(".contact-form__submit");
    await sleep(400);
    const statusText = await page.evaluate(() => document.querySelector("[data-form-status]")?.textContent ?? "");
    const statusVisible = await page.evaluate(() => document.querySelector("[data-form-status]")?.hidden === false);
    check("valid form shows success status", statusVisible && statusText.length > 0, statusText.slice(0, 50));

    /* ============ Mobile drawer (mobile viewport) ============ */
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(500);

    const navHidden = await page.evaluate(() => {
      const nav = document.querySelector(".site-nav");
      const style = getComputedStyle(nav);
      return style.display === "none";
    });
    check("desktop nav hidden on mobile", navHidden);

    const toggleVisible = await page.evaluate(() => getComputedStyle(document.querySelector(".nav-toggle")).display !== "none");
    check("nav toggle visible on mobile", toggleVisible);

    await page.click(".nav-toggle");
    await sleep(400);
    const drawerOpen = await page.evaluate(() => document.querySelector(".mobile-drawer")?.classList.contains("is-open"));
    check("drawer opens", drawerOpen === true);

    const scrollLocked = await page.evaluate(() => document.documentElement.classList.contains("no-scroll"));
    check("scroll locked when drawer open", scrollLocked);

    /* Mobile AI fullscreen behavior */
    await page.click(".mobile-drawer__close");
    await sleep(400);
    await page.click("[data-ai-toggle]");
    await sleep(400);
    const mobileChatFullscreen = await page.evaluate(() => {
      const chat = document.querySelector("[data-ai-chat]");
      const style = getComputedStyle(chat);
      return style.position === "fixed";
    });
    check("chat fullscreen on mobile", mobileChatFullscreen);
    await page.keyboard.press("Escape");

    await page.screenshot({ path: `${SHOT_DIR}/mobile-home.png`, fullPage: false });

    /* ============ Deep link /#about ============ */
    await page.goto(BASE + "/#about", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(900);
    const deepLinkState = await page.evaluate(() => ({
      hash: window.location.hash,
      aboutVisible: document.getElementById("about") ? true : false,
    }));
    check("deep link /#about works", deepLinkState.hash === "" && deepLinkState.aboutVisible, JSON.stringify(deepLinkState));

    /* ============ 404 page (intentional 404 — snapshot error log first) ============ */
    const consoleErrorsBefore404 = [...consoleErrors];
    consoleErrors.length = 0;
    await page.goto(BASE + "/does-not-exist", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(300);
    const notFound = await page.evaluate(() => document.querySelector(".not-found") !== null);
    check("404 page renders", notFound);
    const navOn404 = await page.evaluate(() => document.querySelectorAll(".site-nav__link").length > 0);
    check("404 has working nav", navOn404);

    /* Final console error sweep (covers everything except the intentional 404 load) */
    const unexpectedErrors = consoleErrorsBefore404.filter((text) => !text.includes("does-not-exist"));
    check("no console errors across all pages", unexpectedErrors.length === 0, unexpectedErrors.slice(0, 5).join(" | "));

    await page.screenshot({ path: `${SHOT_DIR}/404.png`, fullPage: false });
  } finally {
    await browser.close();
  }

  console.log(`\n[browser-audit] summary: ${checks - failures.length} of ${checks} checks passed`);

  server.kill();
  await sleep(200);

  if (failures.length > 0) {
    console.error("\n[browser-audit] FAILURES:");
    for (const failure of failures) console.error("  -", failure);
    process.exit(1);
  }
  process.exit(0);
}

main().catch(async (error) => {
  console.error("[browser-audit] crashed:", error);
  server.kill();
  await sleep(200);
  process.exit(1);
});
