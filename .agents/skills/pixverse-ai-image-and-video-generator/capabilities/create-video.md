---
name: pixverse:create-video
description: Create AI videos from text prompts (T2V), from images (I2V), or with character references (fusion)
---

# Create Video

Generate AI videos using PixVerse CLI. Supports text-to-video (T2V), image-to-video (I2V), and character-reference fusion.

## Decision Tree

```
Want to create a video?
|-- From text only?            -> T2V:    pixverse create video --prompt "..." --json
|-- From an image?             -> I2V:    pixverse create video --prompt "..." --image <path> --json
+-- With character references? -> Fusion: pixverse create reference --images <img1> [img2...] --prompt "..." --json
```

---

## create video -- Flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--prompt <text>` | Prompt text (required) | -- |
| `--image <input>` | Image input (enables I2V): local file path, HTTPS URL, image ID, or media path | local files auto-upload; pass an existing asset's image ID or media path to skip upload |
| `-m, --model <model>` | Video model | `v6` (default), `pixverse-c1`, `v5.6`, `sora-2`, `sora-2-pro`, `veo-3.1-standard`, `veo-3.1-fast`, `veo-3.1-lite`, `grok-imagine`, `grok-imagine-1.5` (I2V only — requires `--image`), `seedance-2.5`, `seedance-2.0-standard`, `seedance-2.0-fast`, `seedance-2.0-mini`, `minimax-h3`, `gemini-omni-flash`, `kling-o3-pro`, `kling-o3-standard`, `kling-3.0-pro`, `kling-3.0-standard`, `happyhorse-1.0` |
| `-d, --duration <sec>` | Duration in seconds | model-specific; `1`–`30` overall (default `5`; see Model Reference) |
| `-q, --quality <q>` | Video quality | model-specific; `360p`–`2160p` overall (see Model Reference) |
| `--aspect-ratio <ratio>` | Aspect ratio | model-specific; H3 image-to-video forces `auto` (see Model Reference) |
| `--seed <number>` | Random seed | any integer |
| `--count <number>` | Number of generations | `1` (default), `2`, `3`, `4` |
| `--audio` / `--no-audio` | Enable or disable audio generation | boolean toggle (default: on for supported models) |
| `--multi-shot` / `--no-multi-shot` | Enable or disable multi-shot mode | boolean toggle (forced off for `pixverse-c1`) |
| `--off-peak` | Use off-peak pricing | flag |
| `--idempotency-key <key>` | Stable safe-retry key; repeated submissions return the original task without re-charging | optional |
| `--no-wait` | Return immediately without polling | flag |
| `--timeout <sec>` | Polling timeout | `300` (default) |
| `--json` | JSON output | flag |

---

## create reference -- Flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--images <inputs...>` | Image inputs: file paths, HTTPS URLs, image IDs, or media paths. Maximum: 30 on `seedance-2.5`, 9 on Seedance 2.0 / `minimax-h3`, 5 on `gemini-omni-flash`, otherwise 7. At least one image or video reference is required overall | -- |
| `--videos <inputs...>` | Video references for Seedance / `minimax-h3`. Seedance 2.5: max 10 and ≤30s total; others: max 3, with Seedance 2.0 limited to ≤15s total | file path, HTTPS URL, video ID, or media path |
| `--audios <inputs...>` | Audio references for Seedance / `minimax-h3`; requires ≥1 image/video. Seedance 2.5: max 10 and ≤30s total. Seedance 2.0: max 3, each 2–15s, ≤15s total, and known local files ≤15MB. H3 uses count-only model validation | file path, HTTPS URL, audio ID, or media path |
| `--prompt <text>` | Prompt text (required) | -- |
| `-m, --model <model>` | Video model | `v6` (default), `pixverse-c1`, `v5.6`, `seedance-2.5`, `seedance-2.0-standard`, `seedance-2.0-fast`, `seedance-2.0-mini`, `minimax-h3`, `gemini-omni-flash`, `kling-o3-pro`, `kling-o3-standard`, `grok-imagine` |
| `-q, --quality <q>` | Video quality | model-specific; up to `2160p` (see Model Reference) |
| `--aspect-ratio <ratio>` | Aspect ratio | model-specific; H3 with images defaults to `auto` but preserves an explicit fixed ratio; without images it defaults to `16:9` and rejects `auto` |
| `-d, --duration <sec>` | Duration in seconds | model-specific; `1`–`30` overall (default `5`) |
| `--audio` / `--no-audio` | Enable or disable audio generation | model-dependent boolean toggle |
| `--count <number>` | Number of generations | `1` (default), `2`, `3`, `4` |
| `--seed <number>` | Random seed | any integer |
| `--off-peak` | Use off-peak pricing | flag |
| `--idempotency-key <key>` | Stable safe-retry key; repeated submissions return the original task without re-charging | optional |
| `--no-wait` | Return immediately without polling | flag |
| `--timeout <sec>` | Polling timeout | `300` (default) |
| `--json` | JSON output | flag |

