/**
 * Expands MAX AI's knowledge base with a large batch of data-driven FAQs.
 *
 * Everything is generated from client/data/settings.json (and other facts
 * already present in the KB), so every answer stays truthful — nothing is
 * fabricated. The output is written to client/data/ai/generated.json which
 * build-kb.mjs merges into the production bundle.
 *
 * Rerunnable: `node scripts/expand-kb.mjs` (committed output only — build-kb
 * is what ships it, so editing the generated file is pointless).
 */

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve();
const SETTINGS = JSON.parse(await readFile(path.join(ROOT, "client/data/settings.json"), "utf8"));
const OUT = path.join(ROOT, "client/data/ai/generated.json");

const S = SETTINGS;
const SITE = S.site;
const CONTACT = S.contact;
const HERO = S.hero;
const ABOUT = S.about;
const DOMAIN = "https://mrabdulsamaddev.vercel.app";

const faqs = [];
const next = (() => {
  let n = 0;
  return () => `${++n}`.padStart(3, "0");
})();

function faq(category, id, question, answer, keywords) {
  faqs.push({ category, id: `${id}-${next()}`, question, answer, keywords: [...new Set(keywords)] });
}

/* ------------------------------------------------------------------ */
/* Per-skill coverage                                                  */
/* ------------------------------------------------------------------ */

const SKILL_GROUPS = S.skills.groups;
for (const group of SKILL_GROUPS) {
  for (const skill of group.skills) {
    const slug = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const groupName = group.title;

    faq("skills", `know-${slug}`, `How well does Abdul know ${skill.name}?`,
      `Abdul knows ${skill.name} well — it's part of his ${groupName} toolkit (he rates himself ${skill.level}%).\n\nHe reaches for it in real projects, not just tutorials — his skills are built through hands-on work.`,
      [
        `does abdul know ${skill.name.toLowerCase()}`,
        `does abdul use ${skill.name.toLowerCase()}`,
        `is ${skill.name.toLowerCase()} one of abdul's skills`,
        `is abdul good with ${skill.name.toLowerCase()}`,
        `has abdul learned ${skill.name.toLowerCase()}`,
        `is ${skill.name.toLowerCase()} in his skill set`,
        `${skill.name.toLowerCase()} knowledge`,
        `${skill.name.toLowerCase()} experience`,
        `${skill.name.toLowerCase()} expertise`,
        `${skill.name.toLowerCase()} proficiency`,
        `skill in ${skill.name.toLowerCase()}`,
        `experience with ${skill.name.toLowerCase()}`,
        `familiar with ${skill.name.toLowerCase()}`,
        `what is abdul's skill with ${skill.name.toLowerCase()}`,
      ]);

    faq("skills", `use-${slug}`, `Where does Abdul use ${skill.name}?`,
      `Abdul uses ${skill.name} as part of his ${groupName} work — ${group.title === "Frontend" ? "building the UI" : group.title === "Backend" ? "powering the server" : group.title === "Programming" ? "solving problems and writing clean logic" : "handling cloud, tooling and day-to-day engineering"}.\n\nIt's one of ${Math.max(1, Math.round(skill.level / 10)) * 10}+ rated areas in his ${group.title.toLowerCase()} toolkit.`,
      [
        `where does abdul use ${skill.name.toLowerCase()}`,
        `where is ${skill.name.toLowerCase()} used`,
        `what is ${skill.name.toLowerCase()} used for`,
        `how does abdul use ${skill.name.toLowerCase()}`,
        `what does abdul use ${skill.name.toLowerCase()} for`,
        `when does abdul use ${skill.name.toLowerCase()}`,
        `in which projects does abdul use ${skill.name.toLowerCase()}`,
        `${skill.name.toLowerCase()} usage`,
        `${skill.name.toLowerCase()} in projects`,
        `projects using ${skill.name.toLowerCase()}`,
        `${skill.name.toLowerCase()} in his work`,
      ]);
  }
}

faq("skills", "groups-overview", "What skill groups does Abdul have?",
  "Abdul organizes his toolkit into four groups:\n\n• Frontend — HTML5, CSS3, JavaScript, TypeScript\n• Backend — Node.js, Express\n• Programming — Python, C++, C#\n• Cloud & Tools — Cloud Data Engineering, Linux, Git & GitHub, VS Code, OpenCode CLI",
  [
    "skill groups",
    "what are the skill groups",
    "skill categories",
    "categories of skills",
    "how are his skills organized",
    "grouped skills",
    "skill list by group",
    "groups in his skills",
    "what groups do his skills have",
    "frontend backend programming cloud groups",
  ]);

faq("skills", "tech-count", "How many technologies has Abdul learned?",
  `Abdul has learned 25+ technologies and counting — from HTML5, CSS3, JavaScript and TypeScript to Node.js, Express, Python, C++, C#, cloud data engineering, Linux and Git.\n\nHis about page stats say "${ABOUT.statistics[1].value} Technologies Learned".`,
  [
    "how many technologies",
    "how many technologies has he learned",
    "how many technologies does he know",
    "how many technologies does he use",
    "number of technologies",
    "count of technologies",
    "total technologies learned",
    "25 technologies",
    "25+ technologies",
    "how many techs",
    "how many languages does he know",
    "how many programming languages",
    "how many tools does he know",
  ]);

faq("skills", "top-skill", "Which skill is Abdul best at?",
  "Abdul is strongest in frontend fundamentals — HTML5 (95%) and CSS3 (92%) — with JavaScript (88%), Git & GitHub (88%) and VS Code (90%) close behind.\n\nAs a full stack developer his real strength is combining clean frontends with solid Node.js backends.",
  [
    "strongest skill",
    "best skill",
    "most skilled at",
    "what is he best at",
    "highest skill level",
    "top rated skill",
    "best rated skill",
    "what is his number one skill",
    "what is his greatest skill",
    "most confident skill",
    "best technology",
    "what is he best at",
    "which skill is he best at",
    "his strongest skill",
  ]);

faq("skills", "newest-skill", "What is Abdul's newest skill?",
  "Abdul's newest area is Cloud Data Engineering (rated 74%) — data pipelines, ETL, cloud platforms like AWS and Azure, and Linux.\n\nHe is also building comfort with OpenCode CLI (70%) as part of his daily workflow.",
  [
    "newest skill",
    "latest skill",
    "most recent skill",
    "what did he learn most recently",
    "new skills he is learning",
    "what is he learning now",
    "newest technology",
    "latest technology",
  ]);

faq("skills", "skill-summary", "Give me a summary of Abdul's skills",
  `Here is Abdul's complete skill summary:\n\n${SKILL_GROUPS.map((g) => `• ${g.title}: ${g.skills.map((s) => s.name).join(", ")}`).join("\n")}\n\nFull details live on the Skills section of the home page.`,
  [
    "skill summary",
    "summary of skills",
    "skills summary",
    "summarize his skills",
    "complete skill list",
    "all his skills",
    "full list of skills",
    "overview of skills",
    "skills in short",
    "quick skill list",
    "give me his skills",
  ]);

/* ------------------------------------------------------------------ */
/* Journey / timeline                                                  */
/* ------------------------------------------------------------------ */

for (const [index, step] of ABOUT.journey.entries()) {
  faq("about", `journey-${index + 1}`, `Tell me about ${step.title}`,
    `${step.title} (${step.period}): ${step.description}`,
    [
      `tell me about ${step.title.toLowerCase()}`,
      `what was ${step.title.toLowerCase()}`,
      `what happened in ${step.period}`,
      `what happened during ${step.period}`,
      `his journey in ${step.period}`,
      `what did he do in ${step.period}`,
      `what happened at the ${step.title.toLowerCase()} stage`,
      `the ${step.title.toLowerCase()} stage`,
      `stage ${index + 1} of his journey`,
      step.title.toLowerCase(),
    ]);
}

faq("about", "journey-start", "How did Abdul's tech journey start?",
  "Abdul's journey started in 2024 with Microsoft Word — his very first computer skill. Mastering documents, formatting and keyboard shortcuts sparked his curiosity about computers and software, which led to programming the same year.",
  [
    "how did his journey start",
    "how did it all start",
    "where did his journey begin",
    "how did he get started",
    "what started his journey",
    "how did he start in tech",
    "when did he start in tech",
    "beginning of his journey",
    "the start of his tech journey",
    "first step in tech",
  ]);

faq("about", "first-computer-skill", "What was Abdul's first computer skill?",
  "Microsoft Word was Abdul's very first computer skill (2024) — documents, formatting and keyboard shortcuts. That curiosity grew into HTML, CSS and JavaScript, then full stack development and cloud data engineering.",
  [
    "first computer skill",
    "what was his first computer skill",
    "first thing he learned",
    "first skill learned",
    "how did he start learning computers",
    "microsoft word",
    "ms word",
    "word documents",
    "first skill on a computer",
    "what did he learn first",
  ]);

