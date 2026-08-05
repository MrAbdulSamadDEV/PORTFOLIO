# Abdul Samad — Portfolio

A premium, production-quality personal portfolio for **Abdul Samad** — Cloud Data
Engineering student & Full Stack Developer. Server-side rendered with
TypeScript + Node.js + Express, with a self-contained AI assistant, clean
SEO-friendly URLs and a full accessibility pass.

---

## Features

- **Server-side rendering** — Express 5 + TypeScript renders every page; no
  client-side dependency to see the complete content.
- **Clean URLs** — only `/`, `/projects`, `/contact` and the 404 page exist.
  Home sections scroll in place via the History API (no `#hash` URLs), and
  legacy `.html`/trailing-slash URLs redirect (301) to their canonical forms.
- **MAX AI assistant** — a floating chat widget that answers questions about
  Abdul's projects, skills and contact details from a bundled
  knowledge base (`client/data/ai.json`). Typing animation, suggested
  questions, conversation search, copy-to-clipboard and clear chat. Works
  with no network access at all.
- **Projects page** — live category filtering, featured badges, expandable
  card details, Source + Live Demo buttons.
- **Contact form** — frontend validation with accessible inline errors; on
  success it opens the visitor's email client with a pre-filled message.
- **Design system** — white background with a pink accent (`#FFB6C1`), fixed
  left navigation on desktop that becomes a drawer on mobile, floating social
  rail, custom block cursor, lightweight particle background, reveal-on-scroll
  animations, and full `prefers-reduced-motion` support.
- **SEO** — canonical URLs, Open Graph + Twitter cards, JSON-LD structured
  data (Person, WebSite, ProfilePage, BreadcrumbList, Organization, ItemList,
  CreativeWork, ContactPoint), `robots.txt`, `sitemap.xml`, PWA
  `manifest.json`, `browserconfig.xml`, preloaded fonts, semantic HTML.
- **Performance & security** — compressed responses, cache headers, CSP /
  other security headers via Helmet, self-hosted fonts and Font Awesome
  (no third-party requests), lazy-loaded images with reserved dimensions.

---

## Tech stack

| Layer      | Technology                                            |
| ---------- | ----------------------------------------------------- |
| Runtime    | Node.js 20+ (built and tested on Node 24)             |
| Server     | TypeScript, Express 5, Helmet 8, compression          |
| Client     | TypeScript (native ESM modules, zero frameworks)      |
| Images     | Sharp (procedurally generated assets)                 |
| Icons      | Font Awesome 7 (self-hosted)                          |
| Fonts      | Inter + Space Grotesk (self-hosted woff2)             |
| Dev tools  | tsx, TypeScript, `npm run smoke` integration tests    |

No database, no authentication, no CMS, no third-party APIs — every piece of
content lives in `client/data/*.json` and is served as-is.

---

## Project structure

```
portfolio/
├── client/
│   ├── data/               # All editable content (JSON)
│   │   ├── settings.json   #   site info, nav, hero, about, skills,
│   │   │                   #   contact, footer, AI widget labels
│   │   ├── projects.json   #   10 projects (image, links, category…)
│   │   └── ai.json         #   MAX AI knowledge base (100+ FAQs)
│   ├── index.html          # SSR template (%%TOKENS%% replaced server-side)
│   ├── public/             # Static assets served at the site root
│   │   ├── assets/         #   generated images (profile, projects, certs…)
│   │   ├── css/            #   fontawesome.min.css (self-hosted)
│   │   ├── fonts/          #   Inter + Space Grotesk woff2
│   │   ├── webfonts/       #   Font Awesome icon fonts
│   │   └── js/             #   compiled client bundle (build output)
│   ├── src/                # Client TypeScript
│   │   ├── main.ts         #   bootstraps everything
│   │   ├── components/     #   cursor, background, nav, projects, AI, form…
│   │   ├── hooks/          #   reveal + scroll-spy
│   │   └── utils/          #   dom helpers, JSON fetching
│   └── styles/             # CSS: base, layout, components, sections,
│                           #       effects, responsive, fonts
├── server/
│   ├── app.ts              # Express app + security + static + routes
│   ├── config/             # env paths + settings/projects/ai loaders
│   ├── controllers/        # page handlers (metadata + JSON-LD)
│   ├── middleware/         # SEO: canonical redirects + cache control
│   ├── routes/             # /, /projects, /contact, 404
│   └── utils/              # HTML escaping, structured data, section renderers
├── scripts/
│   ├── fetch-fonts.mjs     # download self-hosted fonts (rerunnable)
│   ├── generate-assets.mjs # create all images with sharp (rerunnable)
│   ├── smoke.mjs           # integration tests against the built server
│   ├── browser-audit.mjs   # real-Chrome end-to-end audit (puppeteer)
│   ├── test-engine.mjs     # MAX AI question-answering tests
│   └── validate-html.mjs   # JSON-LD + markup audit of all routes
└── package.json
```

