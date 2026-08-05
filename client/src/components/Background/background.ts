import { clamp, prefersReducedMotion } from "../../utils/dom.js";

/**
 * Very lightweight animated background:
 *  - soft drifting gradient blobs (pure CSS, in the DOM)
 *  - a tiny canvas with a handful of slow particles
 * The canvas pauses when the tab is hidden and uses a capped device
 * pixel ratio so CPU usage stays minimal.
 */

interface Particle {
  x: number;
  y: number;
  radius: number;
  speed: number;
  drift: number;
  phase: number;
  alpha: number;
  color: string;
}

const PARTICLE_COLORS = ["#f26d86", "#222222", "#ffb6c1"];

export function initBackground(): void {
  const canvas = document.getElementById("particle-canvas") as HTMLCanvasElement | null;
  if (!canvas) return;
  if (prefersReducedMotion()) return;

  const context = canvas.getContext("2d");
  if (!context) return;

  let particles: Particle[] = [];
  let width = 0;
  let height = 0;
  let dpr = 1;
  let rafId = 0;
  let running = true;

  const countFor = (w: number, h: number): number => {
    const areaBased = Math.floor((w * h) / 42000);
    return clamp(areaBased, 12, 42);
  };

  const resize = (): void => {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = countFor(width, height);
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: 0.6 + Math.random() * 1.3,
      speed: 0.08 + Math.random() * 0.22,
      drift: (Math.random() - 0.5) * 0.4,
      phase: Math.random() * Math.PI * 2,
      alpha: 0.12 + Math.random() * 0.3,
      color: PARTICLE_COLORS[Math.floor(Math.random() * PARTICLE_COLORS.length)] ?? "#ffb6c1",
    }));
  };

  const draw = (time: number): void => {
    context.clearRect(0, 0, width, height);

    for (const particle of particles) {
      particle.y -= particle.speed;
      particle.x += Math.sin(time * 0.0004 + particle.phase) * particle.drift;

      if (particle.y < -8) {
        particle.y = height + 8;
        particle.x = Math.random() * width;
      }
      if (particle.x < -8) particle.x = width + 8;
      if (particle.x > width + 8) particle.x = -8;

      context.globalAlpha = particle.alpha;
      context.fillStyle = particle.color;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
    }

    context.globalAlpha = 1;
    rafId = requestAnimationFrame(draw);
  };

  const start = (): void => {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(draw);
  };

  const stop = (): void => {
    running = false;
    cancelAnimationFrame(rafId);
  };

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      stop();
    } else {
      start();
    }
  });

  window.addEventListener("resize", resize, { passive: true });

  resize();
  start();
}
