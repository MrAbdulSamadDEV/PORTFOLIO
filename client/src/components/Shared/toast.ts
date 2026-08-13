/**
 * Lightweight glassmorphism toast notifications (success / error / info /
 * warning). Rendered bottom-right, stacked, auto-dismissing and fully
 * accessible (role="status" + aria-live). The container is created lazily
 * on the first toast so unused pages pay nothing.
 */

export type ToastType = "success" | "error" | "info" | "warning";

const ICONS: Record<ToastType, string> = {
  success: "fa-solid fa-circle-check",
  error: "fa-solid fa-triangle-exclamation",
  info: "fa-solid fa-circle-info",
  warning: "fa-solid fa-triangle-exclamation",
};

const DURATION: Record<ToastType, number> = {
  success: 2200,
  error: 3600,
  info: 2600,
  warning: 3200,
};

const TOAST_LABELS: Record<ToastType, string> = {
  success: "Success",
  error: "Error",
  info: "Information",
  warning: "Warning",
};

let container: HTMLElement | null = null;

function getContainer(): HTMLElement {
  if (container && container.isConnected) return container;
  // The toast container lives in the DOM, so duplicated module copies
  // (lazy chunks) all render into the same stack.
  const existing = document.querySelector<HTMLElement>(".toast-container");
  if (existing) {
    container = existing;
    return existing;
  }
  container = document.createElement("div");
  container.className = "toast-container";
  container.setAttribute("aria-live", "polite");
  container.setAttribute("aria-atomic", "false");
  document.body.appendChild(container);
  return container;
}

export function showToast(message: string, type: ToastType = "success"): void {
  const toast = document.createElement("div");
  toast.className = `toast toast--${type}`;
  toast.setAttribute("role", "status");
  toast.innerHTML = `
    <span class="toast__icon" aria-hidden="true"><i class="${ICONS[type]}"></i></span>
    <span class="toast__body">
      <strong class="toast__title">${TOAST_LABELS[type]}</strong>
      <span class="toast__message"></span>
    </span>
    <button type="button" class="toast__close" aria-label="Dismiss notification">
      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
    </button>`;

  toast.querySelector<HTMLElement>(".toast__message")!.textContent = message;

  const dismiss = (): void => {
    if (!toast.isConnected) return;
    toast.classList.add("is-leaving");
    window.setTimeout(() => toast.remove(), 220);
  };

  toast.querySelector<HTMLButtonElement>(".toast__close")?.addEventListener("click", dismiss);

  const holder = getContainer();
  holder.appendChild(toast);
  // A rAF forces the "enter" styles to apply before the toast appears.
  requestAnimationFrame(() => toast.classList.add("is-visible"));

  window.setTimeout(dismiss, DURATION[type]);
}