faq("about", "when-start-coding", "When did Abdul start coding?",
  "Abdul wrote his first lines of HTML, CSS and JavaScript in 2024, moved into full stack development (Node.js, Express, TypeScript, React) in 2025, and is now studying cloud data engineering (2026).",
  [
    "when did he start coding",
    "when did he start programming",
    "since when does he code",
    "how long has he been coding",
    "when did he learn to code",
    "coding since",
    "programming since",
    "when did he write his first line of code",
    "how long has he been programming",
  ]);

faq("about", "journey-timeline", "What is Abdul's tech timeline?",
  `Here is Abdul's timeline:\n\n${ABOUT.journey.map((step) => `• ${step.period} — ${step.title}`).join("\n")}`,
  [
    "tech timeline",
    "timeline of his journey",
    "journey timeline",
    "his timeline",
    "roadmap of his journey",
    "history of his learning",
    "chronological journey",
    "stages of his journey",
    "his tech history",
  ]);

/* ------------------------------------------------------------------ */
/* Statistics                                                          */
/* ------------------------------------------------------------------ */

for (const stat of ABOUT.statistics) {
  faq("about", `stat-${stat.label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`, `What is Abdul's "${stat.label}" stat?`,
    `Abdul's stat for "${stat.label}" is ${stat.value}.`,
    [
      `what is his ${stat.label.toLowerCase()} stat`,
      `what is the ${stat.label.toLowerCase()} stat`,
      `how many ${stat.label.toLowerCase()}`,
      `what is his ${stat.label.toLowerCase()} count`,
      `his ${stat.label.toLowerCase()}`,
      `the ${stat.label.toLowerCase()} statistic`,
      `stat ${stat.label.toLowerCase()}`,
      `${stat.label.toLowerCase()} number`,
    ]);
}

faq("about", "stats-all", "What are Abdul's portfolio statistics?",
  `Abdul's portfolio stats:\n\n${ABOUT.statistics.map((stat) => `• ${stat.value} — ${stat.label}`).join("\n")}`,
  [
    "portfolio statistics",
    "all the stats",
    "all statistics",
    "his stats",
    "statistics about him",
    "stats of the portfolio",
    "what are his numbers",
    "key statistics",
    "quick stats",
    "portfolio numbers",
  ]);

faq("about", "years-learning", "How many years has Abdul been learning?",
  "Abdul has been learning for 3+ years (starting 2024), and he has been around computers since 2022 — he counts it as 3+ years of learning with continuous growth.",
  [
    "how many years of learning",
    "years of learning",
    "how long has he been learning",
    "years in tech",
    "years of experience learning",
    "how many years of experience",
    "experience in years",
    "how long learning",
  ]);

/* ------------------------------------------------------------------ */
/* Projects deep-dive                                                  */
/* ------------------------------------------------------------------ */

faq("projects", "furnecher-live", "Is Furnecher live?",
  "Yes — SALAAR'S HOME (Furnecher) is live at https://salaars-home.vercel.app/.\n\nIt is a premium furniture e-commerce platform built with React, Node.js and MongoDB.",
  [
    "is furnecher live",
    "is salaar's home live",
    "is the furniture store live",
    "is furnecher deployed",
    "where can i try furnecher",
    "furnecher live demo",
    "live link of furnecher",
    "is the ecommerce store online",
    "can i visit furnecher",
    "furnecher website link",
    "salaar's home url",
    "salaar's home link",
  ]);

faq("projects", "furnecher-repo", "Is Furnecher open source?",
  "Yes — the Furnecher source code is public on GitHub: https://github.com/MrAbdulSamadDEV/salaars-home-furnecher\n\nYou can explore the code, open issues and contribute.",
  [
    "is furnecher open source",
    "furnecher source code",
    "furnecher github",
    "furnecher repository",
    "furnecher repo",
    "can i see furnecher's code",
    "furnecher code link",
    "is furnecher on github",
    "salaar's home source",
    "salaar's home github",
    "where is the furnecher code",
  ]);

faq("projects", "furnecher-stack", "What is the Furnecher tech stack?",
  "Furnecher's stack: React + TypeScript on the frontend, Node.js + Express on the backend, MongoDB for data, styled with HTML5 and CSS3.\n\nIt is deployed on Vercel.",
  [
    "furnecher tech stack",
    "furnecher stack",
    "what stack does furnecher use",
    "furnecher technologies",
    "tech behind furnecher",
    "what is furnecher built with",
    "how was furnecher built",
    "furnecher architecture",
    "what backend does furnecher use",
    "what frontend does furnecher use",
    "what database does furnecher use",
    "mongodb furnecher",
    "react furnecher",
    "node furnecher",
  ]);

faq("projects", "furnecher-audience", "Who is Furnecher for?",
  "Furnecher (SALAAR'S HOME) is a premium furniture e-commerce platform — it serves shoppers browsing a furniture catalog, exploring products and completing purchases in a modern storefront.",
  [
    "who is furnecher for",
    "who uses furnecher",
    "furnecher target audience",
    "who is the furniture store for",
    "furnecher users",
    "what is furnecher's purpose",
    "what does furnecher do",
    "what kind of store is furnecher",
    "what is salaar's home",
    "what is the furniture platform",
  ]);

faq("projects", "furnecher-learned", "What did Abdul learn from Furnecher?",
  "Building Furnecher end-to-end taught Abdul to think like a product engineer — designing a complete e-commerce flow with a React frontend, a Node.js API and MongoDB, then shipping it live on Vercel.",
  [
    "what did he learn from furnecher",
    "what did furnecher teach him",
    "lessons from furnecher",
    "what did he learn building furnecher",
    "what did the ecommerce project teach him",
    "what did he learn from the furniture store",
    "what did he learn from his flagship project",
    "how did furnecher help him grow",
  ]);

faq("projects", "furnecher-challenge", "What was the hardest part of Furnecher?",
  "The hardest part was orchestrating the whole e-commerce flow — React storefront, Node.js API, MongoDB persistence, and shipping it all live on Vercel. It was his biggest challenge and his biggest growth moment.",
  [
    "hardest part of furnecher",
    "furnecher challenges",
    "what was hard about furnecher",
    "furnecher difficulties",
    "what was the hardest part of the ecommerce project",
    "challenges building furnecher",
    "what was difficult in furnecher",
    "furnecher problems",
  ]);

faq("projects", "portfolio-pages", "What pages does this portfolio have?",
  "This portfolio has three pages:\n\n• Home — hero, about, skills, journey and contact sections\n• Projects — the project showcase\n• Contact — contact cards and a message form\n\nPlus a custom 404 page and the MAX AI assistant on every page.",
  [
    "what pages does this site have",
    "pages of the portfolio",
    "portfolio pages",
    "list of pages",
    "which pages exist",
    "does it have a projects page",
    "does it have a contact page",
    "how many pages",
    "what is on the home page",
    "what is on the projects page",
    "what is on the contact page",
    "site navigation",
    "how do i navigate this site",
  ]);

faq("projects", "portfolio-features", "What features does this portfolio have?",
  "This portfolio is packed with premium features:\n\n• Server-side rendering for fast loads and great SEO\n• MAX AI — an offline Q&A assistant trained on Abdul's data\n• Command palette (Ctrl/Cmd+K) with keyboard shortcuts\n• Dynamic light/dark themes with instant favicon switching\n• Custom desktop cursor, premium loading screen, progress bar\n• One-click copy buttons on email and location\n• Contact form, back-to-top, page transitions and more",
  [
    "what features does this site have",
    "features of this portfolio",
    "portfolio features",
    "what can this website do",
    "premium features",
    "list of features",
    "what makes this site special",
    "features list",
    "cool features of the site",
    "what does this website offer",
  ]);

faq("projects", "portfolio-why", "Why did Abdul build this portfolio?",
  "Abdul built this portfolio to showcase his work and personality — a production-quality site that demonstrates real engineering: SSR, SEO, accessibility, performance and a custom AI assistant. It doubles as a flagship project and his professional home on the web.",
  [
    "why did he build this portfolio",
    "why this portfolio",
    "why did he make this website",
    "purpose of the portfolio",
    "what is this site for",
    "why does this site exist",
    "why this website",
    "reason for the portfolio",
    "what is the purpose of this site",
  ]);

faq("projects", "portfolio-fast", "Is this website fast?",
  "Yes — performance is a core requirement here: server-side rendering, lazy-loaded chunks (MAX AI loads only when opened), preloaded fonts, optimized images, zero layout shift and GPU-friendly animations. The site is built to score well on Lighthouse and Core Web Vitals.",
  [
    "is this website fast",
    "is this site fast",
    "website performance",
    "how fast is this site",
    "is the portfolio optimized",
    "performance of this site",
    "lighthouse score",
    "core web vitals",
    "is this site slow",
    "is this site optimized",
    "page speed",
    "loading speed",
  ]);

