---
name: pixverse:item-design
description: Create and reuse persistent key items, props, and objects for stories and series. Generates a multi-angle product showcase (front / side / 3-quarter / top + material closeup), stores the result as a PixVerse asset id, and reuses that id across every later image or video generation. Designed to compose cleanly with pixverse:character-design.
---

# Item Design

Design a fixed, reusable item for a project — generate a high-quality multi-angle product reference once, register its **PixVerse asset id**, and reuse that id whenever the item appears in a later scene. Sister skill to `pixverse:character-design`; the two share architecture and registry semantics, and items can be composed with characters in a single I2I call.

## When to Use

- The user wants a **persistent prop / object** (a sword, gadget, vehicle, magical orb, branded product, vehicle, etc.) that will appear consistently across multiple later generations.
- A scene calls for **a character holding a specific item**, and you want both to remain visually consistent across shots.
- The user wants to **adopt a local image or PixVerse asset** as a canonical item reference.

This skill **does not** orchestrate scenes — it manages item references. Downstream generation happens through standard `pixverse create image` commands, with this skill resolving an item name to a PixVerse `image_id`.

---

## Source of Truth: The Asset ID

Every item is anchored on a single value: an **`image_id`** in the user's PixVerse account.

- `pixverse create image` returns an `image_id` directly — that id IS an asset id.
- `pixverse asset upload <local-path-or-https-url>` returns an `id` for a user-supplied reference.
- Downstream commands accept `image_id` natively as `--image` / `--images` input. No re-upload is ever needed.

**Local files (`reference.png`) are an optional cache** for preview/offline use — the registry's truth is the cloud id.

---

## Persistence Modes

Identical to `pixverse:character-design`.

### FS mode (default when a writable project root exists)

- Registry persists at `./.pixverse/items.json`.
- A local cache image is downloaded to `./items/<slug>/reference.png` for previewing.
- Survives across sessions; can be committed to the project repo.

### Session mode (fallback when no writable FS is available)

- Registry lives in the agent's conversation memory only.
- After every mutating action, the agent prints the full registry JSON so the user can save it externally.
- A one-line notice is printed once per session:
  > _"No writable project root found — running in session mode. Save the printed registry JSON if you want to reuse these items later."_

Both modes expose the same actions and the same registry schema.

---

## Decision Tree

```
Need an item?
├── Detect mode → FS (writable .pixverse/) or Session (in-memory)
├── Creating from scratch?            → action: create <name> [field flags]
├── Importing a local/URL/id image?   → action: create <name> --from-image <path|url|id>
├── Listing existing items?            → action: list
├── Inspecting one?                    → action: show <name>
├── Reusing in a generation?          → action: use <name>[,…] --for image|video "<prompt>"
└── Migrating older folders?          → action: migrate
```

---

## Sub-Actions

| Action | Purpose |
|:---|:---|
| `create <name>` | Generate the multi-angle product sheet via T2I, register the resulting `image_id` |
| `create <name> --from-image <input>` | Adopt a local file / HTTPS URL / existing image id as the reference (uploads if needed) |
| `list` | Print all items in the registry |
| `show <name>` | Print the registry entry (id, url, fields, optional cache path) |
| `use <name>[,…] --for image \| video "<prompt>"` | Run downstream generation with the item's `image_id` |
| `migrate` | One-shot upload of any v1 `reference.png` files lacking an `image_id`, write ids back |

---

## Registry Schema

One file (FS mode) or one in-memory object (session mode):

```json
{
  "version": 2,
  "items": {
    "ember-blade": {
      "name": "Ember Blade",
      "image_id": 400111222333444,
      "image_url": "https://media.pixverse.ai/...",
      "origin": "generated",
      "fields": {
        "short_description": "An ornate fantasy longsword with a glowing ruby pommel",
        "category": "weapon",
        "material": "polished steel blade, brass crossguard, leather-wrapped hilt",
        "color_palette": "silver, brass, deep red",
        "size_scale": "handheld",
        "era_style": "high fantasy",
        "distinctive_features": "rune engravings down the fuller, faintly glowing ruby pommel",
        "condition": "pristine",
        "style_tags": "3D toon style"
      },
      "source_prompt": "Ultra-high-detail 3D toon style. An ornate fantasy longsword with a glowing ruby pommel. …",
      "generation": {
        "model": "gpt-image-2.0",
        "quality": "1440p",
        "aspect_ratio": "16:9"
      },
      "cache": {
        "local_path": "./items/ember-blade/reference.png"
      },
      "created_at": "2026-04-29T12:00:00Z"
    }
  }
}
```

