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

  // MAX AI is booted lazily (own chunk, own fetch) so first paint and
  // the main thread stay fast on every page, including the home hero.
  void import("./components/AI/ai.js").then(({ initAiAssistant }) => initAiAssistant());

  if (document.body.classList.contains("page-projects")) {
    initProjectsPage();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
