---
name: pixverse:character-design
description: Create and reuse persistent characters for stories and series. Generates a three-view character sheet, stores the result as a PixVerse asset id (cloud-first), and reuses that id across every later image or video generation — no re-uploads, no dependence on local files. Local files become an optional preview cache.
---

# Character Design

Design a fixed, reusable character for a project — generate a high-quality three-view character sheet once, register its **PixVerse asset id**, and reuse that id as the reference for every later scene. The character's identity lives in the cloud, not on disk, so the skill works the same in headless agents, web sandboxes, and local terminals.

## When to Use

- The user wants to **create a persistent character** that will appear in multiple later generations.
- The user is starting a **story / series / campaign** and needs anchor characters before generating scenes.
- A later request **cues** a previously-saved character (by name) and needs the reference fed into a new image or video generation.
- The user wants to **adopt a local image** (or an existing PixVerse asset/URL) as a character reference.

This skill **does not** orchestrate full stories — it only manages character references. Downstream generation happens through the standard `pixverse create image` / `pixverse create reference` commands, with this skill resolving a character name to a PixVerse `image_id`.

---

## Source of Truth: The Asset ID

Every character is anchored on a single value: an **`image_id`** in the user's PixVerse account.

- `pixverse create image` returns an `image_id` directly — that id IS an asset id.
- `pixverse asset upload <local-path-or-https-url>` returns an `id` for a user-supplied reference.
- Downstream commands accept `image_id` natively as `--image` / `--images` input. No re-upload is ever needed.

**Local files (`reference.png`) are an optional cache** for preview/offline use — the registry's truth is the cloud id.

---

## Persistence Modes

The skill operates in one of two modes, chosen automatically:

### FS mode (default when a writable project root exists)

- Registry persists at `./.pixverse/characters.json`.
- A local cache image is downloaded to `./characters/<slug>/reference.png` for previewing.
- Survives across sessions; can be committed to the project repo.

### Session mode (fallback when no writable FS is available)

- Registry lives in the agent's conversation memory only.
- At the end of any turn that mutates the registry, the agent **prints the full registry JSON** so the user can copy/save it externally.
- On a later turn, the user can paste that JSON back and the skill rehydrates from it.
- No local cache is created.
- A one-line notice is printed once per session:
  > _"No writable project root found — running in session mode. Save the printed registry JSON if you want to reuse these characters later."_

Both modes expose the same actions and the same registry schema.

---

## Decision Tree

```
Need a character?
├── Detect mode → FS (writable .pixverse/) or Session (in-memory)
├── Creating from scratch?            → action: create <name> [field flags]
├── Importing a local/URL/id image?   → action: create <name> --from-image <path|url|id>
├── Listing existing characters?      → action: list
├── Inspecting one?                    → action: show <name>
├── Reusing in a generation?          → action: use <name>[,…] --for image|video "<prompt>"
└── Migrating v1 folders?             → action: migrate
```

---

## Sub-Actions

| Action | Purpose |
|:---|:---|
| `create <name>` | Generate the three-view sheet via T2I, register the resulting `image_id` |
| `create <name> --from-image <input>` | Adopt a local file / HTTPS URL / existing image id as the reference (uploads if needed) |
| `list` | Print all characters in the registry |
| `show <name>` | Print the registry entry (id, url, fields, optional cache path) |
| `use <name>[,…] --for image \| video "<prompt>"` | Run downstream generation with the character's `image_id` |
| `migrate` | One-shot upload of any v1 `reference.png` files lacking an `image_id`, write ids back |

---

## Registry Schema

One file (FS mode) or one in-memory object (session mode):

