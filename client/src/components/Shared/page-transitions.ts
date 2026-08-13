/**
 * Subtle page transitions.
 * Internal navigation fades the page out before the browser starts the next
 * document load, then the incoming page paints normally (no fade-in so LCP
 * is never delayed). Modifier keys, hash links, external links and
 * mailto/tel links are left untouched. Respects reduced motion.
 */

import { prefersReducedMotion } from "../../utils/dom.js";

const FADE_MS = 150;

function isInternal(href: string): boolean {
  if (href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("#")) return false;
  try {
    const url = new URL(href, window.location.href);
    return url.origin === window.location.origin && url.pathname !== window.location.pathname;
  } catch {
    return false;
  }
}

export function initPageTransitions(): void {
  if (prefersReducedMotion()) return;

  document.addEventListener("click", (event) => {
    const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>("a[href]") : null;
    if (!link) return;
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (link.target === "_blank" || link.hasAttribute("download")) return;
    if (link.dataset.noTransition === "true") return;

    const href = link.getAttribute("href") ?? "";
    if (!isInternal(href)) return;

    event.preventDefault();
    document.body.classList.add("page-leaving");
    window.setTimeout(() => {
      window.location.href = href;
    }, FADE_MS);
  });
}