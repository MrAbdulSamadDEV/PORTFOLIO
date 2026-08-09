---
name: pixverse:prompt-enhance
description: Optimize user prompts for PixVerse V6 video generation. Only invoke when the user explicitly asks to enhance, improve, or optimize their prompt — never auto-trigger.
---

# Prompt Enhance

Optimize a user's video generation prompt for PixVerse V6. This skill rewrites the prompt structure and language to produce better results from the `create video` command, without changing the user's original creative intent.

## When to Use

**Opt-in only.** Invoke this skill ONLY when the user explicitly asks to enhance, improve, or optimize their prompt. Examples:

- "Enhance my prompt"
- "Help me improve this prompt"
- "Optimize this for video generation"
- "Make this prompt better"
- "Can you polish this before generating?"

**Do NOT auto-invoke** this skill as part of a normal `create video` flow. If the user just says "generate a video of X", go straight to generation without enhancement.

When this skill is used, **clearly state in your response** that you are applying the PixVerse V6 Prompt Enhance skill.

## Scope

- **Create video mode only** — T2V (text-to-video) and I2V (image-to-video)
- **Prompt text only** — this skill optimizes the `--prompt` value; it does not select models, quality, or other parameters
- **No workflows or pipelines** — do not suggest multi-step processes

## Core Principles

### 1. Preserve Original Intent

The user's creative vision is sacred. Enhancement means sharpening what the user already expressed, not expanding or redirecting it.

**Rules:**
- Never add subjects, objects, or characters the user did not mention
- Never change the scene, setting, or environment unless the user described one
- Never alter the mood, tone, or overall vibe
- Never introduce narrative elements (e.g., turning a static description into a story)
- If the user said "a dog running" — the enhanced prompt is still about a dog running, nothing more

### 2. Structured Element Ordering

Reorganize the prompt into a clear structure that V6 parses effectively. Apply this order to whatever elements the user provided — do not invent missing elements:

1. **Subject** — Who or what is in the frame (appearance, defining features)
2. **Action** — What the subject is doing (motion, gesture, behavior)
3. **Scene / Environment** — Where it takes place (setting, background, weather)
4. **Camera / Motion** — How the shot is framed and moves (angle, movement, lens)
5. **Lighting / Atmosphere** — Light source, color temperature, mood of the light

Only include sections that correspond to information the user actually provided. If the user gave no camera direction, do not add one. If there is no scene described, do not fabricate one.

### 3. Camera and Motion Language

V6 has no explicit camera control flags. All camera and motion direction must be expressed as natural language within the prompt text.

**Standard cinematography terms that work:**
- **Movement:** dolly in, dolly out, pan left, pan right, tilt up, tilt down, tracking shot, crane shot, steadicam, handheld, orbit
- **Framing:** close-up, medium shot, wide shot, extreme close-up, over-the-shoulder, bird's-eye view, low angle, high angle, Dutch angle
- **Lens:** shallow depth of field, deep focus, rack focus, wide-angle lens, telephoto lens

**Conflict detection:** If the user's prompt contains contradictory camera directions (e.g., "dolly in while pulling back", "pan left and pan right simultaneously"), flag the conflict and ask the user which to keep. Do not silently resolve it.

### 4. Strip Quality-Booster Fluff

The following types of words and phrases have **no real effect** on V6 output and should be removed:

- Resolution descriptors: "4K", "8K", "UHD", "high resolution"
- Generic quality words: "cinematic", "masterpiece", "award-winning", "professional"
- Detail boosters: "highly detailed", "ultra detailed", "intricate details", "sharp focus"
- Rendering terms: "octane render", "unreal engine", "ray tracing", "photorealistic rendering"

Remove these silently — they are noise. Do not replace them with other filler.

### 5. Verb Precision Over Adjective Stacking

The single most effective enhancement is replacing vague or generic verbs with specific, physical ones. Precise verbs give V6 far stronger motion cues than any amount of adjectives.

- Vague: "a bird flying" → Precise: "a bird gliding with wings fully spread"
- Vague: "water moving" → Precise: "water rushing downstream over smooth rocks"
- Vague: "a person walking" → Precise: "a person striding steadily forward"
- Vague: "a car crashes" → Precise: "a car slams into the barrier, the hood crumples and the rear wheels lift off the ground"
- Vague: "he escapes" → Precise: "he kicks the door open, jumps out, rolls across the pavement"

**Key principle:** One specific verb ("detonates", "pivots", "scrambles") outperforms three adjectives ("dramatic", "intense", "powerful"). When enhancing, upgrade verbs first, strip empty adjectives second.

