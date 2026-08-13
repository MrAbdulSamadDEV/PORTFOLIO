/**
 * Skill progress animation.
 * When a skill enters the viewport the progress bar animates from 0 to its
 * target width exactly once, and the percentage number counts up. Values are
 * server-rendered (inline `--progress` + visible text), so without JS the
 * bars simply show their final state. Reduced motion renders instantly.
 */

import { prefersReducedMotion } from "../../utils/dom.js";

const DURATION = 900;

export function initSkills(): void {
  const fills = Array.from(document.querySelectorAll<HTMLElement>(".skill__fill"));
  if (fills.length === 0) return;

  const targets = fills.map((fill) => {
    const raw = fill.style.getPropertyValue("--progress").trim();
    const value = Math.min(100, Math.max(0, Number.parseFloat(raw) || 0));
    const levelEl = fill.closest(".skill")?.querySelector<HTMLElement>(".skill__level") ?? null;
    return { fill, target: value, levelEl };
  });

  type Target = (typeof targets)[number];

  const animate = (target: Target): void => {
    const { fill, target: value, levelEl } = target;
    if (prefersReducedMotion()) {
      fill.style.setProperty("--progress", `${value}%`);
      if (levelEl) levelEl.textContent = `${value}%`;
      return;
    }

    fill.style.setProperty("--progress", "0%");
    if (levelEl) levelEl.textContent = "0%";

    requestAnimationFrame(() => {
      fill.style.setProperty("--progress", `${value}%`);
    });

    if (levelEl) {
      const startedAt = performance.now();
      const tick = (now: number): void => {
        const progress = Math.min(1, (now - startedAt) / DURATION);
        const eased = 1 - Math.pow(1 - progress, 3);
        levelEl.textContent = `${Math.round(eased * value)}%`;
        if (progress < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }
  };

  if (!("IntersectionObserver" in window)) {
    targets.forEach(animate);
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const target = targets.find((item) => item.fill === entry.target);
        if (target) animate(target);
        observer.unobserve(entry.target);
      }
    },
    { rootMargin: "0px 0px -60px 0px", threshold: 0.35 },
  );

  targets.forEach((target) => observer.observe(target.fill));
}
