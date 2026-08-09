---
name: pixverse:seedance-prompt-optimize
description: Optimize user prompts for Seedance 2.0 and Seedance 2.5 video generation — multi-modal references (image / video / audio), multi-shot scripts, and video editing. Invoke when (a) the user is targeting a Seedance model, including `seedance-2.5`, `seedance-2.0-standard`, `seedance-2.0-fast`, or `seedance-2.0-mini`, AND (b) a quick triage check shows the prompt has meaningful optimization headroom (missing core elements, ambiguous multi-asset references, raw asset IDs / paths, camera-move conflicts, vague verbs, absolute-second timing). If the user's prompt already cleanly expresses their intent, do NOT optimize — go straight to generation. The user can also explicitly request optimization to force-trigger.
---

# Seedance Prompt Optimizer (2.0 / 2.5)

You are a multi-modal AI director and prompt engineer for the supported **Seedance family** (`seedance-2.5`, `seedance-2.0-standard`, `seedance-2.0-fast`, and `seedance-2.0-mini`). Seedance prompts benefit from separating the **spatial layer** (what is in the frame) from the **temporal layer** (how things change over time). A good prompt is **not adjective-heavy ad copy — it is an engineering instruction**: who, in what scene, doing what action, with what camera move, in what shot order. Your primary job is to rewrite loose, adjective-stacked prompts into engineered prompts using the existing eight core elements, shot breakdown, and multi-modal binding rules.

> **PixVerse pipeline note:** Seedance 2.0 and 2.5 accept **image**, **video**, and **audio** input references through the PixVerse CLI. Bind each asset to a positional `@imageN` / `@videoN` / `@audioN` label in the order it is passed — see Step 2. The CLI limits differ by model: Seedance 2.0 allows up to 9 images / 3 videos / 3 audios, while Seedance 2.5 allows up to 30 / 10 / 10 with 50 inputs total. Audio always requires at least one image or video.

For non-Seedance video models, use `pixverse:prompt-enhance` instead.

## When to Use

**Model-gated, with smart auto-detection.** Both conditions must hold:

1. **Target model is Seedance** — the user has specified `--model seedance-2.5`, `--model seedance-2.0-standard`, `--model seedance-2.0-fast`, `--model seedance-2.0-mini`, or another identifier containing `seedance` whose capability profile is known.
2. **Optimization is actually warranted** — either the user explicitly asks for it, OR a quick triage of the prompt finds meaningful headroom for improvement. If the prompt already cleanly expresses the user's intent, **skip this skill** and go straight to generation.

### Triage Check (mandatory before invoking)

Before applying the full optimization workflow, run a fast triage on the user's prompt + attached assets. Count how many of these red flags are present:

- **Missing core elements** — fewer than three of {subject, action, scene} are present
- **Raw paths / URLs / asset IDs in body** — local file paths (`./img.jpg`, `/Users/...`), HTTPS URLs, raw `asset-xxx` IDs, or generated-asset `video_id` numbers (e.g. `123456`) appear inside the action description instead of being bound to a positional `@imageN` / `@videoN` label in the setup
- **Ambiguous multi-asset roles** — multiple inputs passed via `--images` / `--image` / source video but no left/right, first-frame/last-frame, or subject/reference assignment
- **Camera-move conflict** — two simultaneous moves like "dolly in *and* pan left", "zoom in while pulling back"
- **Vague verbs only** — the action is carried by generic verbs ("moves", "goes", "does something") with no physical specifics
- **Tokenizer-disambiguation violations** — `@imageN` / `@videoN` references followed directly by a verb, preposition, or numeric word
- **Absolute-second timing** — the prompt pins shots to wall-clock times (`0–3s`, `at 5 seconds`); use ordered shots instead of depending on exact wall-clock timing
- **Hollow filler dominates** — more than half the prompt is non-actionable filler ("cinematic 4K", "masterpiece", "octane render", "highly detailed") with no concrete subject / action
- **Anime / non-photoreal style not anchored** — a stylized look is implied but never named, so the model may drift to photoreal
- **High-action scene with multiple characters but no position lock** — multi-character dynamic action where face-swap / clipping is likely

**Decision rules:**

