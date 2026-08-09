---
name: pixverse:transition
description: Create smooth transition animations between two or more keyframe images
---

# Transition

Create smooth transition animations between two or more keyframe images using PixVerse's transition generation.

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)
- Two or more images (local file paths or URLs) to use as keyframes

## When to Use

```
Want to animate between images?
├── Two images → pixverse create transition --images ./a.jpg ./b.jpg --json
├── Multiple frames → pixverse create transition --images ./f1.jpg ./f2.jpg ./f3.jpg --json
└── With guidance → pixverse create transition --images ./a.jpg ./b.jpg --prompt "smooth morph" --json
```

Use transitions when you need to:

- Morph between faces or objects
- Create scene transitions
- Build before/after reveals
- Animate a storyboard into a video

## Steps

1. Prepare two or more keyframe images (local files or URLs).
2. Run `pixverse create transition` with `--images` and `--json`.
3. Parse the JSON output to get the `video_id`.
4. If using `--no-wait`, poll with `pixverse task wait <video_id> --json`.
5. Download the result with `pixverse asset download <video_id> --json` if needed.

## Commands Reference

### create transition

| Flag | Description | Values |
|:---|:---|:---|
| `--images <paths...>` | Image paths or URLs (2+ required) | -- |
| `--prompt <text>` | Prompt to guide transition | optional generally; required for `seedance-2.5` and `minimax-h3` |
| `-m, --model <model>` | Video model | `v6` (default, first/last frame only), `pixverse-c1` (first/last frame only), `v5.6`, `v5` (3+ frame only), `seedance-2.5` (exactly 2 frames), `seedance-2.0-standard`, `seedance-2.0-fast`, `seedance-2.0-mini`, `minimax-h3` (exactly 2 frames), `veo-3.1-standard`, `veo-3.1-fast`, `veo-3.1-lite`, `kling-o3-pro`, `kling-o3-standard`, `kling-3.0-pro`, `kling-3.0-standard` |
| `-q, --quality <q>` | Video quality | model-specific; up to `2160p` (see table below) |
| `-d, --duration <sec>` | Duration | model-specific; `1`–`30` overall (default `5`) |
| `--count <n>` | Generations | `1`-`4` |
| `--seed <n>` | Random seed | -- |
| `--audio` / `--no-audio` | Enable or disable audio generation | model-dependent boolean toggle |
| `--off-peak` | Off-peak pricing | flag |
| `--idempotency-key <key>` | Stable safe-retry key; repeated submissions return the original task without re-charging | optional |
| `--no-wait` / `--timeout <sec>` / `--json` | Standard flags | -- |

### Transition-capable models

Only specific models support Transition mode. Using other models will result in a validation error.

| Model | `--model` value | Quality | Duration | Aspect Ratio | Notes |
|:---|:---|:---|:---|:---|:---|
| PixVerse V6 | `v6` (default) | `360p` `540p` `720p` `1080p` | `1`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `3:2` `2:3` `21:9` | **First/last frame only** — no multi-frame |
| PixVerse C1 | `pixverse-c1` | `360p` `540p` `720p` `1080p` | `1`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `3:2` `2:3` | **First/last frame only** — no multi-frame; no `21:9` |
| PixVerse v5.6 | `v5.6` | `360p` `480p` `540p` `720p` `1080p` | `1`–`10` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `3:2` `2:3` | First/last frame only (multi-frame: use `v5`) |
| PixVerse v5 | `v5` | `360p` `480p` `540p` `720p` `1080p` | `1`–`10` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `3:2` `2:3` | **Multi-frame only** (3+ images); not valid for 2-frame transition |
| Seedance 2.5 | `seedance-2.5` | `480p` `720p` (default) | `4`–`30` (any integer) | not selectable (no CLI flag) | Exactly 2 frames; prompt required; no generated audio/off-peak |
| Seedance 2.0 Standard | `seedance-2.0-standard` | `480p` `720p` `1080p` `2160p` | `4`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `21:9` | External model; no off-peak |
| Seedance 2.0 Fast | `seedance-2.0-fast` | `480p` `720p` | `4`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `21:9` | External model; no off-peak |
| Seedance 2.0 Mini | `seedance-2.0-mini` | `480p` `720p` | `4`–`15` (any integer) | `16:9` `4:3` `1:1` `3:4` `9:16` `21:9` | External model; no off-peak |
| MiniMax H3 | `minimax-h3` | `768p` `1440p` (default) | `5`–`15` (any integer) | image-derived (no CLI flag) | Exactly 2 frames; prompt required; no generated audio/off-peak |
| Veo 3.1 Standard | `veo-3.1-standard` | `720p` `1080p` `2160p` | `4` `6` `8` | `16:9` `9:16` | First/last frame only |
| Veo 3.1 Fast | `veo-3.1-fast` | `720p` `1080p` `2160p` | `4` `6` `8` | `16:9` `9:16` | First/last frame only |
| Veo 3.1 Lite | `veo-3.1-lite` | `720p` `1080p` | `4` `6` `8` | `16:9` `9:16` | First/last frame only |
| Kling O3 Pro | `kling-o3-pro` | `720p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` | External model; no off-peak |
| Kling O3 Standard | `kling-o3-standard` | `720p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` | External model; no off-peak |
| Kling 3.0 Pro | `kling-3.0-pro` | `720p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` | External model; no off-peak |
| Kling 3.0 Standard | `kling-3.0-standard` | `720p` | `3`–`15` (any integer) | `16:9` `9:16` `1:1` | External model; no off-peak |

