/**
 * Application entry point.
 * Boots the shared layer (cursor, background, navigation, AI assistant…)
 * followed by the page-specific bootstrap for the current route.
 */

import { initBackground } from "./components/Background/background.js";
import { initCustomCursor } from "./components/Cursor/cursor.js";
import { initBackToTop } from "./components/Shared/back-to-top.js";
import { initContactForm } from "./components/Shared/contact-form.js";
import { initCopyButtons } from "./components/Shared/copy.js";
import { initFavicon } from "./components/Shared/favicon.js";
import { initHeroTyping } from "./components/Shared/hero-typing.js";
import { initNavigation } from "./components/Shared/navigation.js";
import { initPageTransitions } from "./components/Shared/page-transitions.js";
import { initProgressBar } from "./components/Shared/progress-bar.js";
import { initSkills } from "./components/Shared/skills.js";
import { initTheme } from "./components/Shared/theme.js";
import { prefersReducedMotion } from "./utils/dom.js";
import { initReveal } from "./hooks/use-reveal.js";
import { initScrollSpy } from "./hooks/use-scroll-spy.js";

/**
 * MAX AI first-visit onboarding.
 * On the first visit the whole site is dimmed and blurred like a tutorial,
 * the MAX launcher stays bright and pulsing above the dim, and a tooltip
 * card introduces the assistant. Get Started / Skip / opening MAX retires
 * the tour forever (localStorage).
 */
function initAiTour(): void {
  const TOUR_KEY = "max-ai-tour-done";
  try {
    if (localStorage.getItem(TOUR_KEY)) return;
  } catch {
    return;
  }

  const toggle = document.querySelector<HTMLElement>("[data-ai-toggle]");
  const widget = document.querySelector<HTMLElement>("[data-ai-widget]");
  if (!toggle || !widget) return;

  const tour = document.createElement("div");
  tour.className = "ai-tour";
  tour.setAttribute("role", "dialog");
  tour.setAttribute("aria-modal", "true");
  tour.setAttribute("aria-label", "Meet MAX AI");
  tour.innerHTML = `
    <div class="ai-tour__card">
      <span class="ai-tour__badge" aria-hidden="true"><i class="fa-solid fa-robot"></i></span>
      <h2 class="ai-tour__title">Meet MAX AI</h2>
      <p class="ai-tour__text">Have any questions? Ask MAX. You can ask about Abdul Samad, projects, skills, experience, contact details and more.</p>
      <div class="ai-tour__actions">
        <button type="button" class="btn btn--primary ai-tour__start">Get Started</button>
        <button type="button" class="btn btn--ghost ai-tour__skip">Skip</button>
      </div>
    </div>`;

  let done = false;
  const complete = (openMax: boolean): void => {
    if (done) return;
    done = true;
    try {
      localStorage.setItem(TOUR_KEY, "1");
    } catch {
      // Storage unavailable — the tour is still retired for this session.
    }
    tour.classList.add("is-leaving");
    document.documentElement.classList.remove("no-scroll");
    window.setTimeout(() => {
      widget.classList.remove("is-tour");
      tour.remove();
    }, 340);
    if (openMax) {
      window.dispatchEvent(new CustomEvent("max-ai:open"));
    }
  };

  document.body.appendChild(tour);
  widget.classList.add("is-tour");
  document.documentElement.classList.add("no-scroll");

  const show = (): void => {
    if (done) return;
    tour.classList.add("is-visible");
    tour.querySelector<HTMLButtonElement>(".ai-tour__start")?.focus();
  };

  window.setTimeout(show, 900);

  tour.querySelector<HTMLButtonElement>(".ai-tour__start")?.addEventListener("click", () => complete(true));
  tour.querySelector<HTMLButtonElement>(".ai-tour__skip")?.addEventListener("click", () => complete(false));
  tour.addEventListener("click", (event) => {
    if (event.target === tour) complete(false);
  });

  const onKey = (event: KeyboardEvent): void => {
    if (event.key === "Escape" && !done) complete(false);
  };
  document.addEventListener("keydown", onKey);

  /* Opening MAX through any path (launcher, drawer menu) also retires it. */
  window.addEventListener("max-ai:open", () => complete(false), { once: true });
  toggle.addEventListener("click", () => complete(false), { once: true });
}

/* ---------- Command palette (lazy) ---------- */

type PaletteApi = { openPalette: () => void; openHelp: () => void; isOpen: () => boolean };