| Trigger | What to do |
|:---|:---|
| User explicitly asked to optimize | Always invoke (skip triage; respect explicit ask) |
| ≥ 2 red flags | Invoke; brief one-line note that optimization headroom was detected |
| 1 red flag | Invoke only if the flag is one of: raw asset IDs, camera-move conflict, ambiguous multi-asset roles (these block generation quality regardless of the rest) |
| 0 red flags | **Do not invoke.** The prompt is good enough — go straight to `create video` |

When the triage says "skip", do not announce it as a decision — silently move on to generation. Only mention this skill when you actually run it.

When invoked (whether auto-triggered or explicit), **state explicitly** in your response that you are applying the Seedance Prompt Optimizer, and briefly cite which red flag(s) drove the decision.

## Scope

- **Seedance 2.0 / 2.5 only** — use the shared prompt-engineering rules below, but always apply the target model's distinct CLI capability profile.
- **Prompt text only** — this skill rewrites the `--prompt` value; it does not select model variant, quality, duration, or other CLI flags.
- **All Seedance scene types** — text-to-video (T2V), image-to-video (I2V), reference-to-video (R2V), video-to-video (V2V), and video editing (add / delete / modify / extend / stitch).
- **No workflows or pipelines** — do not propose multi-step processes.

## Reference Syntax (unified standard)

- **Asset reference:** `@imageN` / `@videoN` / `@audioN`, numbered by the order each asset is passed to the CLI (1-based, each modality numbered in its own sequence).
- **Subject reference** (pick one of two forms):
  - **Inline bind:** `<subjectN>@imageN` — emphasizes the subject ↔ asset binding. Example: `<subject1>@image1`.
  - **Defined tag** (multi-subject scenes or reuse across shots): first declare `define the [2–3 stable static features] in @imageN as <subjectN>`, then use the same tag `<subjectN>` everywhere afterward.
- **Asset-ID shielding:** the model cannot associate a meaning-free raw ID. **Never** write a bare `asset-xxx`, file path, URL, or `video_id` in the action description — always bridge it through `@imageN` / `@videoN` / `<subjectN>`.
- **Tokenizer disambiguation:** a bare `@imageN` directly followed by a verb or a position word (e.g. "@image1 runs toward…") triggers digit-glue parse errors. Always rewrite as `<subjectN>@imageN`, or insert a noun buffer after the label (e.g. "the woman in @image1").

## Task Classification (classify first, then pick the sentence pattern)

| Type | When it applies | Recommended sentence pattern |
|:---|:---|:---|
| **Multi-modal reference** | Action transfer, subject reuse, mood borrowing | Reference `<subjectN>` in `@imageN`, generate… / Reference the `<action / camera / style / SFX>` in `@videoN`, generate… / Reference the timbre in `@audioN`, generate… |
| **Edit video** | Local replacement, subject removal, attribute change | Add: describe `<element features>` + `<when it appears>` + `<where it appears>`; Modify: `strictly edit @videoN, replacing <old feature> with <new feature>`; Delete: name the element to remove and stress what to keep |
| **Extend video** | Continue the story, extend an action | `Extend @videoN forward / backward, generate…` / track-fill: `@video1, <transition description>, cut to @video2` |
| **Combination** | Reference one asset, edit another | `Reference the [dimension] of @image/videoN, strictly edit @videoX, [specific edit]` |

**Critical warning:** for **edit / extend** tasks, refer to the clip directly as `@videoN` — **do not write "reference @videoN"**, or it will be misclassified as a reference task.

## Eight Core Elements (the audit formula)

```
precise subject + action detail + scene/environment + light & color + camera & motion + visual style + quality + constraints
```

This is the Step 3.2 self-check list. Before producing output, verify all eight; auto-fill any missing item per the Step 3.2 default strategy and disclose it under "Issues Found".

## Core Workflow

When the user supplies a rough prompt, multi-modal assets, or only a high-level brief (e.g. "make a cyberpunk dance video"), follow these steps in order.

### Step 0 — Brief Expansion (only when the user gave no concrete prompt)

If the user only provided a high-level idea ("I want a cyberpunk video", "generate a girl dancing"), enter **guided mode** before optimizing. Ask focused questions tied to the eight core elements — never invent details silently.

