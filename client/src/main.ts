/**
 * Application entry point.
 * Boots the shared layer (cursor, background, navigation, AI assistant…)
 * followed by the page-specific bootstrap for the current route.
 */

import { initBackground } from "./components/Background/background.js";
import { initCustomCursor } from "./components/Cursor/cursor.js";
import { initAiAssistant } from "./components/AI/ai.js";
import { initBackToTop } from "./components/Shared/back-to-top.js";
import { initContactForm } from "./components/Shared/contact-form.js";
import { initNavigation } from "./components/Shared/navigation.js";
import { initReveal } from "./hooks/use-reveal.js";
import { initScrollSpy } from "./hooks/use-scroll-spy.js";
import { initProjectsPage } from "./pages/projects.js";

function boot(): void {
  document.documentElement.classList.add("js");

  initBackground();
  initCustomCursor();
  initNavigation();
  initBackToTop();
  initReveal();
  initScrollSpy();
  initAiAssistant();

  // The contact form exists on the home page and the /contact page.
  initContactForm();

  if (document.body.classList.contains("page-projects")) {
    initProjectsPage();
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot, { once: true });
} else {
  boot();
}