---

## Getting started

```bash
npm install                 # install dependencies
npm run dev                 # start in development mode (tsx watch) → http://localhost:3000
```

Production:

```bash
npm run build               # compile server (dist/) + client (client/public/js)
npm start                   # run the production server on PORT (default 3000)
```

Quality gates:

```bash
npm run typecheck           # TypeScript checks (server + client)
npm test                    # build + full smoke test suite
node scripts/validate-html.mjs   # JSON-LD + markup audit
node scripts/test-engine.mjs     # MAX AI answer quality tests
npm run test:browser        # real-Chrome end-to-end audit (36 checks)
```

---

## Editing content

Everything user-facing is plain JSON — no rebuild of logic required:

- `client/data/settings.json` — name, tagline, nav items, social links, hero,
  about cards + statistics + timeline, skills groups, contact details, footer
  and AI widget labels.
- `client/data/projects.json` — project cards. Set `"featured": true` to show
  a project in the home "Featured Projects" section.
- `client/data/ai.json` — MAX AI's knowledge. Each FAQ has `question`,
  `answer` (plain text; lines starting with `• ` render as bullet lists) and
  `keywords` used for matching. `synonyms` expand user queries, `intents`
  provide a category fallback, `suggestions` are the quick-question buttons.

### Colors

Defined once in `client/styles/base.css` under `:root`:

```css
--color-bg: #ffffff;      /* background           */
--color-accent: #ffb6c1;  /* accent (pink)        */
--color-text: #222222;    /* primary text         */
--color-border: #ececec;  /* borders & dividers   */
--color-success: #16a34a; /* success states       */
--color-warning: #f59e0b; /* warning states       */
--color-error: #ef4444;   /* error states         */
```

### Images

The site uses procedurally generated artwork — no binary sources required.
After editing the palette in `scripts/generate-assets.mjs`, run:

```bash
npm run assets
```

This (re)generates the profile picture, all project thumbnails, certificate
covers, the Open Graph image, favicons and the logo into `client/public/`.

### Fonts

```bash
node scripts/fetch-fonts.mjs
```

Downloads Inter and Space Grotesk into `client/public/fonts/` and writes
`client/styles/fonts.css`.

---

## Deployment

Any Node host works:

1. `npm ci`
2. `npm run assets` (once — generate images)
3. `npm run build`
4. `node dist/server/app.js` with `NODE_ENV=production`

Static assets are served by the Express server itself — no CDN setup needed
(though one is easy to add in front). Update `site.domain` in
`client/data/settings.json` before deploying so canonical URLs, sitemaps and
structured data point at your real domain.

---

## Troubleshooting

- **Port already in use** — set `PORT` (e.g. `$env:PORT=8080; npm start`).
- **Missing images after cloning** — run `npm run assets`.
- **Blank icons** — ensure `client/public/css/fontawesome.min.css` and
  `client/public/webfonts/` exist (they ship in the repo).
- **`npm run dev` doesn't reflect data edits** — JSON files are read from
  disk per request; only the template is cached. Restart if you edit
  `client/index.html`.

## License

MIT — see `LICENSE`. Built with TypeScript, Express, Sharp and Font Awesome.
