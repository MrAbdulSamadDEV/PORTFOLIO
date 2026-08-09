---
name: pixverse-ai-image-and-video-generator
description: PixVerse CLI — generate AI videos, images, audio, and MiniApp projects from the command line. Supports PixVerse V6, MiniMax H3, Veo, Sora, Grok, Seedance, Kling, Happy Horse video models; Nano Banana (Gemini), Seedream, Qwen, Kling, GPT Image image models; MiniMax / ElevenLabs voice (TTS) and MiniMax / ElevenLabs / Google Lyria music models; PixVerse MiniApps; and PixVerse's rich effect template library. Start here.
version: 1.21.0
homepage: https://pixverse.ai
source: https://github.com/PixVerseAI/skills
---

# PixVerse CLI — Master Skill

## What is PixVerse CLI

PixVerse CLI is the official command-line interface for [PixVerse](https://pixverse.ai) — an AI-powered creative platform for generating videos, images, and audio (speech & music). It is essentially **a UI-free version of the PixVerse website**: all features, models, and parameters are aligned with the web experience at [app.pixverse.ai](https://app.pixverse.ai).

It is designed for:
- **AI agents** (primary) — structured JSON output, deterministic exit codes, and pipeable commands for autonomous workflows (Claude Code, Cursor, Codex, custom agents)
- **Developers & power users** — scriptable video/image generation without leaving the terminal
- **Automation** — batch processing, CI/CD pipelines, content production workflows

Key facts:
- Generating content **consumes credits** from the user's PixVerse account (same pricing as the website)
- **Only subscribed users** can use the CLI — see [subscription plans](https://app.pixverse.ai/subscribe)
- All output can be returned as structured JSON via `--json` flag
- English only

---

## Installation

```bash
npm install -g pixverse
```

Or run without installing:
```bash
npx pixverse
```

Verify:
```bash
pixverse --version
```

**Requires Node.js >= 20.**

---

## Quick Start

```bash
# 1. Install
npm install -g pixverse

# 2. Authenticate (OAuth device flow — opens browser)
pixverse auth login --json

# 3. Create a video (waits for completion by default)
RESULT=$(pixverse create video --prompt "A cat astronaut floating in space" --json)
VIDEO_ID=$(echo "$RESULT" | jq -r '.video_id')

# 4. Download the result
pixverse asset download $VIDEO_ID --json
```

To skip waiting and poll later:
```bash
RESULT=$(pixverse create video --prompt "A cat astronaut floating in space" --no-wait --json)
VIDEO_ID=$(echo "$RESULT" | jq -r '.video_id')
pixverse task wait $VIDEO_ID --json
pixverse asset download $VIDEO_ID --json
```

> **Windows users**: For a full PowerShell pipeline example (T2I → I2V → upscale → download), see `skills/examples/windows/powershell-text-to-video.ps1`.

---

## Authentication

PixVerse CLI uses **OAuth device flow** — no need to manually copy tokens:

1. Run `pixverse auth login --json`
2. The CLI prints an authorization URL
3. Open the URL in your browser and authorize
4. The token is stored automatically in `~/.pixverse/`

Details:
- Token is valid for 30 days
- CLI sessions are independent from your web/app sessions
- If token expires (exit code 3), re-run `pixverse auth login --json`
- Run `pixverse auth status --json` to check login state and credits

---

## Capabilities Overview

| I want to... | Use skill |
|:---|:---|
| Create a video from text or image | `pixverse:create-video` |
| Review a prompt and get suggestions to improve it (advice only, any model — never auto-edits the prompt) | `pixverse:prompting-guide` |
| Enhance a video prompt for better results (V6 / generic) | `pixverse:prompt-enhance` |
| Optimize a prompt for Seedance 2.0 / 2.5 (auto-triggers when prompt has clear optimization headroom; skipped when prompt is already clean) | `pixverse:seedance-prompt-optimize` |
| Distill an emotional / atmospheric / loosely-expressed idea into an experience-first Seedance prompt (Vibe Creating) | `pixverse:seedance-vibe-creating` |
| Edit video content with AI (replace subjects, swap outfits, change backgrounds) | `pixverse:modify-video` |
| Animate a character with motion from a reference video | `pixverse:motion-control` |
| Create or edit an image | `pixverse:create-and-edit-image` |
| Generate speech / voiceover from text (TTS) | `pixverse:create-voice` |
| Generate music or a soundtrack from a prompt | `pixverse:create-music` |
| Extend or upscale a video | `pixverse:post-process-video` |
| Create transition animation between frames | `pixverse:transition` |
| Check generation progress | `pixverse:task-management` |
| Browse, download, upload, or delete assets | `pixverse:asset-management` |
| Organize assets into named folders | `pixverse:saved-folders` |
| Set up auth or check account | `pixverse:auth-and-account` |
| Browse and create from effect templates | `pixverse:template` |
| Discover and run PixVerse MiniApps | `pixverse:miniapps` |
| Manage workspaces (list, switch, status) | `pixverse:workspace` |
| Generate Mondo-style posters and covers | `pixverse:mondo-poster-design` |
| Design and reuse persistent characters across a story | `pixverse:character-design` |
| Design and reuse persistent key items / props / objects | `pixverse:item-design` |

> **Looking up models or parameters?** Don't wait until you're generating — read the relevant capabilities file directly:
> - Video models & constraints → `skills/capabilities/create-video.md` (Model Reference section)
> - Image models & constraints → `skills/capabilities/create-and-edit-image.md` (Model Reference section)

---

## Model Quick Reference

Use this to pick a model before diving into a sub-skill.

### Video Models (`pixverse create video --model <value>`)

| Model | `--model` value | Max Quality | Duration |
|:---|:---|:---|:---|
| PixVerse V6 *(default)* | `v6` | `1080p` | `1`–`15`s |
| PixVerse C1 | `pixverse-c1` | `1080p` | `1`–`15`s |
| PixVerse v5.6 | `v5.6` | `1080p` | `1`–`10`s |
| Sora 2 | `sora-2` | `720p` | `4` `8` `12`s |
| Sora 2 Pro | `sora-2-pro` | `1080p` | `4` `8` `12`s |
| Veo 3.1 Standard | `veo-3.1-standard` | `2160p` | `4` `6` `8`s |
| Veo 3.1 Fast | `veo-3.1-fast` | `2160p` | `4` `6` `8`s |
| Veo 3.1 Lite | `veo-3.1-lite` | `1080p` | `4` `6` `8`s |
| Grok Imagine | `grok-imagine` | `720p` | `1`–`15`s |
| Grok Imagine 1.5 *(image-to-video only)* | `grok-imagine-1.5` | `720p` | `1`–`15`s |
| Happy Horse 1.0 | `happyhorse-1.0` | `1080p` | `3`–`15`s |
| Seedance 2.5 | `seedance-2.5` | `720p` | `4`–`30`s |
| Seedance 2.0 Standard | `seedance-2.0-standard` | `2160p` | `4`–`15`s |
| Seedance 2.0 Fast | `seedance-2.0-fast` | `720p` | `4`–`15`s |
| Seedance 2.0 Mini | `seedance-2.0-mini` | `720p` | `4`–`15`s |
| MiniMax H3 | `minimax-h3` | `1440p` | `5`–`15`s |
| Kling O3 Pro | `kling-o3-pro` | `720p` | `3`–`15`s |
| Kling O3 Standard | `kling-o3-standard` | `720p` | `3`–`15`s |
| Kling 3.0 Pro | `kling-3.0-pro` | `720p` | `3`–`15`s |
| Kling 3.0 Standard | `kling-3.0-standard` | `720p` | `3`–`15`s |
| Google Gemini Omni | `gemini-omni-flash` | `720p` | `3`–`10`s |

### Image Models (`pixverse create image --model <value>`)

| Model | `--model` value | Max Quality |
|:---|:---|:---|
| GPT Image 2 *(default)* | `gpt-image-2.0` | `2160p` |
| Qwen Image | `qwen-image` | `1080p` |
| Seedream 5.0 Lite | `seedream-5.0-lite` | `2160p` |
| Seedream 4.5 | `seedream-4.5` | `2160p` |
| Seedream 4.0 | `seedream-4.0` | `2160p` |
| Gemini 2.5 Flash (Nanobanana) | `gemini-2.5-flash` | `1080p` |
| Gemini 3.0 (Nano Banana Pro) | `gemini-3.0` | `2160p` |
| Gemini 3.1 Flash (Nano Banana 2) | `gemini-3.1-flash` | `2160p` |
| Gemini 3.1 Flash Lite (Nano Banana 2 Lite) | `gemini-3.1-flash-lite` | `1080p` |
| Seedream 5.0 Pro | `seedream-5.0-pro` | `1440p` |
| Kling Image O3 | `kling-image-o3` | `2160p` |
| Kling Image V3 | `kling-image-v3` | `1440p` |

### Voice / TTS Models (`pixverse create voice --model <value>`)

| Model | `--model` value | Provider | Max characters |
|:---|:---|:---|---:|
| MiniMax Speech 2.8 HD *(default)* | `speech-2.8-hd` | MiniMax | 10,000 |
| MiniMax Speech 2.8 Turbo | `speech-2.8-turbo` | MiniMax | 10,000 |
| Eleven Multilingual v2 | `eleven-multilingual-v2` | ElevenLabs | 10,000 |
| Eleven v3 | `eleven-v3` | ElevenLabs | 5,000 |
| Eleven Turbo v2.5 | `eleven-turbo-v2.5` | ElevenLabs | 40,000 |

### Music Models (`pixverse create music --model <value>`)

| Model | `--model` value | Provider | Explicit lyrics | Auto lyrics | Instrumental | Image ref |
|:---|:---|:---|:---|:---|:---|:---|
| MiniMax Music 2.6 *(default)* | `music-2.6` | MiniMax | Yes | Yes | Yes | No |
| ElevenLabs Music | `music-v1` | ElevenLabs | Yes | Yes | Yes | No |
| Google Lyria 3 Pro | `lyria-3-pro-preview` | Google | No | Yes | Yes | Up to 10 |

For full parameter constraints (aspect ratios, quality per model, mode support, voice/music flags), read the capabilities files listed above.

---

## Workflow Skills

| I want to... | Use skill |
|:---|:---|
| Generate video from text end-to-end | `pixverse:text-to-video-pipeline` |
| Animate an image into video | `pixverse:image-to-video-pipeline` |
| Generate image then animate it | `pixverse:text-to-image-to-video` |
| Iteratively edit an image | `pixverse:image-editing-pipeline` |
| Modify a video and enhance it | `pixverse:modify-video-pipeline` |
| Full video production (create + extend + audio + upscale) | `pixverse:video-production` |
| Animate a character with a motion reference | `pixverse:motion-control-pipeline` |
| Create multiple items in parallel | `pixverse:batch-creation` |
| Generate a Mondo-style poster end-to-end | `pixverse:mondo-poster-pipeline` |
| Generate poster then animate into video | `pixverse:mondo-poster-to-video-pipeline` |
| Storyboard → 4-shot video from a single prompt | `pixverse:storyboard-to-video` |

---

## Reference Materials

Located in `skills/references/`. These are read-only knowledge bases that capabilities and workflows draw from — no CLI commands, just curated design knowledge.

| Reference | Path | Content |
|:---|:---|:---|
| Mondo Artist Styles | `references/mondo-poster/artist-styles.md` | 37 artist styles with prompt keywords across 7 categories |
| Mondo Composition Patterns | `references/mondo-poster/composition-patterns.md` | 8 composition techniques (negative space, silhouette, geometric framing, etc.) |
| Mondo Genre Templates | `references/mondo-poster/genre-templates.md` | Genre-specific prompt templates for film, book covers, and album covers |

---

## All Commands

| Command | Description |
|:---|:---|
| `auth login` | Login via browser (OAuth device flow) |
| `auth status` | Check authentication status |
| `auth logout` | Remove stored token |
| `create video` | Text-to-video or image-to-video |
| `create image` | Text-to-image or image-to-image |
| `create transition` | Create transitions between keyframes |
| `create voice` | Generate speech audio from text (TTS) |
| `create music` | Generate music audio from a prompt |
| `create modify` | Modify video content with a prompt at a keyframe |
| `create extend` | Extend video duration |
| `create upscale` | Upscale a local file, HTTPS URL, video ID, or media path to `2160p` |
| `create reference` | Generate video with character references |
| `create motion-control` | Generate video with character image + motion reference video |
| `create template` | Create video or image from an effect template |
| `template categories` | List template categories |
| `template list` | Browse templates (with optional category filter) |
| `template search` | Search templates by keyword |
| `template info` | Get template details |
| `miniapps list` | List available PixVerse MiniApps |
| `miniapps info` | Get MiniApp details and a normalized parameter schema |
| `miniapps create` | Create a MiniApp project from an app ID and JSON parameters |
| `voice models` | List voice/TTS providers, models, and languages |
| `voice presets` | List preset voices |
| `music models` | List music providers and models |
| `task status` | Check one task or MiniApp project, or query multiple IDs / `--ids` in parallel |
| `task wait` | Wait for task or MiniApp project completion |
| `asset list` | List generated assets or MiniApp projects (with applicable filters) |
| `asset info` | Get asset or MiniApp project details |
| `asset download` | Download a generated asset or a MiniApp project's primary asset |
| `asset upload` | Upload a local file or HTTPS URL to asset library |
| `asset delete` | Delete an asset or MiniApp project |
| `saved list` | List saved folders |
| `saved items` | List items in a saved folder |
| `saved new` | Create a new saved folder |
| `saved rename` | Rename a saved folder |
| `saved add` | Add assets to a saved folder |
| `saved remove` | Remove assets from a saved folder |
| `saved delete` | Delete a saved folder |
| `account info` | View account info and credits |
| `account usage` | View credit usage records |
| `account slots` | Show current concurrent generation slots (image / video) |
| `workspace list` | List all workspaces |
| `workspace status` | Show currently active workspace |
| `workspace switch` | Switch to a different workspace |
| `workspace manage` | Open workspace management in browser |
| `subscribe` | Open subscription page in browser |
| `config list` | List all config values |
| `config get` | Get a config value |
| `config set` | Set a config value |
| `config reset` | Reset config to defaults |
| `config path` | Show config file path |
| `config defaults` | Show all creation defaults (shorthand for `config defaults show`) |
| `config defaults show` | Show creation defaults (all modes or a specific mode) |
| `config defaults set` | Set a per-mode creation default value |
| `config defaults reset` | Reset creation defaults to built-in values |
| `update` | Update the CLI to the latest version (`npm i -g pixverse@latest`) |

---

## Global Flags

| Flag | Description |
|:---|:---|
| `--json` or `-p` | Pure JSON output to stdout (required for agent use) |
| `--workspace-id <id>` | Per-command workspace override (0 = personal). Not persisted — only affects the single invocation. |
| `--trace-id <id>` | Attach a caller-supplied UUIDv4 to all API requests in this invocation (for end-to-end tracing). Must be a valid UUIDv4. |
| `-V, --version` | Show CLI version |
| `-h, --help` | Show help for any command |

Every command supports `--json`. All examples in skills use `--json` for machine-readable output.

**Common creation conventions**:
- **`-` for stdin** — text inputs (`--prompt`, `--text`, `--lyrics`) accept a literal string, a local file path, or `-` to read from stdin. Pipe long or multi-line prompts: `cat prompt.txt | pixverse create video --prompt - --json`.
- **`--idempotency-key <key>`** — supported by video/image generation and editing commands (`video`, `image`, `transition`, `extend`, `modify`, `upscale`, `reference`, `motion-control`, `template`). Supply a stable key for safe retries; the backend dedupes by key, so a repeated submission returns the original task without re-charging credits. Voice/music use `--client-request-id` instead, which is logged but does not dedupe.

**Interactive mode**: Run any creation command without arguments (and without `--json`) to enter the interactive wizard.

---

## Output Contract

### JSON mode (`--json`)

- **stdout**: Pure JSON only. No spinners, no progress text, no decorative output.
- **stderr**: All errors, warnings, and diagnostic messages — including error payloads in `--json` mode (as of CLI v1.1.4: `pixverse task …` and `pixverse template …` errors are also routed to stderr, preserving the stdout-is-success contract).
- Parse stdout with `jq` or any JSON parser.

### Universal JSON fields

All `--json` object payloads (both success on stdout and errors on stderr) automatically include:

| Field | When present | Meaning |
|:---|:---|:---|
| `trace_id` | Whenever the command made an HTTP request and the API returned an `Ai-Trace-Id` header | Upstream request id — include this when reporting bugs. Array / primitive payloads are not augmented. |
| `code` | Error payloads from API failures | Backend error code (from `ApiError`). Pair with `trace_id` for support. |
| `error` | Error payloads | Human-readable error message. |
| `cost_credits` | `create …` success payloads, only when backend returns a **positive** integer | Credits charged for this creation request. Absent when the API returns `0`, `null`, or omits the field. |

In interactive (non-JSON) text mode, `cost_credits` surfaces as `Cost: N credits` after `Submitted!`.

### Exit Codes

| Code | Name | Meaning | Recovery |
|:---|:---|:---|:---|
| 0 | SUCCESS | Completed | — |
| 1 | GENERAL_ERROR | Unexpected error | Check stderr for details |
| 2 | TIMEOUT | Polling timed out | Increase `--timeout` or use `--no-wait` then `pixverse task wait` |
| 3 | AUTH_EXPIRED | Token invalid/expired | Re-run `pixverse auth login --json` |
| 4 | CREDIT_INSUFFICIENT | Not enough credits | Check `pixverse account info --json`, wait for daily reset or upgrade |
| 5 | GENERATION_FAILED | Generation failed/rejected | Check prompt, try different parameters |
| 6 | VALIDATION_ERROR | Invalid parameters | Check flag values against enums in each skill |
| 7 | CONCURRENCY_LIMIT | Temporary concurrent-generation limit | Wait for a slot; reuse the safe-retry key when the command supports one |

### Workspace error auto-recovery

When a request fails because the active workspace is no longer accessible (e.g. user was removed from a team), the CLI automatically resets to personal workspace (ID=0) and asks you to retry. This does **not** trigger when `--workspace-id` override is active or the failing request is a workspace management command.

### Error handling pattern

```bash
RESULT=$(pixverse create video --prompt "A sunset over mountains" --json 2>/tmp/pv_err)
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  VIDEO_ID=$(echo "$RESULT" | jq -r '.video_id')
  echo "Success: $VIDEO_ID"
  pixverse asset download $VIDEO_ID --json
elif [ $EXIT_CODE -eq 3 ]; then
  echo "Token expired, re-authenticating..."
  pixverse auth login --json
elif [ $EXIT_CODE -eq 4 ]; then
  echo "Not enough credits"
  pixverse account info --json | jq '.credits'
elif [ $EXIT_CODE -eq 5 ]; then
  echo "Generation failed — check prompt or parameters"
  cat /tmp/pv_err
elif [ $EXIT_CODE -eq 7 ]; then
  echo "All generation slots are busy; waiting before a safe retry" >&2
  pixverse account slots --json >&2
  sleep 15
  exit 7
else
  echo "Error (code $EXIT_CODE)"
  cat /tmp/pv_err
fi
```
