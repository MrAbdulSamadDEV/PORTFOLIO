/**
 * Application entry point.
 * Boots the shared layer (cursor, background, navigation, AI assistant…)
 * followed by the page-specific bootstrap for the current route.
 */

import { initBackground } from "./components/Background/background.js";
import { initCustomCursor } from "./components/Cursor/cursor.js";
import { initBackToTop } from "./components/Shared/back-to-top.js";
import { initContactForm } from "./components/Shared/contact-form.js";
import { initHeroTyping } from "./components/Shared/hero-typing.js";
import { initNavigation } from "./components/Shared/navigation.js";
import { initReveal } from "./hooks/use-reveal.js";
import { initScrollSpy } from "./hooks/use-scroll-spy.js";
import { initProjectsPage } from "./pages/projects.js";
import { initTheme } from "./components/Shared/theme.js";

function boot(): void {
  document.documentElement.classList.add("js");

  initTheme();
  initHeroTyping();
  initBackground();
  initCustomCursor();
  initNavigation();
  initBackToTop();
  initReveal();
  initScrollSpy();

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
    void import("./components/AI/ai.js").then(({ initAiAssistant }) => initAiAssistant());
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
  window.addEventListener("max-ai:open", loadMax);
  const prefetchMax = (): void => {
    void fetch("/js/components/AI/ai.js");
    void fetch("/js/components/AI/engine.js");
  };
  if (document.readyState === "complete") {
    prefetchMax();
  } else {
    window.addEventListener("load", prefetchMax, { once: true });
  }

  if (document.body.classList.contains("page-projects")) {
    initProjectsPage();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
