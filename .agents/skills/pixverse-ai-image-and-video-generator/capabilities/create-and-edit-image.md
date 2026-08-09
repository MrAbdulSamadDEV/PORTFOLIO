---
name: pixverse:create-and-edit-image
description: Create images from text (T2I) or edit existing images (I2I) using AI
---

# Create and Edit Image

Generate images from text prompts (T2I) or transform existing images (I2I) using PixVerse CLI.

## Decision Tree

```
Want an image?
|-- From text only?           -> T2I: pixverse create image --prompt "..." --json
|-- Edit with single image?   -> I2I: pixverse create image --prompt "..." --image <path> --json
+-- Edit with multiple images? -> I2I: pixverse create image --prompt "..." --images <p1> <p2> --json
```

---

## Flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--prompt <text>` | Prompt text (required) | -- |
| `--image <input>` | Single image input (enables I2I): local file path, HTTPS URL, image ID, or media path | local files auto-upload; pass an image ID or media path to skip upload |
| `--images <inputs...>` | Multiple image inputs (enables I2I): file paths, HTTPS URLs, image IDs, or media paths | -- |
| `-m, --model <model>` | Image model | `gpt-image-2.0` (default), `gemini-3.1-flash`, `gemini-3.1-flash-lite`, `qwen-image`, `gemini-3.0`, `gemini-2.5-flash`, `seedream-5.0-pro`, `seedream-5.0-lite`, `seedream-4.5`, `seedream-4.0`, `kling-image-o3`, `kling-image-v3` |
| `-q, --quality <q>` | Image quality | `512p`, `720p`, `1080p` (default), `1440p`, `1800p`, `2160p` (availability varies by model — see table below) |
| `--aspect-ratio <ratio>` | Aspect ratio | `1:1` (default), `16:9`, `9:16`, `4:3`, `3:4`, `3:2`, `2:3`, `5:4`, `4:5`, `2:1`, `1:2`, `21:9`, `auto` (availability varies by model) |
| `--detail-level <level>` | Optional rendering detail for **`gpt-image-2.0` only** | `low` (default when omitted), `medium`, `high`. Passing this with any other model fails with exit code 6 (validation). |
| `--count <number>` | Number of generations | `1` (default), `2`, `3`, `4` |
| `--seed <number>` | Random seed | any integer |
| `--idempotency-key <key>` | Stable safe-retry key; repeated submissions return the original task without re-charging | optional |
| `--no-wait` | Return immediately without polling | flag |
| `--timeout <sec>` | Polling timeout | `300` (default) |
| `--json` | JSON output | flag |

### Model Reference

Each model has its own supported parameter combinations. **Always check this table before selecting flags.**

| Model | `--model` value | Resolution | Aspect Ratio | Max I2I refs |
|:---|:---|:---|:---|---:|
| GPT Image 2 | `gpt-image-2.0` (default) | `1080p` `1440p` `2160p` | `1:1` `16:9` `9:16` `4:3` `3:4` `3:2` `2:3` `2:1` `1:2` `21:9` | 9 |
| Qwen Image | `qwen-image` | `720p` `1080p` | `1:1` `16:9` `9:16` `4:3` `3:4` `5:4` `4:5` `3:2` `2:3` `21:9` | 3 |
| Seedream 5.0 Pro | `seedream-5.0-pro` | `1080p` `1440p` | `auto` `1:1` `16:9` `9:16` `4:3` `3:4` `5:4` `4:5` `3:2` `2:3` `21:9` | 10 |
| Seedream 5.0 Lite | `seedream-5.0-lite` | `1440p` `1800p` `2160p` | `auto` `1:1` `16:9` `9:16` `4:3` `3:4` `5:4` `4:5` `3:2` `2:3` `21:9` | 6 |
| Seedream 4.5 | `seedream-4.5` | `1440p` `2160p` | `auto` `1:1` `16:9` `9:16` `4:3` `3:4` `5:4` `4:5` `3:2` `2:3` `21:9` | 6 |
| Seedream 4.0 | `seedream-4.0` | `1080p` `1440p` `2160p` | `auto` `1:1` `16:9` `9:16` `4:3` `3:4` `5:4` `4:5` `3:2` `2:3` `21:9` | 6 |
| Gemini 2.5 Flash (aka Nanobanana) | `gemini-2.5-flash` | `1080p` | `auto` `1:1` `16:9` `9:16` `4:3` `3:4` `5:4` `4:5` `3:2` `2:3` `21:9` | 3 |
| Gemini 3.0 (aka Nano Banana Pro) | `gemini-3.0` | `1080p` `1440p` `2160p` | `auto` `1:1` `16:9` `9:16` `4:3` `3:4` `5:4` `4:5` `3:2` `2:3` `21:9` | 9 |
| Gemini 3.1 Flash (aka Nano Banana 2) | `gemini-3.1-flash` | `512p` `1080p` `1440p` `2160p` | `auto` `1:1` `16:9` `9:16` `4:3` `3:4` `5:4` `4:5` `3:2` `2:3` `21:9` | 9 |
| Gemini 3.1 Flash Lite (aka Nano Banana 2 Lite) | `gemini-3.1-flash-lite` | `1080p` | `auto` `1:1` `3:2` `2:3` `3:4` `4:3` `4:5` `5:4` `9:16` `16:9` `21:9` | 14 |
| Kling Image O3 | `kling-image-o3` | `1080p` `1440p` `2160p` | `16:9` `9:16` `1:1` `4:3` `3:4` `3:2` `2:3` `21:9` | 10 |
| Kling Image V3 | `kling-image-v3` | `1080p` `1440p` | `16:9` `9:16` `1:1` `4:3` `3:4` `3:2` `2:3` `21:9` | 1 |