> **V6 / C1 constraint:** V6 and `pixverse-c1` only support **first/last frame** transitions (2 images). For multi-frame transitions (3+ images), only `v5` is supported.
>
> **Veo 3.1 constraint:** Standard/Fast support `720p` / `1080p` / `2160p`; Lite supports `720p` / `1080p`. All three accept durations `4` / `6` / `8` and use first/last-frame transitions.
>
> **MiniMax H3 constraint:** H3 requires exactly two images and a non-empty prompt. It supports `768p` / `1440p` (default `1440p`), accepts integer durations `5`–`15`, and does not support generated audio or off-peak mode.
>
> **Seedance 2.5 constraint:** Seedance 2.5 requires exactly two images and a non-empty prompt. It supports `480p` / `720p` (default `720p`), accepts integer durations `4`–`30`, and does not expose an aspect-ratio flag or support generated audio/off-peak mode in Transition.

### 3+ image constraint: automatic model fallback

When **3 or more images** are provided, only `v5` supports multi-frame transitions. V6, `pixverse-c1`, and `v5.6` do **not**. The CLI automatically falls back to `v5` and prints a warning:

```
--model v5.6 does not support 3+ image transitions, using v5
```

To avoid the fallback, explicitly pass `--model v5` when supplying 3+ images.

Additionally, with 3+ images the `--count` flag has no effect — multi-frame transitions always produce one output per transition pair.

## JSON Output

Same video result format as create-video.

Submitted (with `--no-wait`):

```json
{ "video_id": 123, "trace_id": "...", "status": "submitted" }
```

Completed (default, waits for result):

```json
{ "video_id": 123, "trace_id": "...", "status": "completed", "video_url": "...", "cover_url": "...", "prompt": "...", "model": "...", "duration": 5, "width": 1280, "height": 720, "created_at": "..." }
```

## Use Cases

- **Morphing between faces** -- provide two portraits and let the model interpolate
- **Scene transitions** -- smoothly blend from one environment to another
- **Before/after reveals** -- transition between two states of an object or scene
- **Storyboard-to-animation** -- supply sequential storyboard frames to produce a cohesive animation

## Examples

Basic two-image transition:

```bash
pixverse create transition --images ./frame1.jpg ./frame2.jpg --json
```

With prompt and higher quality:

```bash
pixverse create transition --images ./a.jpg ./b.jpg --prompt "smooth morph" --quality 1080p --json
```

Multiple frames with longer duration:

```bash
pixverse create transition --images ./f1.jpg ./f2.jpg ./f3.jpg --duration 10 --json
```

Using a specific model (3+ frame transition requires `v5`):

```bash
pixverse create transition --images ./f1.jpg ./f2.jpg ./f3.jpg --model v5 --json
```

MiniMax H3 two-frame transition:

```bash
pixverse create transition --model minimax-h3 --images ./start.jpg ./end.jpg --prompt "A smooth orbiting camera move connects the scenes" --quality 1440p --duration 10 --json
```

Seedance 2.5 two-frame transition:

```bash
pixverse create transition --model seedance-2.5 --images ./start.jpg ./end.jpg --prompt "A seamless transformation" --quality 720p --duration 20 --json
```

Submit without waiting:

```bash
pixverse create transition --images ./a.jpg ./b.jpg --no-wait --json
```

## Error Handling

| Exit Code | Meaning |
|:---|:---|
| 0 | Success |
| 2 | Timeout waiting for generation |
| 3 | Authentication error (token invalid/expired) |
| 4 | Credit/subscription limit reached |
| 5 | Generation failed or content policy violation |
| 6 | Validation error (e.g., fewer than 2 images provided) |
| 7 | Concurrent generation limit; wait for a slot and retry with the same `--idempotency-key` |

## Related Skills

- `pixverse:create-video` -- create videos from text or images
- `pixverse:post-process-video` -- extend or upscale videos
- `pixverse:task-management` -- check status and wait for tasks
- `pixverse:asset-management` -- browse, download, and delete assets
