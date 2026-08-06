import type { AiFaq, AiKnowledgeBase } from "../../types.js";

/**
 * Offline question-answering engine for MAX AI.
 *
 * Strategy:
 *  1. Normalize the question (lowercase, strip punctuation, drop possessives).
 *  2. Stem tokens so singular/plural forms compare equal ("skill" ≈ "skills").
 *  3. Expand the query with synonyms (e.g. "github" → "+ source code repository").
 *  4. Rank every FAQ by layered matching, from strongest to weakest:
 *       exact phrase  → full token set → meaningful tokens → fuzzy (typo) → partial prefix.
 *  5. If nothing matches confidently, fall back to intent detection (also fuzzy).
 *
 * Everything runs locally from the bundled JSON — no external services.
 */

export interface EngineResult {
  faq?: AiFaq;
  intent: string | null;
}

export const MIN_CONFIDENT_SCORE = 3;

/** Representative FAQ shown when only the intent is known (e.g. "abdulsamad's skills"). */
export const INTENT_FALLBACKS: Record<string, string> = {
  about: "who-are-you",
  skills: "skills-overview",
  projects: "projects-overview",
  education: "education-overview",
  experience: "experience-overview",
  contact: "contact-methods",
};

/** High-frequency words that carry no topic meaning for ranking. */
export const STOPWORDS = new Set([
  "me", "my", "you", "your", "yours", "yourself", "are", "is", "am", "what", "who", "how", "why", "when",
  "where", "do", "does", "did", "can", "could", "would", "will", "shall", "should", "the", "a", "an", "of",
  "to", "for", "with", "on", "at", "in", "and", "or", "about", "tell", "show", "please", "i", "we", "it",
  "this", "that", "these", "those", "have", "has", "had", "be", "been", "not", "so", "if", "as", "by", "from",
  "up", "out", "over", "under", "again", "more", "most", "other", "some", "such", "than", "then", "too",
  "very", "just", "get", "want", "know", "like", "there", "here", "into", "only", "own", "same", "us",
  "them", "he", "she", "his", "her", "let", "etc",
]);

/** Words whose trailing "s" is not a plural marker. */
const NO_PLURAL_STRIP = new Set([
  "has", "was", "his", "this", "yes", "its", "as", "us", "is", "less", "address", "class", "process",
  "focus", "status", "boss", "access", "analysis", "basis", "canvas", "database", "css", "sass", "ass",
]);

/** Rough singular/plural handling: skill(s), study/studies, box/boxes, … */
export function stem(word: string): string {
  const w = word.toLowerCase();
  if (w.length <= 3 || NO_PLURAL_STRIP.has(w)) return w;
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith("es")) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

/**
 * Levenshtein distance with an early-out bound. Returns `bound + 1` when the
 * distance is known to exceed `bound`, so typo checks stay cheap.
 */