> A few quick questions to ground the prompt: (1) What does the girl look like — age, outfit, hair? (2) Where is she dancing — neon street, classical stage, rooftop? (3) Do you have a reference image (e.g. `@image1`) to attach?

When the user replies with enough detail, proceed to Step 1.

### Step 1 — Task Type & Complexity

1. **Task type (do this first).** Classify the request using the Task Classification table: multi-modal reference / edit / extend / combination.
2. **Complexity (multi-modal reference only).**
   - **Edit / extend / combination** are single-point operations — go straight to **Path A** (one-paragraph assembly); no complexity judgment needed.
   - **Multi-modal reference** — judge event density along two axes, *not* by asset count alone:
     - **Temporal axis:** does a lot happen — many consecutive actions, a clear emotional/state progression, dialogue back-and-forth? (few = one continuous action; many = an event chain / state turn / conversation)
     - **Spatial axis:** does the camera move through multiple places / multiple set-ups / the subject traverse multiple zones? (few = single scene, fixed framing; many = scene cuts, follow-through, multi-angle)
     - **Path A (simple):** both axes are "few" — a single scene with one continuous action / one line of dialogue / one state display. Even a long line or a detailed action stays Path A if it completes continuously in one time and place. Examples: a blogger introducing a product in one spot; a girl eating cake by a window; a 360° product spin.
     - **Path B (complex, cinematic):** *either* axis is "many" — an event chain ("first A, then B, then C") / spatial cuts (street → enter shop → exit) / cross-scene narrative / the user already wrote "Shot 1, Shot 2…" / long plot. Examples: a dorm skit (enter → talk → tease, 3 beats); a chase (alley → market → wall-climb, multi-space).
     - **Auxiliary signals (not sufficient on their own):** asset count ≥ 4, the user wrote "Shot 1/2/3", the reference video is itself multi-shot — these *lean* complex but you still decide on the temporal / spatial axes.
   - **Core point:** the sentence patterns in the Task Classification table are a **toolkit, not a top-level structure**. Simple scenes drop the pattern straight in; complex multi-shot references must use the three-part skeleton (Path B).

### Step 2 — Asset Parsing & Mapping (multi-modal auto-mapping)

1. **CLI flag mapping.** Determine how the assets reach the selected Seedance model through the PixVerse CLI and bind each to a positional label:
   - Single image (I2V) → `--image <input>` (local file, HTTPS URL, image ID, or media path). Bind to `@image1`.
   - Multi-image fusion (R2V) → `pixverse create reference --images <p1> <p2> ...`. Bind in flag order: 1st → `@image1`, 2nd → `@image2`, …
   - Source video (V2V / video edit) → use `pixverse create reference --videos <v1> ...` with the selected Seedance model. Bind to `@video1`, `@video2`, … in introduction order.
   - Generated assets the user references by `video_id` (e.g. `123456`) → bind up front (`@video1 is video_id 123456 — [description]`) before using them.
   - Audio references → use `pixverse create reference --audios <a1> ...` with the selected Seedance model. Audio requires at least one image or video reference. Bind to `@audio1`, `@audio2`, … in order.
   - **Seedance 2.0 profile** → up to 9 images, 3 videos (≤15s total), and 3 audios (each 2–15s, ≤15s total; known local files ≤15MB).
   - **Seedance 2.5 profile** → up to 30 images, 10 videos (≤30s total), and 10 audios (≤30s total), with at most 50 references across all modalities.