> **Recommended:** The default is `gpt-image-2.0` (up to `2160p`; `--detail-level` defaults to `low`). For the widest resolution/aspect-ratio range prefer `gemini-3.1-flash` (up to `2160p`) or `seedream-5.0-lite` (up to `2160p`). Use `seedream-5.0-pro` when you need up to 10 I2I references at `1080p` / `1440p`, and `qwen-image` when you want a fast, lighter model (capped at `1080p`).

> **Important:** Each model only accepts specific quality and aspect-ratio values. The CLI adjusts unsupported values to a model-valid fallback and writes a warning to stderr; choose from the table to avoid silent parameter changes.

> **Kling image models:** `kling-image-o3` supports up to 10 reference images for I2I; `kling-image-v3` supports only 1 reference image. Neither supports `auto` aspect ratio or the `5:4`/`4:5` ratios.

> **Gemini 3.1 Flash Lite** (`gemini-3.1-flash-lite`, aka Nano Banana 2 Lite): Fixed at `1080p`; widest reference-image cap of any image model — up to 14 for I2I. Added in CLI v1.2.7.

> **GPT Image 2 (`gpt-image-2.0`):** `--detail-level` is optional (`low` / `medium` / `high`) and defaults to `low`. Like every create command, output `--count` is limited to 1–4; the model's separate I2I input-reference limit is 9.

---

## JSON Output

### Submitted (--no-wait)

```json
{
  "image_id": 789012,
  "trace_id": "def-456",
  "status": "submitted",
  "cost_credits": 20
}
```

When `--count > 1`:

```json
{
  "image_ids": [789012, 789013, 789014, 789015],
  "trace_id": "def-456",
  "status": "submitted",
  "cost_credits": 80
}
```

> `cost_credits` is present **only when the API returns a positive integer**; omit-handling code should treat it as optional. `trace_id` is auto-injected on every `--json` object payload (success on stdout, errors on stderr). See master `SKILL.md → Output Contract → Universal JSON fields`.

### Completed

