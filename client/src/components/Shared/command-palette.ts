/**
 * Premium VS Code / Raycast style command palette.
 * - Lazy: the module (and its DOM) only loads on the first open.
 * - Glassmorphism popup, centered, blurred backdrop, fade + scale entrance.
 * - Instant search with per-command keywords ("pro" → Projects, etc.).
 * - Full keyboard support (↑↓, Enter, Esc, Tab focus trap) + ARIA
 *   (dialog, listbox, aria-activedescendant, focus trap).
 */

import { qsa } from "../../utils/dom.js";
import { prefersReducedMotion } from "../../utils/dom.js";
import { copyText } from "./copy.js";
import { showToast } from "./toast.js";
import { applyTheme, currentThemeValue } from "./theme.js";

interface PaletteCommand {
  id: string;
  label: string;
  keywords: string[];
  icon: string;
  hint?: string;
  run: () => void;
}

function isHome(): boolean {
  return document.body.classList.contains("page-home");
}

function navigate(url: string): void {
  if (url.startsWith("/#") && isHome()) {
    const id = url.slice(2);
    document.getElementById(id)?.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", "/");
    return;
  }
  window.location.href = url;
}

function scrollTo(y: number): void {
  window.scrollTo({ top: y, behavior: prefersReducedMotion() ? "auto" : "smooth" });
}

function buildCommands(): PaletteCommand[] {
  const copy = (value: string, label: string): void => {
    void copyText(value).then((ok) => {
      showToast(ok ? `Copied ${label}!` : "Couldn't copy. Please copy manually.", ok ? "success" : "error");
    });
  };

  return [
    { id: "home", label: "Home", keywords: ["start", "go to", "hero"], icon: "fa-solid fa-house", run: () => navigate("/") },
    { id: "about", label: "About", keywords: ["who", "bio"], icon: "fa-solid fa-user", run: () => navigate("/#about") },
    { id: "skills", label: "Skills", keywords: ["tech", "stack", "tools"], icon: "fa-solid fa-code", run: () => navigate("/#skills") },
    { id: "projects", label: "Projects", keywords: ["pro", "work", "portfolio"], icon: "fa-solid fa-folder-open", run: () => navigate("/#projects") },
    { id: "contact", label: "Contact", keywords: ["email me", "hire", "reach"], icon: "fa-solid fa-envelope", run: () => navigate("/#contact") },
    {
      id: "max",
      label: "Open MAX AI",
      keywords: ["max", "chat", "assistant", "ask", "ai"],
      icon: "fa-solid fa-robot",
      run: () => window.dispatchEvent(new CustomEvent("max-ai:open")),
    },
    {
      id: "theme",
      label: "Toggle Theme",
      keywords: ["theme", "dark", "light", "mode"],
      icon: "fa-solid fa-moon",
      run: () => applyTheme(currentThemeValue() === "dark" ? "light" : "dark", true),
    },
    {
      id: "copy-email",
      label: "Copy Email",
      keywords: ["email", "mail", "address", "copy"],
      icon: "fa-solid fa-copy",
      run: () => copy(document.querySelector<HTMLElement>(".contact-card__value")?.textContent?.trim() ?? "", "email"),
    },
    {
      id: "copy-phone",
      label: "Copy Phone Number",
      keywords: ["phone", "number", "call", "copy"],
      icon: "fa-solid fa-copy",
      run: () => copy(document.querySelector('[data-copy^="+"]')?.getAttribute("data-copy") ?? "+923708033443", "phone number"),
    },
    {
      id: "copy-portfolio",
      label: "Copy Portfolio URL",
      keywords: ["portfolio", "url", "link", "website", "copy"],
      icon: "fa-solid fa-globe",
      run: () => copy(window.location.origin, "portfolio URL"),
    },
    {
      id: "copy-github",
      label: "Copy GitHub URL",
      keywords: ["git", "github", "repo", "url", "copy"],
      icon: "fa-brands fa-github",
      run: () => copy("https://github.com/MrAbdulSamadDEV", "GitHub URL"),
    },
    { id: "open-github", label: "Open GitHub", keywords: ["git", "github", "repo"], icon: "fa-brands fa-github", run: () => window.open("https://github.com/MrAbdulSamadDEV", "_blank", "noopener") },
    { id: "open-linkedin", label: "Open LinkedIn", keywords: ["linkedin", "in"], icon: "fa-brands fa-linkedin", run: () => window.open("https://www.linkedin.com/in/MRABDULSAMADDEV", "_blank", "noopener") },
    { id: "open-instagram", label: "Open Instagram", keywords: ["instagram", "ig", "photo"], icon: "fa-brands fa-instagram", run: () => window.open("https://www.instagram.com/samad_boy.dev", "_blank", "noopener") },
    { id: "open-youtube", label: "Open YouTube", keywords: ["youtube", "video", "channel"], icon: "fa-brands fa-youtube", run: () => window.open("https://www.youtube.com/@MRABDULSAMADDEV", "_blank", "noopener") },
    { id: "open-x", label: "Open X (Twitter)", keywords: ["x", "twitter", "tweet"], icon: "fa-brands fa-x-twitter", run: () => window.open("https://x.com/ABDULSAMAD8492", "_blank", "noopener") },
    { id: "scroll-top", label: "Scroll to Top", keywords: ["top", "up", "beginning"], icon: "fa-solid fa-arrow-up", run: () => scrollTo(0) },
    { id: "scroll-bottom", label: "Scroll to Bottom", keywords: ["bottom", "down", "end"], icon: "fa-solid fa-arrow-down", run: () => scrollTo(document.documentElement.scrollHeight) },
    { id: "preview-404", label: "Open 404 Preview", keywords: ["404", "error", "not found", "preview"], icon: "fa-solid fa-ghost", run: () => navigate("/this-page-does-not-exist") },
  ];
}

