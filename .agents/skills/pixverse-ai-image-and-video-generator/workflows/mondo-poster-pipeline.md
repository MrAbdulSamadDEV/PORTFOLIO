---
name: pixverse:mondo-poster-pipeline
description: End-to-end Mondo-style poster generation — select artist style, compose prompt, generate, iterate, and download
---

### Pipeline Steps
1. Auth check
2. Credit check
3. Select artist style (from `references/mondo-poster/artist-styles.md`)
4. Select genre template (from `references/mondo-poster/genre-templates.md`)
5. Compose Mondo prompt using the formula
6. Choose model + quality + aspect ratio
7. Generate image
8. Review result, optionally iterate with I2I
9. Download final poster

### Full Example

```bash
# Step 1: Verify authentication
pixverse auth status --json

# Step 2: Check credits
CREDITS=$(pixverse account info --json | jq -r '.credits.total')
if [ "$CREDITS" -lt 1 ]; then echo "Insufficient credits"; exit 1; fi

# Step 3-6: Generate poster (Saul Bass noir style)
RESULT=$(pixverse create image \
  --prompt "Saul Bass style Mondo poster, radical minimalist abstraction, detective silhouette in fedora standing under streetlight, centered single figure composition, bold geometric shapes, 3-color screen print: deep blue, cream, red accent, negative space mastery, vintage 1940s noir aesthetic, halftone texture, limited edition poster art" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 2:3 \
  --json)

IMAGE_ID=$(echo "$RESULT" | jq -r '.image_id')
IMAGE_URL=$(echo "$RESULT" | jq -r '.image_url')

# Step 7: Review — download to inspect
pixverse asset download $IMAGE_ID --json
```

### Iteration with I2I Refinement

If the initial result needs refinement, use I2I to transform it:

```bash
# Use the generated image as input, refine with adjusted prompt
REFINED=$(pixverse create image \
  --prompt "Refine into cleaner Mondo screen print aesthetic, sharpen geometric shapes, increase contrast between blue and cream, maintain Saul Bass minimalism, cleaner halftone texture, more defined silhouette edges" \
  --image "$IMAGE_URL" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --json)

REFINED_ID=$(echo "$REFINED" | jq -r '.image_id')
pixverse asset download $REFINED_ID --json
```

### Batch Style Exploration

Generate multiple variations to explore different approaches:

```bash
# Variation 1: Saul Bass style
pixverse create image \
  --prompt "Saul Bass style Mondo poster, [SUBJECT], minimalist geometric, 3-color: burnt orange, black, cream, vintage 1959 aesthetic" \
  --model gemini-3.1-flash --quality 2160p --aspect-ratio 2:3 --json

# Variation 2: Olly Moss style
pixverse create image \
  --prompt "Olly Moss style Mondo poster, [SUBJECT], clever negative space, hidden imagery, 2-color: teal, cream, ultra-minimal" \
  --model gemini-3.1-flash --quality 2160p --aspect-ratio 2:3 --json

# Variation 3: Kilian Eng style
pixverse create image \
  --prompt "Kilian Eng style Mondo poster, [SUBJECT], geometric futurism, precise line work, 3-color: purple, teal, black, sci-fi" \
  --model gemini-3.1-flash --quality 2160p --aspect-ratio 2:3 --json
```

### Quick Iteration Pattern

For fast prompt testing, use `qwen-image` first, then upgrade:

```bash
# Fast draft
DRAFT=$(pixverse create image \
  --prompt "..." \
  --model qwen-image \
  --quality 1080p \
  --aspect-ratio 2:3 \
  --json)
echo "Draft: $(echo $DRAFT | jq -r '.image_url')"

# Happy with prompt? Re-generate at high quality
FINAL=$(pixverse create image \
  --prompt "..." \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 2:3 \
  --json)
FINAL_ID=$(echo "$FINAL" | jq -r '.image_id')
pixverse asset download $FINAL_ID --json
```

### Related Skills
`pixverse:mondo-poster-design`, `pixverse:create-and-edit-image`, `pixverse:asset-management`, `pixverse:image-editing-pipeline`