> **Note:** Reference (fusion) supports `v6` (default), `pixverse-c1`, `v5.6`, `seedance-2.5`, `seedance-2.0-standard`, `seedance-2.0-fast`, `seedance-2.0-mini`, `minimax-h3`, `gemini-omni-flash`, `kling-o3-pro`, `kling-o3-standard`, and `grok-imagine`.
>
> Seedance 2.5 reference requests accept at most 50 inputs in total, even when the individual 30-image / 10-video / 10-audio caps would otherwise allow more.

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

When `--count > 1`, the submitted output includes a list of IDs:

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
  "prompt": "A cat astronaut floating in space",
  "model": "v5.6",
  "duration": 5,
  "width": 1280,
  "height": 720,
  "created_at": "2026-01-01T00:00:00Z"
}
```

---

## Steps for T2V

1. Compose your prompt describing the desired video.
2. Choose a model — see Model Reference table below for all available models and their constraints.
3. Set quality, aspect ratio, and duration based on the chosen model's supported values.
4. Optionally set: `--seed`, `--count`, `--audio`, `--multi-shot`, `--off-peak`.
5. Run the command:
   ```bash
   pixverse create video --prompt "A sunset over mountains" --model v6 --quality 720p --json
   ```
6. Parse `video_id` from JSON output:
   ```bash
   pixverse create video --prompt "A sunset over mountains" --json | jq '.video_id'
   ```
7. If `--no-wait` was used, poll later with `pixverse task wait <video_id> --json`.
8. If wait completed, result includes `video_url`. Download with `pixverse asset download <video_id> --json`.

## Steps for I2V

1. Same as T2V, plus provide `--image <local-path-or-url>`.
2. Local file paths are auto-uploaded to PixVerse cloud storage (OSS) by the CLI. **Do not pass files containing sensitive, private, or confidential content.**
3. URLs are passed directly to the API. Only `https://` URLs are accepted (`http://` is rejected for security).
4. Alternatively, pass an already-uploaded asset's **image ID** or **media path** directly to `--image` to skip the upload step.
5. Run the command:
   ```bash
   pixverse create video --prompt "Animate this scene" --image ./photo.jpg --json
   ```

## Steps for Fusion (Character Reference)

1. Prepare at least one visual reference. Most models allow 1–7 images; Seedance 2.0 and `minimax-h3` allow up to 9, while Seedance 2.5 allows up to 30 images plus 10 videos and 10 audios (50 inputs total).
2. Write a prompt describing the desired scene with those characters.
3. Run the command:
   ```bash
   pixverse create reference --images ./char1.jpg ./char2.jpg --prompt "Two characters meeting in a park" --json
   ```
4. Parse and wait the same as T2V.

---

## Examples

### Basic T2V

```bash
pixverse create video --prompt "A sunset over mountains" --json
```

### Full customization

```bash
pixverse create video \
  --prompt "A cinematic drone shot of a futuristic city at night" \
  --model v6 \
  --quality 1080p \
  --aspect-ratio 16:9 \
  --duration 10 \
  --audio \
  --json
```

### I2V from local file

```bash
pixverse create video --prompt "Animate this scene with gentle wind" --image ./photo.jpg --json
```

### I2V from URL

```bash
pixverse create video --prompt "Bring this painting to life" --image "https://example.com/photo.jpg" --json
```

### Seedance 2.5 text-to-video

```bash
pixverse create video --model seedance-2.5 \
  --prompt "A slow aerial orbit around an alpine lake" \
  --quality 720p --duration 12 --aspect-ratio 21:9 --json
```

