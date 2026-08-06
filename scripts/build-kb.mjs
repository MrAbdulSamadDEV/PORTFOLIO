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
  "i want to know ",
  "i would like to know ",
  "i need to know ",
  "more about ",
  "anything about ",
  "everything about ",
  "about ",
];

/** Keywords already phrased as a complete question/sentence get no prefix. */
const QUESTION_STARTERS =
  /^(what|who|how|why|when|where|which|do|does|is|are|can|could|would|should|will|shall|tell|show|list|give|please|thank|goodbye|hello|hi|hey|i|you|your|his|my|the|a|an|am|have|has|are|were|was)\b/;

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

/** Expands one FAQ keyword list with question-form and case variations. */
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
    push(keyword);
    for (const prefix of PREFIXES) {
      if (!QUESTION_STARTERS.test(keyword)) {
        push(`${prefix}${keyword}`);
      }
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
    suggestions: config.suggestions,
    synonyms: config.synonyms,
    intents: config.intents,
    faqs,
  };

  await mkdir(path.dirname(OUT_FILE), { recursive: true });
  await writeFile(OUT_FILE, `${JSON.stringify(bundle, null, 2)}\n`, "utf8");

  const sizeKb = Math.round((await readFile(OUT_FILE)).byteLength / 1024);
  console.log(`[build-kb] bundled ${faqs.length} FAQs with ${keywordCount.toLocaleString()} match keywords`);
  console.log(`[build-kb] wrote ${OUT_FILE} (${sizeKb} KB) in ${Date.now() - startedAt} ms${warned ? ` (${warned} warnings)` : ""}`);
}

main().catch((error) => {
  console.error("[build-kb] failed:", error);
  process.exitCode = 1;
});