Field notes:

- `image_id` is **required** and unique per item entry. Primary key for all reuse.
- `origin`: `"generated"` (skill produced it via T2I), `"uploaded"` (local file or URL adopted), or `"imported"` (user pasted a pre-existing image id).
- `cache.local_path` is **only present in FS mode**; absent in session mode.
- The top-level key is `items` (parallel to character-design's `characters`); a project may carry both registries side-by-side.

---

## Item Fields (Hybrid)

| Field | Required | Notes |
|:---|:---|:---|
| `name` | yes | Display name; slugified for the registry key |
| `short_description` | yes | One-line anchor, e.g. `"An ornate fantasy longsword with a glowing ruby pommel"` |
| `category` | no | weapon / gadget / vehicle / food / magical-object / clothing / furniture / instrument / etc. |
| `material` | no | wood, brushed steel, frosted glass, woven leather, ceramic, etc. |
| `color_palette` | no | `"navy + brass"`, `"matte black with red accents"` |
| `size_scale` | no | `handheld` / `room-scale` / `building-scale` — helps downstream scene composition |
| `era_style` | no | medieval, sci-fi, modern, fantasy, retro-80s |
| `distinctive_features` | no | engravings, glow effects, unique shapes |
| `condition` | no | pristine / worn / damaged / ancient |
| `style_tags` | no | art style, e.g. `"3D toon"`, `"photoreal"`, `"cyberpunk render"` |

When `--from-image` is used, fields are optional metadata only — the user's image is the canonical reference.

---

## Prompt Template

Used only by `create <name>` (the generation path). `{DESCRIPTION}` joins provided fields, skipping empties:

```
Ultra-high-detail {style_tags}. {short_description}.
A {category} from {era_style}, made of {material}, in a {color_palette} palette.
{size_scale} scale. {distinctive_features}. {condition} condition.
```

Wrapped in the fixed layout instruction (note: this is **not** a three-view turnaround — items get a four-panel orthographic grid optimized for clean reference):

```
{DESCRIPTION}

Four-panel orthographic grid layout (2x2): front view in the top-left
panel, left side view in the top-right panel, top-down view in the
bottom-left panel, right side view in the bottom-right panel. By default
the four panels are evenly sized (each occupies one quadrant), separated
by thin gutters. Absolutely no text, no labels, no annotations, no
captions anywhere in the image. Pure solid white (#FFFFFF) background
filling the entire canvas — no gradient, no texture, no colored tint,
no studio backdrop curve. The white background must extend edge-to-edge
behind every panel and through the gutters; only the soft drop shadow
directly under each item is allowed on the background. Soft
product-photography lighting on the items themselves. Overall
composition is neat, balanced, and professional — optimized as a
reusable visual reference, not a product ad.
```

### Panel sizing — even by default, proportional when dimensions demand

For most everyday items (mugs, gadgets, magical orbs, bottles), the four panels should be **equal quadrants** — one quarter of the canvas each. This is the default and should be the strong starting prompt.

For items whose views have **strongly mismatched aspect ratios**, force-fitting every panel into a square quadrant wastes canvas and shrinks the subject too small to be useful as a reference. In those cases, allow proportional adjustment of panel sizes while keeping the 2×2 reading order intact:

| Item shape | Adjustment guidance |
|:---|:---|
| **Tall / vertical** (longsword, staff, rifle, lamppost) | Front and left/right side views are very tall and narrow; top-down view is short and narrow. Allow taller-than-wide side panels and a smaller top-down panel; rebalance row heights. |
| **Long / horizontal vehicle** (motorcycle, car, boat) | Side views are wide and short; front and top-down views are roughly square or boxy. Allow wider-than-tall side panels and a more square front panel; rebalance column widths. |
| **Flat / planar** (book, plate, painting, phone) | Top-down view dominates; side views are very thin slivers. Allow a larger top-down panel paired with thin side strips. |
| **Roughly cubic / spherical** (orb, mug, ring, helmet) | All four views fit equal quadrants — keep the default. |

When proposing the assembled prompt to the model, append a one-line hint matching the item's shape category, e.g. for a longsword: `"Side and front panels may be taller than the top-down panel to accommodate the blade's vertical length; keep the 2×2 grid arrangement and pure white background."` For a motorcycle: `"Side panels may be wider than the front and top-down panels to accommodate the motorcycle's length; keep the 2×2 grid arrangement and pure white background."` Skip the hint entirely for cubic/spherical items. **The pure-white-background requirement is non-negotiable across every shape variant** — proportional panel rebalancing must never introduce a colored or textured backdrop.

The skill picks the hint by inspecting `fields.category` and `fields.size_scale` (e.g. `weapon` + `handheld` with `"sword"` / `"staff"` in `short_description` → tall hint; `vehicle` → long hint; `food-and-drink-vessel` / `magical-object` → no hint).

---

## Create Flow — Generated Sheet (default)

1. **Detect mode.** Check whether the project root is writable. If yes → FS mode; if no → session mode (print the one-line notice).
2. **Load registry.** FS: read `./.pixverse/items.json` (initialize empty `{version: 2, items: {}}` if absent). Session: read in-memory object (start from `{version: 2, items: {}}` if first call).
3. **Collect fields** — required `name`, `short_description`; walk through optional fields. Headless callers can pass them as flags.
4. **Compute slug** — `slugify(name)`. If the slug already exists in `registry.items`, auto-version: `<slug>-2`, `<slug>-3`, …
5. **Assemble prompt** using the template above.
6. **Generate the sheet** using the model fallback chain (try in order, fall through on failure):

   ```bash
   pixverse create image \
     --prompt "<assembled prompt>" \
     --model gpt-image-2.0 \
     --quality 1440p \
     --aspect-ratio 1:1 \
     --json
   ```

   If the call returns `status: "Failed"` (status_code 8), `invalid param`, or the resulting `image_url` 404s, retry with the next model in the chain. **A status-code-8 response can include a non-existent `image_url` — always check `status === "completed"` and verify the URL is reachable, never trust `image_url` presence alone.**

   Capture `image_id`, `image_url`, and the actual model that succeeded; record the latter in `generation.model`.

7. **Register.** Write a new entry under `registry.items[<slug>]` with `image_id`, `image_url`, `origin: "generated"`, fields, source prompt, generation params, and `created_at`.
8. **Cache (FS mode only).** Download the image to `./items/<slug>/reference.png` and set `cache.local_path` accordingly. Skip in session mode.
9. **Persist.** FS: write the registry back. Session: print the full registry JSON at the end of the turn.
10. **Report** the slug, image id, image url, and (if applicable) the cache path.

### Defaults (locked)

| Parameter | Value | Rationale |
|:---|:---|:---|
| Model | Fallback chain — `gpt-image-2.0` → `gemini-3.1-flash` → `gemini-3.0` → `seedream-5.0-lite` | Same chain as character-design. Try the strongest layout-following model first; fall through on `Failed` / `invalid param` / 404 image URL. |
| Quality | `1440p` (2K) | Enough resolution for each of the four panels to remain a usable reference |
| Aspect ratio | `1:1` | Square frame fits the four orthographic panels evenly into a 2×2 grid; differs from character-design's 16:9 by design — items want orthographic clarity, characters want a horizontal turnaround |

**Chain semantics:**

- Attempt the first model. On any of `status_code === 8`, `error.code === 400017`, or `image_url` returning HTTP 4xx/5xx on `HEAD`, advance to the next model.
- The chain order is fixed; do not reorder per-call. Power users may override the entry point with a `--model` flag, in which case the chain starts at the requested model and continues down the list.
- Record the model that actually succeeded in `generation.model` of the registry entry.

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
7. **Cache (FS mode only).** Download the resolved asset to `./items/<slug>/reference.png`.
8. **Persist & report** as in the generated flow.

### Examples

```bash
# Adopt a local image (auto-uploaded once, then reused by id)
item-design create vintage-watch --from-image ./refs/watch.png \
  --short-description "A 1920s gold pocket watch with engraved cover"

# Adopt an image already in PixVerse (no upload)
item-design create logo --from-image 398819693367838

# Adopt from a public URL
item-design create chair --from-image https://example.com/eames-chair.jpg
```

---

## Use Flow

> **Core rule:** the multi-angle item sheet is a *reference image* only. Like the character three-view sheet, it must **never** be passed directly to a plain I2V command, because that would animate the panel layout itself. Always use I2I (for stills) or the two-step I2I→I2V flow (for video).

All commands below pass the registered `image_id` directly — no file paths, no re-uploads, identical in FS and session modes.

### `use <name> --for image "<scene prompt>"`

Produce a new scene image featuring the item (I2I):

```bash
pixverse create image \
  --image <image_id> \
  --model gpt-image-2.0 \
  --quality 1440p \
  --aspect-ratio 16:9 \
  --prompt "Same item from the reference sheet — <distinctive traits from registry.fields>. <scene prompt>" \
  --json
```

**Prompt construction:** prepend a short anchor line that names the most visually distinctive traits from the item's `fields` block (e.g. `"polished steel blade, brass crossguard, ruby pommel"`). Preserves item fidelity across scenes.

### `use <name> --for video "<scene prompt>"`

**Recommended: two-step (I2I → I2V).** Items are usually animated *as part of a scene*, not fused as subjects. Generate a still that places the item in the desired scene, then animate that still:

```bash
# 1. Place the item in a scene
STILL_ID=$(pixverse create image --image <item_image_id> --model gpt-image-2.0 \
  --prompt "Same item ... <scene>" --quality 1440p --aspect-ratio 16:9 --json | jq -r '.image_id')

# 2. Animate the scene
pixverse create video --image $STILL_ID --model <video_model> \
  --prompt "<motion prompt>" --duration 6 --aspect-ratio 9:16 --json
```

This keeps the model focused on motion within a coherent scene, rather than trying to fuse an item-only reference with an action prompt.

`pixverse create reference` is technically available too (it accepts 1–7 reference images), but it is tuned for character fusion and tends to produce inconsistent results when fed an item-only reference. Use the two-step flow unless you have a specific reason not to.

---

## Composing Items With Characters

Items frequently need to appear *with* a character. Pass both image_ids in a single I2I call:

```bash
pixverse create image \
  --images <character_image_id> <item_image_id> \
  --model gpt-image-2.0 \
  --quality 1440p \
  --aspect-ratio 9:16 \
  --prompt "<character description from character-design fields> holding <item description from item-design fields>. <scene>." \
  --json
```

This is the canonical pattern for "Alice wielding the Ember Blade" or "the apple mascot drinking from the artisan coffee cup". Resolve each name through its respective skill's registry (`pixverse:character-design` for characters, `pixverse:item-design` for items), then pass the ids together.

The same pattern extends to multiple items (e.g. character + sword + shield) by adding more ids to `--images`. Most models accept up to 4–7 references; check the model's individual constraints if you exceed 4.

---

## List / Show

- **`list`** — iterate `registry.items` and print `slug | name | category | image_id | origin | created_at`.
- **`show <name>`** — resolve `<name>` by exact slug match first, then case-insensitive `name` match; error on ambiguity. Print the full registry entry plus the `image_url` for human preview, and the cache `local_path` if present.

Both actions work identically in FS and session modes.

---

## Session-Only Mode Details

When running without a writable FS:

1. On first item-design action of the session, print the one-line notice (above).
2. After every action that mutates the registry (`create`, `migrate`), end the response with a fenced JSON block containing the full registry:

   ```
   ```json
   {"version": 2, "items": { … }}
   ```
   ```
3. To rehydrate on a later turn, the user pastes the JSON; the skill validates it (`version === 2`, every entry has `image_id`) and resumes.
4. `list` and `show` do not need to print the registry — only mutation actions do.
5. `use` works without persistence: it reads from the in-memory registry to resolve `<name> → image_id`, then runs the downstream command unchanged.

If both `pixverse:character-design` and `pixverse:item-design` are running in session mode, print **two** JSON blocks (one for characters, one for items) so each can be rehydrated independently.

---

## Migration

If a project already has an older items folder (`./items/<slug>/reference.png` + a metadata file without `image_id`), run `migrate` once.

For each metadata file lacking a top-level `image_id`:

1. `pixverse asset upload <slug>/reference.png --json` → capture `id` + `url`.
2. Insert/update the registry entry with `image_id`, `image_url`, `origin: "uploaded"`, the existing fields, and `cache.local_path` pointing at the existing PNG.
3. Optionally rewrite the legacy file with the new id.

After migration, all subsequent `use` calls resolve to ids — the local PNG is just a cache.

---

## Collision Handling

If `slugify(name)` collides with an existing slug, auto-version (`<slug>-2`, `<slug>-3`, …). Each version is an independent registry entry. Same rule as character-design.

Note: characters and items live in **separate registries**, so an item slug `apple` does not conflict with a character slug `apple`.

---

## Error Recovery

| Step | Failure | Recovery |
|:---|:---|:---|
| Detect mode | `.pixverse/` cannot be created | Fall back to session mode silently with the one-line notice |
| Step 6 (T2I) | Image generation fails (exit 5, status 8, or 404 on returned URL) | Advance to the next model in the fallback chain. If all four models fail, offer to retry with a simplified `short_description` and dropped `style_tags`. Brand names (e.g. `"Pepsi"`, `"Disney"`, `"Pixar"`) trigger sensitive-content filter — see Moderation Tips |
| `--from-image` upload | `pixverse asset upload` fails | Confirm the file exists / URL is HTTPS / id is valid; retry once |
| `--from-image` id verify | `asset info` returns 404 | The id may belong to a different account; ask the user to confirm |
| `use --for image` | I2I returns `invalid param` (400017) | Try the next model in the fallback chain; verify the `image_id` is valid |
| Compose with character | One of the inputs is rejected | Confirm both ids are accessible via `pixverse asset info`; the model may reject more than 4 references — drop optional ids first |
| Cache download | `curl` fails | Skip the cache step and continue; the registry entry is still valid (cloud id is the truth) |

---

## Moderation Tips

Lessons inherited from character-design real runs (apply equally to items):

- **Brand names trip the T2I filter.** Words like `"Pixar"`, `"Disney"`, `"Pepsi"`, `"Coca-Cola"` return `500063 sensitive information`. Use neutral phrasing: `"glass cola bottle"` instead of `"Pepsi bottle"`, `"3D toon style"` instead of `"Pixar style"`.
- **Brand names also trip the video filter (status 7 / 8).** Even when the still already shows the branded label, mentioning the brand in the motion prompt blocks the run.
- **Drinking and consumption verbs** (`"sip"`, `"drink"`, `"chug"`, `"bite"`) can trip video moderation. Use neutral verbs (`"present"`, `"rotate"`, `"show"`, `"hold up"`) when the item is a beverage or food.
- **Real human faces** held next to a sensitive item (medication, weapon) raise filter rates significantly. For weapon-category items, prefer 3D toon or stylized characters in the composing step.

---

## Out of Scope (v1)

- Auto-splitting the multi-angle sheet into per-view crops.
- Auto-detecting item names in free-form prompts (recall by fuzzy match).
- Editing or regenerating an existing item without collision-bumping the slug.
- Cross-skill resolver that mixes character names and item names in a single comma-separated argument — for now, compose with explicit `--images` ids as documented above.

---

## Related Skills

- `pixverse:character-design` — sister skill for persistent characters; uses the same registry pattern and fallback chain
- `pixverse:asset-management` — `pixverse asset upload` for `--from-image`, `pixverse asset info` for id verification
- `pixverse:create-and-edit-image` — underlying T2I / I2I command reference
- `pixverse:create-video` — animate a scene still produced by `use --for image`
- `pixverse:prompt-enhance` — refine scene prompts before passing to `use`