```json
{
  "version": 2,
  "characters": {
    "aria": {
      "name": "Aria",
      "image_id": 398830212288488,
      "image_url": "https://media.pixverse.ai/pixverse%2Ft2i%2Fori%2F73ecb411-db4a-49b4-9a9c-5d45bed0b4d3.png",
      "origin": "generated",
      "fields": {
        "short_description": "A stylish young woman in a fitted athletic outfit",
        "age": "early 20s",
        "gender": "female",
        "species": "human",
        "appearance": "blonde long hair, fair complexion, slim toned build",
        "outfit": "fitted athletic workout suit",
        "accessories": "delicate silver necklace",
        "personality": null,
        "style_tags": null
      },
      "source_prompt": "Ultra-high-detail. A stylish young woman in a fitted athletic outfit. …",
      "generation": {
        "model": "gemini-3.1-flash",
        "quality": "1440p",
        "aspect_ratio": "16:9"
      },
      "cache": {
        "local_path": "./characters/aria/reference.png"
      },
      "created_at": "2026-04-22T13:14:29Z"
    }
  }
}
```

Field notes:

- `image_id` is **required** and unique per character entry. Primary key for all reuse.
- `image_url` is recorded for human preview and as a fallback when `image_id` resolution is rate-limited; downstream commands should prefer the id.
- `origin`: `"generated"` (skill produced it via T2I), `"uploaded"` (local file or URL adopted), or `"imported"` (user pasted a pre-existing image id).
- `cache.local_path` is **only present in FS mode**; absent in session mode.

---

## Character Fields (Hybrid)

Same as v1 — collected only when `create` generates a new sheet. Skipped fields stay `null` in the registry.

| Field | Required | Notes |
|:---|:---|:---|
| `name` | yes | Display name; slugified for the registry key |
| `short_description` | yes | One-line anchor, e.g. `"A cheerful apprentice wizard"` |
| `age` | no | Integer or descriptor, e.g. `17` or `"middle-aged"` |
| `gender` | no | `female` / `male` / `non-binary` / free-form |
| `species` | no | Defaults to `human` if omitted |
| `appearance` | no | Hair, eyes, build, distinguishing features |
| `outfit` | no | Primary clothing description |
| `accessories` | no | Items, familiars, props |
| `personality` | no | Personality descriptor / vibe |
| `style_tags` | no | Art style, e.g. `"Studio Ghibli"`, `"3D toon"`, `"photoreal"` |

When `--from-image` is used, fields are optional metadata only — the user's image is the canonical reference, not the assembled prompt.

---

## Prompt Template

Used only by `create <name>` (the generation path). `{DESCRIPTION}` joins provided fields, skipping empties:

```
Ultra-high-detail {style_tags}. {short_description}.
{age}-year-old {gender} {species}.
{appearance}. Wearing {outfit}. {accessories}. {personality}.
```

Wrapped in the fixed layout instruction:

```
{DESCRIPTION}

Three-view character sheet layout: front full-body view, side full-body view,
and back full-body view aligned in a row; enlarged head-and-face detail on
the far left; clothing details and accessories showcase strip displayed below
the character views. Pure solid white (#FFFFFF) background filling the entire
canvas — no gradient, no texture, no colored tint, no studio backdrop curve.
The white background must extend edge-to-edge behind every panel and through
all gutters between views; only the soft drop shadow directly under the
character's feet is allowed on the background. Overall composition is neat,
balanced, symmetrical, and professional.
```

---

## Create Flow — Generated Sheet (default)

1. **Detect mode.** Check whether the project root is writable. If yes → FS mode; if no → session mode (print the one-line notice).
2. **Load registry.** FS: read `./.pixverse/characters.json` (initialize empty `{version: 2, characters: {}}` if absent). Session: read in-memory object (start from `{version: 2, characters: {}}` if first call).
3. **Collect fields** — required `name`, `short_description`; walk through optional fields. Headless callers can pass them as flags.
4. **Compute slug** — `slugify(name)`. If the slug already exists in `registry.characters`, auto-version: `<slug>-2`, `<slug>-3`, …
5. **Assemble prompt** using the template above.
6. **Generate the sheet** using the model fallback chain (try in order, fall through on failure):

   ```bash
   pixverse create image \
     --prompt "<assembled prompt>" \
     --model gpt-image-2.0 \
     --quality 1440p \
     --aspect-ratio 16:9 \
     --json
   ```

   If the call returns `status: "Failed"` (status_code 8), `invalid param`, or the resulting `image_url` 404s, retry with the next model in the chain. **A status-code-8 response can include a non-existent `image_url` — always check `status === "completed"` and verify the URL is reachable, never trust `image_url` presence alone.**

   Capture `image_id`, `image_url`, and the actual model that succeeded; record the latter in `generation.model`.