const ICON_FALLBACK = "fa-solid fa-terminal";

const HELP_ROWS: Array<[string[], string]> = [
  [["Ctrl", "K"], "Open command palette"],
  [["?"], "Show keyboard shortcuts"],
  [["Ctrl", "/"], "Focus MAX chat input"],
  [["Esc"], "Close dialogs"],
  [["Home"], "Scroll to top"],
  [["End"], "Scroll to bottom"],
];

function renderHelp(): string {
  const rows = HELP_ROWS.map(
    ([keys, description]) => `
      <li class="palette__help-row">
        <span class="palette__help-keys">${keys.map((key) => `<kbd>${key}</kbd>`).join("<span class=\"palette__help-plus\" aria-hidden=\"true\">+</span>")}</span>
        <span class="palette__help-desc" data-desc="${description}">${description}</span>
      </li>`,
  ).join("");
  return `
    <div class="palette__help" data-help-panel role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" hidden>
      <header class="palette__help-header">
        <h2>Keyboard shortcuts</h2>
        <button type="button" class="palette__close" data-help-close aria-label="Close keyboard shortcuts">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </header>
      <ul class="palette__help-list">${rows}</ul>
      <footer class="palette__footer"><span><kbd>Esc</kbd> Close</span></footer>
    </div>`;
}

function renderItem(command: PaletteCommand, index: number): string {
  return `
    <li class="palette__item" id="palette-item-${index}" role="option" aria-selected="false">
      <span class="palette__item-icon" aria-hidden="true"><i class="${command.icon || ICON_FALLBACK}"></i></span>
      <span class="palette__item-label">${command.label}</span>
    </li>`;
}