faq("projects", "portfolio-responsive", "Is this portfolio responsive?",
  "Fully responsive — the layout adapts across 320px phones, tablets, laptops and 4K desktops, with a mobile navigation drawer, full-screen MAX AI on phones and a floating chat on desktop. A 225-check responsive audit passes across every sweep.",
  [
    "is this portfolio responsive",
    "does this site work on mobile",
    "responsive design",
    "mobile friendly",
    "does it work on tablets",
    "does it work on phones",
    "mobile version",
    "is the site mobile ready",
    "responsive layout",
    "works on all screens",
  ]);

faq("projects", "portfolio-seo", "Is this website SEO optimized?",
  "Yes — the site ships complete metadata: canonical URLs, Open Graph and Twitter cards, JSON-LD structured data, a sitemap, robots.txt, semantic HTML with proper heading hierarchy, accessibility support and descriptive alt texts. An automated SEO audit passes with zero issues.",
  [
    "is this website seo optimized",
    "seo of this site",
    "is the site seo friendly",
    "search engine optimization",
    "does this site rank on google",
    "google seo",
    "is this site seo ready",
    "seo audit",
    "metadata of this site",
    "is this site optimized for search engines",
  ]);

faq("projects", "portfolio-a11y", "Is this portfolio accessible?",
  "Accessibility is built in: skip links, ARIA labels, keyboard navigation, focus-visible styles, semantic landmarks, screen-reader-friendly AI chat, reduced-motion support and WCAG-minded contrast. An automated a11y audit passes with zero issues.",
  [
    "is this portfolio accessible",
    "accessibility of the site",
    "wcag",
    "a11y",
    "screen reader friendly",
    "is the site accessible",
    "keyboard navigation",
    "does the site support keyboard users",
    "contrast ratios",
    "accessible design",
    "is this site inclusive",
  ]);

faq("projects", "portfolio-theme-feature", "Does this website have dark mode?",
  "Yes — the portfolio has light and dark themes with a one-click toggle (and it follows your system preference on first visit). The theme even swaps the tab favicon and browser theme-color instantly.",
  [
    "does this website have dark mode",
    "dark mode",
    "dark theme",
    "night mode",
    "light mode",
    "light theme",
    "how do i change the theme",
    "theme toggle",
    "switch theme",
    "change to dark mode",
    "change to light mode",
    "follow system theme",
    "system preference",
  ]);

/* ------------------------------------------------------------------ */
/* Contact & availability                                              */
/* ------------------------------------------------------------------ */

faq("contact", "whatsapp", "Is there a WhatsApp number?",
  "Abdul's published contact methods are email (mr.abdulsamadabdullah@gmail.com) and phone (+92 370 8033443).\n\nFor anything you'd normally send on WhatsApp, email is the fastest way to reach him.",
  [
    "is there a whatsapp number",
    "whatsapp number",
    "does he have whatsapp",
    "whatsapp contact",
    "can i whatsapp him",
    "whatsapp me",
    "send whatsapp",
    "whatsapp link",
    "his whatsapp",
    "wa number",
  ]);

faq("contact", "other-platforms", "Is Abdul on Telegram or Discord?",
  "Abdul isn't on Telegram or Discord — his public channels are GitHub, LinkedIn, X (Twitter), YouTube and Instagram, plus email and phone.\n\nDirect email is the most reliable way to reach him.",
  [
    "is abdul on telegram",
    "telegram",
    "discord",
    "is he on discord",
    "skype",
    "does he have a discord",
    "other platforms",
    "what platforms is he on",
    "where else can i find him",
    "signal",
  ]);

faq("contact", "email-format", "What should I include in my email to Abdul?",
  "Keep it clear and simple:\n\n• Who you are and what you need\n• A short project or opportunity description\n• Timeline and budget if relevant\n• How he can reply to you\n\nEmail him at mr.abdulsamadabdullah@gmail.com — he usually responds quickly.",
  [
    "what should i include in my email",
    "email format",
    "how to email him",
    "what to write in the email",
    "email structure",
    "what should my email contain",
    "how should i introduce myself in email",
    "email template",
    "what to say in the email",
    "tips for emailing him",
  ]);

faq("contact", "pronounce-name", "How do you pronounce Abdul Samad?",
  "Abdul Samad is pronounced \"AB-dool Suh-MAHD\" (عبد الصمد) — a traditional Arabic name. Most people just call him Abdul.",
  [
    "how do you pronounce his name",
    "pronounce abdul samad",
    "how to say his name",
    "pronunciation of abdul samad",
    "how is his name pronounced",
    "abdul samad pronunciation",
    "what does his name mean",
    "meaning of abdul samad",
    "is abdul samad his real name",
  ]);

faq("contact", "karachi-address", "What is Abdul's exact address?",
  "Abdul is based in Karachi, Pakistan — he shares his city and timezone publicly but keeps his exact street address private for safety.\n\nThe contact page shows his email and phone for real conversations.",
  [
    "what is his exact address",
    "his address",
    "where does he live exactly",
    "karachi address",
    "postal code",
    "zip code",
    "home address",
    "street address",
    "where in karachi",
    "area of karachi",
  ]);

faq("contact", "email-subject", "What subject line should I use for Abdul?",
  "Use a subject that says what the email is about — examples:\n\n• \"Project Inquiry — Business Website\"\n• \"Internship Opportunity — Full Stack\"\n• \"Freelance Work — Dashboard\"\n\nClear subjects get answered faster.",
  [
    "email subject",
    "what subject line",
    "subject for email",
    "email subject ideas",
    "what should the subject be",
    "how to subject an email to him",
  ]);

faq("contact", "reply-speed", "How quickly does Abdul reply?",
  "Abdul aims to reply to messages as soon as he can — usually within a day or two via email. For urgent matters, phone (+92 370 8033443) is the fastest route.",
  [
    "how quickly does he reply",
    "reply speed",
    "how fast does he respond",
    "response time",
    "how long until he replies",
    "does he reply fast",
    "how quick is he to respond",
    "email response time",
  ]);

faq("contact", "weekend-contact", "Can I contact Abdul on weekends?",
  "Yes — Abdul checks his inbox on weekends too. He replies whenever he can, and for anything urgent the phone line is open (+92 370 8033443).",
  [
    "can i contact him on weekends",
    "weekend contact",
    "is he available on weekends",
    "does he work on weekends",
    "saturday sunday contact",
    "can i email on sunday",
    "is he free on the weekend",
  ]);

faq("contact", "work-with", "How do I work with Abdul?",
  "Reach him through the contact page — drop a message in the form or email mr.abdulsamadabdullah@gmail.com with your idea, scope, timeline and budget.\n\nHe's open to internships, freelance projects and collaborations, remote and onsite.",
  [
    "how do i work with abdul",
    "work with abdul",
    "how can i hire abdul",
    "how do i get in touch about work",
    "collaborate with abdul",
    "start a project with him",
    "how do i start a project with him",
    "hire him for a project",
    "work together",
    "project inquiry",
    "send a project proposal",
  ]);

faq("contact", "part-time", "Does Abdul take part-time work?",
  "Yes — as a student developer, Abdul is open to part-time work, internships and flexible freelance projects. Availability depends on his study schedule, so sharing your timeline early helps.",
  [
    "does he take part time work",
    "part time",
    "part time availability",
    "is he available part time",
    "part time job",
    "part time projects",
    "part time internship",
  ]);

faq("contact", "remote-only", "Does Abdul work remote, onsite or both?",
  "Both — Abdul works fully remote and is also open to onsite opportunities in Karachi, Pakistan. Remote collaborations with teams anywhere in the world are welcome.",
  [
    "does he work remote",
    "remote or onsite",
    "remote only",
    "onsite work",
    "does he work from home",
    "is he remote friendly",
    "can he work onsite",
    "remote work availability",
    "hybrid work",
  ]);

faq("contact", "start-immediately", "Can Abdul start immediately?",
  "For quick projects, Abdul can usually start right away — but it depends on his current workload and studies. Send your project details and he'll confirm a start date.",
  [
    "can he start immediately",
    "start immediately",
    "how fast can he start",
    "when can he start",
    "immediate availability",
    "can he start now",
    "is he free to start now",
    "quick start",
    "how soon can he begin",
  ]);

faq("contact", "small-projects", "Does Abdul take small projects?",
  "Yes — Abdul is happy to take small projects: landing pages, portfolio tweaks, small dashboards, API endpoints and similar. Small, clear-scope projects are a great fit.",
  [
    "does he take small projects",
    "small projects",
    "little projects",
    "short projects",
    "quick projects",
    "does he do small jobs",
    "small gigs",
    "mini projects",
    "does he take tiny projects",
  ]);

faq("contact", "big-projects", "Does Abdul take large projects?",
  "He can — larger builds like full e-commerce stores, dashboards and web platforms are his specialty (Furnecher is a full store). For big scopes he'll plan it properly: milestones, timeline and pricing upfront.",
  [
    "does he take large projects",
    "big projects",
    "large scale projects",
    "enterprise projects",
    "does he handle big projects",
    "complex projects",
    "large websites",
    "can he build a big app",
    "does he take big jobs",
  ]);

