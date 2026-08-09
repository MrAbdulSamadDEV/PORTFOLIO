import type { AiKnowledgeBase } from "../../types.js";
import { fetchJson } from "../../utils/fetch-json.js";
import { qs, qsa, qsRequired, prefersReducedMotion } from "../../utils/dom.js";
import { buildAnswer, formatAnswer } from "./engine.js";

/**
 * MAX AI — the floating portfolio assistant widget.
 * Fully self-contained: the knowledge base ships with the site as a JSON
 * file, so the assistant answers instantly with no external services.
 */

const FALLBACK_UNKNOWN =
  "I couldn't find an exact answer to that yet. Try asking about Abdul's projects, skills, experience, education, certificates or contact details.";

function currentTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function initAiAssistant(): void {
  const widget = qsRequired<HTMLElement>("[data-ai-widget]");
  const toggle = qsRequired<HTMLButtonElement>("[data-ai-toggle]");
  const chat = qsRequired<HTMLElement>("[data-ai-chat]");
  const messages = qsRequired<HTMLElement>("[data-ai-messages]");
  const form = qsRequired<HTMLFormElement>("[data-ai-form]");
  const input = qsRequired<HTMLTextAreaElement>(".ai-chat__input", widget);
  const sendButton = qsRequired<HTMLButtonElement>(".ai-chat__send", widget);
  const searchToggle = qsRequired<HTMLButtonElement>("[data-ai-search-toggle]");
  const searchPanel = qsRequired<HTMLElement>("[data-ai-search]");
  const searchInput = qsRequired<HTMLInputElement>('input[type="search"]', searchPanel);
  const clearButton = qsRequired<HTMLButtonElement>("[data-ai-clear]");
  const closeButton = qsRequired<HTMLButtonElement>("[data-ai-close]");

  const serverWelcome = widget.getAttribute("data-welcome-text") ?? "";
  const reducedMotion = prefersReducedMotion();

  let kb: AiKnowledgeBase | null = null;
  let kbReady: Promise<AiKnowledgeBase> | null = null;
  let opened = false;
  let welcomeShown = false;
  let typingTimer = 0;
  let composerLocked = false;

  /* ---------- Knowledge base (loaded lazily on first open) ---------- */

  const loadKnowledgeBase = (): Promise<AiKnowledgeBase> => {
    if (kbReady) return kbReady;
    kbReady = fetchJson<AiKnowledgeBase>("/data/ai.json")
      .then((data) => {
        kb = data;
        return data;
      })
      .catch((error: unknown) => {
        console.warn("[max-ai] knowledge base unavailable, using fallback:", error);
        return createFallbackKnowledgeBase();
      });
    return kbReady;
  };

  /* ---------- Helpers ---------- */

  const scrollToBottom = (behavior: ScrollBehavior = "auto"): void => {
    messages.scrollTo({ top: messages.scrollHeight, behavior });
  };

  const lockComposer = (locked: boolean): void => {
    composerLocked = locked;
    input.disabled = locked;
    sendButton.disabled = locked;
  };

  function createMessage(role: "user" | "bot"): HTMLElement {
    const message = document.createElement("div");
    message.className = `ai-msg ai-msg--${role}`;
    message.dataset.role = role;

    const bubble = document.createElement("div");
    bubble.className = "ai-msg__bubble";
    message.appendChild(bubble);

    const meta = document.createElement("div");
    meta.className = "ai-msg__meta";
    meta.appendChild(document.createElement("time"));
    message.appendChild(meta);

    return message;
  }

  const setMessageTime = (message: HTMLElement, time: string): void => {
    const timeElement = message.querySelector("time");
    if (timeElement) {
      timeElement.textContent = time;
      timeElement.setAttribute("datetime", new Date().toISOString());
    }
  };

  function addCopyButton(message: HTMLElement, text: string): void {
    const meta = message.querySelector(".ai-msg__meta");
    if (!meta) return;

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "ai-msg__copy";
    copyButton.setAttribute("aria-label", "Copy response");
    copyButton.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i> Copy';

    copyButton.addEventListener("click", async () => {
      const copied = await copyText(text);
      copyButton.innerHTML = copied
        ? '<i class="fa-solid fa-check" aria-hidden="true"></i> Copied'
        : '<i class="fa-solid fa-copy" aria-hidden="true"></i> Copy';
      window.setTimeout(() => {
        copyButton.innerHTML = '<i class="fa-solid fa-copy" aria-hidden="true"></i> Copy';
      }, 1600);
    });

    meta.appendChild(copyButton);
  }

  async function copyText(text: string): Promise<boolean> {
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

  const renderBotAnswer = (message: HTMLElement, text: string): void => {
    const bubble = message.querySelector<HTMLElement>(".ai-msg__bubble");
    if (!bubble) return;
    bubble.innerHTML = formatAnswer(text);
    addCopyButton(message, text);
    setMessageTime(message, currentTime());
  };

  /** Types the bot reply character by character for a polished feel. */
  function typeBotAnswer(message: HTMLElement, text: string, done: () => void): void {
    const bubble = message.querySelector<HTMLElement>(".ai-msg__bubble");
    if (!bubble) return;

    if (reducedMotion || text.length > 600) {
      renderBotAnswer(message, text);
      done();
      return;
    }

    const totalMs = Math.min(1200, Math.max(400, text.length * 8));
    const startedAt = performance.now();
    let index = 0;
    let finished = false;

    const finish = (): void => {
      if (finished) return;
      finished = true;
      bubble.style.whiteSpace = "";
      renderBotAnswer(message, text);
      done();
    };

    bubble.style.whiteSpace = "pre-wrap";

    const tick = (): void => {
      if (finished) return;
      const progress = Math.min(1, (performance.now() - startedAt) / totalMs);
      const target = Math.floor(progress * text.length);
      if (target > index) {
        index = target;
        bubble.textContent = text.slice(0, index);
        scrollToBottom("auto");
      }
      if (progress < 1) {
        window.setTimeout(tick, 24);
      } else {
        finish();
      }
    };

    window.setTimeout(tick, 40);
    // Hard completion guard: nested timers can be throttled (background tab,
    // headless), so guarantee the answer finishes within a bounded time.
    window.setTimeout(finish, totalMs + 350);
  }

  const addUserMessage = (text: string): void => {
    const message = createMessage("user");
    message.querySelector(".ai-msg__bubble")!.textContent = text;
    setMessageTime(message, currentTime());
    messages.appendChild(message);
    scrollToBottom();
  };

  const showTypingIndicator = (): HTMLElement => {
    const indicator = document.createElement("div");
    indicator.className = "ai-msg ai-msg--bot ai-msg--typing";
    indicator.setAttribute("aria-hidden", "true");
    indicator.innerHTML = `<div class="ai-msg__bubble"><span class="ai-msg__dot"></span><span class="ai-msg__dot"></span><span class="ai-msg__dot"></span></div>`;
    messages.appendChild(indicator);
    scrollToBottom();
    return indicator;
  };

  function answerQuestion(rawQuestion: string): void {
    if (composerLocked) return;

    const question = rawQuestion.trim();
    if (question.length === 0) return;

    lockComposer(true);
    input.value = "";
    resizeComposer();
    addUserMessage(question);

    const indicator = showTypingIndicator();

    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(async () => {
      const answer = buildAnswer(question, await loadKnowledgeBase());

      indicator.remove();

      const message = createMessage("bot");
      messages.appendChild(message);

      typeBotAnswer(message, answer, () => {
        lockComposer(false);
        input.focus();
      });
    }, 480 + Math.min(question.length * 14, 640));
  }

  function createFallbackKnowledgeBase(): AiKnowledgeBase {
    return {
      welcome: serverWelcome,
      unknown: FALLBACK_UNKNOWN,
      synonyms: {},
      intents: {},
      faqs: [],
    };
  }

  const showWelcome = (typewriter: boolean): void => {
    if (welcomeShown) return;
    welcomeShown = true;

    const welcomeText = kb?.welcome || serverWelcome;
    if (!welcomeText) return;

    const message = createMessage("bot");
    messages.appendChild(message);

    if (typewriter) {
      typeBotAnswer(message, welcomeText, () => input.focus());
    } else {
      renderBotAnswer(message, welcomeText);
    }
  };

  /* ---------- Open / close ---------- */

  const open = (): void => {
    chat.hidden = false;
    toggle.setAttribute("aria-expanded", "true");
    void loadKnowledgeBase();
    if (!opened) {
      opened = true;
      showWelcome(true);
    }
    window.setTimeout(() => input.focus(), 120);
  };

  const close = (): void => {
    chat.hidden = true;
    toggle.setAttribute("aria-expanded", "false");
    toggle.focus();
  };

  toggle.addEventListener("click", () => {
    if (chat.hidden) {
      open();
    } else {
      close();
    }
  });

  closeButton.addEventListener("click", close);

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !chat.hidden) {
      close();
    }
  });

  window.addEventListener("max-ai:open", () => {
    open();
  });

  // The widget is server-rendered and can be opened (by the boot script)
  // before this module finishes loading; adopt that state instead of
  // requiring a second click.
  if (!chat.hidden) {
    open();
  }

  /* ---------- Suggestions ---------- */

  /* ---------- Composer ---------- */

  const resizeComposer = (): void => {
    input.style.height = "auto";
    input.style.height = `${Math.min(input.scrollHeight, 120)}px`;
  };

  input.addEventListener("input", resizeComposer);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!composerLocked) {
        answerQuestion(input.value);
      }
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    answerQuestion(input.value);
  });

  /* ---------- Clear ---------- */

  clearButton.addEventListener("click", () => {
    qsa<HTMLElement>(".ai-msg", messages).forEach((message) => message.remove());
    welcomeShown = false;
    if (searchPanel.hidden === false) {
      toggleSearch(false);
    }
    showWelcome(false);
  });

  /* ---------- Search conversation ---------- */

  const toggleSearch = (show: boolean): void => {
    searchPanel.hidden = !show;
    searchToggle.classList.toggle("is-active", show);
    searchToggle.setAttribute("aria-pressed", String(show));
    if (show) {
      searchInput.value = "";
      searchInput.focus();
      filterMessages("");
    }
  };

  searchToggle.addEventListener("click", () => {
    toggleSearch(searchPanel.hidden);
  });

  const filterMessages = (query: string): void => {
    const needle = query.trim().toLowerCase();
    let visibleCount = 0;

    qsa<HTMLElement>(".ai-msg", messages).forEach((message) => {
      const matches = needle.length === 0 || (message.textContent ?? "").toLowerCase().includes(needle);
      message.hidden = !matches;
      if (matches) visibleCount += 1;
    });

    let note = messages.querySelector<HTMLElement>(".ai-chat__empty-search");
    if (needle.length > 0 && visibleCount === 0) {
      if (!note) {
        note = document.createElement("p");
        note.className = "ai-chat__empty-search";
        note.textContent = "No messages match your search.";
        messages.appendChild(note);
      }
    } else {
      note?.remove();
    }
  };

  searchInput.addEventListener("input", () => filterMessages(searchInput.value));

  /* ---------- Focus trap within the open chat ---------- */

  chat.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;
    const focusables = qsa<HTMLButtonElement | HTMLInputElement | HTMLTextAreaElement>("button, input, textarea", chat).filter((element) => !element.disabled && !element.hidden);
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    if (!first || !last) return;
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });
}