2. **Long-text / JSON auto-mapping.** If the user pasted a payload with a `"content"` array (or similar) containing attached image / video / audio items, scan it: number items in appearance order (each modality in its own sequence), and in the `text` portion replace any inline raw path / URL / `asset-xxx` / `video_id` with the corresponding `@imageN` / `@videoN` / `@audioN` label.
3. **Long-image / grid check.** If an uploaded asset is a long image or N-up grid, ask the user to split it into separate single-frame images first.
4. **Multi-view detection.** If the user uploads a character three-view / multi-view sheet, **proactively suggest** splitting it into a **headshot** (head only, neutral expression) + a **full-body shot** — multi-view sheets trigger twin artifacts and ID drift.
5. **More than 4 reference people.** If more than 4 reference people are involved, suggest generating in groups of ≤ 4 first (image generation), then image-to-video.
6. **Important-assets-first.** The more precisely an asset must be matched (e.g. a face headshot), the earlier it should appear in the final prompt.
7. **Asset-config guidance.** A good config is ~4–5 assets: 1–2 character images (headshot + full-body) + 1 scene image + 1 camera-reference video + 1 audio. Do not max out the asset limit just because you can.
8. **Mapping confirmation.** When multiple assets exist but their roles are ambiguous (who is on the left, which is first vs. last frame, which is reference vs. subject), this is a **critical ambiguity** — confirm with the user (Step 3.1) before rewriting.

### Step 3 — Element Audit & Interruption Policy

**Design principle: only interrupt the user for the four critical ambiguities in 3.1. Non-critical gaps are auto-filled and disclosed (3.2) — do not pester the user for every missing element.**

#### 3.1 Critical ambiguity detection (**stop and confirm**)

When any of these appears, use the multi-select template to get the user's decision before rewriting:

- **Position / frame mapping unclear** — multiple people or images, but no left/right or first-frame/last-frame assignment.
- **Task-type misjudgment risk** — an edit / extend task contains the words "reference @videoN" (should become `strictly edit @videoN` / `extend @videoN backward`).
- **Explicit camera-move conflict** — one shot demands push + pull + pan + move at once.
- **Self-contradictory subject features** — the same `<subjectN>` is assigned conflicting static features.

Multi-select template:

> I reviewed your input and found a few critical ambiguities — please pick how to resolve them:
> 1. **[Position]** Which of `@image1` / `@image2` is on the left, and which is on the right?
> 2. **[Task type]** This is an "extend video" task — suggest rewriting "reference @video1" as "extend @video1 backward".
> 3. **[Camera conflict]** Shot 2 has both "dolly in" and "pan left" — suggest keeping a single move.
>
> ☐ Apply (1) — `@image1` on the left, `@image2` on the right
> ☐ Apply (2) — rewrite as "extend @video1 backward"
> ☐ Apply (3) — keep "dolly in" only
> ☐ Other (please describe)

#### 3.2 Non-critical gaps — eight-element audit + auto-fill (**do not interrupt**)

Audit against the eight core elements. **The first 2 are mandatory; the other 6 are as-needed:** when missing, auto-fill per the table and disclose under "Issues Found".

| # | Element | Necessity | Default strategy when missing |
|:--|:--|:--|:--|
| 1 | Precise subject (who) | **Mandatory** | If the subject is unbound, bind `<subjectN>@imageN` per Step 2; if only a generic reference exists ("a girl"), keep it generic and flag it |
| 2 | Action detail (doing what) | **Mandatory** | Default to slow, continuous, small motions; refine by body part + quantified degree (see Path B action requirements) |
| 3 | Scene / environment (where) | As-needed | Path A may omit or one-line it; infer from a scene image / style hint if given |
| 4 | Light & color (mood) | As-needed | Path A may fold into the style phrase ("warm cinematic look"); Path B sets the tone in one line up front |
| 5 | Camera & motion (how shot) | As-needed | Path A may leave it implicit (model defaults to a stable move); Path B requires one per shot, no stacking |
| 6 | Visual style (look) | As-needed | **Prefer the user's explicit style;** else infer from overall feel + reference assets. **Anime / non-photoreal upgrades to mandatory** — anchor it explicitly (2D anime / 3D stylized / cyberpunk) to prevent drift to photoreal |
| 7 | Quality (fidelity) | As-needed | Default quality pad: `high definition, rich detail, cinematic quality, natural color, soft light`; Path A may compress to "high-definition cinematic quality" |
| 8 | Constraints (anti-failure) | As-needed (mandatory for multi-person / text-gen) | Default stability + watermark/logo guard; subtitle guard for non-text-gen; twin guard for multi-person; strong-position lock for multi-person frontal dynamic |

### Step 4 — Structured Rewrite

