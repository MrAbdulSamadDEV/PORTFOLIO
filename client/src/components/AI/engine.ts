import type { AiFaq, AiKnowledgeBase } from "../../types.js";

/**
 * Offline question-answering engine for MAX AI.
 *
 * Strategy:
 *  1. Normalize the question (lowercase, strip punctuation).
 *  2. Expand the query with synonyms (e.g. "github" → "+ source code repository").
 *  3. Rank every FAQ by weighted keyword matches (exact + partial token match).
 *  4. If nothing matches confidently, fall back to intent detection.
 */

export interface EngineResult {
  faq?: AiFaq;
  intent: string | null;
}

const MIN_CONFIDENT_SCORE = 3;

/** High-frequency words that carry no topic meaning for ranking. */
const STOPWORDS = new Set([
  "me", "my", "you", "your", "yours", "yourself", "are", "is", "am", "what", "who", "how", "why", "when",
  "where", "do", "does", "did", "can", "could", "would", "will", "shall", "should", "the", "a", "an", "of",
  "to", "for", "with", "on", "at", "in", "and", "or", "about", "tell", "show", "please", "i", "we", "it",
  "this", "that", "these", "those", "have", "has", "had", "be", "been", "not", "so", "if", "as", "by", "from",
  "up", "out", "over", "under", "again", "more", "most", "other", "some", "such", "than", "then", "too",
  "very", "just", "get", "want", "know", "like", "there", "here", "into", "only", "own", "same", "us",
  "them", "he", "she", "his", "her", "let", "etc",
]);

/** Word-boundary token set of the query (no substrings). */
function tokenize(query: string): Set<string> {
  return new Set(query.split(" ").filter(Boolean));
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u2018\u2019]/g, "")
    .replace(/[^a-z0-9\s+@.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function expandSynonyms(query: string, kb: AiKnowledgeBase): string {
  let expanded = query;
  for (const [canonical, terms] of Object.entries(kb.synonyms)) {
    for (const term of terms) {
      if (query.includes(normalize(term))) {
        expanded += ` ${canonical}`;
      }
    }
  }
  return expanded;
}

export function detectIntent(query: string, kb: AiKnowledgeBase): string | null {
  let bestCategory: string | null = null;
  let bestCount = 0;

  for (const [category, keywords] of Object.entries(kb.intents)) {
    let count = 0;
    for (const keyword of keywords) {
      if (query.includes(keyword)) count += 1;
    }
    if (count > bestCount) {
      bestCount = count;
      bestCategory = category;
    }
  }

  return bestCount > 0 ? bestCategory : null;
}

export function findBestAnswer(rawQuestion: string, kb: AiKnowledgeBase): EngineResult {
  const query = normalize(rawQuestion);
  if (!query) return { intent: null };

  const expanded = expandSynonyms(query, kb);
  const queryTokens = tokenize(query);
  let best: { faq: AiFaq; score: number } | null = null;

  for (const faq of kb.faqs) {
    let score = 0;

    for (const rawKeyword of faq.keywords) {
      const keyword = normalize(rawKeyword);
      if (keyword.length < 3) continue;

      const tokens = keyword.split(" ").filter(Boolean);
      const meaningful = tokens.filter((token) => token.length >= 3 && !STOPWORDS.has(token));
      if (meaningful.length === 0) continue;

      if (tokens.every((token) => queryTokens.has(token))) {
        score += 2 + tokens.length * 1.5;
        continue;
      }

      if (meaningful.length > 1 && meaningful.every((token) => queryTokens.has(token))) {
        score += 1 + meaningful.length;
      }
    }

    if (score > (best?.score ?? 0)) {
      best = { faq, score };
    }
  }

  if (best && best.score >= MIN_CONFIDENT_SCORE) {
    return { faq: best.faq, intent: null };
  }

  return { intent: detectIntent(expanded, kb) };
}

/** Renders an answer string ("• item" lines) into safe HTML with clickable links. */
export function formatAnswer(text: string): string {
  const escapeHtml = (value: string): string =>
    value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  const withLinks = (value: string): string =>
    value.replace(
      /(https?:\/\/[^\s<]+)/g,
      '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>',
    );

  const parts: string[] = [];
  let inList = false;

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("• ")) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      parts.push(`<li>${withLinks(escapeHtml(trimmed.slice(2)))}</li>`);
    } else {
      if (inList) {
        parts.push("</ul>");
        inList = false;
      }
      if (trimmed !== "") {
        parts.push(`<p>${withLinks(escapeHtml(trimmed))}</p>`);
      }
    }
  }

  if (inList) parts.push("</ul>");
  return parts.join("");
}
