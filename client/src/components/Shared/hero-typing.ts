import { prefersReducedMotion } from "../../utils/dom.js";

/**
 * Hero profession typing animation.
 * Types each role character-by-character, holds, deletes, then moves to the
 * next one — looping forever. The roles are server-rendered in a data
 * attribute, so no extra request is needed. Respects reduced motion by
 * showing the first role statically.
 */

const TYPE_MS = 55;
const DELETE_MS = 28;
const HOLD_MS = 1800;
const PAUSE_MS = 320;

export function initHeroTyping(): void {
  const container = document.querySelector<HTMLElement>("[data-hero-typing]");
  if (!container) return;

  const textEl = container.querySelector<HTMLElement>("[data-hero-typing-text]");
  if (!textEl) return;

  const rawRoles = container.getAttribute("data-hero-roles");
  let roles: string[] = [];
  try {
    roles = rawRoles ? (JSON.parse(rawRoles) as string[]) : [];
  } catch {
    roles = [];
  }
  roles = roles.filter((role) => typeof role === "string" && role.length > 0);
  if (roles.length === 0) return;

  if (prefersReducedMotion()) {
    textEl.textContent = roles[0] ?? "";
    return;
  }

  let roleIndex = 0;
  let charIndex = 0;
  let deleting = false;
  let timer = 0;

  const next = (delay: number): void => {
    window.clearTimeout(timer);
    timer = window.setTimeout(tick, delay);
  };

  const tick = (): void => {
    const role = roles[roleIndex] ?? "";
    if (deleting) {
      charIndex -= 1;
      textEl.textContent = role.slice(0, charIndex);
      if (charIndex <= 0) {
        deleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        next(PAUSE_MS);
      } else {
        next(DELETE_MS);
      }
      return;
    }

    charIndex += 1;
    textEl.textContent = role.slice(0, charIndex);
    if (charIndex >= role.length) {
      deleting = true;
      next(HOLD_MS);
    } else {
      next(TYPE_MS);
    }
  };

  next(600);
}
