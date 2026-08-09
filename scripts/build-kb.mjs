/**
 * Builds client/data/ai.json — the single bundled knowledge base for MAX AI.
 *
 * Merges client/data/ai/config.json (welcome, unknown, suggestions, synonyms,
 * intents) with the per-category FAQ files (about, skills, projects, ...),
 * expands every FAQ's keyword list with natural question-form variations and
 * writes one production bundle.
 *
 * Rerunnable: `node scripts/build-kb.mjs` (also runs as part of `npm run build`).
 * To extend MAX AI's knowledge: edit or add JSON files under client/data/ai/
 * — no code changes required.
 */

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";

const AI_DIR = path.resolve("client/data/ai");
const OUT_FILE = path.resolve("client/data/ai.json");

/** Natural question prefixes added to keywords that are not already questions. */
const PREFIXES = [
  "tell me ",
  "please tell me ",
  "can you tell me ",
  "could you tell me ",
  "could you please tell me ",
  "can you please tell me ",
  "i want to know ",
  "i would like to know ",
  "i would love to know ",
  "i need to know ",
  "i want to see ",
  "show me ",
  "please show me ",
  "share ",
  "give me ",
  "please give me ",
  "list ",
  "list me ",
  "mention ",
  "explain ",
  "explain me ",
  "describe ",
  "describe me ",
  "more about ",
  "anything about ",
  "everything about ",
  "everything regarding ",
  "anything regarding ",
  "some details about ",
  "all the details about ",
  "full details about ",
  "about ",
];

/** Keywords already phrased as a complete question/sentence get no prefix. */
const QUESTION_STARTERS =
  /^(what|who|how|why|when|where|which|do|does|did|is|are|was|were|can|could|would|should|will|shall|tell|show|list|give|share|mention|explain|describe|please|thank|goodbye|hello|hi|hey|i|you|your|his|my|the|a|an|am|have|has|are|were|was|please|kindly)\b/;

/** Matches the engine's runtime stopword list (client/src/components/AI/engine.ts). */
const STOPWORDS = new Set([
  "me", "my", "you", "your", "yours", "yourself", "are", "is", "am", "what", "who", "how", "why", "when",
  "where", "do", "does", "did", "can", "could", "would", "will", "shall", "should", "the", "a", "an", "of",
  "to", "for", "with", "on", "at", "in", "and", "or", "about", "tell", "please", "i", "we", "it",
  "this", "that", "these", "those", "have", "has", "had", "be", "been", "not", "so", "if", "as", "by", "from",
  "up", "out", "over", "under", "again", "more", "most", "other", "some", "such", "than", "then", "too",
  "very", "just", "get", "want", "know", "like", "there", "here", "into", "only", "own", "same", "us",
  "them", "he", "she", "his", "her", "let", "need", "anything", "everything", "etc",
]);

/** Rough singular/plural handling mirroring the engine's stem(). */
function stemWord(word) {
  const w = word.toLowerCase();
  if (w.length <= 3) return w;
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (w.endsWith("es")) return w.slice(0, -2);
  if (w.endsWith("s")) return w.slice(0, -1);
  return w;
}

/**
 * Signature of a keyword's *meaningful* tokens. Every formulaic variation of
 * one phrase ("soft skills", "tell me soft skills", "please tell me soft skills", …)
 * shares a signature, so within one authored keyword family only the first
 * (canonical) variant is kept. This stops prefix-variant counts from drowning
 * real matches in the fuzzy layer.
 *
 * The dedup is deliberately scoped to one authored keyword family: two
 * *distinct* authored keywords ("cloud" and "about cloud") may share a
 * signature yet carry different phrase-layer meaning, and both must survive
 * into the bundle.
 */
function signatureOf(keyword) {
  return keyword
    .split(" ")
    .map(stemWord)
    .filter((token) => token.length >= 2 && !STOPWORDS.has(token))
    .sort()
    .join(" ");
}

/** Canonical category file order for the bundled faqs array. */
const CATEGORY_ORDER = [
  "about",
  "skills",
  "projects",
  "education",
  "experience",
  "certificates",
  "contact",
  "services",
  "learning",
  "misc",
];

function normalize(value) {
  return value
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Expands one FAQ keyword list with question-form and case variations.
 * Each authored keyword keeps its own family of variants: the base form is
 * always kept, and a prefixed variant is skipped only when it means exactly
 * the same as that family's base (same meaningful-token signature).
 */
function expandKeywords(keywords) {
  const seen = new Set();
  const out = [];

  const push = (value) => {
    const normalized = normalize(value);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    out.push(normalized);
  };

  for (const keyword of keywords) {
    const base = normalize(keyword);
    if (!base) continue;
    push(base);
    const baseSignature = signatureOf(base);
    if (QUESTION_STARTERS.test(keyword)) continue;
    for (const prefix of PREFIXES) {
      const variant = normalize(`${prefix}${keyword}`);
      if (!variant || seen.has(variant)) continue;
      if (baseSignature && signatureOf(variant) === baseSignature) continue;
      push(variant);
    }
  }

  return out;
}

async function main() {
  const startedAt = Date.now();

  const config = JSON.parse(await readFile(path.join(AI_DIR, "config.json"), "utf8"));
  const categoryFiles = (await readdir(AI_DIR))
    .filter((file) => file.endsWith(".json") && file !== "config.json")
    .sort((a, b) => {
      const ai = CATEGORY_ORDER.indexOf(a.replace(".json", ""));
      const bi = CATEGORY_ORDER.indexOf(b.replace(".json", ""));
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });

  const faqs = [];
  const seenIds = new Set();
  const seenQuestions = new Set();
  let keywordCount = 0;
  let warned = 0;

  for (const file of categoryFiles) {
    const category = file.replace(".json", "");
    const data = JSON.parse(await readFile(path.join(AI_DIR, file), "utf8"));

    for (const faq of data.faqs ?? []) {
      if (seenIds.has(faq.id)) {
        console.warn(`  [warn] duplicate faq id "${faq.id}" in ${file} — skipping`);
        warned += 1;
        continue;
      }
      seenIds.add(faq.id);

      const questionKey = normalize(faq.question);
      if (seenQuestions.has(questionKey)) {
        console.warn(`  [warn] duplicate question "${faq.question}" (${file})`);
        warned += 1;
      }
      seenQuestions.add(questionKey);

      const keywords = expandKeywords(faq.keywords ?? []);
      keywordCount += keywords.length;

      faqs.push({
        id: faq.id,
        category: faq.category ?? category,
        question: faq.question,
        answer: faq.answer,
        keywords,
      });
    }
  }

  const bundle = {
    welcome: config.welcome,
    unknown: config.unknown,
    synonyms: config.synonyms,
    intents: config.intents,
    faqs,
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  // Compact JSON: the knowledge base is fetched and parsed on the client,
  // so every byte counts on slow connections.
  await writeFile(OUT_FILE, `${JSON.stringify(bundle)}\n`, "utf8");

  const sizeKb = Math.round((await readFile(OUT_FILE)).byteLength / 1024);
  console.log(`[build-kb] bundled ${faqs.length} FAQs with ${keywordCount.toLocaleString()} match keywords`);
  console.log(`[build-kb] wrote ${OUT_FILE} (${sizeKb} KB) in ${Date.now() - startedAt} ms${warned ? ` (${warned} warnings)` : ""}`);
}

main().catch((error) => {
  console.error("[build-kb] failed:", error);
  process.exitCode = 1;
});