Seedance 2.5 defaults to `720p`, 5 seconds, and `16:9`. Text-to-video and image-to-video accept its fixed aspect ratios. It does not support generated audio, multi-shot, or off-peak generation.

### Seedance 2.5 mixed references

```bash
pixverse create reference --model seedance-2.5 \
  --images ./character.png \
  --videos ./motion.mp4 \
  --audios ./dialogue.mp3 \
  --prompt "@image1 follows @video1 and speaks with @audio1" \
  --quality 720p --duration 20 --aspect-ratio 16:9 --json
```

Reference mode allows up to 30 images, 10 videos, and 10 audios, with 50 inputs total. Known video durations may total at most 30 seconds, known audio durations may total at most 30 seconds, and audio cannot be the only reference type.

### MiniMax H3 text-to-video

```bash
pixverse create video --model minimax-h3 --prompt "A sweeping aerial shot across a crystalline desert" --quality 1440p --duration 10 --aspect-ratio 21:9 --json
```

For H3 image-to-video, pass `--image`; the CLI uses aspect ratio `auto` regardless of an explicit `--aspect-ratio` value.

### MiniMax H3 mixed references

```bash
pixverse create reference --model minimax-h3 \
  --images ./character.png \
  --videos ./motion.mp4 \
  --audios ./dialogue.mp3 \
  --prompt "@image1 follows @video1 while speaking with the delivery in @audio1" \
  --quality 768p --duration 10 --aspect-ratio 16:9 --json
```

Because this reference request includes an image, omitting `--aspect-ratio` would default to `auto`; the explicit fixed `16:9` value is preserved. H3 reference requests without images default to `16:9` and do not accept `auto`.

### Fusion (character reference)

```bash
pixverse create reference --images ./char1.jpg ./char2.jpg --prompt "Two characters meeting at a cafe" --json
```

### No-wait + batch generation

```bash
VIDEO_IDS=$(pixverse create video --prompt "Ocean waves at sunset" --count 4 --no-wait --json | jq '.video_ids[]')
for id in $VIDEO_IDS; do
  pixverse task wait "$id" --json
done
```

---

## Input Handling

How the CLI processes `--image` / `--video` inputs before submitting to the API:

- **Local images** that exceed `1920×1920` pixels or `5 MB` are auto-resized and re-encoded (progressive JPEG/WebP, transparency preserved). Agents do **not** need to pre-compress images — pass them as-is. The original file on disk is not modified.
- **Local videos** are uploaded as-is.
- **Remote URLs** are streamed to a temp file and then uploaded. Only `https://` is accepted; `http://` URLs are rejected with a validation error (exit code 6).

---

## Model Reference

Each model has its own supported parameter combinations. **Always check this table before selecting flags.**

