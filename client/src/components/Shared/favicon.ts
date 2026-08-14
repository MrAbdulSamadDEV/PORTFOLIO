/**
 * Dynamic favicon + theme-color.
 * Swaps the favicon between light and dark variants whenever the theme
 * changes (manual toggle or system preference). The pre-paint script
 * (`theme-init.js`) already handles the very first render; this module keeps
 * the icon in sync afterwards with a mutation observer on <html>.
 */

const LIGHT_ICON = "/assets/logos/logo.png";
const DARK_ICON = "/favicon-dark.png";

/**
 * Favicon MIME types. The light and dark icons are both PNGs (SVG favicons
 * with embedded rasters aren't supported by every browser), so the link's
 * declared `type` never needs to change — this guarantees the icon swap
 * works in Chrome, Edge, Firefox and Safari.
 */

const THEME_COLORS: Record<string, string> = {
  light: "#ffffff",
  dark: "#000000",
};

function applyFavicon(theme: string): void {
  const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
  if (!link) return;
  link.href = theme === "dark" ? DARK_ICON : LIGHT_ICON;

  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", THEME_COLORS[theme] ?? "#ffffff");
  }
}

export function initFavicon(): void {
  const html = document.documentElement;
  applyFavicon(html.getAttribute("data-theme") ?? "light");

  if (!("MutationObserver" in window)) return;
  const observer = new MutationObserver(() => {
    applyFavicon(html.getAttribute("data-theme") ?? "light");
  });
  observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });
}