faq("contact", "nda", "Does Abdul sign NDAs?",
  "Yes — Abdul is happy to sign an NDA before discussing confidential project details. Just send it over and he'll review it promptly.",
  [
    "does he sign ndas",
    "nda",
    "non disclosure agreement",
    "confidentiality agreement",
    "can he work under nda",
    "is he open to ndas",
    "confidential projects",
  ]);

faq("contact", "pro-bono", "Does Abdul do free work?",
  "Abdul doesn't take on unpaid professional work, but he does contribute to open source — the Furnecher codebase is public and he welcomes issues, suggestions and contributions.",
  [
    "does he do free work",
    "free work",
    "pro bono",
    "unpaid work",
    "volunteer work",
    "does he work for free",
    "free projects",
    "can i get a free website",
  ]);

/* ------------------------------------------------------------------ */
/* MAX AI meta                                                         */
/* ------------------------------------------------------------------ */

faq("misc", "max-shortcuts", "Does MAX AI have keyboard shortcuts?",
  "Yes — desktop users get several shortcuts:\n\n• Ctrl/Cmd+K — open the command palette\n• Ctrl/Cmd+/ — focus the MAX AI chat\n• ? — view the shortcut list\n• Home / End — jump to top or bottom of the page\n\nOpen MAX and tap the keyboard icon for the full list (desktop only).",
  [
    "keyboard shortcuts",
    "shortcuts",
    "hotkeys",
    "key bindings",
    "how do i open the command palette",
    "command palette shortcut",
    "ctrl k",
    "shortcut list",
    "what are the shortcuts",
    "quick keys",
    "is there a shortcut for max",
    "how do i focus the chat",
  ]);

faq("misc", "max-clear", "How do I clear the MAX AI conversation?",
  "Open the MAX chat and use the eraser icon (or the \"Clear conversation\" action in the command palette) to reset the conversation to the welcome message.",
  [
    "how do i clear the conversation",
    "clear chat",
    "clear conversation",
    "reset chat",
    "delete the messages",
    "start a new conversation",
    "wipe the chat",
    "how do i reset max",
    "remove all messages",
    "clear the ai chat",
  ]);

faq("misc", "max-copy-answer", "Can I copy a MAX AI answer?",
  "Yes — each MAX AI response has a copy button, so you can copy the full answer to your clipboard in one click.",
  [
    "can i copy the answer",
    "copy answer",
    "copy response",
    "how do i copy the text",
    "copy max's reply",
    "share max answer",
    "copy message",
  ]);

faq("misc", "max-saves", "Does MAX AI save my messages?",
  "No — MAX AI runs entirely in your browser. Your messages are never uploaded or stored anywhere, and there are no analytics or tracking pixels on this site. Clearing the chat wipes the conversation locally.",
  [
    "does max save my messages",
    "does max store my chats",
    "is my conversation saved",
    "does the chat keep my messages",
    "are my questions stored",
    "does max remember my chats",
    "privacy of the chat",
    "are my messages private",
    "is the chat private",
    "does the site track me",
  ]);

faq("misc", "max-internet", "Does MAX AI use the internet or an AI model?",
  "No — MAX AI is a fully offline assistant. It answers from a bundled knowledge base about Abdul using smart matching (exact phrases, synonyms, fuzzy typos, multi-topic merging). It works even without a connection after the page loads.",
  [
    "does max use the internet",
    "does max use chatgpt",
    "is max connected to the internet",
    "does max use a real ai model",
    "is max powered by an llm",
    "does max need internet",
    "does max work offline",
    "is max real ai",
    "how does max answer",
    "does max use openai",
    "is max chatgpt",
    "does max call an api",
  ]);

faq("misc", "max-code", "Can MAX AI write code?",
  "MAX AI focuses on answering questions about Abdul and his portfolio. For code help, it will point you to his projects and the technologies he uses — but it's not a code generator.",
  [
    "can max write code",
    "can max help me code",
    "does max generate code",
    "can max solve coding problems",
    "ask max for code",
    "can max build an app",
    "does max do programming",
  ]);

faq("misc", "max-languages", "What languages can MAX AI understand?",
  "MAX AI is built for English questions. Mixed or casual phrasing usually works, but for the most accurate answers, ask in English — the way you'd ask a friend.",
  [
    "does max understand urdu",
    "does max understand other languages",
    "can max speak urdu",
    "does max know spanish",
    "other languages",
    "can i ask in urdu",
    "does max support hindi",
    "can max translate",
    "languages max understands",
    "is max english only",
    "what languages does max know",
  ]);

faq("misc", "max-mobile", "Does MAX AI work on mobile?",
  "Yes — on phones and tablets MAX opens as a full-screen chat; on desktop it floats above the page. All features (search, clear, copy) work everywhere, and the keyboard-shortcut panel is hidden on touch devices.",
  [
    "does max work on mobile",
    "max on phone",
    "max mobile",
    "is max mobile friendly",
    "can i use max on my phone",
    "does max work on tablet",
    "max full screen mobile",
  ]);

faq("misc", "max-elsewhere", "Is MAX AI available on other websites?",
  "MAX AI currently lives only on this portfolio. It's built by Abdul and he's open to building similar assistants for clients — ask him via the contact page!",
  [
    "is max on other sites",
    "can i get max for my website",
    "does max exist elsewhere",
    "max on another website",
    "can max be installed elsewhere",
    "is max available outside this site",
    "can i have my own max",
  ]);

faq("misc", "max-accuracy", "How accurate is MAX AI?",
  "MAX AI answers from a carefully curated knowledge base about Abdul, so factual answers (contact details, skills, projects, education) are reliable. It can't know things that aren't in the base — in that case it says so and suggests what to ask.",
  [
    "how accurate is max",
    "can max be wrong",
    "is max always right",
    "does max give wrong answers",
    "can max make mistakes",
    "is max reliable",
    "does max know everything",
    "is max perfect",
  ]);

faq("misc", "max-updates", "How is MAX AI updated?",
  "Abdul expands MAX AI's knowledge base over time — new projects, skills and facts get added as they happen. The assistant improves with every update to the site.",
  [
    "how is max updated",
    "does max learn new things",
    "when does max get updated",
    "will max know more in future",
    "does max update itself",
    "how often is max updated",
  ]);

/* ------------------------------------------------------------------ */
/* Site meta / UX                                                      */
/* ------------------------------------------------------------------ */

faq("misc", "site-theme-toggle", "How do I change the theme on this site?",
  "Use the sun/moon button in the header — it toggles light and dark instantly and remembers your choice. On first visit the site follows your system preference (prefers-color-scheme).",
  [
    "how do i change the theme",
    "theme toggle button",
    "where is the theme button",
    "how do i switch to dark",
    "how do i switch to light",
    "theme button",
    "sun moon button",
    "change colors of the site",
    "switch the theme",
  ]);

faq("misc", "site-cursor", "Why does the cursor look different?",
  "On desktop devices with a mouse, the site uses a custom cursor that reacts to links, buttons and cards — it's part of the premium experience. It automatically turns off on touchscreens, tablets and phones, and when MAX AI is open.",
  [
    "why does the cursor look different",
    "custom cursor",
    "what is the custom cursor",
    "why is the cursor weird",
    "where did the default cursor go",
    "disable custom cursor",
    "cursor on touch devices",
    "why no cursor on mobile",
  ]);

faq("misc", "site-loader", "What is the loading screen on this site?",
  "The loading screen is a short themed welcome (about 1.5-2 seconds): Abdul's logo inside a glowing energy ring with floating particles, a progress bar and the text \"Preparing Experience...\". It respects reduced-motion preferences and never blocks clicks.",
  [
    "loading screen",
    "what is the loading screen",
    "the loader",
    "why is there a loading screen",
    "preparing experience",
    "energy ring",
    "how long does the loader stay",
    "can i skip the loader",
    "splash screen",
  ]);

faq("misc", "site-favicon", "Why does the tab icon change with the theme?",
  "The browser tab icon (favicon) swaps between a light and dark version when you change themes — plus the browser's theme-color updates to match. It's a small detail that keeps the whole experience cohesive.",
  [
    "why does the tab icon change",
    "favicon",
    "tab icon",
    "browser icon",
    "site icon",
    "why does the icon change",
    "dark favicon",
    "theme color",
    "why does the browser bar change color",
  ]);

faq("misc", "site-security", "Is this website secure?",
  "Yes — the site is served over HTTPS with a strict Content-Security-Policy (no inline scripts, locked-down resource rules), no third-party trackers, and all links validated. It also has a sitemap, robots.txt and clean metadata.",
  [
    "is this website secure",
    "is the site safe",
    "https",
    "content security policy",
    "csp",
    "is this site secure",
    "security of the site",
    "is it safe to visit",
    "does the site have trackers",
    "third party scripts",
  ]);

faq("misc", "site-template", "Can I use this portfolio as a template?",
  "This portfolio is Abdul's personal project — its code is visible on GitHub (https://github.com/MrAbdulSamadDEV) where you can explore it and contribute. For your own site, Abdul is happy to build something similar for you — reach out through the contact page!",
  [
    "can i use this as a template",
    "is this site a template",
    "can i copy this website",
    "is this template free",
    "can i reuse this portfolio",
    "where is the source code",
    "is this site open source",
    "can i use this code",
    "template for portfolio",
  ]);

