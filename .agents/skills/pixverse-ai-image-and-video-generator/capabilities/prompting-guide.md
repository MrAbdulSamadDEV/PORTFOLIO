---
name: pixverse:prompting-guide
description: Use when a user supplies (or is about to generate with) a video / image prompt that shows a common prompting weakness, or when the user asks "is my prompt good", "how do I write a better prompt", "why are my results inconsistent", or "how can I improve this". Model-agnostic. Surfaces what the current prompt is and a stronger alternative, with the reason for each change — but ADVISES ONLY. It never edits the user's prompt without explicit consent and never silently rewrites what is passed to generation. Covers prompts that are too long / front-loaded wrong, lean on filler words ("cinematic", "epic", "amazing", "high quality"), stack camera moves, use negative-prompt syntax, lean on "fast" / "quick", or re-describe an uploaded reference image.
---

# Prompting Guide

A model-agnostic advisory layer for generation prompts. It diagnoses common prompt weaknesses, shows the user a stronger alternative **side by side with their original**, and explains why — then waits. It applies a change **only** when the user explicitly accepts it.

These principles hold across transformer-based video models (PixVerse V6 / C1, Veo, Sora, Grok, Seedance, Kling, Happy Horse, …) because they describe how such models *read* a prompt — left to right, with attention decaying, treating all text as positive instruction — not how any one model is wired.

## The Cardinal Rule

**This skill advises. It never silently rewrites the user's prompt.**

1. The prompt that goes to generation is the user's **original, verbatim** — unless the user has *explicitly* accepted a suggested change.
2. Always show the suggestion as a clearly-labeled alternative next to the original. Never present a rewrite as if it were what the user typed.
3. No explicit acceptance → use the original, unchanged. Silence, ambiguity, or "ok go ahead and generate" is **not** consent to alter the wording.

**Violating the letter of this rule is violating its spirit.** "I improved it while I was at it" and "the suggestion was obviously better" are both violations.

## When to Use

- The user asks how to improve a prompt, or why their results are inconsistent / drifting / jittery.
- The user shares a prompt and one or more **smells** below are present.
- You are about to run a generation and the prompt has a clear, high-confidence weakness worth flagging once.

