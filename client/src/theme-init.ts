/**
 * First-paint theme bootstrap (CSP-safe: no inline scripts allowed).
 * Sets the `data-theme` attribute on <html> before the page renders so
 * there is no flash of the wrong theme. Must stay dependency-free.
 */
(function () {
  var theme = "light";
  try {
    var stored = localStorage.getItem("portfolio-theme");
    if (stored === "dark" || stored === "light") {
      theme = stored;
    } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      theme = "dark";
    }
  } catch (error) {
    theme = "light";
  }
  document.documentElement.setAttribute("data-theme", theme);
})();