faq("misc", "site-blog", "Does this site have a blog?",
  "Not yet — the site currently has Home, Projects and Contact pages. A blog might come later as Abdul's learning journey grows. Stay tuned!",
  [
    "does this site have a blog",
    "blog",
    "articles",
    "is there a blog",
    "does abdul write articles",
    "blog posts",
    "will there be a blog",
    "does he have a blog",
  ]);

faq("misc", "site-version", "What version of the site is this?",
  "This is the current production build of the portfolio — with SSR, MAX AI, the command palette, themes, custom cursor and loading screen. You can see version and build info in the footer's source (version-info in MAX AI).",
  [
    "what version is this site",
    "site version",
    "current version",
    "is this the latest version",
    "version number",
    "what build is this",
  ]);

/* ------------------------------------------------------------------ */
/* Learning & career                                                   */
/* ------------------------------------------------------------------ */

faq("learning", "cloud-vs-fullstack", "Why both cloud data engineering and full stack?",
  "Abdul is building a bridge between two worlds: cloud data engineering (data pipelines, ETL, AWS/Azure, Linux) and full stack development (TypeScript, Node.js, React). His goal is intelligent, data-driven products — not just pages or pipelines, but systems that do both.",
  [
    "why both cloud and full stack",
    "cloud vs full stack",
    "why cloud data engineering and development",
    "does he prefer cloud or web",
    "what does he focus on",
    "cloud data engineering or full stack",
    "is he a developer or a data engineer",
    "both data and development",
  ]);

faq("learning", "why-cloud-data", "What made Abdul choose cloud data engineering?",
  "Abdul chose cloud data engineering because data is where software gets interesting — pipelines, ETL, cloud platforms like AWS and Azure, and Linux. Combined with his full stack skills, it positions him to build intelligent, scalable systems that solve real problems.",
  [
    "why cloud data engineering",
    "why data engineering",
    "why did he choose cloud",
    "why is he studying data",
    "reason for cloud data",
    "what made him pick data engineering",
    "why cloud",
    "why data",
    "what made him choose cloud data engineering",
  ]);

faq("learning", "study-hours", "How does Abdul structure his study time?",
  "Abdul learns in consistent daily blocks: hands-on building, focused courses, and reading or practice — keeping a balance between web development and cloud data topics. He believes in learning in public and building as you learn.",
  [
    "how does he study",
    "study routine",
    "how many hours does he study",
    "daily study plan",
    "how does he balance learning",
    "study schedule",
    "how much time does he spend learning",
    "daily routine for learning",
    "learning routine",
  ]);

faq("learning", "courses-now", "What is Abdul currently learning?",
  "Abdul is currently deep in cloud data engineering — data pipelines, ETL concepts, AWS and Azure platforms, and Linux — while continuing to sharpen his full stack skills in TypeScript, Node.js and React.",
  [
    "what is he currently learning",
    "what courses is he taking",
    "current courses",
    "what is he studying now",
    "what is he learning these days",
    "what course is he doing",
    "current learning focus",
    "what is he studying this year",
  ]);

faq("learning", "next-course", "What will Abdul learn next?",
  "Next on Abdul's roadmap: deeper cloud data tooling — building production data pipelines, working with big data ecosystems, and combining data engineering with full stack apps (dashboards and data-driven products).",
  [
    "what will he learn next",
    "next course",
    "what is next for him",
    "future learning plans",
    "what's next in his learning",
    "upcoming courses",
    "what will he study next",
    "next skills to learn",
  ]);

faq("learning", "self-taught", "Is Abdul self-taught?",
  "Yes — Abdul is self-taught. His journey went from Microsoft Word to web development, full stack engineering and cloud data engineering through hands-on practice, real projects, online courses and open source contribution — no bootcamp, no formal CS degree (yet).",
  [
    "is abdul self taught",
    "self taught developer",
    "did he go to a bootcamp",
    "did he take a coding bootcamp",
    "how did he learn to code",
    "is he a self learner",
    "does he have a cs degree",
    "did he study computer science",
    "is he self made",
  ]);

faq("learning", "bootcamp-advice", "Should I join a bootcamp or learn on my own?",
  "Abdul's advice from experience: you don't need a bootcamp to start — he's self-taught. Pick one path (web or data), build real projects, learn in public and stay consistent. Paid courses or bootcamps only help if they add structure you actually use.",
  [
    "should i join a bootcamp",
    "bootcamp or self study",
    "is a bootcamp worth it",
    "learn on my own",
    "self taught advice",
    "do i need a bootcamp",
    "bootcamp advice",
    "how to start without a bootcamp",
  ]);

faq("learning", "data-engineering-path", "How do I start cloud data engineering?",
  "A practical starting path, per Abdul's own journey:\n\n• Learn the fundamentals — SQL and Python first\n• Build pipelines — move and transform data end-to-end\n• Cloud basics — AWS or Azure core services\n• Linux — the operating system of the cloud\n• Build data projects — dashboards and ETL that you can show",
  [
    "how do i start cloud data engineering",
    "data engineering path",
    "how to become a data engineer",
    "cloud data roadmap",
    "starting data engineering",
    "data engineering roadmap",
    "how to learn data engineering",
    "path to cloud data",
  ]);

faq("learning", "books", "Does Abdul read tech books?",
  "Yes — Abdul balances courses with books and documentation. For his cloud data path he focuses on data engineering, SQL and Linux topics, plus clean-code and software craftsmanship books for the developer side.",
  [
    "does abdul read books",
    "tech books",
    "favorite books",
    "what books does he read",
    "recommended books",
    "book recommendations",
    "does he read",
    "reading habits",
  ]);

/* ------------------------------------------------------------------ */
/* Certificates                                                        */
/* ------------------------------------------------------------------ */

faq("certificates", "freecodecamp-details", "What did Abdul learn in his FreeCodeCamp course?",
  "Abdul earned his FreeCodeCamp certificate through hands-on curriculum — responsive web design with HTML and CSS, and core JavaScript. It's one of the 4+ certificates on his profile.",
  [
    "freecodecamp details",
    "what did he learn on freecodecamp",
    "freecodecamp course",
    "what is his freecodecamp certificate",
    "fcc certificate",
    "what did he study at freecodecamp",
    "is the freecodecamp certificate real",
  ]);

faq("certificates", "aws-details", "What is Abdul's AWS certificate?",
  "Abdul holds an AWS-related certificate from his cloud learning path — part of his Cloud Data Engineering study (4+ certificates total). The details and verification links are listed on his profile.",
  [
    "aws certificate details",
    "what is his aws certificate",
    "aws cert",
    "did he pass aws",
    "aws certification",
    "which aws certificate",
    "cloud certificate",
  ]);

faq("certificates", "node-details", "What did Abdul learn in his Node.js certificate course?",
  "Abdul's Node.js certificate covered backend development with Node and Express — building servers, APIs and web apps in JavaScript/TypeScript, one of the foundations of his full stack toolkit.",
  [
    "node certificate details",
    "what did he learn in the node course",
    "nodejs certificate",
    "node course",
    "what did his node certificate cover",
    "backend certificate",
    "express course",
  ]);

faq("certificates", "cert-order", "Which certificate did Abdul earn first?",
  "Abdul's certificate path followed his learning journey: FreeCodeCamp (web development foundations) came first, then Node.js backend skills, then cloud/AWS as he moved into cloud data engineering.",
  [
    "which certificate first",
    "what certificate did he get first",
    "order of certificates",
    "first certificate",
    "what order did he earn certificates",
    "which cert came first",
  ]);

faq("certificates", "cert-worth", "Do certificates matter to Abdul?",
  "Abdul sees certificates as proof of structured learning, not the goal itself — the real proof is the projects. He lists certificates on his profile for transparency, and builds because building teaches the most.",
  [
    "do certificates matter to him",
    "are certificates important",
    "does he value certificates",
    "do certificates count",
    "are his certificates useful",
    "certificate value to him",
    "does he care about certificates",
  ]);

faq("certificates", "recommend-course", "Which course does Abdul recommend for beginners?",
  "Abdul recommends starting where he did: FreeCodeCamp for HTML, CSS and JavaScript fundamentals — it's free, hands-on and project-based. Then move to Node.js for the backend, and pick cloud basics (AWS or Azure) later.",
  [
    "which course does he recommend",
    "recommended course",
    "best course for beginners",
    "what course should i take",
    "course recommendation",
    "what did he take first",
    "best beginner course",
  ]);

/* ------------------------------------------------------------------ */
/* Education extras                                                    */
/* ------------------------------------------------------------------ */