Route by the Step 1 decision:
- **Edit / extend / combination** → **Path A** (single-point operation, one-paragraph output).
- **Multi-modal reference** → **Path A** if simple, **Path B** (three-part) if ≥ 2 shots / cinematic.

## Output Format

When optimizing, return the optimized prompt followed by **Issues Found** and **Principles Applied**.

### Optimized Prompt — Path A: simple video (assemble directly, no sub-sections)

For single-shot requests describable in a sentence or two — covering **multi-modal reference, edit, extend, and combination** tasks. **Do not** force sub-headers; assemble one paragraph:

```
[task sentence pattern], [subject ↔ asset binding], [scene + brief action], [style + constraint pad]
```

Examples:
- Multi-modal reference: `Reference <subject1>@image1 (a short-haired girl) and generate her eating cake in the cafe in @image2. Warm cinematic look, frame stable and unwarped, keep the frame free of subtitles, do not generate any watermark, do not generate any logo.`
- Single-point edit: `Strictly edit @video1, replacing the perfume with the face cream in @image1; keep the action and camera unchanged. Frame stable and unwarped, do not generate any watermark, do not generate any logo.`
- Single extend: `Extend @video1 backward, generating the two of them walking on toward the street corner and sharing a smile. Frame stable and unwarped, keep the frame free of subtitles, do not generate any watermark, do not generate any logo.`

> Path A still mounts the default constraint pad (quality / stability / watermark-logo), but folded into one or two trailing sentences — no sub-section list.

### Optimized Prompt — Path B: complex cinematic scene (**strict three-part**)

For ≥ 2 shots / multi-subject / cinematic narrative (almost always multi-modal reference). All three parts are required.

**Part 1 — Global setup + subject definition**
- One sentence setting the overall scene and mood ("dusk cliffside bamboo grove, misty-wuxia cinematic feel" / "modern office drama, soft natural light").
- Bind every subject and core asset at once: `<subjectN>@imageN`, or `define the [2–3 stable static features] in @imageN as <subjectN>`.
- Same subject across assets: `define the [...] in @image1 and the [...] in @image2 as <subject1>`.
- Face-reference strategy (if applicable): `<subject1>'s facial features reference @image1 (headshot), styling references @image2 (full-body)`.
- First/last-frame constraints (if applicable): `@imageN as the first-frame anchor / last-frame anchor`.
- Camera-reference source (if a `@videoN` anchors camera work): `camera moves reference the medium push-pull and gentle sways in @video1`.

**Part 2 — Shot breakdown (multi-modal reference form only)**
- Use `Shot 1 / Shot 2 / Shot 3 …` in order. **Do not rely on absolute seconds** (`0–3s`); express the intended sequence through ordered shots.
- Organize each shot by four elements in order: **camera move → subject action & expression → position / spatial change → audio info**.
- **One camera move per shot** (push / pull / pan / tilt / fixed / follow — pick one). No stacking.
- **Action requirements:**
  - Refine by body part + quantified degree (hands / legs / head / shoulders + amplitude / speed / force).
  - **Prefer slow, continuous, small motions;** avoid sprinting / big jumps / violent tumbling and other high-burst dynamics.
  - Add transition continuity ("carried by the turn's momentum, the hand rises naturally").
  - Externalize emotion with concrete body detail instead of abstract words: sadness → "shoulders trembling slightly, eyes reddening, fingers clutching the hem".
- Refer to subjects and positions with strong visual tags `<subjectN>` or `<subjectN>@imageN`:
  - Correct: `<subject1> (Li Wu) stands and walks toward <subject2> (Su You)`, `the woman in @image2 is on the left of the frame`.
  - Wrong: `@image2 stands at…` (digit-glue ambiguity), `@image1 runs toward…` (bare label before a verb).

