---
name: pixverse:storyboard-to-video
description: Full pipeline — decompose a prompt into 4 shots, generate a storyboard image, split it, generate 4 I2V videos, and concatenate into a final video
---

# Storyboard to Video

Generate a complete multi-shot video from a single prompt (and optional reference image). The agent decomposes the idea into 4 shots, produces a storyboard image, splits it into frames, generates a video from each frame, and concatenates them into a final video.

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)
- Local dependencies: `imagemagick` and `ffmpeg`

## Pipeline Overview

```
User input (prompt + optional image)
    │
    ▼
Step 0: Dependency check
    │
    ▼
Step 1: Agent decomposes prompt into 4 shots
    │
    ▼
Step 2: Generate 2x2 storyboard image (pixverse create image)
    │
    ▼
Step 3: Download + split into 4 images (imagemagick)
    │
    ▼
Step 4: Wait for in-flight tasks, then 4x parallel I2V (pixverse create video)
    │
    ▼
Step 5: Download 4 videos + concatenate (ffmpeg)
```

---

## Step 0: Dependency Check

Before starting, verify all required tools are available. If any are missing, inform the user and ask for confirmation to install.

```bash
# Check pixverse CLI
pixverse --version

# Check imagemagick
magick --version || convert --version

# Check ffmpeg
ffmpeg -version
```

If `imagemagick` or `ffmpeg` is missing:
- **macOS**: Ask the user for confirmation, then `brew install imagemagick ffmpeg`
- **Linux**: Ask the user for confirmation, then `sudo apt-get install imagemagick ffmpeg` (or equivalent)
- **Do NOT install without user confirmation**

Only proceed to Step 1 after all dependencies are confirmed.

---

## Step 1: Decompose Prompt into 4 Shots

The agent (you) breaks the user's prompt into 4 shot descriptions. This is done inline — no external model call needed.

**Rules:**
1. Divide the prompt into 4 shots, each focusing on a different temporal stage
2. Follow the prompt's logical order; if abstract, interpret with the best-fitting narrative tone
3. For each shot, choose one camera angle (e.g., wide shot, close-up, low angle, medium shot, tracking shot)
4. If subjects/objects appear across shots, describe their appearance consistently so they can be differentiated
5. Apply a consistent visual style across all 4 shots — if the user didn't specify, default to realistic
6. Strip all dialogue — keep only visual scene descriptions
7. Each shot description must be under 60 words

**Output format:**

```
Shot 1: [description, < 60 words]
Shot 2: [description, < 60 words]
Shot 3: [description, < 60 words]
Shot 4: [description, < 60 words]
```

Present the 4 shots to the user before proceeding.

---

## Step 2: Generate Storyboard Image

Generate a 2x2 storyboard grid image using PixVerse image creation.

### If user provided a reference image (T2I + reference)

```bash
pixverse create image \
  --prompt "Based on the uploaded image, create a 2x2 stitched storyboard with four panels. Each panel represents one shot: Shot 1: [shot1 text]. Shot 2: [shot2 text]. Shot 3: [shot3 text]. Shot 4: [shot4 text]. The relevant subjects from the uploaded image should appear consistently across panels. Panels flow seamlessly without dividing lines." \
  --image <user_image_path> \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 1:1 \
  --json
```

### If user provided text only (T2I)

```bash
pixverse create image \
  --prompt "Create a 2x2 stitched storyboard with four panels. Each panel represents one shot: Shot 1: [shot1 text]. Shot 2: [shot2 text]. Shot 3: [shot3 text]. Shot 4: [shot4 text]. Characters and subjects should remain consistent across all panels. Panels flow seamlessly without dividing lines." \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 1:1 \
  --json
```

Parse the `image_id` and `image_url` from the output.

**Why `gemini-3.1-flash`:** This model best follows layout instructions like "2x2 grid" and supports up to 2160p, giving each panel enough detail after splitting.

**Why `1:1` aspect ratio:** A square grid splits evenly into 4 equal panels.

---

## Step 3: Download and Split

Download the storyboard image and split it into 4 equal quadrants.

```bash
# Download the storyboard image
curl -sL "<image_url>" -o /tmp/storyboard.png

# Split into 4 quadrants (top-left, top-right, bottom-left, bottom-right)
# First get the dimensions
SIZE=$(magick identify -format "%wx%h" /tmp/storyboard.png)
W=$(echo $SIZE | cut -dx -f1)
H=$(echo $SIZE | cut -dx -f2)
HALF_W=$((W / 2))
HALF_H=$((H / 2))

magick /tmp/storyboard.png -crop ${HALF_W}x${HALF_H}+0+0 +repage /tmp/shot1.png
magick /tmp/storyboard.png -crop ${HALF_W}x${HALF_H}+${HALF_W}+0 +repage /tmp/shot2.png
magick /tmp/storyboard.png -crop ${HALF_W}x${HALF_H}+0+${HALF_H} +repage /tmp/shot3.png
magick /tmp/storyboard.png -crop ${HALF_W}x${HALF_H}+${HALF_W}+${HALF_H} +repage /tmp/shot4.png
```