7. **Register.** Write a new entry under `registry.characters[<slug>]` with `image_id`, `image_url`, `origin: "generated"`, fields, source prompt, generation params, and `created_at`.
8. **Cache (FS mode only).** Download the image to `./characters/<slug>/reference.png` and set `cache.local_path` accordingly. Skip in session mode.
9. **Persist.** FS: write the registry back. Session: print the full registry JSON at the end of the turn.
10. **Report** the slug, image id, image url, and (if applicable) the cache path.

### Defaults (locked)

| Parameter | Value | Rationale |
|:---|:---|:---|
| Model | Fallback chain — `gpt-image-2.0` → `gemini-3.1-flash` → `gemini-3.0` → `seedream-5.0-lite` | Try the strongest layout-following model first; fall through on `Failed` / `invalid param` / 404 image URL. Real runs have shown all four can fail or refuse intermittently, so a chain is required for reliability. |
| Quality | `1440p` (2K) | Enough resolution for each panel to be a usable reference |
| Aspect ratio | `16:9` | Three full-body views plus a head column fit a wide frame |

**Chain semantics:**

- Attempt the first model. On any of `status_code === 8` ("Failed"), `error.code === 400017` ("invalid param"), or `image_url` returning HTTP 4xx/5xx on `HEAD`, advance to the next model.
- The chain order is fixed; do not reorder per-call. Power users may override the entry point with a `--model` flag, in which case the chain starts at the requested model and continues down the list.
- Record the model that actually succeeded in `generation.model` of the registry entry — not the chain head — so reuse and audit reflect reality.

---

## Create Flow — Adopt a Reference (`--from-image`)

For when the user already has the visual and just wants the skill to remember it.

**Input triage** (in order):

1. If `<input>` resolves to an existing local file → upload it: `pixverse asset upload <path> --json` → capture `id` + `url`.
2. Else if `<input>` starts with `https://` → upload from URL: `pixverse asset upload <url> --json` → capture `id` + `url`.
3. Else if `<input>` matches `^[0-9]+$` → treat as an existing image id; verify with `pixverse asset info <id> --type image --json` and capture `image_url` from the response. **No upload.**
4. Else → error: unsupported input shape.

Then:

5. **Compute slug** (same auto-version rule).
6. **Register** with `origin: "uploaded"` (cases 1–2) or `origin: "imported"` (case 3). Fields are whatever the user supplied (all optional). `source_prompt` and `generation` are `null`.
7. **Cache (FS mode only).** Download the resolved asset to `./characters/<slug>/reference.png`.
8. **Persist & report** as in the generated flow.

### Examples

```bash
# Adopt a local image (auto-uploaded once, then reused by id)
character-design create alice --from-image ./refs/alice.png \
  --short-description "A cheerful apprentice wizard"

# Adopt an image already in PixVerse (no upload)
character-design create bob --from-image 398819693367838

# Adopt from a public URL
character-design create cara --from-image https://example.com/cara.jpg
```

---

## Use Flow

> **Core rule (unchanged):** the three-view character sheet is a *reference image* only. It must **never** be passed directly to a plain I2V command (`pixverse create video --image <sheet_id>`), because that would animate the sheet layout itself. Always use I2I (for stills) or `pixverse create reference` (for video).

All commands below pass the registered `image_id` directly — no file paths, no re-uploads, identical in FS and session modes.