export function initCommandPalette(): { openPalette: () => void; openHelp: () => void; isOpen: () => boolean } {
  const root = document.createElement("div");
  root.className = "palette";
  root.innerHTML = `
    <div class="palette__backdrop" data-palette-backdrop aria-hidden="true"></div>
    <div class="palette__popup" role="dialog" aria-modal="true" aria-label="Command palette">
      <div class="palette__header">
        <span class="palette__search-icon" aria-hidden="true"><i class="fa-solid fa-magnifying-glass"></i></span>
        <input type="text" class="palette__input" placeholder="Type a command or search…" aria-label="Search commands" autocomplete="off" spellcheck="false" role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list">
        <button type="button" class="palette__close" aria-label="Close command palette">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
        </button>
      </div>
      <ul class="palette__list" id="palette-list" role="listbox" aria-label="Commands"></ul>
      <p class="palette__empty" hidden>No commands found.</p>
      <footer class="palette__footer">
        <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
        <span><kbd>Enter</kbd> Run</span>
        <span><kbd>Esc</kbd> Close</span>
        <span><kbd>?</kbd> Shortcuts</span>
      </footer>
    </div>
    ${renderHelp()}`;

  const commands = buildCommands();
  const backdrop = root.querySelector<HTMLElement>("[data-palette-backdrop]")!;
  const popup = root.querySelector<HTMLElement>(".palette__popup")!;
  const input = root.querySelector<HTMLInputElement>(".palette__input")!;
  const list = root.querySelector<HTMLElement>(".palette__list")!;
  const empty = root.querySelector<HTMLElement>(".palette__empty")!;
  const helpPanel = root.querySelector<HTMLElement>("[data-help-panel]")!;
  const helpClose = root.querySelector<HTMLButtonElement>("[data-help-close]")!;

  let visible: PaletteCommand[] = commands;
  let selected = 0;
  let open = false;
  let helpOpen = false;
  let lastFocus: HTMLElement | null = null;

  const setOpen = (value: boolean): void => {
    open = value;
    root.classList.toggle("is-open", value);
    document.documentElement.classList.toggle("palette-open", value);
    if (value) {
      lastFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      helpPanel.hidden = true;
      helpOpen = false;
      selected = 0;
      input.value = "";
      render(commands);
      requestAnimationFrame(() => input.focus());
    } else {
      helpPanel.hidden = true;
      helpOpen = false;
      lastFocus?.focus();
    }
  };

  const showHelp = (): void => {
    open = true;
    helpOpen = true;
    helpPanel.hidden = false;
    root.classList.add("is-open");
    document.documentElement.classList.add("palette-open");
    requestAnimationFrame(() => helpClose.focus());
  };

  const runSelected = (): void => {
    const command = visible[selected];
    if (!command) return;
    setOpen(false);
    command.run();
  };

  const render = (items: PaletteCommand[]): void => {
    visible = items;
    empty.hidden = items.length > 0;
    list.innerHTML = items.map(renderItem).join("");
    if (selected >= items.length) selected = 0;
    highlight();
  };

  const highlight = (): void => {
    for (const item of qsa<HTMLElement>(".palette__item", list)) {
      const index = Number(item.id.replace("palette-item-", ""));
      const isSelected = index === selected;
      item.classList.toggle("is-selected", isSelected);
      item.setAttribute("aria-selected", String(isSelected));
    }
    const active = list.querySelector<HTMLElement>(".palette__item.is-selected");
    if (active) {
      input.setAttribute("aria-activedescendant", active.id);
      active.scrollIntoView({ block: "nearest" });
    }
  };

  input.addEventListener("input", () => {
    const needle = input.value.trim().toLowerCase();
    const matches = commands.filter((command) => {
      const haystack = [command.label, ...command.keywords].join(" ").toLowerCase();
      return needle.length === 0 || haystack.includes(needle);
    });
    selected = 0;
    render(matches);
  });

  input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      selected = (selected + 1) % Math.max(1, visible.length);
      highlight();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      selected = (selected - 1 + visible.length) % Math.max(1, visible.length);
      highlight();
    } else if (event.key === "Enter") {
      event.preventDefault();
      runSelected();
    } else if (event.key === "Escape") {
      event.preventDefault();
      if (helpOpen) {
        showHelpClose();
      } else {
        setOpen(false);
        input.blur();
      }
    } else if (event.key === "?" || (event.shiftKey && event.key === "/")) {
      event.preventDefault();
      showHelp();
    } else if (event.key === "Tab") {
      // Focus trap: keep focus inside the palette.
      event.preventDefault();
      const focusables = qsa<HTMLElement>("button, input", popup);
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey) {
        (document.activeElement === first ? last : first)?.focus();
      } else {
        (document.activeElement === last ? first : last)?.focus();
      }
    }
  });

  list.addEventListener("click", (event) => {
    const item = event.target instanceof Element ? event.target.closest<HTMLElement>(".palette__item") : null;
    if (!item) return;
    const index = Number(item.id.replace("palette-item-", ""));
    selected = index;
    runSelected();
  });

  const showHelpClose = (): void => {
    helpPanel.hidden = true;
    helpOpen = false;
    input.focus();
  };

  const closeAll = (): void => {
    if (helpOpen) {
      showHelpClose();
      setOpen(false);
    } else {
      setOpen(false);
    }
  };

  backdrop.addEventListener("click", closeAll);
  root.querySelector<HTMLButtonElement>(".palette__close")?.addEventListener("click", () => setOpen(false));
  helpClose.addEventListener("click", () => {
    showHelpClose();
    setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!root.isConnected) return;
    if (!open && !helpOpen) return;
    if (document.activeElement !== input && helpOpen) {
      event.preventDefault();
      showHelpClose();
    }
  });

  document.body.appendChild(root);

  return {
    openPalette: () => setOpen(true),
    openHelp: () => showHelp(),
    isOpen: () => open || helpOpen,
  };
}