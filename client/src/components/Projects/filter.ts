import type { Project } from "../../types.js";
import { fetchJson } from "../../utils/fetch-json.js";
import { qs, qsa } from "../../utils/dom.js";

/**
 * Category filter for the /projects page.
 * The grid is server-rendered from projects.json; this script adds
 * live filtering by re-reading the same JSON file — one source of truth.
 */
export function initProjectsFilter(): void {
  const grid = qs<HTMLElement>("[data-projects-grid]");
  const container = qs<HTMLElement>(".projects-filter");
  if (!grid || !container) return;

  const cards = qsa<HTMLElement>("[data-category]", grid);
  const applyFilter = (category: string): void => {
    for (const card of cards) {
      const matches = category === "all" || card.dataset.category === category;
      card.hidden = !matches;
    }
    container.querySelectorAll<HTMLButtonElement>(".projects-filter__btn").forEach((button) => {
      const isActive = button.dataset.filter === category;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
  };

  fetchJson<Project[]>("/data/projects.json")
    .then((projects) => {
      const categories = Array.from(new Set(projects.map((project) => project.category))).sort();
      const existing = qsa<HTMLButtonElement>(".projects-filter__btn", container);
      const labels = new Set(existing.map((button) => button.dataset.filter));

      categories.forEach((category) => {
        if (labels.has(category)) return;
        const button = document.createElement("button");
        button.type = "button";
        button.className = "projects-filter__btn";
        button.dataset.filter = category;
        button.setAttribute("aria-pressed", "false");
        button.innerHTML = `<span>${category}</span>`;
        container.appendChild(button);

        button.addEventListener("click", () => applyFilter(category));
      });

      existing.forEach((button) => button.addEventListener("click", () => applyFilter(button.dataset.filter ?? "all")));
    })
    .catch((error: unknown) => {
      console.warn("[projects] filter data unavailable:", error);
      qsa<HTMLButtonElement>(".projects-filter__btn", container).forEach((button) =>
        button.addEventListener("click", () => applyFilter(button.dataset.filter ?? "all")),
      );
    });
}