### `use <name> --for image "<scene prompt>"`

Produce a new scene image featuring the character (I2I):

```bash
pixverse create image \
  --image <image_id> \
  --model gemini-3.0 \
  --quality 1440p \
  --aspect-ratio 16:9 \
  --prompt "Same character from the reference sheet — <distinctive traits from registry.fields>. <scene prompt>" \
  --json
```

**Model note:** I2I currently rejects `gemini-3.1-flash` for this reference workflow; use `gemini-3.0` (Nano Banana Pro). The three-view sheet (T2I) still uses `gemini-3.1-flash`.

**Prompt construction:** prepend a short anchor line that names the most visually distinctive traits from the character's `fields` block (e.g. `"silver shoulder-length hair, violet eyes, navy wizard robe with silver trim"`). Preserves character fidelity across scenes.

### `use <name> --for video "<scene prompt>"`

Single character or multi-character — `pixverse create reference` accepts **1–7 images** by default, up to **9 on Seedance 2.0 and `minimax-h3`**, or up to **30 on Seedance 2.5**:

```bash
pixverse create reference \
  --images <image_id_1> [<image_id_2> …] \
  --prompt "<scene prompt>" \
  --json
```

For comma-separated names (`use alice,bob --for video "..."`), resolve each name to its `image_id` and pass them all in `--images` order.

> **Mixed reference inputs.** Seedance models and `minimax-h3` also accept `--videos <input...>` and `--audios <input...>`; audio requires at least one image or video. Seedance 2.5 allows up to 30 images / 10 videos / 10 audios, 50 inputs total, with separate 30-second aggregate video and audio limits. Seedance 2.0 and MiniMax H3 allow up to 9 images / 3 videos / 3 audios; Seedance 2.0 additionally enforces video total ≤ 15s and audio clips of 2–15s each / ≤ 15s total / ≤ 15MB for known local files. MiniMax H3 uses shared upload/backend validation beyond its model-specific counts. Each input may be a file path, HTTPS URL, asset ID, or media path.

### Two-step alternative: I2I → I2V

When you need precise control over the still frame before animating (e.g. a specific pose, framing, or product placement), do the I2I step first, then animate the resulting still:

```bash
# 1. Generate a clean still featuring the character
STILL_ID=$(pixverse create image --image <character_image_id> --model gemini-3.0 \
  --prompt "Same character... <scene>" --json | jq -r '.image_id')

# 2. Animate that still
pixverse create video --image $STILL_ID --model <video_model> \
  --prompt "<motion prompt>" --duration 15 --json
```

This bypasses `pixverse create reference` and lets the model focus on motion rather than character fusion. The still itself is a regular generated asset and does not need to be added to the registry.

---

## List / Show

- **`list`** — iterate `registry.characters` and print `slug | name | image_id | origin | created_at`.
- **`show <name>`** — resolve `<name>` by exact slug match first, then case-insensitive `name` match; error on ambiguity. Print the full registry entry plus the `image_url` for human preview, and the cache `local_path` if present.

Both actions work identically in FS and session modes.

---

## Session-Only Mode Details

When running without a writable FS:

1. On first character-design action of the session, print the one-line notice (above).
2. After every action that mutates the registry (`create`, `migrate`), end the response with a fenced JSON block containing the full registry:

   ```
   ```json
   {"version": 2, "characters": { … }}
   ```
   ```
3. To rehydrate on a later turn, the user pastes the JSON; the skill validates it (`version === 2`, every entry has `image_id`) and resumes.
4. `list` and `show` do not need to print the registry — only mutation actions do.
5. `use` works without persistence: it reads from the in-memory registry to resolve `<name> → image_id`, then runs the downstream command unchanged.

---

## Migration from v1 Folders

If a project already has v1-style character folders (`./characters/<slug>/reference.png` + `meta.json` without `image_id`), run `migrate` once.

For each `meta.json` lacking a top-level `image_id`:

