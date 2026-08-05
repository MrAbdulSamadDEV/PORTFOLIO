import { qs } from "../../utils/dom.js";
import { onScroll } from "./navigation.js";

/** Shows the "back to top" button after scrolling and scrolls smoothly. */
export function initBackToTop(): void {
  const button = qs<HTMLButtonElement>(".back-to-top");
  if (!button) return;

  onScroll(() => {
    const visible = window.scrollY > 640;
    button.classList.toggle("is-visible", visible);
    button.hidden = !visible;
  });

  button.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}
