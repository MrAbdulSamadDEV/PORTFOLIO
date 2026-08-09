---
name: pixverse:create-voice
description: Generate speech audio from text (TTS) using MiniMax or ElevenLabs voices. Use when the user wants a voiceover, narration, spoken line, or any text-to-speech audio. The output is a standalone audio asset — mux it onto a video with ffmpeg if needed.
---

# Create Voice (Text-to-Speech)

Generate speech audio from text with `pixverse create voice`. This replaces the removed `create speech` (lip-sync) command: voice is now a **standalone audio asset**, decoupled from any video. To put a voiceover on a clip, generate the audio here and mux it on yourself (e.g. `ffmpeg`).

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)
- The text to synthesize (literal, a file path, or `-` for stdin)

## Decision Tree

```
Want spoken audio from text?
├── Pick a model      → MiniMax (default) or ElevenLabs (see Model Reference)
├── Pick a voice      → PixVerse preset (--voice-id, recommended) — browse with `pixverse voice presets`
└── Tune delivery     → provider-specific flags (speed, emotion, stability, …)
```

Browse available models, languages, and preset voices first (no auth required):

```bash
pixverse voice models --json
pixverse voice presets --provider minimax --language en --json
```

---

## create voice -- Flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--text <str>` | Text to synthesize (required) — literal, a local file path, or `-` for stdin | -- |
| `-m, --model <id>` | Voice/TTS model | `speech-2.8-hd` (default) — see Model Reference |
| `--voice-id <id>` | PixVerse preset voice ID (**recommended**) | from `pixverse voice presets` |
| `--provider-voice-id <id>` | Provider's raw voice ID (use when not using a preset) | -- |
| `--language <code>` | Language code | `auto` (default) |
| `--speed <n>` | Speech speed | ElevenLabs `0.7`–`1.2`; MiniMax `0.5`–`2.0` (default `1.0`) |
| `--output <path>` | Download the finished audio to this file/dir | optional |
| `--client-request-id <id>` | Caller-side request id (logged only, not deduped) | optional |
| `--no-wait` | Return immediately without polling | flag |
| `--timeout <sec>` | Polling timeout | `300` (default) |
| `--json` | JSON output | flag |

### ElevenLabs-only flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--stability <0..1>` | Voice stability | default `0.5` |
| `--similarity-boost <0..1>` | Similarity boost | default `0.75` |
| `--style <0..1>` | Style exaggeration (**`eleven-multilingual-v2` only**) | default `0` |
| `--use-speaker-boost` / `--no-use-speaker-boost` | Speaker boost (**`eleven-multilingual-v2` only**) | default on |

### MiniMax-only flags

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--volume <0..10>` | Output volume | default `1.0` |
| `--pitch <-12..12>` | Pitch shift | default `0` |
| `--emotion <enum>` | Emotion preset | `happy`, `sad`, `angry`, `fearful`, `disgusted`, `surprised`, `calm`, `fluent`, `whisper` (omit for neutral) |

> Provider-specific flags are validated before submission — passing an ElevenLabs flag to a MiniMax model (or vice versa) fails with exit code 6.

### Model Reference

| Model | `--model` value | Provider | Max characters |
|:---|:---|:---|---:|
| MiniMax Speech 2.8 HD *(default)* | `speech-2.8-hd` | MiniMax | 10,000 |
| MiniMax Speech 2.8 Turbo | `speech-2.8-turbo` | MiniMax | 10,000 |
| Eleven Multilingual v2 | `eleven-multilingual-v2` | ElevenLabs | 10,000 |
| Eleven v3 | `eleven-v3` | ElevenLabs | 5,000 |
| Eleven Turbo v2.5 | `eleven-turbo-v2.5` | ElevenLabs | 40,000 |

> Pass only these public model IDs. Old underscore forms (e.g. `eleven_v3`) are rejected with `Unknown model` — run `pixverse voice models` for the live list. Text exceeding the model's character limit is rejected (not truncated).

---

## JSON Output

Submitted (with `--no-wait`):

```json
{ "audio_id": 9100, "trace_id": "...", "status": "submitted", "cost_credits": 10 }
```

Completed (default, waits for result):

```json
{ "audio_id": 9100, "trace_id": "...", "status": "completed", "audio_url": "https://...", "model": "speech-2.8-hd", "created_at": "..." }
```

> The audio is an asset of `--type audio`. List, inspect, download, or delete it with `pixverse asset … --type audio` and poll it with `pixverse task … --type audio` (see `pixverse:asset-management`, `pixverse:task-management`).

---

## Steps

1. Browse voices: `pixverse voice presets --provider minimax --language en --json` and pick a `voice_id`.
2. Compose the text (or point `--text` at a file / `-` for stdin).
3. Run the command with `--json`; add `--output` to download in one step.
4. Parse `audio_id` (and `audio_url` when waiting) from the JSON.
5. If `--no-wait` was used, poll with `pixverse task wait <audio_id> --type audio --json`.

---

## Examples

Basic TTS with a preset voice, downloaded locally:

```bash
pixverse create voice \
  --text "Welcome to the future of creative tooling." \
  --voice-id 12345 \
  --output ./voiceover.mp3 \
  --json
```

ElevenLabs with delivery tuning:

```bash
pixverse create voice \
  --text "Once upon a time, in a kingdom far away…" \
  --model eleven-multilingual-v2 \
  --voice-id 67890 \
  --stability 0.4 \
  --style 0.6 \
  --json
```

MiniMax with emotion:

```bash
pixverse create voice --text "We did it!" --model speech-2.8-hd --voice-id 12345 --emotion happy --speed 1.1 --json
```

Long text from a file (or stdin):

```bash
pixverse create voice --text ./script.txt --voice-id 12345 --output ./narration.mp3 --json
cat script.txt | pixverse create voice --text - --voice-id 12345 --json
```

Add a voiceover to a finished video (mux externally):

```bash
pixverse create voice --text "Narration line" --voice-id 12345 --output ./vo.mp3 --json
VIDEO_FILE=$(pixverse asset download <video_id> --dest . --json | jq -r '.file')
ffmpeg -i "$VIDEO_FILE" -i ./vo.mp3 -c:v copy -c:a aac -shortest ./final.mp4
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
| 6 | Validation error (unknown model, text over limit, cross-provider flag, etc.) |
| 7 | Concurrent generation limit; wait for a slot, then retry |

---

## Related Skills

- `pixverse:create-music` -- generate a music track from a prompt
- `pixverse:asset-management` -- list, download, and delete audio assets (`--type audio`)
- `pixverse:task-management` -- poll audio tasks after `--no-wait` (`--type audio`)
- `pixverse:post-process-video` -- extend / upscale video (mux voice on externally)
