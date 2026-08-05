/**
 * Downloads Inter + Space Grotesk woff2 fonts (latin subset) from Google Fonts
 * into client/public/fonts/ and regenerates client/styles/fonts.css with
 * self-hosted @font-face rules. Run: node scripts/fetch-fonts.mjs
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const fontsDir = path.join(root, "client", "public", "fonts");
const cssPath = path.join(root, "client", "styles", "fonts.css");

const CSS_URL =
  "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap";
const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function download(url) {
  const response = await fetch(url, { headers: { "user-agent": UA } });
  if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
  return Buffer.from(await response.arrayBuffer());
}

const familyNames = { Inter: "Inter", "Space Grotesk": "Space Grotesk" };

function parseFontFaces(css) {
  const blocks = [];
  const regex = /@font-face\s*{([^}]+)}/g;
  let match;
  while ((match = regex.exec(css)) !== null) {
    const body = match[1];
    const family = /font-family:\s*'([^']+)'/.exec(body)?.[1];
    const weight = /font-weight:\s*(\d+)/.exec(body)?.[1];
    const urlMatch = /url\((https:[^)]+\.woff2)\)/.exec(body);
    const unicodeRange = /unicode-range:\s*([^;]+)/.exec(body)?.[1];
    if (family && weight && urlMatch && unicodeRange?.startsWith("U+0000-00FF")) {
      blocks.push({ family, weight, url: urlMatch[1] });
    }
  }
  return blocks;
}

async function main() {
  if (!existsSync(fontsDir)) mkdirSync(fontsDir, { recursive: true });

  console.log("[fonts] fetching Google Fonts CSS...");
  const css = (await download(CSS_URL)).toString("utf8");
  const faces = parseFontFaces(css);
  if (faces.length === 0) throw new Error("No latin font faces parsed from Google Fonts CSS");

  const rules = [];
  for (const face of faces) {
    const slug = face.family.replace(/\s+/g, "-").toLowerCase();
    const fileName = `${slug}-latin-${face.weight}.woff2`;
    const filePath = path.join(fontsDir, fileName);
    if (!existsSync(filePath)) {
      console.log(`[fonts] downloading ${fileName}`);
      writeFileSync(filePath, await download(face.url));
    } else {
      console.log(`[fonts] exists, skipping ${fileName}`);
    }
    rules.push(
      [
        "@font-face {",
        `  font-family: "${familyNames[face.family] ?? face.family}";`,
        `  font-style: normal;`,
        `  font-weight: ${face.weight};`,
        `  font-display: swap;`,
        `  src: url("/fonts/${fileName}") format("woff2");`,
        "}",
      ].join("\n"),
    );
  }

  const fontCss = rules.join("\n\n") + "\n";
  writeFileSync(cssPath, fontCss, "utf8");
  console.log(`[fonts] wrote ${cssPath} (${faces.length} faces)`);
}

main().catch((error) => {
  console.error("[fonts] failed:", error.message);
  process.exit(1);
});