The sharpening must stay within the user's stated intent. "A bird flying" can become "a bird gliding with wings fully spread" because it is still a bird flying. It must NOT become "a golden eagle soaring over a mountain canyon" — that adds specifics the user never mentioned.

### 6. Multi-Shot Structuring

When the user describes a sequence of events, multiple actions, or scene changes within a single prompt, structure the prompt into numbered shots with timing. This maps to V6's `--multi-shot` mode and produces significantly better results for narrative or action sequences.

**When to apply:**
- The user describes events happening in sequence ("first X, then Y, finally Z")
- The user mentions camera angle changes ("close-up on... then wide shot of...")
- The user describes multiple distinct actions or beats

**Shot format:**
```
Shot 1 (Ns): [framing/camera]. [action description].
Shot 2 (Ns): [framing/camera]. [action description].
...
```

**Rules:**
- Each shot should contain one primary action and one camera perspective
- Allocate timing based on action complexity (simple actions: 2s, complex actions: 3-4s)
- Total shot duration should stay within V6's 1-15s range
- Use clear transitions between shots: "Cut to", "Snap to", or simply the shot number break
- Do not invent shots — only structure what the user already described into distinct beats

**Example:**

User prompt: "A boy and a girl at the beach, fighting, then close-up on the boy, the boy cries"

Enhanced:
```
Shot 1 (3s): A young boy and a young girl on a sandy beach, pushing and shoving each other.
Shot 2 (2s): Cut to a close-up of the boy's face as tears roll down his cheeks.
```

## Output Format

When enhancing a prompt, produce:

### Enhanced Prompt

The rewritten prompt text, ready to be used as the `--prompt` value.

### What Changed

A brief list of what was modified and why:
- Elements reordered for clarity
- Motion descriptions sharpened
- Quality-booster fluff removed
- Camera direction clarified
- (or: no structural issues found, only minor rewording)

### Recommended Flags

Always include:
```
--audio --multi-shot
```
These are recommended to be enabled by default for V6 video generation.

## Examples

### Example 1: Vague prompt

**User prompt:** "a cat sitting on a window"

**Enhanced prompt:** "A cat sitting still on a windowsill, gazing outward"

**What changed:**
- Sharpened the static action ("sitting still", "gazing outward") for better motion clarity
- Added spatial precision ("windowsill" instead of "window") to anchor the subject

---

### Example 2: Prompt with quality fluff

**User prompt:** "cinematic 4K shot of a woman dancing in the rain, highly detailed, masterpiece quality, octane render"

**Enhanced prompt:** "A woman dancing in the rain, her arms raised and spinning slowly, raindrops splashing around her feet"

**What changed:**
- Removed quality-booster fluff ("cinematic", "4K", "highly detailed", "masterpiece quality", "octane render") — these have no effect on V6
- Sharpened the dance motion with physical detail

---

### Example 3: Camera direction with conflict

**User prompt:** "a car chase scene, camera zooming in and pulling back at the same time, fast paced"

**Enhanced prompt:** Cannot fully enhance — camera conflict detected.

**Conflict:** "zooming in and pulling back" are contradictory camera movements. Please choose one:
- Option A: "camera rapidly dollying in toward the cars"
- Option B: "camera pulling back to reveal the full chase"

---

### Example 4: Prompt with image input (I2V)

**User prompt:** "make this image come alive with gentle movement" (with `--image` provided)

**Enhanced prompt:** "Gentle motion brings the scene to life, subtle movement across the frame with a soft breeze"

**What changed:**
- Translated the abstract "come alive" into concrete motion language ("subtle movement", "soft breeze")
- Kept it generic since the image provides the visual context

### Example 5: Sequential narrative (multi-shot structuring)

**User prompt:** "a fire truck on a tilting street, the road crumbles, the driver jumps out and the truck falls into a hole"

**Enhanced prompt:**
```
Shot 1 (3s): A fire truck locked its brakes on a tilting street, the cab visible, the driver fighting the wheel as the road beneath the rear wheels begins to crumble.
Shot 2 (2s): The rear axle drops over the edge. The truck pivots. The driver kicks the door open and jumps onto the tilting street surface, rolls, grabs a curb edge as the truck slides past him and drops into the void.
```

**What changed:**
- Structured the sequence into two distinct shots with timing
- Upgraded verbs: "crumbles" → "drops over the edge, pivots"; "jumps out" → "kicks the door open, jumps, rolls, grabs"
- Each shot has one primary action and one camera perspective

---

## What This Skill Does NOT Do

- Select models, quality, aspect ratio, or duration — use `pixverse:create-video` for parameter guidance
- Suggest multi-step workflows or pipelines
- Auto-trigger during normal video generation
- Add creative elements beyond what the user provided
- Judge whether the user's idea is good or feasible
