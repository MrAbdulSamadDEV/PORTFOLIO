---
name: pixverse:create-music
description: Generate music audio from a text prompt (optionally with lyrics) using MiniMax, ElevenLabs, or Google Lyria. Use when the user wants a soundtrack, background music, theme song, jingle, or instrumental. The output is a standalone audio asset — mux it onto a video with ffmpeg if needed.
---

# Create Music

Generate music audio from a prompt with `pixverse create music`. Every model can produce instrumental tracks or auto-generated lyrics; MiniMax and ElevenLabs can also sing explicitly supplied lyrics. The output is a **standalone audio asset** — to score a video, generate the track here and mux it on yourself (e.g. `ffmpeg`).

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)
- A music prompt (literal, a file path, or `-` for stdin)

## Decision Tree

```
Want generated music?
├── Instrumental only?          → --instrumental      (highest priority)
├── Let the model write lyrics? → --auto-lyrics     (all models)
├── Have lyrics to sing?        → --lyrics "<text>"   (MiniMax / ElevenLabs only)
└── Lyria with image vibe?      → --model lyria-3-pro-preview --image <ref...>
```

Browse available models first (no auth required):

```bash
pixverse music models --json
```

---

## create music -- Flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--prompt <text>` | Music prompt (required) — literal, a local file path, or `-` for stdin | -- |
| `--lyrics <text>` | Explicit lyrics for MiniMax / ElevenLabs — literal, a file path, or `-` for stdin | rejected by Lyria; omitted when `--instrumental` or `--auto-lyrics` takes precedence |
| `-m, --model <id>` | Music model | `music-2.6` (default) — see Model Reference |
| `--instrumental` | Generate instrumental music (no vocals) | highest priority: forces `auto_lyrics=false` and omits lyrics |
| `--auto-lyrics` | Let the model generate the lyrics | supported by every model; explicit lyrics are omitted unless `--instrumental` takes precedence |
| `--duration-seconds <sec>` | Target duration (sets `duration_auto=false`) | within model range |
| `--no-duration-auto` | Disable automatic duration (requires `--duration-seconds`) | flag |
| `--image <input...>` | Reference image(s) — **Google Lyria only**: file paths, HTTPS URLs, image IDs, or media paths | up to 10 |
| `--output <path>` | Download the finished music to this file/dir | optional |
| `--client-request-id <id>` | Caller-side request id (logged only) | optional |
| `--no-wait` | Return immediately without polling | flag |
| `--timeout <sec>` | Polling timeout | `300` (default) |
| `--json` | JSON output | flag |

### Flag combination precedence

The CLI normalizes overlapping vocal flags to match the Web app:

1. **`--instrumental` wins.** The request sends `instrumental=true`, forces `auto_lyrics=false`, and omits lyrics.
2. **Otherwise, `--auto-lyrics` wins over explicit lyrics.** The request sends `auto_lyrics=true` and omits any supplied `--lyrics` value.
3. **Otherwise, explicit lyrics are sent** for MiniMax and ElevenLabs. Those models require one of explicit lyrics, `--auto-lyrics`, or `--instrumental`.

Model compatibility is validated before this normalization. Lyria never accepts the separate `--lyrics` flag, even when `--auto-lyrics` or `--instrumental` is also present; omit `--lyrics` and use `--auto-lyrics` or put lyric-like direction in `--prompt`.

### Model Reference

| Model | `--model` value | Provider | Prompt max | Explicit lyrics | Auto lyrics | Instrumental | Duration | Image ref | Credits |
|:---|:---|:---|---:|:---|:---|:---|:---|:---|---:|
| MiniMax Music 2.6 *(default)* | `music-2.6` | MiniMax | 2,000 | Up to 3,500 chars | Yes | Yes | 10–240s | No | 40 |
| ElevenLabs Music | `music-v1` | ElevenLabs | 4,000 | Up to 3,500 chars | Yes | Yes | 10–240s | No | 150 |
| Google Lyria 3 Pro | `lyria-3-pro-preview` | Google | 5,000 | No | Yes | Yes | 10–240s | Up to 10 images | 20 |

> The ElevenLabs model ID is `music-v1` (the earlier `music_v1` form is invalid). Lyria supports `--auto-lyrics` and `--instrumental`, but does **not** take independent `--lyrics`; fold lyric-style instructions into `--prompt` when you are not using auto lyrics. `--image` is only valid for Lyria.

---

## JSON Output

Submitted (with `--no-wait`):

```json
{ "audio_id": 9100, "trace_id": "...", "status": "submitted", "cost_credits": 40 }
```

Completed (default, waits for result):

```json
{ "audio_id": 9100, "trace_id": "...", "status": "completed", "audio_url": "https://...", "model": "music-2.6", "created_at": "..." }
```

> The track is an asset of `--type audio` with `create_mode=music`. List, inspect, download, or delete it with `pixverse asset … --type audio` and poll it with `pixverse task … --type audio` (see `pixverse:asset-management`, `pixverse:task-management`).

---

## Steps

1. Browse models: `pixverse music models --json`.
2. Write the prompt; choose `--instrumental`, `--auto-lyrics`, or explicit `--lyrics` according to the precedence rules above.
3. Run the command with `--json`; add `--output` to download in one step.
4. Parse `audio_id` (and `audio_url` when waiting) from the JSON.
5. If `--no-wait` was used, poll with `pixverse task wait <audio_id> --type audio --json`.

---

## Examples

Instrumental background track:

```bash
pixverse create music --prompt "calm ambient forest score, soft strings" --instrumental --output ./score.mp3 --json
```

Song with supplied lyrics:

```bash
pixverse create music \
  --prompt "an upbeat synth-pop anthem, bright and energetic" \
  --lyrics "[Verse]\nWalking through the neon light" \
  --model music-2.6 \
  --output ./song.mp3 \
  --json
```

Let the model write lyrics, fixed duration:

```bash
pixverse create music --prompt "a nostalgic indie folk tune" --auto-lyrics --no-duration-auto --duration-seconds 90 --json
```

Google Lyria with auto-generated lyrics and image references:

```bash
pixverse create music --model lyria-3-pro-preview --prompt "an anthemic electronic song inspired by these scenes" --auto-lyrics --image ./scene1.jpg ./scene2.jpg --json
```

Score a finished video (mux externally):

```bash
pixverse create music --prompt "calm ambient score" --instrumental --output ./score.mp3 --json
VIDEO_FILE=$(pixverse asset download <video_id> --dest . --json | jq -r '.file')
ffmpeg -i "$VIDEO_FILE" -i ./score.mp3 -c:v copy -c:a aac -shortest ./final.mp4
```

---

## Error Handling

| Exit Code | Meaning |
|:---|:---|
| 0 | Success |
| 2 | Timeout waiting for generation |
| 3 | Authentication error (token invalid/expired) |
| 4 | Credit/subscription limit reached |
| 5 | Generation failed or content policy violation |
| 6 | Validation error (unknown model, prompt/lyrics over limit, `--image` on a non-Lyria model, etc.) |
| 7 | Concurrent generation limit; wait for a slot, then retry |

---

## Related Skills

- `pixverse:create-voice` -- generate speech/voiceover audio (TTS)
- `pixverse:asset-management` -- list, download, and delete audio assets (`--type audio`)
- `pixverse:task-management` -- poll audio tasks after `--no-wait` (`--type audio`)
