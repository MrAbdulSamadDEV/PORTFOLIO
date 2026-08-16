/**
 * Responsive audit with headless Chrome: sweeps every common viewport
 * width (180px smartwatches → 7680px 8K) and verifies:
 *   - no horizontal page overflow (document/body scrollWidth <= innerWidth)
 *   - no element visually escapes the viewport (broken/cut layout)
 *   - nav switchpoints (desktop rail vs mobile drawer) behave
 *   - smartwatch sizes keep every control reachable (nav toggle, buttons,
 *     drawer links, MAX AI) with no oversized images
 *   - MAX AI opens full-screen on phones with dim overlay, highlighted icon,
 *     locked background, hidden nav, required welcome text, working close
 *     and restored scrolling
 *   - custom cursor is never enabled on touch devices, works on desktop
 *   - no console / runtime errors across every viewport
 * Writes screenshots for manual review in screenshots/responsive/.
 */

import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import puppeteer from "puppeteer-core";

const PORT = 3461;
const BASE = `http://127.0.0.1:${PORT}`;
const SHOT_DIR = "screenshots/responsive";
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

/* [width, height] for the sweep — covers the requested device list. */
const WIDTHS = [
  [180, 320],   // small smartwatch
  [200, 320],   // smartwatch
  [240, 320],   // large smartwatch
  [280, 320],   // smartwatch / smallest phone
  [320, 568],   // iPhone SE 1st gen / small Android
  [360, 800],   // small Android
  [375, 667],   // iPhone SE
  [390, 844],   // iPhone 12/13/14
  [414, 896],   // iPhone 11 / Plus
  [430, 932],   // iPhone 15/16 Pro Max
  [480, 800],   // foldable outer / small tablet
  [540, 960],   // foldable inner
  [600, 960],   // large phone
  [640, 960],   // foldable / phablet
  [768, 1024],  // iPad Mini
  [820, 1180],  // iPad Air 11"
  [853, 1280],  // iPad Pro 11"
  [912, 1368],  // iPad Air 12.9" portrait-ish
  [1024, 1366], // iPad Pro 12.9" / small laptop
  [1280, 800],  // small laptop
  [1366, 768],  // standard laptop
  [1440, 900],  // standard laptop
  [1536, 864],  // laptop hi-dpi
  [1600, 900],  // large laptop
  [1920, 1080], // full HD
  [2560, 1440], // 2K
  [3840, 2160], // 4K
  [7680, 4320], // 8K
];

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

/* Inline source used inside page.evaluate calls (browser context). */
const escapersSrc = `
  Array.from(document.querySelectorAll("body *"))
    .filter((el) => {
      if (el.hidden) return false;
      if (el.closest(".site-background") || el.closest(".custom-cursor")) return false;
      if (el.closest(".hero__badge")) return false;
      if (el.classList.contains("ai-widget__tooltip")) return false;
      if (el.classList.contains("mobile-drawer") || el.classList.contains("mobile-drawer-overlay")) return false;
      const s = getComputedStyle(el);
      if (s.display === "none" || s.visibility === "hidden" || s.opacity === "0") return false;
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      return r.right > window.innerWidth + 2 || r.left < -2;
    })
    .slice(0, 4)
    .map((el) => el.tagName.toLowerCase() + "." + String(el.className || "").split(" ")[0])
`;