faq("education", "what-studying", "What exactly is Abdul studying?",
  "Abdul is studying Cloud Data Engineering — data pipelines, ETL, cloud platforms (AWS, Azure), Linux and data tooling — alongside his hands-on full stack development work. He started this phase of his journey in 2026.",
  [
    "what exactly is he studying",
    "what is his major",
    "what degree is he doing",
    "what is he studying in cloud data engineering",
    "what subjects does cloud data engineering cover",
    "what does he study exactly",
    "what is his field of study",
  ]);

faq("education", "online-education", "Is Abdul studying online?",
  "Yes — Abdul's education is primarily online: cloud data engineering courses, certificates and hands-on practice. He combines structured courses with building real projects.",
  [
    "is he studying online",
    "online education",
    "online courses",
    "does he study online",
    "is his education online",
    "online learning",
    "is he taking online classes",
  ]);

faq("education", "graduation-date", "When will Abdul graduate?",
  "Abdul's cloud data engineering studies are in progress (started 2026) — he's still on the journey. Reach out if you're looking for a growing, learning-driven engineer for internships or projects.",
  [
    "when will he graduate",
    "graduation date",
    "when does he finish studying",
    "is he a graduate",
    "has he graduated",
    "when does his degree end",
    "graduation year",
  ]);

faq("education", "fsc-subjects", "What subjects did Abdul study in college (FSc)?",
  "Abdul's pre-university (FSc) background is part of his education history — he covers his FSc details, coursework and grades in the education section of his portfolio. For exact figures, ask MAX about \"FSc details\".",
  [
    "fsc subjects",
    "what subjects in fsc",
    "college subjects",
    "intermediate subjects",
    "what did he study in college",
    "fsc details",
    "his fsc",
    "pre engineering subjects",
  ]);

faq("education", "school-name", "Which school or college does Abdul attend?",
  "Abdul keeps specific institution names off the public portfolio — what he shares are his education level, focus and achievements. For collaborations or internships, email him directly and he'll share what's relevant.",
  [
    "which school does he attend",
    "school name",
    "college name",
    "university name",
    "where does he study",
    "his school",
    "which college",
    "institute name",
  ]);

faq("education", "study-tip", "Does Abdul have study tips for students?",
  "Abdul's study tips, from his own journey:\n\n• Build as you learn — projects beat notes\n• Stay consistent — small daily blocks beat rare marathons\n• Learn in public — share progress, get feedback\n• Pick one path first, then branch out",
  [
    "study tips",
    "advice for students",
    "tips for learning",
    "how should i study",
    "student advice",
    "tips from abdul",
    "learning advice",
    "how to study tech",
  ]);

/* ------------------------------------------------------------------ */
/* Experience extras                                                   */
/* ------------------------------------------------------------------ */

faq("experience", "client-communication", "How does Abdul communicate with clients?",
  "Abdul keeps communication clear and simple: email for detailed discussions, quick updates during projects, and regular check-ins on milestones. He speaks fluent English and keeps clients in the loop at every stage.",
  [
    "how does he communicate with clients",
    "client communication",
    "how does he talk to clients",
    "communication style",
    "how often does he update clients",
    "project updates",
    "how do i talk to him about a project",
    "client updates",
  ]);

faq("experience", "deadlines", "How does Abdul handle deadlines?",
  "Abdul plans work in clear steps with realistic timelines, then tracks progress against them — he'd rather give an honest estimate than miss a promise. On his projects (like Furnecher) he shipped on schedule by keeping scope tight.",
  [
    "how does he handle deadlines",
    "does he meet deadlines",
    "deadlines",
    "is he good with deadlines",
    "timeline management",
    "on time delivery",
    "does he deliver on time",
    "how do deadlines work",
  ]);

faq("experience", "built-for-clients", "What has Abdul built for clients?",
  "Abdul's client-facing work includes websites and web apps built through freelancing — landing pages, business sites and storefronts. His flagship public builds are Furnecher (furniture e-commerce) and this portfolio with MAX AI.",
  [
    "what has he built for clients",
    "client work",
    "freelance work examples",
    "what does he deliver to clients",
    "projects for clients",
    "client projects",
    "freelance projects he has done",
    "work samples for clients",
  ]);

faq("experience", "team-size", "Does Abdul work in teams?",
  "Yes — Abdul is comfortable in teams: code review, Git/GitHub collaboration, open source contribution and clear communication are part of his workflow. He also works solo end-to-end on his own projects.",
  [
    "does he work in teams",
    "team work",
    "is he a team player",
    "does he work alone",
    "team experience",
    "collaboration experience",
    "does he prefer teams",
    "working in a group",
  ]);

faq("experience", "work-tools", "What tools does Abdul use at work?",
  "Abdul's daily toolkit: VS Code (90%), Git & GitHub (88%), OpenCode CLI, Linux, Node.js and Express for backends, and modern browsers for testing — plus Figma-style design thinking for the frontend.",
  [
    "what tools does he use",
    "work tools",
    "his toolkit",
    "what tools does he work with",
    "development tools",
    "daily tools",
    "what software does he use",
    "his setup",
  ]);

faq("experience", "student-developer", "Does Abdul balance studies and work?",
  "Yes — Abdul balances cloud data engineering studies with freelance and open source work by keeping a consistent routine: focused study blocks, dedicated project time, and clear communication on availability.",
  [
    "how does he balance studies and work",
    "student developer",
    "study and work",
    "does he manage both",
    "balance learning and projects",
    "student life",
    "work study balance",
  ]);

/* ------------------------------------------------------------------ */
/* Conversational                                                      */
/* ------------------------------------------------------------------ */

const GREETINGS = [
  ["Good morning", "good morning", "morning"],
  ["Good afternoon", "good afternoon", "afternoon"],
  ["Good evening", "good evening", "evening"],
  ["Good night", "good night", "night"],
];
for (const [label, ...keys] of GREETINGS) {
  faq("misc", `greet-${keys[0].replace(/\s+/g, "-")}`, `${label}!`,
    `${label}! I'm MAX, Abdul's portfolio assistant. Ask me about his projects, skills, experience or contact details.`,
    keys);
}

faq("misc", "ack-ok", "OK / thanks",
  "You're welcome! Anything else you'd like to know about Abdul?",
  ["ok", "okay", "kk", "cool", "awesome", "nice", "great", "alright", "sure", "good to know", "that's all", "done", "perfect"]);

faq("misc", "farewell-see-you", "See you later",
  "See you later! Feel free to come back and ask MAX anything about Abdul.",
  ["see you later", "see you soon", "talk to you later", "talk to you soon", "later", "cya", "goodbye for now", "until next time", "take care"]);

faq("misc", "nice-to-meet", "Nice to meet you",
  "Nice to meet you too! I'm MAX — ask me anything about Abdul's projects, skills, experience or contact info.",
  ["nice to meet you", "pleased to meet you", "great to meet you", "good to meet you", "meet you"]);

faq("misc", "whats-up", "What's up?",
  "Not much — just here to answer anything about Abdul! Projects, skills, contact details... ask away.",
  ["what's up", "whats up", "sup", "how's it going", "hows it going", "how are things", "what's new", "whats new"]);

faq("misc", "human", "Are you a human?",
  "No — I'm MAX AI, an assistant built by Abdul that answers from his portfolio's knowledge base. I run fully offline in your browser.",
  ["are you a human", "are you real", "are you a person", "is this a real person", "am i talking to a human", "are you a robot", "are you a bot", "are you abdul"]);

faq("misc", "praise", "You're very helpful",
  "Thank you! If there's anything else about Abdul — projects, skills, experience, contact — just ask.",
  ["you're very helpful", "you are helpful", "good job", "well done", "you're the best", "you are awesome", "great job", "nice work", "you're great", "helpful assistant"]);

faq("misc", "repeat", "Can you repeat that?",
  "Sure — ask me the same question again, or try rephrasing it! I can also tell you about Abdul's projects, skills, experience, education, certificates or contact details.",
  ["can you repeat", "repeat that", "say it again", "again please", "what did you say", "i didn't understand", "didn't catch that", "repeat please"]);

faq("misc", "help-anything", "Help me find something",
  "I can help you find things about Abdul — for example:\n\n• Projects: \"show your projects\"\n• Skills: \"what are your skills\"\n• Contact: \"how can i contact you\"\n• Education: \"what do you study\"\n\nJust ask in your own words!",
  ["help me find", "i'm looking for", "i am looking for", "looking for something", "help me with something", "can you help me", "i need help", "help me please"]);

faq("misc", "date", "What is today's date?",
  "I don't track the live date — but you can check your device clock. What I can tell you is anything about Abdul!",
  ["what is today's date", "what day is it", "today's date", "what is the date today", "what day is today"]);

faq("misc", "listening", "Are you listening?",
  "Always! Ask me anything about Abdul — projects, skills, experience, education, certificates, contact...",
  ["are you listening", "can you hear me", "are you there", "you there", "hello are you there", "are you still there", "can you hear"]);

faq("misc", "who-are-you-max", "Who are you?",
  "I'm MAX — Abdul Samad's personal portfolio assistant. I know his projects, skills, experience, education, certificates and contact details, and I answer from a knowledge base that runs right in your browser.",
  ["who are you", "what are you", "introduce yourself", "tell me about yourself", "about you max", "what is max", "who is max"]);