let palettePromise: Promise<PaletteApi> | null = null;

function loadPalette(): Promise<PaletteApi> {
  palettePromise ??= import("./components/Shared/command-palette.js").then((module) => module.initCommandPalette());
  return palettePromise;
}

function isTypingTarget(target: EventTarget | null): boolean {
  return target instanceof HTMLElement && (target.isContentEditable || target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "SELECT");
}

/* ---------- Global keyboard shortcuts ---------- */

function initKeyboardShortcuts(): void {
  document.addEventListener("keydown", (event) => {
    const mod = event.ctrlKey || event.metaKey;

    if (mod && event.key.toLowerCase() === "k") {
      event.preventDefault();
      void loadPalette().then((palette) => {
        if (palette.isOpen()) return;
        palette.openPalette();
      });
      return;
    }

    if (mod && event.key === "/") {
      event.preventDefault();
      const chat = document.querySelector<HTMLElement>("[data-ai-chat]");
      const input = document.querySelector<HTMLTextAreaElement>(".ai-chat__input");
      if (!chat || !input) return;
      if (chat.hidden) {
        window.dispatchEvent(new CustomEvent("max-ai:open"));
      }
      window.setTimeout(() => input.focus(), 60);
      return;
    }

    if (event.key === "?" && !isTypingTarget(event.target)) {
      event.preventDefault();
      void loadPalette().then((palette) => palette.openHelp());
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      if (isTypingTarget(event.target)) return;
      event.preventDefault();
      window.scrollTo({ top: event.key === "Home" ? 0 : document.documentElement.scrollHeight, behavior: "smooth" });
    }
  });
}

/* ---------- Dynamic copyright year ---------- */

function initCopyrightYear(): void {
  const year = new Date().getFullYear();
  for (const node of document.querySelectorAll<HTMLElement>("[data-copyright-year]")) {
    node.textContent = String(year);
  }
}

/* ---------- Magnetic buttons ----------
   Key CTAs drift a few pixels toward the pointer for a tactile, premium
   feel. GPU-only (transform via CSS custom properties), disabled on touch
   devices and for reduced-motion visitors. Hover lift is preserved: the
   magnet and the lift share the same transform. */
function initMagneticButtons(): void {
  const reducedMotion = prefersReducedMotion();
  const finePointer = window.matchMedia("(pointer: fine)").matches;
  if (reducedMotion || !finePointer) return;

  const buttons = document.querySelectorAll<HTMLElement>(".hero__actions .btn, .projects-cta .btn--primary");
  if (!buttons.length) return;

  const MAX_PULL = 5;

  const reset = (button: HTMLElement): void => {
    button.classList.remove("is-magnetic");
    button.style.removeProperty("--mx");
    button.style.removeProperty("--my");
  };

  for (const button of buttons) {
    button.addEventListener(
      "pointermove",
      (event) => {
        const rect = button.getBoundingClientRect();
        const dx = event.clientX - (rect.left + rect.width / 2);
        const dy = event.clientY - (rect.top + rect.height / 2);
        const distance = Math.hypot(dx, dy);
        const strength = Math.min(1, distance / 90);
        const pullX = (dx / (rect.width / 2 || 1)) * MAX_PULL * strength;
        const pullY = (dy / (rect.height / 2 || 1)) * MAX_PULL * strength;
        button.classList.add("is-magnetic");
        button.style.setProperty("--mx", `${pullX.toFixed(2)}px`);
        button.style.setProperty("--my", `${pullY.toFixed(2)}px`);
      },
      { passive: true },
    );
    button.addEventListener("pointerleave", () => reset(button), { passive: true });
  }
}

/* ---------- MAX AI skeleton while the lazy chunk loads ---------- */

function addMaxSkeleton(): void {
  const messages = document.querySelector<HTMLElement>("[data-ai-messages]");
  if (!messages) return;
  const skeleton = document.createElement("div");
  skeleton.className = "ai-msg ai-msg--bot ai-skeleton";
  skeleton.setAttribute("aria-hidden", "true");
  skeleton.innerHTML = `
    <div class="ai-msg__bubble">
      <span class="ai-skeleton__line" style="width: 82%"></span>
      <span class="ai-skeleton__line" style="width: 58%"></span>
    </div>`;
  messages.appendChild(skeleton);
}

function removeMaxSkeleton(): void {
  document.querySelectorAll<HTMLElement>(".ai-skeleton").forEach((element) => element.remove());
}

/* ---------- Premium loading screen ---------- */

