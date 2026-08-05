import { initProjectsFilter } from "../components/Projects/filter.js";
import { initProjectDetails } from "../components/Projects/details.js";

/** Projects page bootstrap — category filtering + card details. */
export function initProjectsPage(): void {
  initProjectsFilter();
  initProjectDetails();
}