```json
{
  "image_id": 789012,
  "trace_id": "def-456",
  "status": "completed",
  "image_url": "https://...",
  "prompt": "A beautiful landscape",
  "model": "qwen-image",
  "width": 1024,
  "height": 1024,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

## Steps for T2I

1. Compose your prompt describing the desired image.
2. Choose a model — prefer `gemini-3.1-flash` (up to `2160p`) or `seedream-5.0-lite` (up to `2160p`) for higher quality; fall back to `qwen-image` for speed.
3. Set quality to the model's highest supported value for best results (see Model Reference table), then choose aspect ratio.
4. Optionally set: `--seed`, `--count`.
5. Run the command:
   ```bash
   pixverse create image --prompt "A serene lake at dawn" --json
   ```
6. Parse `image_id` from JSON output:
   ```bash
   pixverse create image --prompt "A serene lake at dawn" --json | jq '.image_id'
   ```
7. If `--no-wait` was used, poll later with `pixverse task wait <image_id> --type image --json`.
8. If wait completed, result includes `image_url`.

## Steps for I2I (Single Image)

1. Provide a source image with `--image <local-path-or-url>`.
2. Write a prompt describing how to transform the image.
3. Local files are auto-uploaded to PixVerse cloud storage (OSS) by the CLI. **Do not pass files containing sensitive, private, or confidential content.**
4. URLs are passed directly to the API.
5. Alternatively, pass an already-uploaded asset's **image ID** or **media path** directly to `--image` to skip the upload step.
6. Run the command:
   ```bash
   pixverse create image --prompt "Make it look like watercolor" --image ./photo.jpg --json
   ```

## Steps for I2I (Multiple Images)

1. Provide multiple source images with `--images <path1> <path2> ...`.
2. Write a prompt describing how to combine or transform the images.
3. Run the command:
   ```bash
   pixverse create image --prompt "Combine these into one scene" --images ./img1.jpg ./img2.jpg --json
   ```

---

## Examples

### T2I basic (recommended: high-quality model)

```bash
pixverse create image --prompt "A serene lake at dawn with mist rising" --model gemini-3.1-flash --quality 2160p --json
```

### T2I with full options

```bash
pixverse create image \
  --prompt "A photorealistic portrait of a medieval knight in golden armor" \
  --model seedream-5.0-lite \
  --quality 1800p \
  --aspect-ratio 16:9 \
  --json
```

### I2I with single image

```bash
pixverse create image \
  --prompt "Transform into a watercolor painting style" \
  --image ./photo.jpg \
  --json
```

### I2I with multiple images

```bash
pixverse create image \
  --prompt "Combine these characters into a single scene in a garden" \
  --images ./img1.jpg ./img2.jpg \
  --json
```

### Batch generation

```bash
pixverse create image --prompt "A cyberpunk cityscape" --count 4 --json
```

### GPT Image 2 with explicit detail level

```bash
pixverse create image \
  --prompt "A cinematic portrait with dramatic lighting" \
  --model gpt-image-2.0 \
  --quality 1440p \
  --aspect-ratio 16:9 \
  --detail-level high \
  --json
```

### Parse output and use in pipeline

```bash
# Generate an image, then use it for I2V
IMAGE_RESULT=$(pixverse create image --prompt "A beautiful sunset landscape" --json)
IMAGE_URL=$(echo "$IMAGE_RESULT" | jq -r '.image_url')

pixverse create video \
  --prompt "Animate this sunset with gentle clouds moving" \
  --image "$IMAGE_URL" \
  --json
```

### No-wait with later polling

```bash
RESULT=$(pixverse create image --prompt "A forest path" --no-wait --json)
IMAGE_ID=$(echo "$RESULT" | jq '.image_id')
# ... do other work ...
pixverse task wait "$IMAGE_ID" --type image --json
```

---

## Error Handling

| Exit Code | Meaning | Recovery |
|:---|:---|:---|
| 0 | Success | -- |
| 2 | Timeout waiting for completion | Increase `--timeout` or use `--no-wait` then poll with `pixverse task wait` |
| 3 | Auth token expired or invalid | Re-run `pixverse auth login` to refresh credentials |
| 4 | Insufficient credits | Check balance with `pixverse account info --json`, then top up |
| 5 | Generation failed | Check prompt for policy violations, try different parameters |
| 6 | Validation error | Review flag values against the tables above |
| 7 | Concurrent generation limit | Wait for a slot, then retry with the same `--idempotency-key` |

Example error handling in a script:

```bash
result=$(pixverse create image --prompt "A landscape" --json 2>/dev/null)
exit_code=$?
if [ $exit_code -eq 3 ]; then
  pixverse auth login
  result=$(pixverse create image --prompt "A landscape" --json 2>/dev/null)
elif [ $exit_code -eq 4 ]; then
  echo "Out of credits" >&2
  pixverse account info --json | jq '.credits'
  exit 1
elif [ $exit_code -ne 0 ]; then
  echo "Failed with exit code $exit_code" >&2
  exit $exit_code
fi
image_url=$(echo "$result" | jq -r '.image_url')
```

---

## Related Skills

- `pixverse:task-management` -- poll and manage tasks after using `--no-wait`
- `pixverse:asset-management` -- download, list, and delete completed images
- `pixverse:create-video` -- use generated images as input for I2V video creation
