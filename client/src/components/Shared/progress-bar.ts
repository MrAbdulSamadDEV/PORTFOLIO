/**
 * Reading progress bar — a thin accent-colored bar pinned to the top of the
 * page that reflects scroll progress. GPU-only (transform: scaleX), updated
 * through a rAF-throttled passive scroll listener. Hidden on pages that do
 * not scroll.
 */

import { rafThrottle, prefersReducedMotion } from "../../utils/dom.js";

export function initProgressBar(): void {
  if (prefersReducedMotion()) return;

  const bar = document.createElement("div");
  bar.className = "progress-bar";
  bar.setAttribute("aria-hidden", "true");
  document.body.appendChild(bar);

  const update = (): void => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollable <= 0) {
      bar.style.opacity = "0";
      return;
    }
    const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
    bar.style.transform = `scaleX(${progress})`;
    bar.style.opacity = "1";
  };

  const onScroll = rafThrottle(update);
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll, { passive: true });
  update();
}