Verify all 4 images exist before proceeding.

---

## Step 4: Generate 4 I2V Videos

### 4a: Wait for In-Flight Tasks

Before submitting the 4 video generation requests, check if there are any previously submitted PixVerse tasks still running in this session. If so, wait for them to complete first.

```bash
# For each previously tracked video_id that is still in-flight:
pixverse task wait <in_flight_video_id> --json
```

Only proceed to submit the 4 new requests after all prior tasks have finished.

### 4b: Generate Videos

For each of the 4 split images, run I2V with a prompt based on the corresponding shot description from Step 1. The agent should write each prompt by combining:
- The shot description from Step 1
- Visual understanding of the split image

Apply `pixverse:prompt-enhance` principles to each I2V prompt — use precise verbs, no quality-booster fluff.

```bash
VID1=$(pixverse create video --image /tmp/shot1.png --prompt "<shot 1 I2V prompt>" --model v6 --duration 5 --audio --multi-shot --no-wait --json | jq -r '.video_id')
VID2=$(pixverse create video --image /tmp/shot2.png --prompt "<shot 2 I2V prompt>" --model v6 --duration 5 --audio --multi-shot --no-wait --json | jq -r '.video_id')
VID3=$(pixverse create video --image /tmp/shot3.png --prompt "<shot 3 I2V prompt>" --model v6 --duration 5 --audio --multi-shot --no-wait --json | jq -r '.video_id')
VID4=$(pixverse create video --image /tmp/shot4.png --prompt "<shot 4 I2V prompt>" --model v6 --duration 5 --audio --multi-shot --no-wait --json | jq -r '.video_id')
```

Then wait for all 4:

```bash
pixverse task wait $VID1 --json
pixverse task wait $VID2 --json
pixverse task wait $VID3 --json
pixverse task wait $VID4 --json
```

---

## Step 5: Download and Concatenate

Download all 4 completed videos and concatenate them into a single final video.

```bash
# Download each video
V1_URL=$(pixverse task wait $VID1 --json | jq -r '.video_url')
V2_URL=$(pixverse task wait $VID2 --json | jq -r '.video_url')
V3_URL=$(pixverse task wait $VID3 --json | jq -r '.video_url')
V4_URL=$(pixverse task wait $VID4 --json | jq -r '.video_url')

curl -sL "$V1_URL" -o /tmp/vid1.mp4
curl -sL "$V2_URL" -o /tmp/vid2.mp4
curl -sL "$V3_URL" -o /tmp/vid3.mp4
curl -sL "$V4_URL" -o /tmp/vid4.mp4

# Concatenate with ffmpeg
# Use filter_complex to handle potential resolution/fps differences
ffmpeg -y \
  -i /tmp/vid1.mp4 -i /tmp/vid2.mp4 -i /tmp/vid3.mp4 -i /tmp/vid4.mp4 \
  -filter_complex "\
    [0:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v0]; \
    [1:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v1]; \
    [2:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v2]; \
    [3:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v3]; \
    [v0][0:a][v1][1:a][v2][2:a][v3][3:a]concat=n=4:v=1:a=1[outv][outa]" \
  -map "[outv]" -map "[outa]" \
  -c:v libx264 -preset fast -crf 18 \
  -c:a aac -b:a 192k \
  /tmp/storyboard_final.mp4
```

If any video lacks an audio stream (no `--audio` or generation failed to produce audio), use this fallback concat that handles missing audio:

```bash
ffmpeg -y \
  -i /tmp/vid1.mp4 -i /tmp/vid2.mp4 -i /tmp/vid3.mp4 -i /tmp/vid4.mp4 \
  -filter_complex "\
    [0:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v0]; \
    [1:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v1]; \
    [2:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v2]; \
    [3:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v3]; \
    [v0][v1][v2][v3]concat=n=4:v=1:a=0[outv]" \
  -map "[outv]" \
  -c:v libx264 -preset fast -crf 18 \
  /tmp/storyboard_final.mp4
```

Report the final video path to the user:
```
Final video saved to: /tmp/storyboard_final.mp4
```

---

## Error Recovery

| Step | Failure | Recovery |
|:---|:---|:---|
| Step 0 | Missing dependency | Ask user to install, do not proceed |
| Step 2 | Image generation fails (exit 5) | Retry with simplified storyboard prompt |
| Step 3 | Split fails | Check image downloaded correctly, verify dimensions |
| Step 4 | One or more I2V fails (exit 5) | Report which shot(s) failed, offer to retry those |
| Step 4 | In-flight task wait times out (exit 2) | Increase timeout or ask user to retry later |
| Step 5 | ffmpeg concat fails | Fall back to video-only concat (no audio), report to user |

---

## Related Skills

- `pixverse:prompt-enhance` -- optimize I2V prompts for each shot (principles applied in Step 4)
- `pixverse:create-video` -- I2V generation details and model constraints
- `pixverse:create-and-edit-image` -- storyboard image generation details
- `pixverse:task-management` -- task polling and waiting
- `pixverse:asset-management` -- download completed assets