export function levenshtein(a: string, b: string, bound: number): number {
  if (a === b) return 0;
  const la = a.length;
  const lb = b.length;
  if (Math.abs(la - lb) > bound) return bound + 1;
  if (la === 0) return lb;
  if (lb === 0) return la;

  let prev = new Array<number>(lb + 1);
  let curr = new Array<number>(lb + 1);
  for (let j = 0; j <= lb; j += 1) prev[j] = j;

  for (let i = 1; i <= la; i += 1) {
    curr[0] = i;
    let rowMin = curr[0];
    for (let j = 1; j <= lb; j += 1) {
      const cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
      if (curr[j] < rowMin) rowMin = curr[j];
    }
    if (rowMin > bound) return bound + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[lb];
}

/** Maximum acceptable Levenshtein distance for typo-tolerant single-token matches. */
function typoTolerance(len: number): number {
  if (len <= 4) return 1;
  if (len <= 7) return 2;
  return 3;
}

/** Word-boundary phrase search (case-insensitive on already-normalized text). */
function includesPhrase(text: string, phrase: string): boolean {
  if (phrase.length === 0) return false;
  const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?:^|[^a-z0-9])${escaped}(?:$|[^a-z0-9])`, "i").test(text);
}

/** Word-boundary token set of the query, stemmed for plural comparison. */
function tokenize(query: string): Set<string> {
  const tokens = new Set<string>();
  for (const token of query.split(" ").filter(Boolean)) {
    tokens.add(stem(token));
  }
  return tokens;
}

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u2018\u2019']/g, "")
    .replace(/\bs\b(?=\s)/g, "")
    .replace(/([a-z0-9])s\b/g, "$1")
    .replace(/[^a-z0-9\s+@.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function expandSynonyms(query: string, kb: AiKnowledgeBase): string {
  let expanded = query;
  for (const [canonical, terms] of Object.entries(kb.synonyms)) {
    for (const term of terms) {
      if (includesPhrase(query, normalize(term))) {
        expanded += ` ${canonical}`;
      }
    }
  }
  return expanded;
}

/** Fuzzy comparison of a query token against a keyword token. */
function tokensMatch(queryToken: string, keywordToken: string): boolean {
  if (queryToken === keywordToken) return true;
  const q = stem(queryToken);
  const k = stem(keywordToken);
  if (q === k) return true;
  if (q.length < 4 || k.length < 4) return false;
  if (levenshtein(q, k, typoTolerance(Math.max(q.length, k.length))) <= typoTolerance(Math.max(q.length, k.length))) {
    return true;
  }
  const minLen = Math.min(q.length, k.length);
  if (minLen >= 5) {
    if (q.startsWith(k) || k.startsWith(q)) return true;
    if (q.endsWith(k.slice(-4)) && k.length >= 6) return true;
  }
  return false;
}

export function detectIntent(query: string, kb: AiKnowledgeBase): string | null {
  const tokens = tokenize(query);
  let bestCategory: string | null = null;
  let bestCount = 0;

  for (const [category, keywords] of Object.entries(kb.intents)) {
    let count = 0;
    for (const keyword of keywords) {
      const normalized = normalize(keyword);
      const keywordTokens = normalized.split(" ").filter((t) => t.length >= 2 && !STOPWORDS.has(stem(t)));
      if (keywordTokens.length === 0) continue;

      const matched = keywordTokens.some((keywordToken) => {
        for (const queryToken of tokens) {
          if (tokensMatch(queryToken, keywordToken)) return true;
        }
        return false;
      });
      if (matched) count += 1;
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
      const meaningful = tokens.filter((token) => token.length >= 2 && !STOPWORDS.has(stem(token)));
      if (meaningful.length === 0) continue;

      // 1) Exact phrase present in the query (strongest signal).
      if (includesPhrase(query, keyword)) {
        score += 6 + tokens.length * 2;
        continue;
      }

      // 2) Every token of the keyword appears (any order, plurals equalized).
      if (tokens.every((token) => queryTokens.has(stem(token)))) {
        score += 3 + tokens.length * 1.5;
        continue;
      }

      // 3) Every meaningful token appears.
      if (meaningful.length > 1 && meaningful.every((token) => queryTokens.has(stem(token)))) {
        score += 2 + meaningful.length;
      }

      // 4) Fuzzy + partial token matches (typos, truncations, compounds).
      let fuzzyHits = 0;
      let partialHits = 0;
      for (const keywordToken of meaningful) {
        for (const queryToken of queryTokens) {
          const q = stem(queryToken);
          const k = stem(keywordToken);
          if (tokensMatch(queryToken, keywordToken)) {
            if (q === k) {
              fuzzyHits += 1;
              break;
            }
            fuzzyHits += 0.5;
            break;
          }
          if (q.length >= 5 && k.length >= 5 && (q.startsWith(k) || k.startsWith(q))) {
            partialHits += 1;
            break;
          }
        }
      }
      score += Math.min(fuzzyHits, 2) * 1.5;
      score += Math.min(partialHits, 2);
    }

    if (score > (best?.score ?? 0)) {
      best = { faq, score };
    }
  }

  if (best && best.score >= MIN_CONFIDENT_SCORE) {
    return { faq: best.faq, intent: null };
  }

  const intent = detectIntent(expanded, kb);
  const fallbackId = intent ? INTENT_FALLBACKS[intent] : undefined;
  if (fallbackId) {
    const fallback = kb.faqs.find((faq) => faq.id === fallbackId);
    if (fallback) {
      return { faq: fallback, intent };
    }
  }

  return { intent };
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
