---
name: pixverse:seedance-vibe-creating
description: Decide whether a user's idea suits Vibe Creating (VC) — distilling a single-shot prompt, multi-shot description, emotional imagery, or mixed expression into an experience-first prompt for Seedance 2.0 or Seedance 2.5 — while preserving any user-specified dialogue, voiceover, music, sound effects, and other hard constraints. Use when the user targets a Seedance model with an emotional / atmospheric / loosely-expressed creative idea and wants it shaped for generation. Not for word-level dialogue-synced long-form drama, industrial shot lists, functional demos, or UI tutorials — and not for precise multi-asset / multi-shot engineering control, which belongs to `pixverse:seedance-prompt-optimize`.
---

# Seedance Vibe Creating (2.0 / 2.5)

## Overview

**Vibe Creating (VC)** distills what the user actually wants to express so the model can grab the center of the frame, the emotional direction, and the continuity of the experience. It amplifies creative intent, emotional value, key imagery, and visual unity, and it downweights low-value technical parameters and mechanical execution language.

VC is **not** about engineering a precise instruction — it is about purifying intent into an evocative, generation-friendly prompt. For the opposite job (engineering exact subject / asset bindings, shot order, and camera control for Seedance's parser), use `pixverse:seedance-prompt-optimize` instead.

> **PixVerse pipeline note:** This skill rewrites the `--prompt` text for `seedance-2.5`, `seedance-2.0-standard`, `seedance-2.0-fast`, or `seedance-2.0-mini` through `pixverse create video` / `pixverse create reference`. It does not choose model variant, quality, duration, or other CLI flags — see `pixverse:create-video`. For non-Seedance video models, use `pixverse:prompt-enhance`.

## When to Use

Use VC when **both** hold:

1. **Target model is Seedance** — the user specified `--model seedance-2.5` / `seedance-2.0-standard` / `seedance-2.0-fast` / `seedance-2.0-mini`, or another supported identifier containing `seedance`.
2. **The intent is experiential, not engineering** — the input is an emotion, an atmosphere, a memory, a stream of associations, a single evocative shot, or a multi-shot description that all serves one unified feeling, and the user wants that feeling amplified for generation.

**Do NOT use VC for:**

- Word-level, strictly dialogue-synced long-form drama.
- Industrial / execution shot lists the user wants kept verbatim.
- Functional demos, UI tutorials, step-by-step instructions.
- Inputs that need precise multi-asset binding, shot ordering, or camera engineering for Seedance — route those to `pixverse:seedance-prompt-optimize`.

> **Precise-control writing is not the same as a low-fit scene.** A prompt stuffed with lens specs and shot numbers can still be a VC-suitable emotional scene underneath. Judge the *goal* of the scene first, then decide whether to translate.

## Quick Start

When you receive the input, run three steps:

1. **Judge VC fit first** — is this a scene whose effect is amplified by creative rewriting?
2. **Then judge the best handling** — Pass through, Light purify, Rewrite, Ask first, Keep original, or Optional VC version.
3. **Ask only when information is insufficient** — request only what the current action needs; do not interrogate the user just to classify.

Do all three internally; never expose the internal labels to the user.

## Routing — Scene Fit (S) × Expression (E)

Judge scene fit (S) to decide whether VC applies, then combine with expression style (E) to choose the action. The information-density check (below) runs in parallel and takes priority: if a key anchor is missing, ask first, then act.

| Scene fit ↓ \ Expression → | **E1 — close to VC** | **E2 — mixed** | **E3 — precise-control writing** |
|:---|:---|:---|:---|
| **S1 — VC-native fit** | **Rewrite** by default; if the text is already mature, **Light purify** or **Pass through** | **Light purify, then rewrite** — keep the effective structure, narrative order, and emotional build | **VC-translatable** — don't block it for being execution-style; drop the low-value technical control and turn it into a natural, generation-friendly scene |
| **S2 — partial VC fit** | **Light purify**; **Pass through** if already usable | Offer an **Optional VC version** — let the user decide whether to adopt the more experiential phrasing | **Keep original intent**, and note kindly that an extra VC rewrite is available on request |
| **S3 — low VC fit** | Stay close to the original; **Keep original** when needed — don't force VC | **Keep original** or do very limited cleanup; stylize locally only on explicit request | **Keep original**; explain the need suits a traditional storyboard workflow rather than a VC rewrite |

### Four hard rules for routing

- **Insufficient information comes first.** No matter how well the scene fits, if the visual anchor, main action, or style direction is missing, ask before writing.
- **User hard constraints win.** If the user explicitly asks to keep dialogue, music, shot numbers, parameters, paragraph structure, or a delivery format, do not remove them. Provide any VC version as an *extra* version, or only after the user agrees.
- **Multi-shot: preserve structure.** When the user is already expressing one unified experience through shot segments, do not flatten it into a single prose blob. But do not carry over numbering unless the user explicitly asked to keep numbers or a list format.
- **Precise-control writing ≠ low-fit scene.** Look at the scene goal first, then decide whether to translate.

## Information Density Check

Even a VC-fit scene cannot be force-rewritten when key information is missing. Ask first when: there is no clear visual anchor; only an abstract feeling with no person / object / scene; a subject but no action or state; image fragments but no main relationship or style direction; an ultra-short input that has a subject and event but no clear style direction, way of viewing, or focal moment; or multi-shot content with obvious jumps but no visible reason they belong together.

Under VC, a prompt should satisfy these four layers; fill whichever layer is missing first — don't mechanically interrogate every layer in order:

1. **Visual anchor** — the core that most needs to be seen (person / object / named concept / the effect itself).
2. **Action or state** — what is happening (one action / state / beat only).
3. **Local tone** — the feel of this shot (one mood word or adjective).
4. **Video theme** — this clip's use case + visual style.
   - **Use case:** concept short, micro-narrative, film previz, emotional expression, knowledge re-creation, effect snippet…
   - **Visual style:** hyperreal, cinematic, animation, claymation, Eastern lyrical ink, cyber, illustrative…

**Asking principle:** the density check is not a separate gate placed in front of S/E — it is a parallel stability check that decides whether the current input can drop straight onto the routed action. Fill the minimum information needed to rewrite, usually in one round. Only keep asking when the gap clearly blocks the scene from landing. For ultra-short, abstract, single-image inputs, prioritize turning the abstract word into the visible-image information it needs; if the direction is already mostly clear, give a preliminary judgment first, then ask the 1–3 most critical gaps.

## Interaction Policy

Do not expose internal classification labels to the user, but internally complete three judgments first: **scene (S)**, **expression (E)**, and **information density (I)**. These may be preliminary — do not force a final class when information is insufficient.

After judging, choose an action: **Pass through, Light purify, Rewrite, Ask first, Keep original, or Optional VC version.**

Processing principles:

- Scene fits VC but information is short → fill the minimum information the current action needs.
- **When the input already has a clear subject, structure, time relationship, core imagery, and explicit emotional goal, and the text itself is already strongly generation-ready, default to Pass through; if only clarity needs a touch-up, do a Light purify — do not proactively rewrite.**
- Scene fits VC but mixes in precise control with no stated keep/drop intent → you may downweight, delete, or translate it by default; if you did, you must disclose it and tell the user they can ask to keep specific parts.
- Scene only partially fits → don't push VC by default; keep the original intent or offer an Optional VC version.
- Scene is low-fit → explain it is a goal / workflow mismatch, not a rejection of the user's creativity.
- User-specified dialogue, voiceover, music, sound effects, structure, and parameter requirements always take priority.

## Camera Language Policy

Camera language is not deleted across the board. What truly needs removing is the low-value technical parameter that tells the system *how to shoot*; what needs preserving or translating is the camera *intent* that tells the viewer *how to feel*.

**Downweight or delete by default:**

- Focal length, millimeters
- Camera-position jargon
- Rig / motion parameters
- Shot numbers
- Depth of field, aperture, exposure, shutter
- Equipment notes, A/B cam, coverage
- Pure editing instructions

When the user explicitly asks to keep parameters, follow the constraint first, then decide whether to additionally offer a VC version.

**When keep/drop of precise control is not declared:**

- Don't treat technical control as a must-keep item.
- Still default to the more generation-friendly VC creative version.
- Preserve the parts that contribute to emotion, narrative, or viewing experience.
- For purely technical camera control, delete or translate it into a natural result by default.
- Don't interrupt to confirm; but if you downweighted, deleted, or translated any technical control, say so briefly in the output. If the user wants some parameters, structure, or rhythm beats kept, they can point them out and you provide a constraint-preserving version.

> **Seedance note:** if the user genuinely wants engineered camera and shot control (single camera move per shot, shot-order over absolute time, asset binding), that is `pixverse:seedance-prompt-optimize`, not VC. VC is the opposite intent — feel over mechanics.

## Sound & Constraint Priority

Dialogue, voiceover, music, sound effects, lyrics, narration, and any other explicitly specified sound content rank **above** creative optimization. You may reorder them, but you must **not** rewrite the wording, replace the content, or delete a user's stated sound requirement.

When rules conflict, resolve in this order:

1. **User-specified content and hard constraints** — dialogue, voiceover, music, sound effects, shot structure, parameter-keep requests, format requirements, style limits.
2. **Creative optimization** — purify story, emotion, memory, imagery, and unified experience without breaking constraints.
3. **VC paradigm consistency** — only after 1 and 2 are satisfied, tighten the language so it is easier for the model to understand and generate.

Supplementary rules:

- Dialogue, voiceover, music, or sound effects the user wrote explicitly should be preserved verbatim.
- When picture description and sound requirements are written together, you may reorder them, but do not alter the sound content itself.
- If the picture part suits VC but the sound part should not be rewritten, rewrite only the picture part.
- If the whole thing only works under long, strict, word-level dialogue sync, do not run a VC rewrite by default.

> **Seedance audio mapping:** when a specified sound is carried into the prompt, route it through Seedance's audio markup so the user's exact wording is preserved — `()` background music, `<>` sound effect, `{}` dialogue, `[]` subtitle / title. Audio references attach through `pixverse create reference --audios`. See `pixverse:seedance-prompt-optimize` (Audio Channel) for the full markup and reference rules; keep the user's exact words inside `{}`.

## Rewrite Modes

VC rewriting is not one template. Pick the mode that fits the dominant factor in the input:

- **Narrative rewrite** — for story-, relationship-, or event-driven input. Output one continuous prompt, or keep 2–5 scene segments; the point is to preserve event order and emotional turns.
- **Emotional rewrite** — for mood / feeling / state-driven input. Concentrate on environment, rhythm, texture, and viewing experience; don't fabricate a causal chain just to make it "feel like a story."
- **Memory rewrite** — for recollection, flashback, old-times feel, fading, a fragment being remembered. Keep the blur, the wash-out, the gaps, and the fragility; amplify recurring imagery and the sense of passing time.
- **Stream-of-consciousness rewrite** — for association, fragments, subjective perception, non-linear expression. Allow incompleteness, but keep the picture perceptible and hold internal unity across images.
- **Multi-shot experience rewrite** — for multi-segment, multi-scene, multi-cut input that all serves one experience. Use natural segments, or numbered groups only when the user explicitly asks; 1–3 sentences per segment; preserve the scene flow, emotional progression, and visual motifs, and drop low-value execution jargon.
- **Hybrid purification** — for input that mixes creative content with execution language. Keep the original structure and the useful information; remove only the technical noise, repeated explanation, and low-value control statements. Don't over-rewrite, and don't add new plot the user didn't write.

## Output Rules

The goal is to help the user **express more accurately**, not to rewrite their idea into a different work.

### Length & form

- Default to not being significantly longer than the original, and don't expand an ultra-short input into long prose.
- Add nothing unsupported — never invent character relationships, plot twists, scene details, or emotional shifts.
- For single-segment output, tighten to one prompt that's directly ready to generate.
- **Preserving structure is not the same as preserving numbering.** Shot numbers, segment numbers, or list formatting in the input do not, by themselves, mean "keep the numbering." Keep numbered output only when the user explicitly asks for shot numbers, segment numbers, list format, or a delivery structure; otherwise present multi-segment content as natural paragraphs.
- With sufficient information and no extra constraints, a single shot or single segment is usually **~40–120 words**; loosen this to preserve structure, dialogue, or multi-segment progression.
- When the user explicitly asks to keep the original structure, prioritize structure over brevity.

### User-visible format

- Do not expose internal labels such as `S1 + E2` or `Mode 5`.
- Default to a four-part output, in fixed order: **Judgment / Action / Result / Notes (if any).**
- **Judgment** — briefly state whether it suits VC, whether the original is already usable, and whether information is sufficient.
- **Action** — explicitly use one of these labels: **Pass through / Light purify / Rewrite / Ask first / Keep original / Optional VC version.**
- **Result** — the actual rewrite, the preserved text, or the questions you're asking.
- **Notes (if any)** — what technical control you downweighted / deleted / translated, which hard constraints (dialogue, voiceover, music, sound effects) you preserved, and a reminder that the user can ask to keep parameters, structure, or rhythm beats.
- Keep the output natural, concise, and fitted to the user's original task context.
- Omit the Notes section when there is nothing to add.

## Examples

### Example 1 — Precise-control writing over an emotional scene (S1 + E3)

**Target model:** `seedance-2.0-standard`
**User input:** *"35mm, f/1.8, slow dolly-in, Shot 04. A girl stands alone at a rainy bus stop at night, neon reflections, she's been waiting a long time, feels lonely."*

> **Judgment** — VC-fit emotional scene wrapped in execution parameters; information is sufficient.
> **Action** — Rewrite.
> **Result** — A girl waits alone at a neon-lit bus stop on a rainy night, city lights smearing across the wet pavement; she watches the empty street, shoulders drawn in, the long wait settling into quiet loneliness. Cinematic, cool and rain-soaked, intimate and still.
> **Notes** — Dropped the lens, aperture, camera-move, and shot-number parameters (translated the "slow dolly-in" into the prompt's calm, drawn-in mood). If you want the dolly-in or 35mm look kept, say so and I'll add a constraint-preserving version.

### Example 2 — Abstract one-word input (insufficient information)

**Target model:** `seedance-2.0-fast`
**User input:** *"freedom"*

> **Judgment** — VC-fit in spirit, but there is no visual anchor, action, or style direction yet — not enough to rewrite.
> **Action** — Ask first.
> **Result** — To turn "freedom" into something the model can see: (1) Who or what carries it — a person, an animal, an object? (2) What single moment shows it — running, breaking loose, flying, an open horizon? (3) What look — hyperreal, cinematic, animation, ink-style?

### Example 3 — Multi-shot experience with specified dialogue (S1 + E2)

**Target model:** `seedance-2.0-standard`
**User input:** *"3 shots, a kid finds a stray cat in the rain, brings it home, mom says {You can keep it}. Make it warm. Keep the line."*

> **Judgment** — VC-fit multi-shot experience serving one warm arc; a dialogue line is a hard constraint.
> **Action** — Rewrite (multi-shot experience mode), dialogue preserved.
> **Result**
> A child crouches under a grey drizzle, finding a soaked stray cat trembling by a wall, and gently lifts it into the shelter of a jacket.
> Cut to the child carrying the small wet cat home through the rain, cradling it close, footsteps quick and careful.
> Inside the warm doorway, the mother kneels to meet them, looks at the shivering cat, and softly says {You can keep it}; the room glows warm. Tender, cozy, gently hopeful.
> **Notes** — Kept the line {You can keep it} verbatim and tagged it as dialogue. Used natural paragraphs rather than numbered shots (you didn't ask to keep the numbering — say so if you'd prefer Shot 1 / 2 / 3).

## Quick Reference

| Input type | Priority judgment | Ask first when… | Default action | Output style |
|:---|:---|:---|:---|:---|
| Single shot with clear subject, action, mood | Likely VC-fit; check if already focused enough | Missing style, frame center, or main state | Rewrite, Light purify, or Pass through | One ready-to-generate prompt |
| Multi-shot narrative serving one unified experience | VC-fit; check emotional / theme / memory through-line | Relationship or progression between shots is unclear | Rewrite preserving structure, group if needed | Natural segments, or keep original structure |
| Many shot numbers / parameters, but an emotional or story scene underneath | VC-translatable; don't block for execution style | Main experience, action, or relationship unclear | De-noise and translate, keep narrative & emotional intent | Drop parameters, natural scene phrasing |
| Brand / character / stylized ad | Partial VC fit; not necessarily a rewrite | Emotional goal or style direction unclear | Light purify or Optional VC version | Keep intent; offer a more experiential version |
| Abstract words only ("freedom", "premium", "powerful") | Insufficient info; don't force a rewrite | Visual anchor, scene, action, or state | Ask first | Ask 1–3 short questions |
| Picture prompt with explicit dialogue / VO / music / SFX | Partial VC; sound content ranks higher | Only when the picture part is underspecified | Preserve the sound, rewrite only the picture | State "sound kept, unchanged" first |
| User explicitly wants shot numbers / parameters / delivery structure kept | Constraints win; don't remove them | Usually no need to ask | Keep original, or add an Optional VC version | Note "kept as the execution draft" |
| Functional demo, UI tutorial, step list | Low fit; goal isn't creative translation | Usually no VC questions | Keep original; suggest splitting if needed | Explain VC isn't recommended |
| Long-form drama needing exact dialogue sync | Low fit; capability / workflow boundary | Usually no VC questions | No VC rewrite; suggest splitting into picture-only segments | Note the picture-only part can be split out |
| Mixed-language creative input with light jargon | Still VC-fit if the underlying experience is clear | Only when subject, relationship, or style unclear | Translate the jargon, keep the core vibe | Output natural English scene phrasing |

## What This Skill Does NOT Do

- Select model variant (`seedance-2.5` / `seedance-2.0-standard` / `seedance-2.0-fast` / `seedance-2.0-mini`), quality, aspect ratio, or duration — see `pixverse:create-video`.
- Engineer precise asset binding, shot order, or single-camera-move control for Seedance's parser — see `pixverse:seedance-prompt-optimize`.
- Rewrite, replace, or delete user-specified dialogue, voiceover, music, or sound effects.
- Add creative elements (characters, plot, scene details, emotional shifts) the user did not write or confirm.
- Force a VC rewrite on low-fit inputs (functional demos, UI tutorials, strict dialogue-synced drama).
- Optimize prompts for non-Seedance models — use `pixverse:prompt-enhance` for V6.

## Related Skills

- `pixverse:seedance-prompt-optimize` — engineer precise multi-modal / multi-shot control for Seedance 2.0 / 2.5 (the complement to this skill).
- `pixverse:prompt-enhance` — prompt optimization for PixVerse V6 and other non-Seedance models.
- `pixverse:create-video` — pick the model variant, quality, duration, and run the generation.
