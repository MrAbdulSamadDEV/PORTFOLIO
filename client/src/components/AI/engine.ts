import type { AiFaq, AiKnowledgeBase } from "../../types.js";

/**
 * Offline question-answering engine for MAX AI.
 *
 * Strategy:
 *  1. Normalize the question (lowercase, strip punctuation, drop possessives).
 *  2. Stem tokens so singular/plural forms compare equal ("skill" ≈ "skills").
 *  3. Expand the query with synonyms (e.g. "github" → "+ source code repository").
 *  4. Split compound messages into segments ("github email phone", "skills and
 *     experience") and rank EVERY FAQ in the whole knowledge base by layered
 *     matching, from strongest to weakest:
 *       exact phrase → full token set → meaningful tokens → fuzzy (typo) → partial prefix.
 *  5. Collect ALL matching FAQs — never stop at the first keyword. Each hit
 *     records which query tokens it explains; greedy token coverage merges
 *     complementary topics into one combined answer and drops redundant
 *     duplicates (e.g. "skills" only returns the skills overview).
 *  6. Only if no FAQ anywhere matches confidently do we fall back to intent
 *     detection and finally to the unknown-response.
 *
 * Everything runs locally from the bundled JSON — no external services.
 */

export interface EngineHit {
  faq: AiFaq;
  score: number;
  tokens: Set<string>;
}

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
  certificates: "certificates-list",
  contact: "contact-methods",
  services: "services",
  learning: "learning-journey",
  misc: "what-can-you-do",
};

/** High-frequency words that carry no topic meaning for ranking. */
export const STOPWORDS = new Set([
  "me", "my", "you", "your", "yours", "yourself", "are", "is", "am", "what", "who", "how", "why", "when",
  "where", "do", "does", "did", "can", "could", "would", "will", "shall", "should", "the", "a", "an", "of",
  "to", "for", "with", "on", "at", "in", "and", "or", "about", "tell", "please", "i", "we", "it",
  "this", "that", "these", "those", "have", "has", "had", "be", "been", "not", "so", "if", "as", "by", "from",
  "up", "out", "over", "under", "again", "more", "most", "other", "some", "such", "than", "then", "too",
  "very", "just", "get", "want", "know", "like", "there", "here", "into", "only", "own", "same", "us",
  "them", "he", "she", "his", "her", "let", "need", "anything", "everything", "etc",
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
      const del = prev[j] ?? lb + 1;
      const ins = curr[j - 1] ?? lb + 1;
      const sub = prev[j - 1] ?? lb + 1;
      curr[j] = Math.min(del + 1, ins + 1, sub + cost);
      const cell = curr[j] ?? lb + 1;
      if (cell < rowMin) rowMin = cell;
    }
    if (rowMin > bound) return bound + 1;
    [prev, curr] = [curr, prev];
  }
  return prev[lb] ?? lb;
}

/** Maximum acceptable Levenshtein distance for typo-tolerant single-token matches. */
function typoTolerance(len: number): number {
  if (len <= 4) return 1;
  return 2;
}

/** LRU-ish memo so large knowledge bases normalize each keyword only once. */
const normalizeCache = new Map<string, string>();

/** Fast word-boundary phrase search on already-normalized text. Uses
 * `indexOf` + boundary checks instead of one RegExp per keyword: V8 keeps
 * 20K+ distinct regexes on its slow interpreter path (~40-90µs per test),
 * which turned a single question into a multi-second main-thread freeze. */
function includesPhrase(text: string, phrase: string): boolean {
  if (phrase.length === 0) return false;
  let from = 0;
  for (;;) {
    const idx = text.indexOf(phrase, from);
    if (idx === -1) return false;
    const startOk = idx === 0 || !isWordChar(text.charCodeAt(idx - 1));
    const end = idx + phrase.length;
    const endOk = end === text.length || !isWordChar(text.charCodeAt(end));
    if (startOk && endOk) return true;
    from = idx + 1;
  }
}

