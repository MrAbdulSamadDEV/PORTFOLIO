/**
 * HTML escaping utilities used by every server-rendered template.
 * All content that comes from JSON is escaped before it reaches the page.
 */

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function escapeAttr(value: string): string {
  return escapeHtml(value);
}

/** Escapes a value for safe embedding inside a JSON-LD script block. */
export function escapeJsonLd(value: unknown): string {
  const json = JSON.stringify(value);
  return json.replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
}
