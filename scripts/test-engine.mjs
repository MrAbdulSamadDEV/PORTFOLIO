import { readFileSync } from "node:fs";
import { findBestAnswer, formatAnswer } from "../client/public/js/components/AI/engine.js";

const kb = JSON.parse(readFileSync("client/data/ai.json", "utf8"));

const queries = [
  ["What technologies do you use?", "faq"],
  ["tell me about your education", "faq"],
  ["do you have any certificates?", "faq"],
  ["where can I find your github?", "faq"],
  ["how do I contact you?", "faq"],
  ["what is your experience with node js", "faq"],
  ["are you working on any projects now", "faq"],
  ["what are your goals", "faq"],
  ["what skills do you have in cloud", "faq"],
  ["email me", "faq"],
  ["random gibberish xyzzy", "intent-or-null"],
];

let pass = 0;
let fail = 0;
for (const [q, expected] of queries) {
  const result = findBestAnswer(q, kb);
  const ok = result.faq ? true : result.intent !== null;
  const label = result.faq ? `FAQ(${result.faq.id})` : `intent(${result.intent})`;
  if (ok) {
    pass += 1;
    console.log(`  ok   "${q}" -> ${label}`);
  } else {
    fail += 1;
    console.log(`  FAIL "${q}" -> ${label}`);
  }
}

const sample = formatAnswer(kb.faqs.find((f) => f.answer.includes("\u2022"))?.answer ?? "• one\n• two\n\nplain text with https://example.com link");
console.log("\nformatAnswer sample:");
console.log(sample);
console.log(`\nresult: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