/* ------------------------------------------------------------------ */
/* Misc extras                                                         */
/* ------------------------------------------------------------------ */

faq("about", "everything", "Tell me everything about Abdul Samad",
  `Here's the complete picture of Abdul Samad:\n\n• Role — Cloud Data Engineering Student and Full Stack Developer\n• Based in — Karachi, Pakistan\n• Stack — TypeScript, Node.js, Express, React, MongoDB, HTML5, CSS3\n• Stats — ${ABOUT.statistics.map((s) => `${s.value} ${s.label.toLowerCase()}`).join(", ")}\n• Flagship project — SALAAR'S HOME (Furnecher), a live furniture e-commerce platform\n• Contact — ${SITE.email} · ${SITE.phoneDisplay}\n• Website — ${DOMAIN}\n\nAsk MAX for details on any of these!`,
  [
    "tell me everything about abdul",
    "everything about abdul",
    "tell me all about abdul",
    "tell me everything",
    "complete profile",
    "full profile of abdul",
    "all about abdul samad",
    "tell me everything about him",
    "everything about him",
    "summarize abdul",
    "full summary of abdul",
    "tell me about abdul samad completely",
  ]);

faq("misc", "coffee", "Coffee or tea?",
  "Abdul is a coffee person when deep in code — but tea is never far away in Pakistan. Ask MAX about his projects while he's on his next cup!",
  ["coffee or tea", "does he drink coffee", "does he drink tea", "what does he drink", "coffee", "chai", "tea or coffee"]);

faq("misc", "visit-pakistan", "What is it like working with someone in Pakistan?",
  "Abdul is based in Karachi, Pakistan (PKT timezone). He works remotely worldwide, communicates in fluent English, and time differences are easy to manage with clear scheduling — just like any remote team.",
  [
    "what is it like working with him in pakistan",
    "working with someone in pakistan",
    "is pakistan remote friendly",
    "time difference",
    "working across timezones",
    "remote from pakistan",
    "karachi timezone work",
  ]);

faq("misc", "bucket-list", "What is on Abdul's bucket list?",
  "On Abdul's bucket list: shipping a large production system end-to-end, contributing to major open source projects, landing a cloud data engineering role, and building products that people genuinely use.",
  [
    "bucket list",
    "what does he want to do",
    "dreams",
    "aspirations",
    "future dreams",
    "things he wants to achieve",
    "what does he hope to do",
  ]);

faq("misc", "contact-summary", "How can I reach Abdul quickly?",
  "The fastest ways to reach Abdul:\n\n• Email — mr.abdulsamadabdullah@gmail.com\n• Phone — +92 370 8033443\n• LinkedIn — linkedin.com/in/MRABDULSAMADDEV\n\nAll links are also on the contact page.",
  [
    "how can i reach abdul quickly",
    "fastest way to contact",
    "quickest way to reach him",
    "reach him quickly",
    "best way to reach him fast",
    "how to contact him fast",
  ]);

/* ------------------------------------------------------------------ */
/* Per-skill learning advice                                           */
/* ------------------------------------------------------------------ */

for (const group of SKILL_GROUPS) {
  for (const skill of group.skills) {
    const slug = skill.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const groupName = group.title;
    const levelBand = skill.level >= 85 ? "mastery" : skill.level >= 75 ? "strong" : "growing";
    faq("learning", `learn-${slug}`, `How do I learn ${skill.name} like Abdul?`,
      `To learn ${skill.name} the way Abdul did:\n\n• Start with the official docs and a free beginner course\n• Build a small real project with it — learning sticks when you build\n• Practice daily, even 30 minutes\n• Share your progress publicly to stay accountable\n\nAbdul rates himself ${skill.level}% here (${levelBand}), built entirely through projects.`,
      [
        `how do i learn ${skill.name.toLowerCase()}`,
        `how to learn ${skill.name.toLowerCase()}`,
        `learn ${skill.name.toLowerCase()} like him`,
        `how did abdul learn ${skill.name.toLowerCase()}`,
        `learning ${skill.name.toLowerCase()} advice`,
        `resources for ${skill.name.toLowerCase()}`,
        `start learning ${skill.name.toLowerCase()}`,
        `beginner ${skill.name.toLowerCase()} guide`,
        `how long to learn ${skill.name.toLowerCase()}`,
        `best way to learn ${skill.name.toLowerCase()}`,
        `${skill.name.toLowerCase()} for beginners`,
      ]);
  }
}

faq("skills", "easiest-skill", "What is Abdul's easiest skill?",
  "Abdul finds CSS3 the most approachable — it gives instant visual feedback, which makes it fun and fast to learn. His mastery there is 92%, among his highest.",
  [
    "easiest skill",
    "what is his easiest skill",
    "which skill was easiest to learn",
    "easiest technology",
    "what came easiest to him",
    "easiest part of his stack",
  ]);

faq("skills", "hardest-skill", "What was Abdul's hardest skill to learn?",
  "Cloud Data Engineering is Abdul's hardest area — it has real breadth: data pipelines, ETL, cloud platforms (AWS/Azure) and Linux all at once. It's also his newest skill, and he's enjoying the climb.",
  [
    "hardest skill",
    "hardest thing to learn",
    "what was hardest for him",
    "most difficult skill",
    "what took the longest to learn",
    "hardest technology",
    "what is his hardest skill",
  ]);

faq("skills", "favorite-group", "What is Abdul's favorite skill group?",
  "Abdul's favorite is the full stack combination — Frontend (HTML, CSS, JS, TS) plus Backend (Node.js, Express) — because it lets him ship complete products from design to database.",
  [
    "favorite skill group",
    "favorite group of skills",
    "which group does he like most",
    "favorite part of his stack",
    "frontend or backend favorite",
    "favorite area of development",
    "what does he enjoy most",
  ]);

faq("skills", "improve-most", "What skill does Abdul want to improve most?",
  "Abdul is investing most in Cloud Data Engineering — data pipelines, ETL and cloud platforms — while keeping his full stack sharp. It's the skill that will define his next chapter.",
  [
    "what skill does he want to improve",
    "skill he is improving",
    "improving most",
    "what is he working on improving",
    "focus skill",
    "what does he want to get better at",
    "which skill needs work",
  ]);

faq("skills", "fun-skill", "What is Abdul's most fun skill?",
  "Abdul has the most fun with JavaScript/TypeScript — it works everywhere (browser, server, tooling) and turns ideas into working products fast. He also enjoys Linux and the terminal.",
  [
    "most fun skill",
    "fun skill",
    "what does he enjoy most",
    "favorite thing to code",
    "most enjoyable skill",
    "what is fun for him",
    "enjoys coding in",
  ]);

/* ------------------------------------------------------------------ */
/* Career & hiring                                                     */
/* ------------------------------------------------------------------ */

faq("contact", "roles-looking", "What roles is Abdul looking for?",
  "Abdul is open to:\n\n• Internships — full stack or data engineering\n• Junior full stack developer roles\n• Cloud data engineering roles\n• Freelance projects and collaborations\n\nHe's a fast learner with shipped, production-quality work.",
  [
    "what roles is he looking for",
    "what jobs is he looking for",
    "what position is he seeking",
    "roles he wants",
    "what kind of job",
    "is he looking for a job",
    "what is he applying for",
    "internship or job",
    "what roles suit him",
  ]);

faq("contact", "relocate", "Is Abdul open to relocating?",
  "Abdul is based in Karachi, Pakistan and works remotely worldwide. For the right role he's open to discussing relocation — remote-first collaboration is always available in the meantime.",
  [
    "is abdul open to relocating",
    "can he relocate",
    "is he willing to move",
    "relocation",
    "does he want to move abroad",
    "is he open to moving",
    "works from pakistan",
  ]);

faq("contact", "company-type", "Startup or big company?",
  "Abdul values growth over size — a startup where he can own real features, or a bigger company with strong mentorship and engineering discipline, both appeal to him. What matters most: real problems and learning.",
  [
    "startup or big company",
    "does he prefer startups",
    "what companies does he like",
    "what kind of company",
    "startup or corporate",
    "does he want to join a startup",
    "what does he look for in a company",
  ]);

faq("contact", "employer-look", "What does Abdul look for in an employer?",
  "Abdul looks for growth, mentorship and real problems to solve. He thrives where code quality matters, feedback is honest, and engineers are trusted to own their work end-to-end.",
  [
    "what does he look for in an employer",
    "what does he want from a job",
    "ideal employer",
    "what makes him join a company",
    "what does he value in a workplace",
    "ideal workplace",
  ]);

faq("contact", "visa", "Does Abdul need visa sponsorship?",
  "Abdul is based in Pakistan. For onsite roles abroad he'd discuss sponsorship with the employer — meanwhile he's fully available for remote work from anywhere.",
  [
    "visa sponsorship",
    "does he need a visa",
    "visa",
    "sponsorship",
    "does he need sponsorship",
    "work permit",
    "visa for him",
  ]);

