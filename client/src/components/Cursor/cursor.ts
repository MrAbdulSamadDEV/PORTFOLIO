import { prefersFinePointer, prefersReducedMotion } from "../../utils/dom.js";

/**
 * Lightweight 2D pixel-style cursor (desktop only).
 * - Small square, smooth lerped movement
 * - Grows on buttons, turns accent on links, outlines cards
 * - Shows a pointing hand over the MAX AI button
 * - Shrinks on click
 * - Automatically disabled on touch devices / reduced motion
 */

const CURSOR_SIZE = 14;
const LERP_FACTOR = 0.34;

interface CursorState {
  targetX: number;
  targetY: number;
  x: number;
  y: number;
  visible: boolean;
  hand: boolean;
}

export function initCustomCursor(): void {
  const cursor = document.getElementById("custom-cursor");
  if (!cursor) return;
  if (!prefersFinePointer() || prefersReducedMotion()) return;

  document.documentElement.classList.add("has-custom-cursor");

  const handIcon = document.createElement("i");
  handIcon.className = "fa-solid fa-hand-pointer";
  handIcon.setAttribute("aria-hidden", "true");
  cursor.appendChild(handIcon);

  const state: CursorState = {
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    visible: false,
    hand: false,
  };

  let rafId = 0;

  const frame = (): void => {
    state.x += (state.targetX - state.x) * LERP_FACTOR;
    state.y += (state.targetY - state.y) * LERP_FACTOR;
    cursor.style.transform = `translate(${state.x - CURSOR_SIZE / 2}px, ${state.y - CURSOR_SIZE / 2}px)`;
    rafId = requestAnimationFrame(frame);
  };

  window.addEventListener("mousemove", (event) => {
    state.targetX = event.clientX;
    state.targetY = event.clientY;
    if (!state.visible) {
      state.visible = true;
      state.x = event.clientX;
      state.y = event.clientY;
      cursor.style.opacity = "1";
      rafId = requestAnimationFrame(frame);
    }
  });

  document.addEventListener("mouseleave", () => {
    state.visible = false;
    cursor.style.opacity = "0";
    cancelAnimationFrame(rafId);
  });

  document.addEventListener("mouseenter", () => {
    state.visible = true;
    cursor.style.opacity = "1";
    rafId = requestAnimationFrame(frame);
  });

  const applyHover = (target: EventTarget | null): void => {
    cursor.classList.remove("is-hover-button", "is-hover-link", "is-hover-card", "is-hand");
    if (!(target instanceof Element)) return;

    const aiToggle = target.closest("[data-ai-toggle]");
    if (aiToggle) {
      cursor.classList.add("is-hand");
      return;
    }
    if (target.closest("button") || target.closest("[role='button']")) {
      cursor.classList.add("is-hover-button");
      return;
    }
    if (target.closest("a")) {
      cursor.classList.add("is-hover-link");
      return;
    }
    if (target.closest("article, .card, .project-card, .skills-card, .about-card")) {
      cursor.classList.add("is-hover-card");
    }
  };

  document.addEventListener("mouseover", (event) => applyHover(event.target));

  const clickTimer = { id: 0 };
  document.addEventListener("mousedown", () => {
    cursor.classList.add("is-clicked");
    window.clearTimeout(clickTimer.id);
    clickTimer.id = window.setTimeout(() => cursor.classList.remove("is-clicked"), 120);
  });
}
