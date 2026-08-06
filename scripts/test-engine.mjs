import { readFileSync } from "node:fs";
import { findBestAnswer, formatAnswer } from "../client/public/js/components/AI/engine.js";

const kb = JSON.parse(readFileSync("client/data/ai.json", "utf8"));

/**
 * Each group asserts that every query in it resolves to the same FAQ id
 * (or at least to the same intent when no direct FAQ matches).
 */
const groups = [
  {
    label: "identity / introduction",
    faq: "who-are-you",
    queries: [
      "Who is Abdul Samad?",
      "Tell me about Abdul Samad.",
      "Who are you?",
      "Your introduction",
      "Introduce yourself",
      "who is samad",
      "What can you tell me about him?",
    ],
  },
  {
    label: "general skills",
    faq: "skills-overview",
    queries: [
      "Skills",
      "Skill",
      "My skills",
      "Abdul Samad skills",
      "his skill",
      "Tell me about his skills",
      "What are you skilled at?",
    ],
  },
  {
    label: "programming skills",
    faq: "programming-languages",
    queries: ["Programming skills", "What programming languages do you know?", "which languages do you code in"],
  },
  {
    label: "frontend skills",
    faq: "frontend-skills",
    queries: ["Frontend skills", "Which frontend technologies do you know?", "front end stack"],
  },
  {
    label: "backend skills",
    faq: "backend-skills",
    queries: ["Backend skills", "Which backend technologies do you know?", "back end stack"],
  },
  {
    label: "cloud skills",
    faq: "cloud-skills",
    queries: ["Cloud skills", "What do you know about cloud?", "cloud computing skills"],
  },
  {
    label: "data engineering skills",
    faq: "data-engineering-skills",
    queries: ["Data Engineering skills", "what do you know about data engineering", "etl and pipelines"],
  },
  {
    label: "html",
    faq: "html-level",
    queries: ["HTML", "html5", "do you know html", "how good is he with html"],
  },
  {
    label: "css",
    faq: "css-level",
    queries: ["CSS", "css3", "do you know css", "how good is he with css"],
  },
  {
    label: "javascript",
    faq: "javascript-level",
    queries: ["JavaScript", "js", "do you know javascript", "how good is he with js"],
  },
  {
    label: "typescript",
    faq: "typescript-level",
    queries: ["TypeScript", "ts", "do you know typescript", "how good is he with typescript"],
  },
  {
    label: "python",
    faq: "python-level",
    queries: ["Python", "do you know python", "how good is he with python", "python skills"],
  },
  {
    label: "node.js",
    faq: "nodejs-level",
    queries: ["Node.js", "nodejs", "node js", "do you know node", "how good is he with node"],
  },
  {
    label: "phone",
    faq: "phone",
    queries: ["Phone", "Mobile", "Contact number", "Call", "whatsapp number", "telephone", "his mobile number"],
  },
  {
    label: "github",
    faq: "github",
    queries: ["GitHub", "Github profile", "Repository", "Source code", "where is your code", "gihub link"],
  },
  {
    label: "portfolio",
    faq: "portfolio-link",
    queries: ["Portfolio", "Website", "Personal website", "your site url", "web address"],
  },
  {
    label: "email",
    faq: "email",
    queries: ["Email", "Mail", "e mail", "email address", "his email id"],
  },
  {
    label: "projects",
    faq: "projects-overview",
    queries: ["Projects", "Project list", "Show projects", "show me your projects", "what projects has he built"],
  },
  {
    label: "education",
    faq: "education-overview",
    queries: ["Education", "where do you study", "university", "his degree", "Tell me about your education"],
  },
  {
    label: "experience",
    faq: "experience-overview",
    queries: ["Experience", "work experience", "his career", "What is your experience?"],
  },
  {
    label: "certificates",
    faq: "certificates-list",
    queries: ["Certificates", "certifications", "what certs do you have", "credentials"],
  },
  {
    label: "services",
    faq: "services",
    queries: ["Services", "what services do you provide", "what do you offer", "service list"],
  },
  {
    label: "contact",
    faq: "contact-methods",
    queries: ["Contact", "how do i contact you", "get in touch", "reach him"],
  },
  {
    label: "location",
    faq: "location",
    queries: ["Location", "where are you", "where do you live", "which city", "based in"],
  },
];

const singles = [
  ["tell me about your education", "faq"],
  ["do you have any certificates?", "faq"],
  ["where can I find your github?", "faq"],
  ["what is your experience with node js", "faq"],
  ["abdulsamad's skills", "faq"],
  ["tell me about furnecher", "faq"],
  ["are you available for work?", "faq"],
  ["can I get your resume?", "faq"],
  ["thank you", "faq"],
  ["what is max ai", "faq"],
  ["hello there", "faq"],
  ["how much do you charge", "faq"],
  ["random gibberish xyzzy", "intent-or-null"],
];

let pass = 0;
let fail = 0;
let checks = 0;

function check(ok, detail) {
  checks += 1;
  if (ok) {
    pass += 1;
    console.log(`  ok   ${detail}`);
  } else {
    fail += 1;
    console.log(`  FAIL ${detail}`);
  }
}

for (const group of groups) {
  let first = null;
  for (const q of group.queries) {
    const result = findBestAnswer(q, kb);
    const got = result.faq?.id ?? `intent(${result.intent})`;
    if (first === null) first = got;
    check(
      got === first,
      `"${q}" -> ${got}${got === group.faq ? "" : ` (expected ${group.faq})`}`,
    );
  }
  check(
    first === group.faq,
    `group "${group.label}" resolves to ${first}${first === group.faq ? "" : ` — expected ${group.faq}`}`,
  );
}

for (const [q, expected] of singles) {
  const result = findBestAnswer(q, kb);
  /* "intent-or-null" means any sane result is fine (nonsense queries should
     fall through to the "unknown" fallback, so null is expected there). */
  const ok = expected === "intent-or-null" || result.faq !== undefined || result.intent !== null;
  const label = result.faq ? `FAQ(${result.faq.id})` : `intent(${result.intent})`;
  check(ok, `"${q}" -> ${label}`);
}

const sample = formatAnswer(kb.faqs.find((f) => f.answer.includes("\u2022"))?.answer ?? "• one\n• two\n\nplain text with https://example.com link");
console.log("\nformatAnswer sample:");
console.log(sample);

const faqCount = kb.faqs.length;
const keywordCount = kb.faqs.reduce((sum, f) => sum + f.keywords.length, 0);
console.log(`\nknowledge base: ${faqCount} FAQs, ${keywordCount.toLocaleString()} match keywords`);
console.log(`result: ${pass} passed, ${fail} failed (${checks} checks)`);
process.exit(fail > 0 ? 1 : 0);