const LOADER_KEY = "loader-seen";
const LOADER_MIN_MS = 800;
const LOADER_MAX_MS = 1000;

/**
 * Shows the page loader only on the very first Home page load of a
 * session, locks scrolling while it is visible, then fades it out. The
 * markup is server-rendered on the Home page only, and `theme-init` adds
 * `no-loader` before paint on every other page (and repeat Home loads),
 * so the loader can never flash or shift layout anywhere else - it also
 * never appears during internal navigation, MAX AI or theme switches,
 * which do not reload the document. Reduced-motion visitors get an
 * immediate hide with no animations.
 */
function initPageLoader(): void {
  const loader = document.querySelector<HTMLElement>("[data-loader]");
  if (!loader) return;

  let seen = false;
  try {
    seen = sessionStorage.getItem(LOADER_KEY) === "1";
  } catch {
    seen = false;
  }
  if (seen) {
    loader.remove();
    return;
  }
  try {
    sessionStorage.setItem(LOADER_KEY, "1");
  } catch {
    // Storage unavailable - the loader still plays for this load only.
  }

  const reducedMotion = prefersReducedMotion();
  const startedAt = performance.now();
  let hidden = false;

  const hide = (): void => {
    if (hidden) return;
    hidden = true;
    document.documentElement.classList.remove("loader-active");
    if (reducedMotion) {
      loader.remove();
      return;
    }
    loader.classList.add("is-hidden");
    window.setTimeout(() => loader.remove(), 500);
  };

  document.documentElement.classList.add("loader-active");

  const finishWhenReady = (): void => {
    const elapsed = performance.now() - startedAt;
    window.setTimeout(hide, Math.max(0, LOADER_MIN_MS - elapsed));
  };

  if (document.readyState === "complete") {
    finishWhenReady();
  } else {
    window.addEventListener("load", finishWhenReady, { once: true });
  }
  window.setTimeout(hide, LOADER_MAX_MS);
}

function boot(): void {
  document.documentElement.classList.add("js");

  initPageLoader();
  initTheme();
  initFavicon();
  initHeroTyping();
  initBackground();
  initCustomCursor();
  initNavigation();
  initBackToTop();
  initProgressBar();
  initAiTour();
  initReveal();
  initScrollSpy();
  initSkills();
  initCopyButtons();
  initPageTransitions();
  initCopyrightYear();
  initKeyboardShortcuts();
  initMagneticButtons();

  // The contact form exists on the home page and the /contact page.
  initContactForm();

  // MAX AI is booted lazily so first paint and the main thread stay fast on
  // every page. Its chunks are network-prefetched after the window load
  // event (idle time, near-zero main-thread cost), while evaluation is
  // deferred until the visitor opens the widget — the fetch is already in
  // the HTTP cache by then, so opening it is instant.
  let maxRequested = false;
  const loadMax = (): void => {
    if (maxRequested) return;
    maxRequested = true;
    addMaxSkeleton();
    void import("./components/AI/ai.js")
      .then(({ initAiAssistant }) => {
        removeMaxSkeleton();
        initAiAssistant();
      })
      .catch(() => removeMaxSkeleton());
  };
  document.addEventListener("click", (event) => {
    const toggle = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-ai-toggle]") : null;
    if (!toggle) return;
    // Opening is synchronous (the widget HTML is server-rendered) so the
    // panel appears instantly; the AI module takes over when it is ready.
    const chat = document.querySelector<HTMLElement>("[data-ai-chat]");
    if (chat && chat.hidden) {
      chat.hidden = false;
      toggle.setAttribute("aria-expanded", "true");
    }
    loadMax();
  });
  window.addEventListener("max-ai:open", () => {
    // Same eager open for the "MAX" nav actions and the first-visit tour —
    // the panel appears instantly even if the AI chunk hasn't loaded yet
    // (ai.ts adopts the already-open state when it boots).
    const chat = document.querySelector<HTMLElement>("[data-ai-chat]");
    if (chat && chat.hidden) {
      chat.hidden = false;
      document.querySelector<HTMLElement>("[data-ai-toggle]")?.setAttribute("aria-expanded", "true");
    }
    loadMax();
  });
  const prefetchMax = (): void => {
    void fetch("/js/components/AI/ai.js");
    void fetch("/js/components/AI/engine.js");
  };
  if (document.readyState === "complete") {
    prefetchMax();
  } else {
    window.addEventListener("load", prefetchMax, { once: true });
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
