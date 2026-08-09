---
name: pixverse:post-process-video
description: Enhance existing videos — extend duration or upscale resolution
---

# Post-Process Video

Enhance existing PixVerse videos: extend duration or upscale resolution.

> **Looking to add a voiceover or music track?** Speech and music are now standalone audio generations, not video post-processing. Generate audio with `pixverse:create-voice` (TTS) or `pixverse:create-music`, then mux it onto the video yourself (e.g. `ffmpeg`). The old `create speech` / lip-sync command was removed in CLI v1.2.0.

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)
- An existing video supplied as a local file, HTTPS URL, PixVerse video ID, or media path

## When to Use

```
Have an existing video?
├── Change content/scene? → pixverse create modify --video <id-or-path> --prompt "..." --json
│                           (see pixverse:modify-video)
├── Make it longer? → pixverse create extend --video <id-or-path> --json
└── Higher resolution? → pixverse create upscale --video <id-or-path> --json
```

## Steps

1. Identify the source video (local file, HTTPS URL, PixVerse video ID, or media path).
2. Choose the post-processing operation (extend or upscale).
3. Run the appropriate `pixverse create` subcommand with `--json`.
4. Parse the JSON output to get the `video_id`.
5. If using `--no-wait`, poll with `pixverse task wait <video_id> --json`.
6. Download the result with `pixverse asset download <video_id> --json` if needed.

## Commands Reference

### create extend

Extend a video's duration.

| Flag | Description | Values |
|:---|:---|:---|
| `--video <input>` | Video file path, HTTPS URL, video ID, or media path (required) | -- |
| `--prompt <text>` | Prompt for extension | optional |
| `-m, --model <model>` | Video model | `v6` (default), `grok-imagine` |
| `-q, --quality <q>` | Video quality | V6: `360p` `540p` `720p` `1080p`; Grok Imagine: `480p` `720p` |
| `-d, --duration <sec>` | Duration | `1`–`15` (any integer; default `4`) |
| `--count <n>` | Generations | `1`-`4` |
| `--seed <n>` | Random seed | any integer |
| `--audio` / `--no-audio` | Enable or disable audio generation | V6 only; ignored with a warning for Grok Imagine |
| `--off-peak` | Off-peak pricing | flag |
| `--idempotency-key <key>` | Safe-retry key — backend dedupes by key, so repeated submissions return the original task without re-charging | optional |
| `--no-wait` / `--timeout <sec>` / `--json` | Standard flags | -- |

### create upscale

Upscale a video to the fixed `2160p` target. `--quality` may be omitted because `2160p` is the default and only accepted value.

| Flag | Description | Values |
|:---|:---|:---|
| `--video <input>` | Video file path, HTTPS URL, video ID, or media path (required) | -- |
| `-q, --quality <q>` | Target quality | `2160p` (default; only accepted value) |
| `--idempotency-key <key>` | Stable safe-retry key; repeated submissions return the original task without re-charging | optional |
| `--no-wait` / `--timeout <sec>` / `--json` | Standard flags | -- |

## JSON Output

Both post-processing commands produce the same video result format.

Submitted (with `--no-wait`):

```json
{ "video_id": 123, "trace_id": "...", "status": "submitted" }
```

Completed (default, waits for result):

```json
{ "video_id": 123, "trace_id": "...", "status": "completed", "video_url": "...", "cover_url": "...", "prompt": "...", "model": "...", "duration": 5, "width": 1280, "height": 720, "created_at": "..." }
```

## Examples

Extend a video:

```bash
pixverse create extend --video 123456 --prompt "continue the scene" --duration 5 --json
```

Upscale to 2160p using the default:

```bash
pixverse create upscale --video 123456 --json

# The same command also accepts other video input forms:
pixverse create upscale --video ./source.mp4 --json
pixverse create upscale --video https://example.com/source.mp4 --json
pixverse create upscale --video upload/source.mp4 --json
```

Combined pipeline -- extend, then upscale:

```bash
VID=<original_video_id>
EXTENDED=$(pixverse create extend --video $VID --prompt "continue the scene" --json | jq -r '.video_id')
pixverse task wait $EXTENDED --json
FINAL=$(pixverse create upscale --video $EXTENDED --quality 2160p --json | jq -r '.video_id')
pixverse task wait $FINAL --json
pixverse asset download $FINAL --json
```

Add a generated voiceover, then mux it on yourself (speech is no longer a video command):

```bash
# 1. Generate the voiceover as a standalone audio asset (see pixverse:create-voice)
pixverse create voice --text "Welcome to the future" --output ./voiceover.mp3 --json
# 2. Download the finished video and capture the generated local filename
VIDEO_FILE=$(pixverse asset download 123456 --dest . --json | jq -r '.file')
# 3. Mux audio onto video with ffmpeg
ffmpeg -i "$VIDEO_FILE" -i ./voiceover.mp3 -c:v copy -c:a aac -shortest ./final.mp4
```

## Error Handling

| Exit Code | Meaning |
|:---|:---|
| 0 | Success |
| 2 | Timeout waiting for generation |
| 3 | Authentication error (token invalid/expired) |
| 4 | Credit/subscription limit reached |
| 5 | Generation failed or content policy violation |
| 6 | Validation error (invalid flags/arguments) |
| 7 | Concurrent generation limit; wait for a slot and safely retry |

## Related Skills

- `pixverse:create-video` -- create videos from text or images
- `pixverse:create-voice` -- generate speech audio (TTS) to add as a voiceover
- `pixverse:create-music` -- generate a music track
- `pixverse:modify-video` -- modify video content with a prompt at a keyframe
- `pixverse:task-management` -- check status and wait for tasks
- `pixverse:asset-management` -- browse, download, and delete assets