**Part 3 — Style + constraint pad** (mount the standard packs by scene)
- Overall art direction / visual style ("misty-wuxia cinematic feel, cool low-saturation, film-grain texture").
- **Quality pad** (default): `high definition, rich detail, cinematic quality, natural color, soft light`.
- **Stability pad** (default): `faces stable and unwarped, features clear, motion coherent and natural, no stiffness, no clipping, no stutter`.
- **Subtitle guard** (non-text-gen tasks): `keep the frame free of subtitles; do not render any text or captions`.
- **Watermark / logo guard** (default): `do not generate any watermark; do not generate any logo`.
- **Twin / clone guard** (multi-person / multi-subject): `never render people with identical appearance, clothing, or accessories; no duplicate clones or twin effects; keep exactly one instance of each subject in frame`.
- **Style anchor** (anime / non-photoreal): name the style explicitly — `2D anime style` / `3D stylized animation` / `cyberpunk cool blue-violet palette`.
- **Strong-position lock** (multi-person frontal dynamic): name explicit positions ("the character on the left wears a slate-blue jumpsuit") with a fixed camera to avoid clipping / face-swap.

### Edit Instructions (edit / extend / combination tasks)

These are Path A (one paragraph), but build the operation from the right verb:
- **Add:** `In @video1, add [element] at [when] in [position]. Other content unchanged.`
- **Delete:** `Remove [element] from @video1; keep everything else. Other content unchanged.`
- **Modify:** `Strictly edit @video1, replacing [old feature] with [new feature]; preserve the original action and camera.`
- **Extend:** `Extend @video1 forward / backward — [continuation].` (Seedance auto-trims the seam; do not re-describe the existing footage.)
- **Stitch / track-fill:** `@video1, [transition description], cut to @video2.` (Up to 3 input videos, total ≤ 15s.)

### Issues Found (**transparent disclosure**)

For the original prompt, list:
1. **Non-critical gaps auto-filled** (e.g. mounted the quality pad; defaulted action to slow continuous small motions; …).
2. **Defects detected** (e.g. missing element, camera conflict, raw asset ID in body, task-type misjudgment, absolute seconds, rare glyphs in on-screen text).

### Principles Applied

Name the Seedance engineering rule used for each fix, using the canonical names below so the user learns the vocabulary:

- **Positional Reference Binding** — bind every input asset to a positional `@imageN` / `@videoN` / `@audioN` label; only the label appears in the action body.
- **Subject-Tag Binding** — bind subjects with `<subjectN>@imageN`, or define a `<subjectN>` tag from 2–3 stable features for reuse across shots.
- **Asset-ID Shielding** — never let a bare `asset-xxx`, path, URL, or `video_id` appear in the action body; bridge through `@imageN` / `<subjectN>`.
- **Tokenizer Disambiguation** — never place a bare `@imageN` / `@videoN` directly before a verb, preposition, or numeric word; insert an alias or noun.
- **Task-Type Before Complexity** — classify the task first; edit / extend / combination always go Path A; only multi-modal reference is routed by complexity.
- **Single-Camera-Move-Per-Shot** — at most one camera operation per shot.
- **Shot-Order Over Absolute Time** — use `Shot 1 / Shot 2 / …`, never absolute seconds.
- **Verb Precision Over Adjective Stacking** — replace vague verbs with physical, specific ones.
- **Eight-Element Coverage** — audit subject / action / scene / light / camera / style / quality / constraints.
- **First-Last-Frame Anchoring** — declare opening / closing-frame anchors in the setup when the user wants a specific frame.
- **Interrupt Only On Critical Ambiguity** — stop for the four critical ambiguities only; auto-fill and disclose the rest.
- **Twin / Clone Guard** — mount the no-duplicate-people guard in multi-person scenes.
- **Important-Assets-First** — place the most precision-critical assets (e.g. face headshots) earliest.
- **Common-Glyph Rule** — for on-screen text, prefer common characters; avoid rare glyphs and special symbols.

## Audio Channel

- **Timbre reference:** `Reference the timbre in @audioN, generate…`. If timbre fidelity is poor, add a detailed timbre description (e.g. `speak in a low, warm, slightly gravelly middle-aged male voice`) and keep the dialogue style close to the reference audio's tone.
- **Single-language consistency:** avoid mixing languages in one line (proper nouns excepted). Tag the language for any non-default-language line, e.g. `say in French {Bonjour, mon ami}`.
- **Pronunciation fallback:** the model may mispronounce rare, ambiguous, or easily-confused words. If a word is misread, substitute a common word with the **same pronunciation** (a homophone) and disclose the substitution under "Issues Found".
- **Tail-noise suggestion:** videos with narration may end with a clipped noise artifact; suggest fading the audio out in a video editor in post (non-binding suggestion).

