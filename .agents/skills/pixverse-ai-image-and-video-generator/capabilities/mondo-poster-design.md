---
name: pixverse:mondo-poster-design
description: Generate Mondo-style posters, book covers, and album covers using PixVerse CLI — 37 artist styles, genre templates, composition patterns, and prompt engineering for gallery-quality design output
---

# Mondo Poster Design

Generate AI posters, book covers, album art, and event designs in Mondo's distinctive alternative aesthetic — limited-edition screen-printed art with bold colors, minimalist compositions, and symbolic storytelling. Powered by PixVerse CLI image generation.

> **Credit:** This skill is based on [qiaomu-mondo-poster-design](https://github.com/joeseesun/qiaomu-mondo-poster-design) by [@vista8](https://x.com/vista8). The original prompt engineering, artist style library, composition patterns, and genre templates are his work. This adaptation replaces the image generation backend with PixVerse CLI and adds video animation capabilities.

This skill provides:
- Structured prompt engineering using 37 legendary artist styles
- Genre-specific templates for film, book, and music covers
- Composition pattern guidance (negative space, silhouette, geometric framing)
- Direct image generation via `pixverse create image`
- Optional animation of posters into cinematic videos (unique PixVerse capability)

## Decision Tree

```
Want a Mondo-style design?
├── Movie / event poster?
│   ├── Know the genre?     → Pick genre template from genre-templates.md
│   └── Know the artist?    → Pick artist style from artist-styles.md
├── Book cover?             → See genre-templates.md (Book Cover section)
├── Album cover?            → See genre-templates.md (Album Cover section)
├── From text only?         → T2I: pixverse create image --prompt "..." --json
├── Transform existing art? → I2I: pixverse create image --prompt "..." --image <path> --json
└── Animate a poster?       → See pixverse:mondo-poster-to-video-pipeline
```

---

## Mondo Prompt Formula

Every Mondo-style prompt follows this structure:

```
[ARTIST STYLE] + [SUBJECT/SCENE] + [COMPOSITION PATTERN] + [COLOR PALETTE] +
[TEXTURE/MEDIUM] + [POSTER FORMAT CUES]
```

### Building Blocks

**1. Artist Style** (pick from `references/mondo-poster/artist-styles.md`):
- Use the artist's prompt modifiers directly
- Example: `Saul Bass style Mondo poster, radical minimalist abstraction, bold geometric shapes`

**2. Subject/Scene:**
- Describe the conceptual essence, not a literal scene
- Focus on symbolic elements: key props, silhouettes, iconic objects
- Example: `detective silhouette in fedora` NOT `Sam Spade standing in his office`

**3. Composition Pattern** (pick from `references/mondo-poster/composition-patterns.md`):
- Choose 1-2 patterns: centered symmetry, negative space, geometric framing, etc.
- Example: `centered symmetrical composition, single focal point`

**4. Color Palette** (specify exactly):
- Limited: `3-color screen print: burnt orange, black, cream`
- Duotone: `deep blue and gold duotone`
- Vintage: `70s palette: burnt orange, mustard yellow, brown`

**5. Texture/Medium** (adds authenticity):
- `screen print aesthetic, halftone dot texture`
- `risograph printing effect, paper texture grain`
- `slight misalignment between color layers, vintage print imperfections`

**6. Poster Format:**
- `limited edition poster art, vintage [decade] movie poster`
- `minimalist design, Mondo alternative poster`

### Assembled Example

```
Saul Bass style Mondo poster, radical minimalist abstraction,
detective silhouette in fedora, centered single figure composition,
3-color screen print: deep blue, cream, red accent,
clean minimalist design, halftone texture,
vintage 1940s noir aesthetic, limited edition poster art
```

---

## Model Selection Guide

| Use Case | Model | `--model` value | Max Quality | Why |
|:---|:---|:---|:---|:---|
| **Best for posters** (default) | Gemini 3.1 Flash | `gemini-3.1-flash` | `2160p` | Widest resolution range, best detail for line work and textures |
| Painterly / illustrated | Seedream 5.0 Lite | `seedream-5.0-lite` | `2160p` | Strong at artistic and illustrated styles |
| High-res photorealistic | Seedream 4.5 | `seedream-4.5` | `2160p` | Best photorealistic rendering |
| Creative / experimental | Gemini 3.0 | `gemini-3.0` | `2160p` | Good creative interpretation |
| Fast drafts / iteration | Qwen Image | `qwen-image` | `1080p` | Fastest, good for prompt testing |

> **Recommendation:** Use `gemini-3.1-flash --quality 2160p` for final poster output. Use `qwen-image` for rapid prompt iteration, then re-generate with the high-quality model.

---

## Poster Format → Aspect Ratio

| Format | Real-World Size | `--aspect-ratio` | Notes |
|:---|:---|:---|:---|
| Standard movie poster | 27x40" (~2:3) | `2:3` | Most common Mondo format |
| Tall art print | 12x36" | `9:16` | Narrow vertical poster |
| Landscape banner | 36x24" | `16:9` | Horizontal display |
| Panoramic / ultrawide | Cinema banner | `21:9` | Widescreen format |
| Album cover (vinyl/CD) | 12x12" / 5x5" | `1:1` | Square format |
| Book cover | 6x9" (~2:3) | `2:3` | Standard book dimensions |
| Social media cover | Varies | `16:9` / `4:3` | Platform-dependent |
| Instagram / Xiaohongshu | Square or 4:5 | `1:1` / `4:5` | Social post formats |

---

## Examples

### Basic Mondo Poster

```bash
pixverse create image \
  --prompt "Saul Bass style Mondo poster, detective silhouette in fedora, centered single figure, 3-color screen print: deep blue, cream, red accent, minimalist composition, halftone texture, vintage 1940s noir aesthetic, limited edition poster art" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 2:3 \
  --json
```

### Sci-Fi Poster with Specific Artist

```bash
pixverse create image \
  --prompt "Kilian Eng style Mondo poster, geometric futuristic cityscape, precise technical line work, isometric perspective, cool teal and purple palette, 3-color screen print, atmospheric neon-lit depth, retro 1970s sci-fi aesthetic, limited edition poster art" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 2:3 \
  --json
```

### Horror Book Cover

```bash
pixverse create image \
  --prompt "Martin Ansin style Mondo poster, Victorian mansion single lit window, centered Gothic silhouette, Art Deco elegant lines, 3-color screen print: black, burgundy, cream, atmospheric dread, vintage 1970s horror aesthetic, book cover design" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 2:3 \
  --json
```

### Jazz Album Cover

```bash
pixverse create image \
  --prompt "Reid Miles Blue Note Records style, saxophone player silhouette, bold asymmetric Helvetica typography, high contrast 3-color screen print: black, cream, cobalt blue, jazz album cover aesthetic, halftone texture, 1960s graphic design" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 1:1 \
  --json
```

### I2I Style Transfer (Transform Existing Art)

```bash
pixverse create image \
  --prompt "Transform into Mondo screen print aesthetic, Olly Moss minimalist style, reduce to 3-color palette: burnt orange, black, cream, negative space storytelling, halftone texture, vintage poster art" \
  --image ./original-poster.jpg \
  --model gemini-3.1-flash \
  --quality 2160p \
  --json
```

### Chinese National Trend Style Poster

```bash
pixverse create image \
  --prompt "Chinese national trend style Mondo poster, traditional Chinese dragon motif reimagined modern, bold red gold black palette, heritage meets contemporary design, 3-color screen print, limited edition poster art" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 2:3 \
  --json
```

### Batch Variations

```bash
# Generate 4 variations with different seeds
pixverse create image \
  --prompt "Olly Moss style Mondo poster, astronaut helmet visor reflecting alien planet, centered circular composition, 3-color screen print: orange, teal, black, negative space storytelling, retro 1970s sci-fi" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 2:3 \
  --count 4 \
  --json
```

### Full Pipeline with Download

```bash
# Generate and download
RESULT=$(pixverse create image \
  --prompt "Jay Ryan style Mondo poster, single acoustic guitar silhouette, bold simple shapes, textured hand-printed background, folksy handmade aesthetic, warm limited palette: amber, forest green, cream, indie music poster" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 2:3 \
  --json)

IMAGE_ID=$(echo "$RESULT" | jq -r '.image_id')
pixverse asset download $IMAGE_ID --json
```

---

## Reference Files

| File | Content | Use When |
|:---|:---|:---|
| `references/mondo-poster/artist-styles.md` | 37 artist styles with prompt keywords | Selecting an artistic style for your poster |
| `references/mondo-poster/composition-patterns.md` | 8 composition techniques | Deciding layout and visual structure |
| `references/mondo-poster/genre-templates.md` | Genre-specific prompt templates + book/album covers | Creating genre-appropriate designs |

---

## Tips for Best Results

**Do:**
- Specify exact color names and counts ("3-color: burnt orange, cream, navy")
- Use geometric composition terms (centered, symmetrical, negative space)
- Reference specific decades for vintage accuracy (60s/70s/80s)
- Emphasize symbolic over literal elements (silhouettes > detailed faces)
- Include texture keywords (screen print, halftone, risograph, paper grain)
- Start with `qwen-image` for fast iteration, then re-generate at `2160p` with `gemini-3.1-flash`

**Don't:**
- Use photorealistic or digital gradient terms
- Request complex facial details (use silhouettes instead)
- Mix too many artist styles (keep it focused)
- Forget the vintage era context (60s-80s is key)
- Overlook negative space opportunities
- Exceed 3-4 colors for authentic screen-print feel

---

## Error Handling

| Exit Code | Meaning | Recovery |
|:---|:---|:---|
| 0 | Success | — |
| 2 | Timeout | Increase `--timeout` or use `--no-wait` then `pixverse task wait` |
| 3 | Auth expired | Re-run `pixverse auth login --json` |
| 4 | Insufficient credits | Check `pixverse account info --json` |
| 5 | Generation failed | Check prompt for policy violations, try different parameters |
| 6 | Validation error | Verify model/quality/aspect-ratio combination (see Model Selection Guide) |
| 7 | Concurrent generation limit | Wait for a slot, then retry with the same `--idempotency-key` |

---

## Related Skills

- `pixverse:mondo-poster-pipeline` — end-to-end poster generation workflow
- `pixverse:mondo-poster-to-video-pipeline` — animate poster into cinematic video
- `pixverse:create-and-edit-image` — underlying image creation capability (full flag reference)
- `pixverse:asset-management` — download, list, and manage generated posters
- `pixverse:image-editing-pipeline` — iterative I2I refinement workflow