1. `pixverse asset upload <slug>/reference.png --json` → capture `id` + `url`.
2. Insert/update the registry entry with `image_id`, `image_url`, `origin: "uploaded"`, the existing fields, and `cache.local_path` pointing at the existing PNG.
3. Optionally rewrite `meta.json` with the new id (legacy readers still work).

After migration, all subsequent `use` calls resolve to ids — the local PNG is just a cache.

---

## Collision Handling

Unchanged from v1: if `slugify(name)` collides with an existing slug, auto-version (`<slug>-2`, `<slug>-3`, …). Each version is an independent registry entry.

---

## Error Recovery

| Step | Failure | Recovery |
|:---|:---|:---|
| Detect mode | `.pixverse/` cannot be created | Fall back to session mode silently with the one-line notice |
| Step 6 (T2I) | Image generation fails (exit 5, status 8, or 404 on returned URL) | Advance to the next model in the fallback chain. If all four models fail, offer to retry with a simplified `short_description` and dropped `style_tags`. Brand names (e.g. `"Pixar"`, `"Disney"`) trigger sensitive-content filter — see Moderation Tips |
| `--from-image` upload | `pixverse asset upload` fails | Confirm the file exists / URL is HTTPS / id is valid; retry once |
| `--from-image` id verify | `asset info` returns 404 | The id may belong to a different account; ask the user to confirm |
| `use --for image` | I2I returns `invalid param` (400017) | Confirm `--model gemini-3.0` is set and the `image_id` is valid; retry |
| `use --for video` | `create reference` rejects the prompt (status 7) | Moderation block — neutralize verbs (e.g. avoid `"sip"`, `"drink"`, brand names); see Moderation Tips |
| Cache download | `curl` fails | Skip the cache step and continue; the registry entry is still valid (cloud id is the truth) |

---

## Moderation Tips

Lessons from real runs — keep prompts past these filters:

- **Brand names trip the T2I filter.** Words like `"Pixar"`, `"Disney"`, `"Pepsi"`, `"Coca-Cola"` return `500063 sensitive information`. Use neutral phrasing: `"3D toon style animation"` instead of `"Pixar style"`, `"glass cola bottle"` instead of `"Pepsi bottle"`.
- **Brand names also trip the video filter (status 7 / 8).** Even when the generated still already shows the branded label, mentioning the brand in the motion prompt blocks the run.
- **Drinking verbs trigger video moderation.** `"sip"`, `"drink"`, `"chug"` → status 7. Use `"present"`, `"rotate"`, `"show"`, `"hold up"` instead.
- **Real human faces are accepted on Seedance 2.0.** Most real-face inputs now pass moderation and are no longer blocked — use them freely. (For lip-sync quality, note there is no in-CLI lip-sync step; see the voiceover note below.)
- **Voiceover is layered externally.** There is no in-CLI lip-sync/speech step (the old `create speech` was removed in v1.2.0). Generate the voice track with `pixverse create voice` (see `pixverse:create-voice`) and mux it onto the finished video with `ffmpeg` — this preserves the video's original aspect ratio and duration (TikTok-style 9:16 is kept intact).

---

## Out of Scope (v2)

- Auto-splitting the three-view sheet into front/side/back/head crops.
- Auto-detecting character names in free-form prompts (recall by fuzzy match).
- Editing or regenerating an existing character without collision-bumping the slug.
- Integration into `pixverse:storyboard-to-video` — that workflow stays untouched; users manually invoke `use --for image` to pre-generate scene stills before storyboarding.

---

## Related Skills

- `pixverse:asset-management` — `pixverse asset upload` for `--from-image`, `pixverse asset info` for id verification
- `pixverse:create-and-edit-image` — underlying T2I / I2I command reference
- `pixverse:create-video` — animate a scene still produced by `use --for image`
- `pixverse:motion-control` — apply a motion reference to a character-anchored scene still
- `pixverse:prompt-enhance` — refine scene prompts before passing to `use`