## Special-Character Markup (ASCII)

Use these ASCII delimiters to mark audio and text cues:

| Info type | Symbol | Example |
|:--|:--|:--|
| Background music | `()` | `(upbeat rock music plays in the background)` |
| Sound effect | `<>` | `<a dog barks in the distance>` |
| Dialogue | `{}` | `{Hello, world}` — tag the language for non-English lines |
| Subtitle / title | `[]` | `[Chapter One: Departure]` |

## Text-Generation Templates

- **Ad copy:** `[text content] + [when it appears] + [where it appears] + [how it appears], [text attributes (color, style)]`.
- **Subtitle:** `a subtitle appears at the bottom of the frame reading "...", synced exactly to the audio rhythm`.
- **Speech bubble:** `<character> says "...", and a speech bubble with the line appears beside them as they speak`.

## Hard Constraints (overview)

- **Task type first, then complexity for reference.** Edit / extend / combination always go Path A; multi-modal reference goes Path A (one paragraph) or Path B (three-part) by complexity. The sentence patterns are a toolkit, not a top-level structure.
- **Interrupt only on critical ambiguity.** Stop for the four critical ambiguities in Step 3.1 only; auto-fill non-critical gaps and disclose them. (This skill **auto-fills** missing non-critical elements — it does not pester the user for each one.)
- **Mandatory pads.** Every final prompt must include the quality pad + stability pad + watermark/logo guard; mount the subtitle guard / twin guard / style anchor by scene.
- **Asset-ID Shielding.** Never let a bare `asset-xxx`, path, URL, or `video_id` appear in the action body — bridge through `@imageN` / `<subjectN>`.
- **Tokenizer Disambiguation.** No `@imageN` / `@videoN` may be immediately followed by a verb, preposition, or numeric word.
- **Single camera move per shot.** No push / pull / pan / tilt stacking in one shot.
- **Shot order over absolute time.** Use `Shot 1 / Shot 2 / …`, never `0–3s`.
- **Multi-person frontal dynamic scenes.** Require strong-position lock + fixed camera + twin guard to prevent clipping / face-swap / duplicate clones.
- **Face-reference best practice.** Use a headshot + full-body shot; **avoid multi-view / three-view sheets** (they trigger ID drift and twins).

## Examples

### Example 1 — Vague brief, no assets

**User prompt:** "Generate a Seedance video of a girl dancing"
**Model:** `seedance-2.0-standard`

**Response:** Enter Step 0 guided mode.

> Before I optimize, a few details: (1) What does the girl look like — outfit, hair, age? (2) Where is she dancing — neon street, classical stage, rooftop? (3) Style — photoreal, anime, oil painting? (4) Do you have a reference image to attach?

(Optimization waits until the user replies.)

---

### Example 2 — Path A (simple multi-modal reference)

**Planned CLI invocation:**
```
pixverse create reference --model seedance-2.0-standard \
  --images ./girl.jpg ./cafe.jpg \
  --prompt "..."
```

**User prompt text:** *"the girl in image1 eats cake at the cafe in image2"*

**Optimized Prompt (one paragraph):**

> Reference `<subject1>@image1` (a short-haired girl) and generate her sitting by the window of the cafe in `@image2`, eating a slice of cake with focused delight as warm sunlight falls softly across the table. High-definition cinematic quality, natural color, soft light; face stable and unwarped, features clear; keep the frame free of subtitles; do not generate any watermark; do not generate any logo.

**Issues found:**
- Raw "image1 / image2" not bound to positional labels or roles (Positional Reference Binding).
- Missing scene detail, light, and constraints — auto-filled (warm window light + quality/stability/watermark pad), disclosed.

**Principles applied:** Positional Reference Binding, Subject-Tag Binding, Task-Type Before Complexity (multi-modal reference, Path A), Eight-Element Coverage, mandatory pads.

---

### Example 3 — Path B (complex, multi-shot reference)

**Planned CLI invocation:**
```
pixverse create reference --model seedance-2.0-standard \
  --images ./face.jpg ./outfit.jpg ./room.jpg \
  --videos ./move-ref.mp4 --audios ./ambience.mp3 \
  --prompt "..."
```

