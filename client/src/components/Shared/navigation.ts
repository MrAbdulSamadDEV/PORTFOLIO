import { qs, prefersReducedMotion, rafThrottle } from "../../utils/dom.js";

/**
 * Shared navigation behavior:
 *  - mobile drawer (open / close / overlay / Escape / focus handling)
 *  - smooth section scrolling with clean URLs (no hash navigation)
 *  - "AI Assistant" nav items dispatch an event the MAX AI widget listens to
 *  - deep links like /#about scroll to the section and clean the URL
 */

function scrollToSection(sectionId: string): void {
  const section = document.getElementById(sectionId);
  if (!section) return;
  const behavior: ScrollBehavior = prefersReducedMotion() ? "auto" : "smooth";
  section.scrollIntoView({ behavior, block: "start" });
}

function onHomePage(): boolean {
  return document.body.classList.contains("page-home");
}

function bindSectionLinks(): void {
  document.querySelectorAll<HTMLElement>("[data-nav-scroll]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      const sectionId = link.dataset.navScroll ?? "";
      if (!sectionId) return;

      if (onHomePage()) {
        scrollToSection(sectionId);
        window.history.replaceState(null, "", "/");
      } else {
        window.location.href = `/#${sectionId}`;
      }
    });
  });
}

function handleDeepLink(): void {
  if (!onHomePage()) return;
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  window.history.replaceState(null, "", "/");
  window.setTimeout(() => scrollToSection(hash), 80);
}

/** Same-document hash changes (e.g. typing /#about in the address bar). */
function handleHashChange(): void {
  if (!onHomePage()) return;
  const hash = window.location.hash.replace("#", "");
  if (!hash) return;
  window.history.replaceState(null, "", "/");
  window.setTimeout(() => scrollToSection(hash), 80);
}

function bindAiNavActions(): void {
  document.querySelectorAll<HTMLElement>("[data-nav-action='ai']").forEach((button) => {
    button.addEventListener("click", () => {
      window.dispatchEvent(new CustomEvent("max-ai:open"));
    });
  });
}

function initDrawer(): void {
  const toggle = qs<HTMLButtonElement>(".nav-toggle");
  const drawer = qs<HTMLElement>(".mobile-drawer");
  const overlay = qs<HTMLElement>("[data-drawer-overlay]");
  const closeButton = qs<HTMLButtonElement>("[data-drawer-close]");
  if (!toggle || !drawer || !overlay || !closeButton) return;

  const open = (): void => {
    drawer.hidden = false;
    overlay.hidden = false;
    document.documentElement.classList.add("no-scroll");
    toggle.setAttribute("aria-expanded", "true");
    toggle.setAttribute("aria-label", "Close navigation menu");
    requestAnimationFrame(() => drawer.classList.add("is-open"));
    closeButton.focus();
  };

  const close = (): void => {
    drawer.classList.remove("is-open");
    document.documentElement.classList.remove("no-scroll");
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "Open navigation menu");
    window.setTimeout(() => {
      drawer.hidden = true;
      overlay.hidden = true;
    }, 260);
    toggle.focus();
  };

  toggle.addEventListener("click", () => {
    if (toggle.getAttribute("aria-expanded") === "true") {
      close();
    } else {
      open();
    }
  });

  closeButton.addEventListener("click", close);
  overlay.addEventListener("click", close);
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && toggle.getAttribute("aria-expanded") === "true" && !document.documentElement.classList.contains("palette-open")) {
      close();
    }
  });

  drawer.querySelectorAll("a, button").forEach((element) => {
    element.addEventListener("click", close);
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth >= 1025 && toggle.getAttribute("aria-expanded") === "true") {
      close();
    }
  });
}

export function initNavigation(): void {
  bindSectionLinks();
  bindAiNavActions();
  initDrawer();
  handleDeepLink();
  window.addEventListener("hashchange", handleHashChange);
}

/** Scroll-position utilities shared by back-to-top and header state. */
export function onScroll(callback: () => void): void {
  const throttled = rafThrottle(callback);
  window.addEventListener("scroll", throttled, { passive: true });
  throttled();
}