/** ASCII word char (a-z / 0-9) — the same boundary the old regex used. */
function isWordChar(code: number): boolean {
  return (code >= 48 && code <= 57) || (code >= 97 && code <= 122);
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
  const cached = normalizeCache.get(text);
  if (cached !== undefined) return cached;
  // Deliberately idempotent: every step below must keep its output stable
  // when applied twice, because findBestAnswer passes its normalized query
  // into findAllAnswers. Plural handling lives in stem() instead (guarded by
  // NO_PLURAL_STRIP), so "address" never becomes "addres" -> "addre".
  const value = text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u2018\u2019']/g, "")
    .replace(/\bs\b(?=\s)/g, "")
    .replace(/[^a-z0-9\s+@.\-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (normalizeCache.size > 60000) normalizeCache.clear();
  normalizeCache.set(text, value);
  return value;
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

interface KeywordInfo {
  normalized: string;
  tokens: string[];
  stemmed: string[];
  meaningful: string[];
  meaningfulStemmed: string[];
}

/** Tokenization of a keyword is stable; memoize it across questions. */
const keywordInfoCache = new Map<string, KeywordInfo>();

function keywordInfo(rawKeyword: string): KeywordInfo {
  const cached = keywordInfoCache.get(rawKeyword);
  if (cached) return cached;
  const normalized = normalize(rawKeyword);
  const tokens = normalized.split(" ").filter(Boolean);
  const stemmed = tokens.map(stem);
  const meaningful = tokens.filter((token) => token.length >= 2 && !STOPWORDS.has(stem(token)));
  const info = { normalized, tokens, stemmed, meaningful, meaningfulStemmed: meaningful.map(stem) };
  if (keywordInfoCache.size > 50000) keywordInfoCache.clear();
  keywordInfoCache.set(rawKeyword, info);
  return info;
}

/**
 * Unique meaningful keyword tokens across the whole knowledge base, grouped
 * for cheap fuzzy-candidate lookup. Built once per knowledge base.
 */
interface TokenIndex {
  set: Set<string>;
  byLength: Map<number, string[]>;
  byFirst: Map<string, string[]>;
}

const tokenIndexCache = new WeakMap<object, TokenIndex>();

function buildTokenIndex(kb: AiKnowledgeBase): TokenIndex {
  const set = new Set<string>();
  const byLength = new Map<number, string[]>();
  const byFirst = new Map<string, string[]>();
  for (const faq of kb.faqs) {
    for (const rawKeyword of faq.keywords) {
      for (const token of keywordInfo(rawKeyword).meaningfulStemmed) {
        if (set.has(token)) continue;
        set.add(token);
        let lengthBucket = byLength.get(token.length);
        if (!lengthBucket) {
          lengthBucket = [];
          byLength.set(token.length, lengthBucket);
        }
        lengthBucket.push(token);
        const first = token.charAt(0);
        let firstBucket = byFirst.get(first);
        if (!firstBucket) {
          firstBucket = [];
          byFirst.set(first, firstBucket);
        }
        firstBucket.push(token);
      }
    }
  }
  return { set, byLength, byFirst };
}

/**
 * Per-question candidate map for the fuzzy layer: query token → every
 * keyword token in the whole knowledge base it would match. The original
 * fuzzy branch re-ran Levenshtein inside the per-FAQ/per-keyword loops
 * (~30K+ calls per question); building this map once per question turns
 * those calls into Set lookups in scoreFaq. Match conditions mirror the
 * original branch exactly: length gates, tolerance from the longer token,
 * and the prefix rule with minLen 5.
 */
function buildFuzzyMatches(queryTokens: Set<string>, kb: AiKnowledgeBase): Map<string, Set<string>> {
  let index = tokenIndexCache.get(kb);
  if (!index) {
    index = buildTokenIndex(kb);
    tokenIndexCache.set(kb, index);
  }

  const matches = new Map<string, Set<string>>();
  for (const q of queryTokens) {
    if (q.length < 4) continue;
    const matched = new Set<string>();

    const fromLen = Math.max(4, q.length - 2);
    const toLen = q.length + 2;
    for (let len = fromLen; len <= toLen; len += 1) {
      const bucket = index.byLength.get(len);
      if (!bucket) continue;
      for (const k of bucket) {
        const tolerance = typoTolerance(Math.max(q.length, k.length));
        if (Math.abs(q.length - k.length) <= tolerance && levenshtein(q, k, tolerance) <= tolerance) {
          matched.add(k);
        }
      }
    }

    if (q.length >= 5) {
      // q.startsWith(k): a shorter keyword token that is a prefix of the
      // query token ("fullstack" contains "full" + "stack").
      for (let prefixLen = 5; prefixLen < q.length; prefixLen += 1) {
        const prefix = q.slice(0, prefixLen);
        if (index.set.has(prefix)) matched.add(prefix);
      }
      // k.startsWith(q): a longer keyword token built on the query token.
      const firstBucket = index.byFirst.get(q.charAt(0));
      if (firstBucket) {
        for (const k of firstBucket) {
          if (k.length > q.length && k.startsWith(q)) matched.add(k);
        }
      }
    }

    if (matched.size > 0) matches.set(q, matched);
  }
  return matches;
}

interface FaqScore {
  score: number;
  tokens: Set<string>;
}

/**
 * Scores one FAQ against the query. Returns the total score and the set of
 * query tokens this FAQ actually explains (used for multi-topic merging).
 */
function scoreFaq(faq: AiFaq, query: string, queryTokens: Set<string>, fuzzyMatches: Map<string, Set<string>>): FaqScore {
  let score = 0;
  const tokens = new Set<string>();
  const fuzzyMatched = new Set<string>();

  for (const rawKeyword of faq.keywords) {
    const { normalized: keyword, stemmed, meaningfulStemmed } = keywordInfo(rawKeyword);
    if (keyword.length < 2) continue;

    // 1) Exact phrase present in the query (strongest signal). Runs before
    //    the token layers so stopword-only phrases like "where are you"
    //    still score instead of being skipped.
    if (includesPhrase(query, keyword)) {
      score += 6 + stemmed.length * 2;
      for (const s of stemmed) {
        if (queryTokens.has(s)) tokens.add(s);
      }
      continue;
    }

    if (meaningfulStemmed.length === 0) continue;
    if (stemmed.every((s) => queryTokens.has(s))) {
      score += 3 + stemmed.length * 1.5;
      for (const s of stemmed) {
        if (queryTokens.has(s)) tokens.add(s);
      }
      continue;
    }

    // 2) Every meaningful token appears.
    if (meaningfulStemmed.length > 1 && meaningfulStemmed.every((s) => queryTokens.has(s))) {
      score += 2 + meaningfulStemmed.length;
      for (const s of meaningfulStemmed) {
        if (queryTokens.has(s)) tokens.add(s);
      }
    }

    // 3) Fuzzy + partial token matches (typos, truncations, compounds).
    //    Each query token contributes at most once per FAQ, so FAQs with
    //    more keyword variants never drown out exact-phrase matches.
    //    A typo pair is as strong as an exact token so short misspellings
    //    ("gihub link") can clear the confidence bar together.
    //    Query tokens arrive stemmed (tokenize) and keyword tokens are
    //    pre-stemmed once in keywordInfo, so the inner loop avoids all
    //    re-stemming. Levenshtein and prefix comparisons were moved into
    //    buildFuzzyMatches (once per question); here it is a Set lookup.
    for (const k of meaningfulStemmed) {
      for (const queryToken of queryTokens) {
        if (fuzzyMatched.has(queryToken)) continue;
        const q = stem(queryToken);
        if (q === k || fuzzyMatches.get(q)?.has(k)) {
          fuzzyMatched.add(queryToken);
          tokens.add(queryToken);
          score += 1.5;
          break;
        }
      }
    }
  }

  return { score, tokens };
}

/** Every FAQ in the whole knowledge base whose score clears the confidence bar. */
export function findAllAnswers(rawQuestion: string, kb: AiKnowledgeBase): EngineHit[] {
  const query = normalize(rawQuestion);
  if (!query) return [];

  const queryTokens = tokenize(query);
  const fuzzyMatches = buildFuzzyMatches(queryTokens, kb);
  const hits: EngineHit[] = [];

  for (const faq of kb.faqs) {
    const { score, tokens } = scoreFaq(faq, query, queryTokens, fuzzyMatches);
    if (score >= MIN_CONFIDENT_SCORE) {
      hits.push({ faq, score, tokens });
    }
  }

  hits.sort((a, b) => b.score - a.score);
  return hits;
}

/** Best single answer (kept for tooling/tests that expect one result). */
export function findBestAnswer(rawQuestion: string, kb: AiKnowledgeBase): EngineResult {
  const query = normalize(rawQuestion);
  if (!query) return { intent: null };

  const expanded = expandSynonyms(query, kb);
  const hits = findAllAnswers(query, kb);

  if (hits.length > 0) {
    const topHit = hits[0];
    if (topHit) {
      return { faq: topHit.faq, intent: null };
    }
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

/** Words that split one message into several questions. */
const SEGMENT_SEPARATORS = /[,;.!?]|\n|\band\b|\bplus\b|\balso\b|\bthen\b|\balong with\b|\btogether with\b/g;

/**
 * Detects multiple questions inside one message ("github email phone",
 * "skills and experience", "what is his email, phone?"). Phrases such as
 * "get in touch with" are left untouched because the separators are
 * deliberately conservative.
 */
export function splitQuestions(rawQuestion: string): string[] {
  const segments = rawQuestion
    .split(SEGMENT_SEPARATORS)
    .map((segment) => segment.trim())
    .filter((segment) => segment.length > 0);
  return segments.length > 0 ? segments : [rawQuestion.trim()];
}

const TOPIC_LABELS: Record<string, string> = {
  github: "GitHub",
  email: "Email",
  phone: "Phone",
  whatsapp: "WhatsApp",
  "max-ai": "MAX AI",
  "portfolio-link": "Portfolio Website",
  "contact-methods": "Contact Details",
  "social-media-all": "Social Links",
  "projects-overview": "Projects",
  "skills-overview": "Skills",
  "education-overview": "Education",
  "experience-overview": "Experience",
  "certificates-list": "Certificates",
  "learning-journey": "Learning Journey",
  "who-are-you": "About Abdul Samad",
  "cv-resume": "Resume",
};

/** Human-readable topic label derived from the FAQ id. */
export function topicLabel(faq: AiFaq): string {
  const mapped = TOPIC_LABELS[faq.id];
  if (mapped) return mapped;
  return faq.id
    .split("-")
    .map((part) => (part && part.length > 0 ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

/** Maximum number of merged topics in one answer (keeps replies readable). */
export const MAX_MERGED_TOPICS = 8;

/**
 * Answers one message — single or multi-question.
 *
 * 1. Splits the message into segments.
 * 2. Searches the ENTIRE knowledge base for every segment, collecting every
 *    confident match (never stops at the first keyword).
 * 3. Deduplicates FAQs and keeps only hits that explain new query tokens
 *    (so "skills" yields one clean answer, while "github email phone" merges).
 * 4. Returns the merged answer, or the intent fallback, or the unknown text.
 */
export function buildAnswer(rawQuestion: string, kb: AiKnowledgeBase): string {
  const segments = splitQuestions(rawQuestion);
  const seen = new Set<string>();
  const hits: EngineHit[] = [];

  for (const segment of segments) {
    for (const hit of findAllAnswers(segment, kb)) {
      if (seen.has(hit.faq.id)) continue;
      seen.add(hit.faq.id);
      hits.push(hit);
    }
  }

  hits.sort((a, b) => b.score - a.score);

  const covered = new Set<string>();
  const accepted: EngineHit[] = [];
  for (const hit of hits) {
    const novel = [...hit.tokens].filter((token) => !covered.has(token));
    if (novel.length > 0) {
      accepted.push(hit);
      for (const token of hit.tokens) covered.add(token);
      if (accepted.length >= MAX_MERGED_TOPICS) break;
    }
  }

  if (accepted.length === 0) {
    const query = normalize(rawQuestion);
    const expanded = expandSynonyms(query, kb);
    const intent = detectIntent(expanded, kb);
    const fallbackId = intent ? INTENT_FALLBACKS[intent] : undefined;
    const fallback = fallbackId ? kb.faqs.find((faq) => faq.id === fallbackId) : undefined;
    if (fallback) return fallback.answer;
    return kb.unknown;
  }

  if (accepted.length === 1) {
    const only = accepted[0];
    if (only) return only.faq.answer;
  }

  const parts = accepted.map((hit) => `## ${topicLabel(hit.faq)}\n\n${hit.faq.answer}`);
  return `Here's everything I found:\n\n${parts.join("\n\n")}`;
}

/** Renders an answer string ("• item" lines, "## " topics) into safe HTML with clickable links. */
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

  const closeList = (): void => {
    if (inList) {
      parts.push("</ul>");
      inList = false;
    }
  };

  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (trimmed.startsWith("## ")) {
      closeList();
      parts.push(`<p class="ai-msg__topic">${escapeHtml(trimmed.slice(3))}</p>`);
    } else if (trimmed.startsWith("• ")) {
      if (!inList) {
        parts.push("<ul>");
        inList = true;
      }
      parts.push(`<li>${withLinks(escapeHtml(trimmed.slice(2)))}</li>`);
    } else {
      closeList();
      if (trimmed !== "") {
        parts.push(`<p>${withLinks(escapeHtml(trimmed))}</p>`);
      }
    }
  }

  closeList();
  return parts.join("");
}