**When NOT to use:**
- The prompt is already clean (no smells) — say so briefly and proceed; do not invent problems.
- The user wants the prompt actually rewritten and applied for a specific model — hand off (see [Related Skills](#related-skills)); those skills still surface their result for the user to accept.
- You'd be flagging the same issue repeatedly — raise it once, then respect the user's choice.

## How It Works

```
User prompt
  │
  ├─ Scan for smells (the 7 checks below)
  │
  ├─ None found ──────────► "Looks solid." Proceed with the original.
  │
  └─ One or more found ───► Show advisory card (Current / Suggested / Why)
                              │
                              ├─ User accepts (explicit) ──► Use the suggested wording
                              ├─ User accepts some ───────► Apply only the accepted parts
                              └─ User declines / silent ──► Use the original, verbatim
```

## The 7 Checks

Each check is a *smell* to scan for, plus the fix to suggest. Cite the check name when you explain a change so the user learns the vocabulary.

### 1. Shorter beats longer

Models read left to right and attention decays — the first sentence carries the most weight; by the third, element consistency is already dropping. A tight ~50–80-word prompt reliably beats a 150–200-word version of the same scene; past that length the model stops treating elements as instructions and starts sampling loosely.

**Suggest** trimming to a tight 3-sentence structure:
1. **Subject + action + location** (who does what, where)
2. **Camera + style** (shot size / movement / lens + a concrete look)
3. **Constraints** (what must stay stable)

### 2. "Cinematic" is near-useless

In training data "cinematic" is attached to wildly different footage — dark thrillers, bright rom-coms, nature docs — so the model samples a broad, fuzzy distribution. The word carries almost no specific meaning.

**Suggest** a specific, vertical reference instead — a named director or an exact lighting setup:
- `Wes Anderson symmetry` → centered framing, soft palette
- `Kubrick one-point perspective` → geometric corridor
- `golden hour backlight, long shadows stretching forward` → does what "cinematic lighting" never could

### 3. Don't stack camera moves

A camera move is a spatial vector, and the model processes vectors **sequentially**, not as one blended motion. Two directions at once ("push in *while* panning left") makes the model try to run both in order — producing jitter at the transition, almost every time.

**Suggest** one primary move + at most one texture modifier:
- Good: `slow push in, slight handheld feel`
- Bad: `push in while panning left`

### 4. There are no negative prompts

These models have no negative-embedding path — **all** text is read as a positive instruction. `negative: jitter, bent limbs, deformation` is parsed as scene description (noise), not as something to avoid, and tends to make results worse.

**Suggest** rewriting each negative as a positive constraint:
- ❌ `negative: jitter, bent limbs, flicker, deformation`
- ✅ `face stable, limbs anatomically natural, consistent lighting with no flicker, body proportions consistent throughout`

### 5. "Fast" / "quick" degrades complex motion

`fast` paired with complex action or camera movement is a top cause of quality loss: competing elements are all forced to run at max speed at once, which produces jitter (two elements) or unrecoverable cumulative error (three+).

**Suggest** conveying speed through physics instead of the word:
- Instead of `running fast`: `feet striking the ground hard, each stride fully extended, arms pumping at 90 degrees`
- One element can carry speed — they just can't all accelerate together.

### 6. Don't re-describe your reference image (image-to-video)

When the prompt re-describes an uploaded image (upload a woman in a red dress, then write "a woman in a red dress…"), the model has **two competing inputs for the same subject** and reconciling them introduces drift — the character comes back slightly wrong each time.

**Suggest** restricting an image-to-video prompt to exactly two things — **motion** and **camera** — and leaving everything already visible in the image out of the text entirely.

### 7. Generic quality words do nothing

`amazing`, `beautiful`, `high quality`, `epic`, `masterpiece`, `4K`, `award-winning` are high-frequency labels tied to an enormous range of outputs — the model can't tell what you mean by them.

**Suggest** replacing each generic adjective with something specific and named:
- a director's name
- an exact lighting setup
- a lens spec, e.g. `anamorphic 2.39:1, lens flare from a practical light source`

## Output Format

When one or more smells are present, present a single advisory card:

> **Your current prompt**
> `<the user's prompt, verbatim>`
>
> **Suggested prompt**
> `<the improved version>`
>
> **Why**
> - `<change>` — *Check N: <name>*
> - `<change>` — *Check N: <name>*
>
> Want me to generate with the **suggested** version, keep **yours as-is**, or tweak it further?

Rules for the card:
- Quote the original exactly. Do not "lightly clean it up" in the Current box.
- Every change in Suggested must map to a named check in Why. No unexplained edits, no new creative content (subjects, settings, mood the user never mentioned).
- End with the choice. Then stop and wait.

## Consent Rules

| Situation | What to use |
|:---|:---|
| User says "use the suggestion" / "yes" / "go with that" / "apply it" | The suggested wording |
| User accepts some changes, rejects others | Only the accepted changes; keep the rest original |
| User says "keep mine" / declines | The original, verbatim |
| User ignores the card and says "just generate" | The original, verbatim |
| User is silent / ambiguous | The original, verbatim — do not assume consent |

If the user asked you to generate in the same breath, the suggestion does **not** block generation. Offer it once; if they don't take it, generate with their original prompt.

## Red Flags — STOP

You are about to break the Cardinal Rule if you catch yourself thinking:
- "The suggestion is clearly better, I'll just use it."
- "They said generate, that's basically consent to my improved version."
- "I'll quietly fix the obvious filler and show them the rest."
- "They accepted last time, so they'd accept this too."

**All of these mean: use the original. Show the suggestion. Wait for an explicit answer.**

## Related Skills

This skill is the **model-agnostic, advice-only front door**. It diagnoses and suggests; it does not own model-specific rewrite syntax, and it never auto-applies.

- `pixverse:prompt-enhance` — actually rewrite a prompt for PixVerse **V6** (opt-in).
- `pixverse:seedance-prompt-optimize` — engineer a prompt for **Seedance 2.0 / 2.5** (multi-modal `@imageN` / shot syntax).
- `pixverse:seedance-vibe-creating` — distill an emotional / atmospheric idea into a Seedance-family prompt.
- `pixverse:create-video` — model and parameter selection.

For model-specific token syntax (e.g. Seedance's `@imageN` binding), hand off to the matching skill above rather than inventing it here.

## What This Skill Does NOT Do

- Rewrite or "clean up" the user's prompt without explicit consent.
- Run generation, or select model / quality / aspect ratio / duration.
- Add creative content the user did not mention.
- Judge whether the user's idea is good — only how clearly the prompt expresses it.
- Replace model-specific optimizers — it points to them.
