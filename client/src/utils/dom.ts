/** Small DOM helpers used across the client code. */

export function qs<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T | null {
  return root.querySelector<T>(selector);
}

/** Like qs but throws when the element is missing — for required UI parts. */
export function qsRequired<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) {
    throw new Error(`Required element not found: ${selector}`);
  }
  return element;
}

export function qsa<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return Array.from(root.querySelectorAll<T>(selector));
}

/** Throttled requestAnimationFrame wrapper. */
export function rafThrottle<Args extends unknown[]>(callback: (...args: Args) => void): (...args: Args) => void {
  let frameId = 0;
  return (...args: Args) => {
    if (frameId !== 0) return;
    frameId = requestAnimationFrame(() => {
      frameId = 0;
      callback(...args);
    });
  };
}

export function prefersReducedMotion(): boolean {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function prefersFinePointer(): boolean {
  return window.matchMedia("(pointer: fine)").matches;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
