---
name: pixverse:template
description: Browse and apply PixVerse effect templates — including viral AI effects like AI Hug, AI Kiss, and more — to create videos or images from your photos
---

# Template

Discover and use PixVerse effect templates to create videos or images. Templates are pre-configured effects that take your image (or video) as input and apply a specific transformation.

## Decision Tree

```
Want to use templates?
├── Discover templates?
│   ├── Browse by category? → pixverse template list --category <id> --json
│   ├── Search by keyword?  → pixverse template search "keyword" --json
│   └── Get categories?     → pixverse template categories --json
├── Inspect a template?     → pixverse template info <id> --json
└── Create from template?   → pixverse create template --template-id <id> [--image ...] --json
```

---

## Browsing Templates

### template categories

List all template categories.

```bash
pixverse template categories --json
```

JSON output:
```json
{
  "categories": [
    { "id": 1, "category_name": "Trending" },
    { "id": 2, "category_name": "Portrait" }
  ]
}
```

---

### template list

Browse templates with optional category filter.

| Flag | Description | Values |
|:---|:---|:---|
| `--category <id>` | Filter by category ID | from `template categories` |
| `--limit <n>` | Items per page | default `20` |
| `--page <n>` | Page number | default `1` |
| `--json` | JSON output | flag |

```bash
pixverse template list --json
pixverse template list --category 1 --limit 10 --json
```

JSON output:
```json
{
  "items": [...],
  "total": 120,
  "page": 1,
  "limit": 20
}
```

Each item includes: `template_id`, `display_name`, `template_type` (1=video, 2=image), `effect_type`, `supported_features`.

---

### template search

Search templates by keyword.

```bash
pixverse template search "dancing" --json
```

JSON output:
```json
{
  "items": [...],
  "total": 5
}
```

---

### template info \<id\>

Get full details of a specific template.

| Field | Description |
|:---|:---|
| `template_id` | Template ID |
| `display_name` | Template name |
| `template_type` | `1` = video output, `2` = image output |
| `effect_type` | Input requirement (see below) |
| `supported_features` | `1000` = also accepts video input |
| `duration` | Default duration in seconds |
| `display_prompt` | Default prompt text |
| `template_model` | Underlying model |
| `template_paid` | Whether template requires paid tier |
| `video_base_cost` | Base credit cost |
| `web_thumbnail_video_url` | Sample preview URL |

```bash
pixverse template info 12345 --json
```

---

## Understanding `effect_type`

`effect_type` determines what input the template requires:

| `effect_type` | Input required |
|:---|:---|
| `0` | No image/video — text only |
| `1` | 1 image (or 1 video if `supported_features == 1000`) |
| `N > 1` | Exactly N images |

---

## create template -- Flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--template-id <id>` | Template ID (required) | from `template list` / `template search` |
| `--image <paths...>` | Image path(s) or URL(s) | required if `effect_type >= 1` |
| `--video <pathOrId>` | Video file path or video ID | alternative to `--image` if template supports it |
| `-q, --quality <q>` | Output quality | `720p` (default), model-dependent |
| `-d, --duration <sec>` | Duration | from template default, or override |
| `--aspect-ratio <ratio>` | Aspect ratio | optional override |
| `--prompt <text>` | Prompt override | optional — uses template default if omitted |
| `--seed <number>` | Random seed | any integer; image templates generate one automatically when omitted |
| `--count <number>` | Number of generations | `1`–`4` |
| `--off-peak` | Off-peak pricing | flag |
| `--idempotency-key <key>` | Stable safe-retry key; repeated submissions return the original task without re-charging | optional |
| `--no-wait` | Return immediately without polling | flag |
| `--timeout <sec>` | Polling timeout | `300` (default) |
| `--json` | JSON output | flag |

> **Note:** `--image` and `--video` are mutually exclusive.

For image templates, CLI v1.2.13 and later supplies a random seed when `--seed` is omitted. This prevents the backend `invalid param` failure while preserving explicit seeds for reproducible output. Video-template seed behavior is unchanged.

---

## JSON Output

### Video template (submitted)

```json
{ "video_id": 123456, "trace_id": "...", "status": "submitted" }
```

### Video template (completed)

```json
{
  "video_id": 123456,
  "trace_id": "...",
  "status": "completed",
  "video_url": "https://...",
  "cover_url": "https://...",
  "prompt": "...",
  "model": "v5.5",
  "duration": 5,
  "width": 1280,
  "height": 720,
  "created_at": "2026-01-01T00:00:00Z"
}
```

### Image template (completed)

```json
{
  "image_id": 789012,
  "trace_id": "...",
  "status": "completed",
  "image_url": "https://...",
  "model": "v5.5",
  "width": 1024,
  "height": 1024,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

## Steps: Create from Template

1. Find a template ID:
   ```bash
   pixverse template list --json | jq '.items[] | {id: .template_id, name: .display_name}'
   ```
2. Check what input the template needs:
   ```bash
   pixverse template info 12345 --json | jq '{effect_type, supported_features, template_type}'
   ```
3. Run the template:
   - Text-only (`effect_type == 0`):
     ```bash
     pixverse create template --template-id 12345 --json
     ```
   - 1 image (`effect_type == 1`):
     ```bash
     pixverse create template --template-id 12345 --image ./photo.jpg --json
     ```
   - Multi-image (`effect_type == N`):
     ```bash
     pixverse create template --template-id 12345 --image ./img1.jpg ./img2.jpg --json
     ```
   - Video input (only if `supported_features == 1000`):
     ```bash
     pixverse create template --template-id 12345 --video 987654 --json
     ```
4. Parse the output ID (`video_id` or `image_id`) and download if needed:
   ```bash
   pixverse asset download <id> --json
   ```

---

## Examples

Search and use a template in one pipeline:

```bash
# Find a template
TEMPLATE=$(pixverse template search "zoom in" --json | jq '.items[0].template_id')

# Check its type
INFO=$(pixverse template info $TEMPLATE --json)
EFFECT_TYPE=$(echo $INFO | jq '.effect_type')

# Create (assuming effect_type == 1)
RESULT=$(pixverse create template --template-id $TEMPLATE --image ./photo.jpg --json)
VIDEO_ID=$(echo $RESULT | jq -r '.video_id')

# Download
pixverse asset download $VIDEO_ID --json
```

No-wait pattern:

```bash
RESULT=$(pixverse create template --template-id 12345 --image ./face.jpg --no-wait --json)
ID=$(echo $RESULT | jq -r '.video_id')
pixverse task wait $ID --json
pixverse asset download $ID --json
```

---

## Error Handling

| Exit Code | Meaning | Recovery |
|:---|:---|:---|
| 0 | Success | -- |
| 2 | Timeout | Increase `--timeout` or use `--no-wait` then `pixverse task wait` |
| 3 | Auth expired | Re-run `pixverse auth login --json` |
| 4 | Insufficient credits | Check `pixverse account info --json` |
| 5 | Generation failed | Check image quality, try different template |
| 6 | Validation error | Wrong number of images for `effect_type`, or image/video conflict |
| 7 | Concurrent generation limit | Wait for a slot, then retry with the same `--idempotency-key` |

---

## Related Skills

- `pixverse:task-management` — poll and wait for template tasks
- `pixverse:asset-management` — download completed outputs
- `pixverse:create-video` — create videos without templates
