---
name: pixverse:modify-video
description: Edit video content with AI — replace subjects, swap outfits, add accessories, change backgrounds, or transform scenes using a text prompt. Use when the user wants to modify, change, alter, or edit what appears IN a video (not trim/cut/splice). Examples — "replace the cat with a dog", "change her dress to red", "add sunglasses", "swap the background to a beach".
---

# Modify Video

Edit the visual content of an existing video using a text prompt. This is **AI content modification** — replacing subjects, changing appearances, transforming scenes — not traditional video editing (trimming, cutting, splicing, or timeline operations).

Examples of what this skill does:
- Replace a subject: "change the cat to a dog"
- Swap clothing or accessories: "put sunglasses on the character", "change his shirt to a red jacket"
- Transform the scene: "replace the background with a snowy mountain"
- Alter visual style: "make the scene look like a watercolor painting"

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)
- An existing video (by ID or local file path)
- A prompt describing the desired content change

## When to Use

```
Want to change what appears IN a video?
├── Replace/swap subjects?           → pixverse create modify (this skill)
├── Change clothing/accessories?     → pixverse create modify (this skill)
├── Transform background/scene?      → pixverse create modify (this skill)
├── Alter visual style?              → pixverse create modify (this skill)
│
├── Make it longer?                  → pixverse create extend  (see pixverse:post-process-video)
├── Higher resolution?               → pixverse create upscale (see pixverse:post-process-video)
└── Add voice/music?                 → pixverse create voice / create music (see pixverse:create-voice, pixverse:create-music)
```

> **Not for traditional editing:** This skill does not trim, cut, splice, or rearrange video clips. It uses AI to re-generate video content based on a text prompt. For timeline-based editing, use external tools (e.g., ffmpeg).

---

## create modify -- Flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--video <input>` | Video file path, HTTPS URL, video ID, or media path (required) | -- |
| `--prompt <text>` | Prompt describing the modification; bind optional reference images as `@image1`, `@image2`, ... | required |
| `--images <inputs...>` | Optional reference images: file paths, HTTPS URLs, image IDs, or media paths | max 5; prompt labels follow flag order |
| `--keyframe-time <ms>` | Keyframe time in milliseconds | `0` (default, first frame) |
| `-m, --model <model>` | Video model | `v5.5` (only supported model) |
| `-q, --quality <quality>` | Video quality | `360p`, `480p`, `540p`, `720p` (default), `1080p` |
| `--count <number>` | Number of generations | `1` (default), `2`, `3`, `4` |
| `--seed <number>` | Random seed | any integer |
| `--off-peak` | Use off-peak pricing | flag |
| `--idempotency-key <key>` | Stable safe-retry key; repeated submissions return the original task without re-charging | optional |
| `--no-wait` | Return immediately without polling | flag |
| `--timeout <sec>` | Polling timeout | `300` (default) |
| `--json` | JSON output | flag |

### Model constraint

Modify currently supports **v5.5 only**. Other models will fail with a validation error (exit code 6).

---

## How It Works

1. **Resolve video** — The CLI resolves a local file, HTTPS URL, video ID, or media path. For a numeric ID it fetches the video detail (`video_path`, `duration`, `first_frame`); local/remote files are uploaded to PixVerse cloud storage.
2. **Extract keyframe** — The CLI calls `POST /video/frame/at_time` to extract the frame at `--keyframe-time`. This frame becomes the visual anchor for the modification.
3. **Resolve references** — Optional `--images` inputs are resolved in order and bound to prompt labels `@image1`, `@image2`, and so on.
4. **Submit modify** — The prompt, keyframe, reference images, and video metadata are sent to the modify endpoint.
5. **Poll** — Unless `--no-wait` is set, the CLI polls until the new video is ready.

---

## Steps

1. Identify the source video — a file path, HTTPS URL, video ID, or media path.
2. Decide which moment to modify. Set `--keyframe-time` in milliseconds (default `0` = first frame).
3. Optionally provide up to 5 visual references with `--images`, then mention them in the prompt as `@image1`, `@image2`, etc.
4. Write a prompt describing the desired modification.
5. Run the command:
   ```bash
   pixverse create modify --video <id-or-path> --prompt "..." --json
   ```
6. Parse `video_id` from the JSON output.
7. If `--no-wait` was used, poll with `pixverse task wait <video_id> --json`.
8. Download the result with `pixverse asset download <video_id> --json`.

---

## JSON Output

### With --no-wait (submitted)

```json
{
  "video_id": 123456,
  "trace_id": "abc-123",
  "status": "submitted"
}
```

When `--count > 1`:

```json
{
  "video_ids": [123456, 123457, 123458, 123459],
  "trace_id": "abc-123",
  "status": "submitted"
}
```

### With wait (completed)

```json
{
  "video_id": 123456,
  "trace_id": "abc-123",
  "status": "completed",
  "video_url": "https://...",
  "cover_url": "https://...",
  "prompt": "Turn the sky into a dramatic sunset",
  "model": "v5.5",
  "duration": 5,
  "width": 1280,
  "height": 720,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

## Examples

### Modify at first frame (default)

```bash
pixverse create modify \
  --video 123456 \
  --prompt "Change the background to a snowy mountain landscape" \
  --json
```

### Modify at a specific keyframe

```bash
pixverse create modify \
  --video 123456 \
  --prompt "Add fireworks exploding in the sky" \
  --keyframe-time 3000 \
  --json
```

### Modify a local video file

```bash
pixverse create modify \
  --video ./my-video.mp4 \
  --prompt "Transform the scene into a cyberpunk style" \
  --json
```

### Modify using reference images

```bash
pixverse create modify \
  --video 123456 \
  --images ./red-jacket.jpg ./city-at-night.jpg \
  --prompt "Replace the character's outfit with @image1 and use @image2 as the background" \
  --json
```

### Modify + upscale pipeline

```bash
# Modify the video
MODIFIED=$(pixverse create modify \
  --video 123456 \
  --prompt "Add rain and dramatic lighting" \
  --json | jq -r '.video_id')

# Upscale the result
UPSCALED=$(pixverse create upscale --video $MODIFIED --quality 2160p --json | jq -r '.video_id')

# Download
pixverse asset download $UPSCALED --json
```

### Batch modify with multiple variations

```bash
VIDEO_IDS=$(pixverse create modify \
  --video 123456 \
  --prompt "Make the scene look like a painting" \
  --count 4 --no-wait --json | jq '.video_ids[]')

for id in $VIDEO_IDS; do
  pixverse task wait "$id" --json
done
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
| 6 | Validation error | Review flag values — modify only supports model `v5.5` |
| 7 | Concurrent generation limit | Wait for a slot, then retry with the same `--idempotency-key` |

---

## Related Skills

- `pixverse:create-video` -- create new videos from text or images
- `pixverse:post-process-video` -- extend, upscale, or add audio to existing videos
- `pixverse:task-management` -- poll and manage tasks after using `--no-wait`
- `pixverse:asset-management` -- download, list, and delete completed videos
