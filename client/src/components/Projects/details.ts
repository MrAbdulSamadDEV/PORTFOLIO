import { qsa } from "../../utils/dom.js";

/**
 * "View Details" toggle on project cards: expands the description
 * and rotates the chevron. No-JS users always see the full text.
 */
export function initProjectDetails(): void {
  qsa<HTMLButtonElement>(".project-card__details").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest<HTMLElement>(".project-card");
      const description = card?.querySelector<HTMLElement>(".project-card__description");
      if (!description) return;

      const isOpen = button.getAttribute("aria-expanded") === "true";
      button.setAttribute("aria-expanded", String(!isOpen));
      button.classList.toggle("is-open", !isOpen);
      description.classList.toggle("is-expanded", !isOpen);

      const label = button.querySelector("span");
      if (label) {
        label.textContent = isOpen ? "View Details" : "Show Less";
      }
    });
  });
}