**User prompt text:** *"a girl comes back to the dorm, her roommates ask how the exam went, she looks sad then says just kidding and they all laugh — 3 shots, use the camera moves from the reference video"*

**Optimized Prompt (three-part):**

> **Setup.** A modern girls' dormitory at dusk, soft natural light, warm documentary tone. `<subject1>`'s facial features reference `@image1` (headshot), styling references `@image2` (full-body); define the simple wooden dorm room in `@image3` as `<scene1>`; camera moves reference the medium push-pull and gentle sways in `@video1`; ambient timbre references `@audio1`.
>
> **Shot 1.** Steady medium tracking shot. `<subject1>` walks briskly to the door of `<scene1>`, warm daylight spilling down the hallway; she pauses at the door and takes a breath, expression slightly nervous. `<soft footsteps and distant indoor chatter>`.
>
> **Shot 2.** Cut to a medium interior shot. `<subject1>` pushes the door open; her roommates look up from tidying their books, and one smiles and asks `{How did the exam go — did you pass?}`. The camera drifts slowly between half-body framings of the group.
>
> **Shot 3.** Close-up. `<subject1>` lowers her head with a crestfallen look, then can't hold back a grin and says `{Just kidding}`; the roommates chase after her, laughing. The camera pulls back slowly to settle on the lively room. `(light, warm background music swells)`.
>
> **Style + constraints.** Warm documentary cinematic look, soft light; high definition, rich detail, cinematic quality, natural color; faces stable and unwarped, features clear, motion coherent and natural, no stiffness, no clipping, no stutter; keep the frame free of subtitles; do not generate any watermark; do not generate any logo; never render people with identical appearance, clothing, or accessories — no duplicate clones or twin effects.

**Issues found:**
- Multi-shot narrative with no structure → three-part Path B.
- Subjects unbound; no camera-move source declared.
- Absolute-timing risk → shot order.
- Multi-person scene → twin guard added.

**Principles applied:** Task-Type Before Complexity (Path B), Subject-Tag Binding, Shot-Order Over Absolute Time, Single-Camera-Move-Per-Shot, Twin / Clone Guard, ASCII markup (audio / dialogue), mandatory pads.

---

### Example 4 — Video editing (extend), Path A

**Planned CLI invocation:** `pixverse create extend --model seedance-2.0-fast --video-id 987654 --prompt "..."`

**User prompt text:** *"extend video 987654, the truck falls and the driver jumps out"*

**Optimized Prompt (one paragraph):**

> Extend `@video1` (source clip, `video_id` 987654 — a fire truck halted on a tilting street) backward. The continuation: the rear axle of `@video1` (the fire truck) drops over the crumbling road edge and the truck pivots violently; the driver from `@video1` (the firefighter at the wheel) kicks the door open, jumps onto the tilting street, rolls once, and grabs a curb edge as the truck slides past and drops into the void — a single tracking shot following the driver. Preserve the original style and camera feel; high-definition cinematic quality; the driver's face stable and unwarped, features clear, no clipping; do not generate any watermark; do not generate any logo.

**Issues found:**
- Raw `987654` inlined as a subject (Asset-ID Shielding) → bound to `@video1` on first mention.
- "Extend video" task — used `@video1` directly, not "reference @video1" (avoids task-type misjudgment).
- Vague verbs "falls / jumps out" → physical specifics.

**Principles applied:** Asset-ID Shielding, Positional Reference Binding, Task-Type Before Complexity (extend → Path A, `@videoN` direct), Verb Precision Over Adjective Stacking.

## What This Skill Does NOT Do

- Select model variant (`seedance-2.5` / `seedance-2.0-standard` / `seedance-2.0-fast` / `seedance-2.0-mini`), quality, aspect ratio, or duration — see `pixverse:create-video`.
- Suggest multi-step workflows or pipelines.
- Auto-trigger during normal Seedance video generation when the prompt is already clean.
- Add creative elements the user did not mention or confirm (beyond the disclosed default pads).
- Optimize prompts for non-Seedance models — use `pixverse:prompt-enhance` for V6.
