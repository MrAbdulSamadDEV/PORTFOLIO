/**
 * One-click copy buttons + the shared clipboard helper.
 * Any element with `data-copy="<value>"` becomes a copy button that shows a
 * success toast. Falls back to a hidden textarea when the async Clipboard
 * API is unavailable (non-secure contexts).
 */

import { qsa } from "../../utils/dom.js";
import { showToast } from "./toast.js";

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand("copy");
    textarea.remove();
    return ok;
  }
}

export function initCopyButtons(): void {
  for (const button of qsa<HTMLButtonElement>("[data-copy]")) {
    if (button.dataset.copyBound === "true") continue;
    button.dataset.copyBound = "true";

    button.addEventListener("click", async () => {
      const value = button.dataset.copy ?? "";
      if (!value) return;
      const copied = await copyText(value);
      if (copied) {
        showToast("Copied!", "success");
      } else {
        showToast("Couldn't copy. Please copy manually.", "error");
      }
    });
  }
}
