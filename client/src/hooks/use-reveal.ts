import { qsa } from "../utils/dom.js";

/**
 * Reveal-on-scroll micro-interaction powered by IntersectionObserver.
 * Elements with the `.reveal` class fade/slide in once, with a small
 * stagger so grids feel intentional rather than mechanical.
 */
export function initReveal(): void {
  const items = qsa<HTMLElement>(".reveal");
  if (items.length === 0) return;

  const reveal = (element: HTMLElement): void => {
    const siblings = qsa<HTMLElement>(".reveal", element.parentElement ?? document);
    const index = siblings.indexOf(element);
    element.style.setProperty("--reveal-delay", `${(index % 4) * 80}ms`);
    element.classList.add("is-visible");
  };

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) reveal(entry.target as HTMLElement);
      }
    },
    { threshold: 0.1, rootMargin: "0px 0px -6% 0px" },
  );

  items.forEach((item) => observer.observe(item));

  /** Fallback: instant jumps (End key, deep links) skip observer crossings. */
  const revealPastViewport = (): void => {
    const viewport = window.innerHeight;
    for (const item of items) {
      if (item.classList.contains("is-visible")) continue;
      if (item.getBoundingClientRect().top < viewport * 0.94) reveal(item);
    }
  };
  window.addEventListener("scroll", revealPastViewport, { passive: true });
  revealPastViewport();
}