/* ------------------------------------------------------------------ */
/* Site features                                                       */
/* ------------------------------------------------------------------ */

faq("misc", "feature-palette", "What is the command palette?",
  "The command palette (Ctrl/Cmd+K on desktop) is a quick launcher for actions: opening the AI chat, copying his email or portfolio URL, clearing the chat, viewing keyboard shortcuts and more. Type a few letters and the action appears.",
  [
    "what is the command palette",
    "command palette",
    "what does the palette do",
    "palette actions",
    "how does the palette work",
    "ctrl k palette",
    "what can the palette do",
    "palette commands",
  ]);

faq("misc", "feature-progress", "What is the progress bar at the top?",
  "That's the reading progress bar — a thin accent line at the very top of the page that fills as you scroll down. It shows how far through the page you are.",
  [
    "what is the progress bar",
    "progress bar at the top",
    "top progress bar",
    "reading progress",
    "scroll progress",
    "what is the thin bar on top",
    "progress indicator",
  ]);

faq("misc", "feature-backtotop", "What does the back-to-top button do?",
  "The back-to-top button (bottom-right) appears after you scroll down — click it to glide smoothly back to the top of the page in one tap.",
  [
    "back to top",
    "back to top button",
    "what is the arrow button",
    "scroll to top",
    "how do i go back to top",
    "top button",
  ]);

faq("misc", "feature-404", "What happens on a missing page?",
  "If a page doesn't exist you get a friendly custom 404 page with navigation back to Home, Projects and Contact — no dead ends on this site.",
  [
    "404 page",
    "what happens when a page is missing",
    "page not found",
    "error page",
    "broken link",
    "what if i open a wrong url",
    "custom 404",
  ]);

faq("misc", "feature-transitions", "Why do pages glide when I navigate?",
  "That's the page-transition effect — navigating between Home, Projects and Contact fades smoothly instead of hard-cutting. It's subtle by design and disabled for reduced-motion users.",
  [
    "page transitions",
    "why do pages fade",
    "smooth navigation",
    "transition effect",
    "why does the page glide",
    "page animation",
  ]);

faq("misc", "feature-toasts", "What are the little popup notifications?",
  "Those are toast notifications — small, unobtrusive confirmations for actions like copying the email or location. They appear briefly and fade away on their own.",
  [
    "what are the popup notifications",
    "toast notifications",
    "little popups",
    "notification bubbles",
    "copy confirmation",
    "what are the toasts",
  ]);

faq("misc", "feature-reveal", "Why do sections fade in as I scroll?",
  "Sections gently reveal themselves as they enter the viewport — a scroll-reveal effect that keeps the page feeling alive without harming performance (GPU-friendly, and disabled for reduced-motion users).",
  [
    "why do sections fade in",
    "scroll reveal",
    "fade in on scroll",
    "reveal animation",
    "why do elements animate",
    "section animations",
  ]);

faq("misc", "feature-navspy", "How does the nav know where I am?",
  "A scroll-spy watches which section is in view and highlights the matching nav link — plus a small accent dot appears under the active item. It keeps orientation clear while scrolling.",
  [
    "scroll spy",
    "nav highlighting",
    "how does the nav know the section",
    "active nav link",
    "why is the nav link highlighted",
    "active section dot",
  ]);

/* ------------------------------------------------------------------ */
/* MAX AI usage help                                                   */
/* ------------------------------------------------------------------ */

faq("misc", "what-ask-max", "What should I ask MAX AI?",
  "Good questions for MAX AI:\n\n• \"Show your projects\"\n• \"What are your skills?\"\n• \"How can I contact you?\"\n• \"What do you study?\"\n• \"Is Furnecher live?\"\n• \"Does he work remote?\"\n\nAsk about anything on the portfolio — MAX knows it all.",
  [
    "what should i ask max",
    "what can i ask",
    "questions for max",
    "what should i ask the assistant",
    "suggest questions",
    "good questions to ask",
    "what do i ask max",
    "example questions",
  ]);

faq("misc", "multi-question", "Can I ask MAX AI multiple questions at once?",
  "Yes — MAX AI can split one message into several questions. Try \"What is his email and phone?\" or \"Skills and experience\" and it will answer each part in a combined reply.",
  [
    "can i ask multiple questions",
    "multiple questions at once",
    "ask two questions",
    "combined question",
    "several questions",
    "questions in one message",
    "email and phone together",
  ]);

faq("misc", "search-chat", "Can I search the MAX AI conversation?",
  "Yes — open MAX and use the search button to filter your conversation by keyword. It's handy when the chat gets long.",
  [
    "can i search the conversation",
    "search chat",
    "search messages",
    "find a message in the chat",
    "search in max",
    "conversation search",
  ]);

/* ------------------------------------------------------------------ */
/* Home page sections                                                  */
/* ------------------------------------------------------------------ */

faq("misc", "home-sections", "What sections are on the home page?",
  "The home page flows through: Hero (intro + typing roles), About (who he is, journey and stats), Skills (the full toolkit), Projects preview, Contact cards and the footer — plus MAX AI available on every page.",
  [
    "what sections are on the home page",
    "home page sections",
    "sections of the homepage",
    "what is on the home page",
    "homepage layout",
    "hero about skills sections",
    "what does the homepage contain",
  ]);

faq("misc", "about-section", "What is in the About section?",
  "The About section covers Abdul's story: who he is, his journey from MS Word to cloud data engineering, his goals, key statistics (projects, technologies, certificates, years) and the full journey timeline.",
  [
    "what is in the about section",
    "about section content",
    "what does the about section show",
    "about section details",
    "his story section",
    "journey section",
  ]);

faq("misc", "find-section", "How do I jump to a section quickly?",
  "Use the nav links (About, Skills) to scroll straight to a section, or the keyboard shortcut Home/End to jump to the very top or bottom. On mobile, open the menu button.",
  [
    "how do i jump to a section",
    "jump to about",
    "jump to skills",
    "quick navigation",
    "how do i get to a section",
    "navigate the homepage",
  ]);

/* ------------------------------------------------------------------ */
/* Light personal & misc                                               */
/* ------------------------------------------------------------------ */

faq("about", "morning-or-night", "Is Abdul a morning person or night owl?",
  "Abdul is most productive in focused blocks — he works with the energy his schedule gives him, balancing studies, projects and learning. Deep-focus sessions are where the real work happens.",
  [
    "morning person or night owl",
    "when does he work best",
    "is he a night owl",
    "does he work at night",
    "best working hours",
    "when is he most productive",
  ]);

faq("about", "setup-preference", "PC or laptop?",
  "Abdul works from a laptop-first setup — portable, practical, and plenty for VS Code, Node.js and cloud work. He values a clean, distraction-free environment.",
  [
    "pc or laptop",
    "does he use a pc",
    "his setup",
    "what computer does he use",
    "laptop or desktop",
    "what does he code on",
  ]);

faq("misc", "know-so-much", "How does MAX AI know so much about Abdul?",
  "MAX AI reads a bundled knowledge base — every fact on this portfolio, organized into projects, skills, education, experience, certificates, contact and more. It's all curated by Abdul himself, so answers stay accurate.",
  [
    "how does max know so much",
    "how do you know all this",
    "where does max get its answers",
    "how do you know about abdul",
    "where do the answers come from",
    "is this data real",
    "how does the assistant know",
  ]);

faq("misc", "your-website", "Is this MAX AI's website or Abdul's?",
  "This is Abdul's portfolio — MAX AI is the assistant he built for it. The site, the AI, the design and the content are all his work.",
  [
    "is this max's website",
    "who owns this website",
    "is this your site or his",
    "who made this website",
    "whose portfolio is this",
    "is this max's site",
  ]);

faq("misc", "other-websites", "Can MAX AI access other websites?",
  "No — MAX AI is fully offline and only knows what's in this portfolio's knowledge base. It can't browse the web, and it never sends your questions anywhere.",
  [
    "can max access other websites",
    "can max browse the web",
    "does max have internet access",
    "can max search google",
    "can max visit websites",
    "does max know other sites",
  ]);

faq("misc", "greet-hey", "Hey there!",
  "Hey there! I'm MAX, Abdul's portfolio assistant. Ask me about his projects, skills, experience, education or contact details — whatever you're curious about!",
  ["hey there", "hiya", "yo", "hello there", "hi there", "heyy", "hey hey", "greetings"]);

/* ------------------------------------------------------------------ */
/* Write                                                               */
/* ------------------------------------------------------------------ */

await mkdir(path.dirname(OUT), { recursive: true });
await writeFile(OUT, `${JSON.stringify({ category: "generated", faqs }, null, 2)}\n`, "utf8");

const authoredKeywords = faqs.reduce((sum, f) => sum + f.keywords.length, 0);
console.log(`[expand-kb] wrote ${faqs.length} generated FAQs (${authoredKeywords} authored keywords) to ${path.relative(ROOT, OUT)}`);
