import { qsa } from "../../utils/dom.js";

/**
 * Dark/light theme switcher.
 * The initial `data-theme` attribute is set by an inline script in the
 * HTML head (before first paint), so this module only handles toggling,
 * persistence, button labels/icons and the theme-color meta tag.
 */

export type Theme = "light" | "dark";

const THEME_KEY = "portfolio-theme";
const THEME_COLORS: Record<Theme, string> = {
  light: "#ffffff",
  dark: "#000000",
};

const ICON_MOON = "fa-solid fa-moon";
const ICON_SUN = "fa-solid fa-sun";

function currentTheme(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

function updateThemeColor(theme: Theme): void {
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[theme]);
  }
}

function updateButtons(theme: Theme): void {
  const isDark = theme === "dark";
  const toggleLabel = isDark ? "Switch to light theme" : "Switch to dark theme";

  for (const button of qsa<HTMLButtonElement>("[data-theme-toggle]")) {
    button.setAttribute("aria-label", toggleLabel);
    button.setAttribute("title", toggleLabel);
    button.setAttribute("data-tooltip", "Toggle theme");

    const iconElement = button.querySelector("i");
    if (iconElement) {
      iconElement.className = isDark ? ICON_SUN : ICON_MOON;
    }

    const label = button.querySelector("span");
    if (label) {
      label.textContent = toggleLabel;
    }
  }
}

export function applyTheme(theme: Theme, persist: boolean): void {
  // Smooth cross-fade: colors transition for one frame window then the
  // helper class is removed so no permanent transition overhead remains.
  const html = document.documentElement;
  html.classList.add("theme-switching");
  window.clearTimeout(applyTheme.transitionTimer);
  applyTheme.transitionTimer = window.setTimeout(() => {
    html.classList.remove("theme-switching");
  }, 380);

  html.setAttribute("data-theme", theme);
  updateThemeColor(theme);
  updateButtons(theme);
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch (error) {
      // Storage unavailable (private mode) — the theme still applies for this visit.
    }
  }
}
applyTheme.transitionTimer = 0;

export function initTheme(): void {
  applyTheme(currentTheme(), false);

  const buttons = qsa<HTMLButtonElement>("[data-theme-toggle]");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      applyTheme(currentTheme() === "dark" ? "light" : "dark", true);
    });
  }

  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (event) => {
      let stored: string | null = null;
      try {
        stored = localStorage.getItem(THEME_KEY);
      } catch (error) {
        // Storage unavailable — fall through to the media query.
      }
      if (stored !== "dark" && stored !== "light") {
        applyTheme(event.matches ? "dark" : "light", false);
      }
    });
  }
}

/** Applies the current saved/system theme (used by the command palette). */
export function currentThemeValue(): Theme {
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}