async function main() {
  await waitForServer();

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--no-sandbox", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    const consoleErrors = [];
    const onConsole = (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    };
    page.on("console", onConsole);
    page.on("pageerror", (error) => consoleErrors.push(`pageerror: ${error.message}`));

    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(500);

    /* The first-visit tour would pop up mid-sweep and interfere with the
       viewport/MAX measurements — retire it here; the tour itself gets its
       own dedicated test section at the end of this script. */
    await page.evaluate(() => localStorage.setItem("max-ai-tour-done", "1"));
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(400);

    /* ---------- Full viewport sweep on the home page ---------- */
    for (const [width, height] of WIDTHS) {
      await page.setViewport({ width, height });
      await sleep(120);

      const state = await page.evaluate(
        (src) => {
          const de = document.documentElement;
          const body = document.body;
          return {
            docOverflow: de.scrollWidth - window.innerWidth,
            bodyOverflow: body.scrollWidth - window.innerWidth,
            escapers: eval(src),
            navDisplay: getComputedStyle(document.querySelector(".site-nav")).display,
            toggleDisplay: getComputedStyle(document.querySelector(".nav-toggle")).display,
            railDisplay: getComputedStyle(document.querySelector(".social-rail")).display,
          };
        },
        escapersSrc,
      );

      check(
        `${width}px no horizontal overflow`,
        state.docOverflow <= 1 && state.bodyOverflow <= 1,
        `doc ${state.docOverflow}px, body ${state.bodyOverflow}px`,
      );
      check(
        `${width}px no elements escaping the viewport`,
        state.escapers.length === 0,
        state.escapers.join(", "),
      );

      if (width <= 1024) {
        check(`${width}px desktop nav hidden`, state.navDisplay === "none", state.navDisplay);
        check(`${width}px mobile toggle visible`, state.toggleDisplay !== "none", state.toggleDisplay);
      }
      if (width >= 1025) {
        check(`${width}px desktop nav visible`, state.navDisplay !== "none", state.navDisplay);
        check(`${width}px mobile toggle hidden`, state.toggleDisplay === "none", state.toggleDisplay);
      }
      if (width <= 768) {
        check(`${width}px social rail hidden`, state.railDisplay === "none", state.railDisplay);
      }
    }

    /* Intermediate sizes: every 25px between the named breakpoints */
    for (let width = 321; width < 1024; width += 25) {
      await page.setViewport({ width, height: 800 });
      // Let the layout settle past any resize-time transients before
      // measuring; a momentary reflow during a viewport change is not a
      // user-visible defect.
      await sleep(150);
      const overflow = await page.evaluate(async () => {
        // Fonts load asynchronously (font-display: optional) and text
        // re-measures when they arrive, which can momentarily widen the
        // document by a couple of pixels. Wait for them so the overflow
        // measurement is taken on the settled layout.
        await document.fonts.ready;
        const de = document.documentElement;
        return de.scrollWidth - window.innerWidth;
      });
      check(`${width}px intermediate no overflow`, overflow <= 1, `${overflow}px`);
    }

    /* ---------- MAX AI: full-screen on phones, floating on desktop ---------- */
    const MAX_WIDTHS = [
      [240, 320],
      [280, 320],
      [320, 568],
      [390, 844],
      [600, 960],
      [768, 1024],
    ];
    for (const [width, height] of MAX_WIDTHS) {
      await page.setViewport({ width, height });
      await page.evaluate(() => window.scrollTo(0, 0));
      await sleep(120);

      await page.click("[data-ai-toggle]");
      await sleep(600);

      const open = await page.evaluate(() => {
        const chat = document.querySelector("[data-ai-chat]");
        const s = getComputedStyle(chat);
        const toggle = document.querySelector("[data-ai-toggle]");
        const overlay = document.querySelector(".ai-overlay");
        const html = document.documentElement;
        const msg = document.querySelector(".ai-msg--bot .ai-msg__bubble");
        const avatar = getComputedStyle(document.querySelector(".ai-chat__avatar"));
        return {
          visible: chat.hidden === false,
          fullscreen:
            s.position === "fixed" && s.width === `${window.innerWidth}px` && s.height === `${window.innerHeight}px`,
          overlayShown: overlay ? overlay.hidden === false : false,
          overlayVisible: overlay ? getComputedStyle(overlay).display !== "none" : false,
          scrollLocked: getComputedStyle(html).overflowY === "hidden" || getComputedStyle(html).overflow === "hidden",
          navHidden: getComputedStyle(document.querySelector(".nav-toggle")).display === "none",
          siteNavHidden: getComputedStyle(document.querySelector(".site-nav")).display === "none",
          maxOpenClass: html.classList.contains("max-ai-open"),
          toggleActive: toggle.classList.contains("is-active") || toggle.getAttribute("aria-expanded") === "true",
          avatarHighlighted: avatar.animationName === "avatar-pulse",
          welcome: (msg?.textContent ?? "").replace(/\s+/g, " ").trim(),
        };
      });

      check(`${width}px MAX opens`, open.visible);
      check(`${width}px MAX full screen`, open.fullscreen, JSON.stringify({ w: `${width}px` }));
      check(`${width}px MAX background dims (overlay)`, open.overlayShown && open.overlayVisible);
      check(`${width}px MAX background scroll locked`, open.scrollLocked);
      check(`${width}px Nav 1 & Nav 2 hidden while MAX open`, open.navHidden && open.siteNavHidden);
      check(`${width}px MAX icon highlighted`, open.toggleActive && open.avatarHighlighted);
      check(
        `${width}px welcome message shown`,
        open.welcome.includes("Have any questions? Ask MAX."),
        open.welcome.slice(0, 60),
      );

      /* Close via header close button */
      await page.click("[data-ai-close]");
      await sleep(350);
      const closed = await page.evaluate(() => {
        const html = document.documentElement;
        const overlay = document.querySelector(".ai-overlay");
        return {
          chatHidden: document.querySelector("[data-ai-chat]").hidden === true,
          overlayHidden: overlay ? overlay.hidden === true : true,
          maxClassGone: !html.classList.contains("max-ai-open"),
          scrollRestored: getComputedStyle(html).overflowY !== "hidden",
          focusOnToggle: document.activeElement === document.querySelector("[data-ai-toggle]"),
        };
      });
      check(`${width}px close button works`, closed.chatHidden);
      check(`${width}px overlay disappears on close`, closed.overlayHidden);
      check(`${width}px background restored (scroll unlock)`, closed.scrollRestored && closed.maxClassGone);

      /* Re-open and close with Escape */
      await page.click("[data-ai-toggle]");
      await sleep(400);
      await page.keyboard.press("Escape");
      await sleep(300);
      const escapeClosed = await page.evaluate(() => {
        const html = document.documentElement;
        return (
          document.querySelector("[data-ai-chat]").hidden === true &&
          !html.classList.contains("max-ai-open") &&
          getComputedStyle(document.querySelector(".nav-toggle")).display !== "none"
        );
      });
      check(`${width}px Escape closes and restores navigation`, escapeClosed);

      if (width === 390) {
        await page.click("[data-ai-toggle]");
        await sleep(500);
        await page.screenshot({ path: `${SHOT_DIR}/max-open-390.png`, fullPage: false });
        await page.keyboard.press("Escape");
        await sleep(300);
      }
    }

    /* Desktop: MAX stays a floating panel with a light dim, no scroll lock */
    await page.setViewport({ width: 1440, height: 900 });
    await sleep(150);
    await page.click("[data-ai-toggle]");
    await sleep(500);
    const desktopMax = await page.evaluate(() => {
      const chat = document.querySelector("[data-ai-chat]");
      const s = getComputedStyle(chat);
      const rect = chat.getBoundingClientRect();
      const overlay = document.querySelector(".ai-overlay");
      const overlayStyle = overlay ? getComputedStyle(overlay) : null;
      const html = document.documentElement;
      const toggle = document.querySelector("[data-ai-toggle]");
      return {
        floating:
          s.position !== "fixed" &&
          rect.width <= 420 &&
          rect.width < window.innerWidth - 200 &&
          rect.height < window.innerHeight - 100,
        overlayShown: overlay ? overlay.hidden === false : false,
        overlayVisible: overlay ? overlayStyle.display !== "none" : false,
        overlayLite: overlay ? parseFloat(overlayStyle.backgroundColor.replace("rgba(", "").replace(")", "").split(",")[3] ?? "0") < 0.45 : true,
        overlayPassive: overlay ? overlayStyle.pointerEvents === "none" : true,
        noLock: getComputedStyle(html).overflow !== "hidden",
        railHidden: getComputedStyle(document.querySelector(".social-rail")).display === "none",
        toggleActive: toggle.classList.contains("is-active"),
        avatarHighlighted: getComputedStyle(document.querySelector(".ai-chat__avatar")).animationName === "avatar-pulse",
      };
    });
    check("desktop MAX floats (not full screen)", desktopMax.floating);
    check("desktop MAX shows light dim overlay", desktopMax.overlayShown && desktopMax.overlayVisible && desktopMax.overlayLite);
    check("desktop MAX overlay is passive (page clickable)", desktopMax.overlayPassive);
    check("desktop MAX background stays scrollable", desktopMax.noLock);
    check("desktop MAX hides Nav 2 (social rail)", desktopMax.railHidden);
    check("desktop MAX icon highlighted", desktopMax.toggleActive && desktopMax.avatarHighlighted);
    await page.keyboard.press("Escape");
    await sleep(300);
    const railRestored = await page.evaluate(
      () => getComputedStyle(document.querySelector(".social-rail")).display !== "none",
    );
    check("Nav 2 restored after MAX closes", railRestored);

    /* ---------- Custom cursor: touch vs fine pointer ---------- */
    const currentUserAgent = await page.evaluate(() => navigator.userAgent);
    await page.setViewport({ width: 390, height: 844 });
    await page.emulate({
      viewport: { width: 390, height: 844 },
      userAgent: currentUserAgent.replace(/HeadlessChrome/, "Chrome"),
      hasTouch: true,
      isMobile: true,
    });
    /* Headless Chrome keeps (pointer: fine) under device emulation; the
       touch-emulation CDP flag is what actually flips the media query. */
    const cdp = await page.createCDPSession();
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(400);
    const touchCursor = await page.evaluate(() => ({
      coarse: matchMedia("(pointer: coarse)").matches,
      enabled: document.documentElement.classList.contains("has-custom-cursor"),
      rendered: getComputedStyle(document.getElementById("custom-cursor")).display !== "none",
    }));
    check("touch device: custom cursor disabled (JS)", touchCursor.coarse && !touchCursor.enabled);
    check("touch device: custom cursor not rendered (CSS)", !touchCursor.rendered);

    /* Fine pointer emulation */
    await cdp.send("Emulation.setTouchEmulationEnabled", { enabled: false });
    await page.emulate({
      viewport: { width: 1440, height: 900 },
      userAgent: currentUserAgent.replace(/HeadlessChrome/, "Chrome"),
      hasTouch: false,
      isMobile: false,
    });
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(400);
    const fineCursor = await page.evaluate(() => document.documentElement.classList.contains("has-custom-cursor"));
    check("desktop pointer: custom cursor enabled", fineCursor);

    /* ---------- Screenshots at key widths (home) ---------- */
    for (const width of [180, 240, 320, 390, 768, 820, 1024, 1440, 1920, 3840, 7680]) {
      await page.setViewport({ width, height: width >= 1920 ? 1080 : width >= 1024 ? 900 : 844 });
      await sleep(200);
      await page.screenshot({ path: `${SHOT_DIR}/home-${width}.png`, fullPage: false });
    }

    /* ---------- Projects section at smartwatch + phone + tablet + desktop ---------- */
    for (const [width, height] of [[180, 320], [390, 844], [768, 1024], [1440, 900]]) {
      await page.setViewport({ width, height });
      await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
      await sleep(400);
      const proj = await page.evaluate(
        (src) => {
          const de = document.documentElement;
          const section = document.getElementById("projects");
          const cards = Array.from(section?.querySelectorAll(".project-card") ?? []);
          return {
            overflow: de.scrollWidth - window.innerWidth,
            escapers: eval(src),
            cardCount: cards.length,
            buttonsInside: cards.every((card) => {
              const cr = card.getBoundingClientRect();
              return Array.from(card.querySelectorAll(".btn")).every((btn) => {
                const br = btn.getBoundingClientRect();
                return br.right <= cr.right + 1 && br.left >= cr.left - 1;
              });
            }),
          };
        },
        escapersSrc,
      );
      check(`projects ${width}px no overflow`, proj.overflow <= 1, `${proj.overflow}px`);
      check(`projects ${width}px no escapers`, proj.escapers.length === 0, proj.escapers.join(", "));
      check(`projects ${width}px cards rendered`, proj.cardCount >= 1, `${proj.cardCount}`);
      check(`projects ${width}px buttons inside cards`, proj.buttonsInside);
    }

    /* ---------- 404 page at the smallest phones ---------- */
    /* The intentional 404 response logs a browser network error — detach the
       console capture for this section so only real failures count below. */
    page.off("console", onConsole);
    for (const width of [320, 375]) {
      await page.setViewport({ width, height: 667 });
      await page.goto(BASE + "/does-not-exist", { waitUntil: "networkidle0", timeout: 60000 });
      await sleep(300);
      const nf = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`404 ${width}px no horizontal overflow`, nf <= 1, `${nf}px`);
    }
    page.on("console", onConsole);

    /* ---------- Contact section at smartwatch + phone + desktop ---------- */
    for (const [width, height] of [[180, 320], [390, 844], [1440, 900]]) {
      await page.setViewport({ width, height });
      await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
      await sleep(400);
      const contact = await page.evaluate(
        (src) => {
          const de = document.documentElement;
          return { overflow: de.scrollWidth - window.innerWidth, escapers: eval(src) };
        },
        escapersSrc,
      );
      check(`contact ${width}px no overflow`, contact.overflow <= 1, `${contact.overflow}px`);
      check(`contact ${width}px no escapers`, contact.escapers.length === 0, contact.escapers.join(", "));
      await page.screenshot({ path: `${SHOT_DIR}/contact-${width}.png`, fullPage: false });
    }

    /* ---------- Smartwatch (180-320px): reachable controls, no oversized media ---------- */
    for (const width of [180, 240, 320]) {
      await page.setViewport({ width, height: 320 });
      await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
      await sleep(400);
      const watch = await page.evaluate(
        (src) => {
          const toggle = document.querySelector(".nav-toggle");
          const toggleRect = toggle.getBoundingClientRect();
          const heroActions = document.querySelector(".hero__actions");
          return {
            overflow: document.documentElement.scrollWidth - window.innerWidth,
            escapers: eval(src),
            toggleVisible: getComputedStyle(toggle).display !== "none",
            toggleSize: Math.min(toggleRect.width, toggleRect.height),
            heroActionsVisible: heroActions.getBoundingClientRect().width > 0,
            undersizedButtons: Array.from(document.querySelectorAll(".btn"))
              .map((b) => Math.min(b.getBoundingClientRect().width, b.getBoundingClientRect().height))
              .filter((s) => s < 32).length,
            oversizedImages: Array.from(document.querySelectorAll("img"))
              .filter((img) => img.getBoundingClientRect().width > window.innerWidth + 1).length,
          };
        },
        escapersSrc,
      );
      check(`watch ${width}px no overflow`, watch.overflow <= 1, `${watch.overflow}px`);
      check(`watch ${width}px no escapers`, watch.escapers.length === 0, watch.escapers.join(", "));
      check(`watch ${width}px nav toggle reachable`, watch.toggleVisible && watch.toggleSize >= 32, `size ${watch.toggleSize}`);
      check(`watch ${width}px hero actions visible`, watch.heroActionsVisible);
      check(`watch ${width}px no undersized buttons`, watch.undersizedButtons === 0, `${watch.undersizedButtons} too small`);
      check(`watch ${width}px no oversized images`, watch.oversizedImages === 0, `${watch.oversizedImages} too wide`);
      await page.screenshot({ path: `${SHOT_DIR}/watch-${width}.png`, fullPage: false });
    }

    /* Smartwatch: drawer opens with every item reachable, MAX goes fullscreen */
    await page.setViewport({ width: 180, height: 320 });
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(400);
    await page.click(".nav-toggle");
    await sleep(400);
    const watchDrawer = await page.evaluate(() => ({
      open: document.querySelector(".mobile-drawer").classList.contains("is-open"),
      overflow: document.documentElement.scrollWidth - window.innerWidth,
      allLinksVisible: Array.from(document.querySelectorAll(".mobile-drawer__list a, .mobile-drawer__list button")).every(
        (el) => el.getBoundingClientRect().height > 0,
      ),
    }));
    check("watch 180px drawer opens", watchDrawer.open);
    check("watch 180px drawer no overflow", watchDrawer.overflow <= 1, `${watchDrawer.overflow}px`);
    check("watch 180px all drawer items reachable", watchDrawer.allLinksVisible);
    await page.click(".mobile-drawer__close");
    await sleep(300);
    await page.click("[data-ai-toggle]");
    await sleep(500);
    const watchMax = await page.evaluate(() => {
      const chat = document.querySelector("[data-ai-chat]");
      const s = getComputedStyle(chat);
      return s.position === "fixed" && s.width === `${window.innerWidth}px`;
    });
    check("watch 180px MAX fullscreen", watchMax);
    await page.keyboard.press("Escape");
    await sleep(300);

    /* ---------- MAX AI first-visit onboarding tour ---------- */
    /* Desktop: fresh storage -> tour appears, Get Started opens MAX */
    await page.setViewport({ width: 1440, height: 900 });
    await page.evaluate(() => localStorage.removeItem("max-ai-tour-done"));
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(1600);
    const tourShown = await page.evaluate(() => {
      const tour = document.querySelector(".ai-tour");
      const widget = document.querySelector("[data-ai-widget]");
      if (!tour) return { present: false };
      return {
        present: true,
        visible: tour.classList.contains("is-visible"),
        dim: getComputedStyle(tour).display !== "none",
        iconBright: widget.classList.contains("is-tour"),
        iconPulse: getComputedStyle(document.querySelector(".ai-widget__toggle")).animationName === "tour-pulse",
        scrollLocked: document.documentElement.classList.contains("no-scroll"),
        title: tour.querySelector(".ai-tour__title")?.textContent ?? "",
        message: (tour.querySelector(".ai-tour__text")?.textContent ?? "").replace(/\s+/g, " ").trim(),
        hasStart: !!tour.querySelector(".ai-tour__start"),
        hasSkip: !!tour.querySelector(".ai-tour__skip"),
      };
    });
    check("tour appears on first visit", tourShown.present && tourShown.visible);
    check("tour dims the background", tourShown.dim);
    check("tour keeps only the MAX icon bright", tourShown.iconBright && tourShown.iconPulse);
    check("tour locks background scrolling", tourShown.scrollLocked);
    check("tour tooltip: Meet MAX AI", tourShown.title === "Meet MAX AI", tourShown.title);
    check(
      "tour tooltip message",
      tourShown.message.includes("Have any questions? Ask MAX.") &&
        tourShown.message.includes("projects") &&
        tourShown.message.includes("skills") &&
        tourShown.message.includes("contact"),
      tourShown.message.slice(0, 80),
    );
    check("tour has Get Started + Skip buttons", tourShown.hasStart && tourShown.hasSkip);
    check("tour in viewport (no overflow)", (await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)) <= 1);

    /* Get Started opens MAX, retires the tour, never shows again */
    await page.click(".ai-tour__start");
    await sleep(700);
    const tourAfterStart = await page.evaluate(() => ({
      chatOpen: document.querySelector("[data-ai-chat]").hidden === false,
      tourGone: !document.querySelector(".ai-tour"),
      stored: localStorage.getItem("max-ai-tour-done") === "1",
      scrollUnlocked: !document.documentElement.classList.contains("no-scroll"),
    }));
    check("tour Get Started opens MAX", tourAfterStart.chatOpen);
    check("tour gone after Get Started", tourAfterStart.tourGone);
    check("tour stored in LocalStorage", tourAfterStart.stored);
    check("tour releases scroll lock", tourAfterStart.scrollUnlocked);
    await page.keyboard.press("Escape");
    await sleep(300);
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(1400);
    const tourAfterReload = await page.evaluate(() => !document.querySelector(".ai-tour"));
    check("tour never shows again after Get Started", tourAfterReload);

    /* Skip path */
    await page.evaluate(() => localStorage.removeItem("max-ai-tour-done"));
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(1600);
    const tourSkip = await page.evaluate(() => !!document.querySelector(".ai-tour"));
    check("tour reappears after storage cleared", tourSkip);
    await page.click(".ai-tour__skip");
    await sleep(700);
    const tourAfterSkip = await page.evaluate(() => ({
      chatClosed: document.querySelector("[data-ai-chat]").hidden === true,
      tourGone: !document.querySelector(".ai-tour"),
      stored: localStorage.getItem("max-ai-tour-done") === "1",
      iconRestored: !document.querySelector("[data-ai-widget]").classList.contains("is-tour"),
    }));
    check("tour Skip closes it without opening MAX", tourAfterSkip.chatClosed);
    check("tour gone after Skip", tourAfterSkip.tourGone);
    check("tour Skip stores in LocalStorage", tourAfterSkip.stored);
    check("tour restores the MAX icon state", tourAfterSkip.iconRestored);

    /* Opening MAX directly also retires the tour */
    await page.evaluate(() => localStorage.removeItem("max-ai-tour-done"));
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(1600);
    const tourAgain = await page.evaluate(() => !!document.querySelector(".ai-tour"));
    check("tour reappears before direct open", tourAgain);
    await page.click("[data-ai-toggle]");
    await sleep(700);
    const tourAfterOpen = await page.evaluate(() => ({
      tourGone: !document.querySelector(".ai-tour"),
      stored: localStorage.getItem("max-ai-tour-done") === "1",
    }));
    check("opening MAX retires the tour", tourAfterOpen.tourGone && tourAfterOpen.stored);
    await page.keyboard.press("Escape");
    await sleep(300);

    /* Tour on mobile: card fits, caret points at the icon, no overflow */
    await page.evaluate(() => localStorage.removeItem("max-ai-tour-done"));
    await page.setViewport({ width: 390, height: 844 });
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(1600);
    const tourMobile = await page.evaluate((src) => {
      const tour = document.querySelector(".ai-tour");
      const card = tour?.querySelector(".ai-tour__card");
      const rect = card ? card.getBoundingClientRect() : null;
      return {
        present: !!tour,
        inViewport: rect ? rect.left >= 0 && rect.right <= window.innerWidth && rect.top >= 0 && rect.bottom <= window.innerHeight : false,
        overflow: document.documentElement.scrollWidth - window.innerWidth,
        escapers: eval(src),
        startVisible: tour ? getComputedStyle(tour.querySelector(".ai-tour__start")).display !== "none" : false,
      };
    }, escapersSrc);
    check("tour mobile: card fits viewport", tourMobile.present && tourMobile.inViewport);
    check("tour mobile: no overflow", tourMobile.overflow <= 1 && tourMobile.escapers.length === 0, tourMobile.escapers.join(", "));
    check("tour mobile: buttons visible", tourMobile.startVisible);
    await page.click(".ai-tour__skip");
    await sleep(700);
    await page.screenshot({ path: `${SHOT_DIR}/tour-mobile-390.png`, fullPage: false });
    await page.evaluate(() => localStorage.removeItem("max-ai-tour-done"));
    await page.setViewport({ width: 1440, height: 900 });
    await page.goto(BASE + "/", { waitUntil: "networkidle0", timeout: 60000 });
    await sleep(1600);
    await page.screenshot({ path: `${SHOT_DIR}/tour-desktop-1440.png`, fullPage: false });
    await page.evaluate(() => localStorage.setItem("max-ai-tour-done", "1"));
    await page.reload({ waitUntil: "networkidle0" });
    await sleep(400);

    check("no console errors across all sweeps", consoleErrors.length === 0, consoleErrors.slice(0, 5).join(" | "));
  } finally {
    await browser.close();
  }

  console.log(`\n[responsive-audit] summary: ${checks - failures.length} of ${checks} checks passed`);

  server.kill();
  await sleep(200);

  if (failures.length > 0) {
    console.error("\n[responsive-audit] FAILURES:");
    for (const failure of failures) console.error("  -", failure);
    process.exit(1);
  }
  process.exit(0);
}

main().catch(async (error) => {
  console.error("[responsive-audit] crashed:", error);
  server.kill();
  await sleep(200);
  process.exit(1);
});