| Model | `--model` value | Modes | Quality | Duration | Aspect Ratio |
|:---|:---|:---|:---|:---|:---|
| PixVerse V6 | `v6` (default) | Video, Transition (first/last frame), Extend, Reference | `360p` `540p` `720p` `1080p` | `1`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `3:2` `2:3` `21:9` |
| PixVerse C1 | `pixverse-c1` | Video, Transition (first/last frame), Reference | `360p` `540p` `720p` `1080p` | `1`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `3:2` `2:3` |
| PixVerse v5.6 | `v5.6` | Video, Transition, Reference, Motion Control | `360p` `480p` `540p` `720p` `1080p` | `1`–`10` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `3:2` `2:3` |
| Sora 2 | `sora-2` | Video | `720p` | `4` `8` `12` | `16:9` `9:16` |
| Sora 2 Pro | `sora-2-pro` | Video | `720p` `1080p` | `4` `8` `12` | `16:9` `9:16` |
| Veo 3.1 Standard | `veo-3.1-standard` | Video, Transition | `720p` `1080p` `2160p` | `4` `6` `8` | `16:9` `9:16` |
| Veo 3.1 Fast | `veo-3.1-fast` | Video, Transition | `720p` `1080p` `2160p` | `4` `6` `8` | `16:9` `9:16` |
| Veo 3.1 Lite | `veo-3.1-lite` | Video, Transition | `720p` `1080p` | `4` `6` `8` | `16:9` `9:16` |
| Grok Imagine | `grok-imagine` | Video, Extend, Reference | `480p` `720p` | `1`–`15` (any integer) | `16:9` `4:3` `1:1` `9:16` `3:4` `3:2` `2:3` |
| Grok Imagine 1.5 | `grok-imagine-1.5` | Video (I2V only) | `480p` `720p` | `1`–`15` (any integer) | derived from input image |
| Happy Horse 1.0 | `happyhorse-1.0` | Video | `720p` `1080p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` `4:3` `3:4` |
| Seedance 2.5 | `seedance-2.5` | Video, Reference, Transition (exactly 2 frames) | `480p` `720p` | `4`–`30` (any integer) | `21:9` `16:9` `4:3` `1:1` `3:4` `9:16` (Video / Reference; transition has no selectable ratio) |
| Seedance 2.0 Standard | `seedance-2.0-standard` | Video, Reference, Transition | `480p` `720p` `1080p` `2160p` | `4`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `21:9` |
| Seedance 2.0 Fast | `seedance-2.0-fast` | Video, Reference, Transition | `480p` `720p` | `4`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `21:9` |
| Seedance 2.0 Mini | `seedance-2.0-mini` | Video, Reference, Transition | `480p` `720p` | `4`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `21:9` |
| MiniMax H3 | `minimax-h3` | Video, Reference, Transition (exactly 2 frames) | `768p` `1440p` (default) | `5`–`15` (any integer) | `auto` `21:9` `16:9` `4:3` `1:1` `3:4` `9:16` (mode-dependent) |
| Kling O3 Pro | `kling-o3-pro` | Video, Reference, Transition | `720p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` |
| Kling O3 Standard | `kling-o3-standard` | Video, Reference, Transition | `720p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` |
| Kling 3.0 Pro | `kling-3.0-pro` | Video, Transition | `720p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` |
| Kling 3.0 Standard | `kling-3.0-standard` | Video, Transition | `720p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` |
| Google Gemini Omni | `gemini-omni-flash` | Video, Reference | `720p` | `3`–`10` (any integer, default `5`) | `16:9` `9:16` |

> **Recommended:** PixVerse V6 (`v6`) is the default — longest duration (up to 15s), widest aspect ratio support (including `21:9`), native audio and multi-shot, and multi-subject reference (fusion). Use `v5` when you need multi-frame transitions (3+ keyframes); `v5.6` is valid for first/last-frame transition only.

### Model-specific constraints

- **V6**: Duration up to 15s; supports `21:9`; native audio and multi-shot (on by default). Supports Video, Extend, Reference (fusion), and Transition (**first/last frame only**). For multi-frame transitions (3+ keyframes), use `v5`.
- **C1** (`pixverse-c1`): Same duration and quality as V6 but **no `21:9` aspect ratio** and **multi-shot is forced off**. Supports Video, Transition (first/last frame), and Reference (fusion). Does not support Extend or Motion Control.
- **v5.6**: Supports Video, first/last-frame Transition, Reference (fusion), and Motion Control. It does not support Extend or 3+ frame transitions. Duration is capped at 10s; no `21:9`.
- **Sora 2**: Fixed at `720p`; only `16:9` / `9:16`.
- **Sora 2 Pro**: Adds `1080p` over Sora 2; same aspect ratio limits.
- **Veo 3.1 (Standard & Fast)**: Supports `720p` / `1080p` / `2160p`, durations `4` / `6` / `8`, and aspect ratios `16:9` / `9:16`. Available in Video and Transition modes.
- **Veo 3.1 Lite**: Cheaper Veo tier; supports `720p` / `1080p`, durations `4` / `6` / `8`, and aspect ratios `16:9` / `9:16`. Available in Video and Transition modes.
- **Grok Imagine**: Supports `480p` and `720p`; duration is any integer from `1` to `15`; widest aspect ratio selection among third-party models but no `21:9`. Also supports **Extend** and **Reference** (fusion) modes (added in CLI v1.1.6).
- **Grok Imagine 1.5** (`grok-imagine-1.5`): **Image-to-video only** — `--image` is required (no text-only generation); aspect ratio is derived from the input image. Supports `480p` / `720p`; duration any integer `1`–`15`. Added in CLI v1.2.0.
- **Happy Horse 1.0** (`happyhorse-1.0`): External model; `720p` / `1080p`; duration starts at `3s` (minimum); aspect ratios `16:9` `9:16` `1:1` `4:3` `3:4`. Video (T2V/I2V) only — no Extend, Transition, or Reference modes.
- **Seedance 2.5** (`seedance-2.5`): External model; `480p` / `720p` (default `720p`); integer durations `4`–`30s` (default `5s`); fixed aspect ratios `21:9` `16:9` `4:3` `1:1` `3:4` `9:16` (default `16:9`) in Video and Reference modes. Reference accepts up to 30 images / 10 videos / 10 audios, 50 inputs total, with separate 30-second aggregate video and audio limits; audio requires a visual reference. Exactly-two-frame Transition is supported with a required prompt and no selectable aspect ratio. Generated audio, multi-shot, and off-peak are unsupported. Prompts are required in every supported mode.
- **Seedance 2.0 Standard**: External model; supports `480p` / `720p` / `1080p` / `2160p` (4K); duration starts at `4s` (minimum); supports `21:9`; available in Video, Reference, and Transition modes. No off-peak pricing.
- **Seedance 2.0 Fast**: External model; `480p` / `720p` only; duration starts at `4s` (minimum); supports `21:9`; available in Video, Reference, and Transition modes. No off-peak pricing.
- **Seedance 2.0 Mini**: External model; same capabilities as Seedance 2.0 Fast — `480p` / `720p` only; duration starts at `4s` (minimum); supports `21:9`; available in Video, Reference, and Transition modes. No off-peak pricing.
- **MiniMax H3** (`minimax-h3`): External model supporting `768p` / `1440p` (default `1440p`) and duration `5`–`15s`. T2V defaults to `16:9` and rejects `auto`; I2V always sends `auto` even if another ratio is supplied. Reference with at least one image defaults to `auto` but preserves an explicit fixed ratio; reference without images defaults to `16:9` and rejects `auto`. Reference accepts up to 9 images / 3 videos / 3 audios, and audio needs a visual reference. H3 reference validation is count-only at the model layer, unlike Seedance's clip-duration and local-audio-size checks. Prompts are required in Video, Reference, and exactly-two-frame Transition. Generated audio, multi-shot, and off-peak are unsupported.
- **Kling O3 (Pro & Standard)**: External models; `720p` only; duration starts at `3s` (minimum); limited aspect ratios (`16:9` `9:16` `1:1`). Available in Video, Reference, and Transition modes. No off-peak pricing.
- **Kling 3.0 (Pro & Standard)**: External models; `720p` only; duration starts at `3s` (minimum); same aspect ratios as Kling O3. Available in Video and Transition modes only (no Reference). No off-peak pricing.
- **Google Gemini Omni** (`gemini-omni-flash`): External model; `720p` only; duration `3`–`10s` (default `5`); aspect ratios `16:9` `9:16` only. Available in Video and Reference modes (no Transition or Extend). Reference caps at 5 images (lower than the 7-image default). No off-peak pricing. Added in CLI v1.2.7.

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
result=$(pixverse create video --prompt "A sunset" --json 2>/dev/null)
exit_code=$?
if [ $exit_code -eq 3 ]; then
  pixverse auth login
  result=$(pixverse create video --prompt "A sunset" --json 2>/dev/null)
elif [ $exit_code -eq 4 ]; then
  echo "Out of credits" >&2
  pixverse account info --json | jq '.credits'
  exit 1
elif [ $exit_code -eq 7 ]; then
  echo "Generation slots are busy; wait and safely retry" >&2
  pixverse account slots --json
  exit 7
elif [ $exit_code -ne 0 ]; then
  echo "Failed with exit code $exit_code" >&2
  exit $exit_code
fi
video_url=$(echo "$result" | jq -r '.video_url')
```

---

## Related Skills

- `pixverse:prompt-enhance` -- optimize your prompt for better V6 results (opt-in, user must request)
- `pixverse:modify-video` -- modify an existing video with a prompt at a keyframe
- `pixverse:motion-control` -- animate a character image with motion from a reference video
- `pixverse:task-management` -- poll and manage tasks after using `--no-wait`
- `pixverse:asset-management` -- download, list, and delete completed videos
- `pixverse:post-process-video` -- extend, upscale, or add audio to existing videos
