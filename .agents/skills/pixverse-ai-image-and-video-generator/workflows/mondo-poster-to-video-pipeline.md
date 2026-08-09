---
name: pixverse:mondo-poster-to-video-pipeline
description: Generate a Mondo-style poster then animate it into a cinematic reveal video — unique PixVerse capability
---

### Pipeline Steps
1. Generate poster image (Mondo prompt + `pixverse create image`)
2. Get `image_url` from result
3. Create animated video from poster (`pixverse create video --image`)
4. Optionally upscale video (`pixverse create upscale`)
5. Download both poster and video

### Animation Prompt Templates for Posters

When animating a static poster, use subtle cinematic effects rather than character movement:

| Effect | Prompt Fragment | Best For |
|:---|:---|:---|
| Cinematic reveal | `Camera slowly pulls back revealing the full poster, cinematic zoom out` | All poster types |
| Light & shadow | `Dramatic lighting shifts across the poster, shadows moving slowly` | Noir, horror |
| Atmospheric particles | `Gentle dust particles floating, subtle atmospheric haze` | Vintage, western |
| Parallax depth | `Layers of the poster move at different speeds creating depth` | Layered compositions |
| Neon glow | `Neon elements pulse and glow with subtle animation` | Sci-fi, cyberpunk |
| Wind / weather | `Gentle wind effect on elements, subtle movement` | Fantasy, nature |
| Ink reveal | `Screen print colors appear one layer at a time, ink being applied` | All Mondo styles |

### Full Example

```bash
# Step 1: Generate Mondo poster
IMG_RESULT=$(pixverse create image \
  --prompt "Kilian Eng style Mondo poster, geometric futuristic cityscape, precise technical line work, isometric perspective, 3-color screen print: teal, purple, black, atmospheric neon-lit depth, retro 1970s sci-fi aesthetic" \
  --model gemini-3.1-flash \
  --quality 2160p \
  --aspect-ratio 16:9 \
  --json)

IMAGE_ID=$(echo "$IMG_RESULT" | jq -r '.image_id')
IMAGE_URL=$(echo "$IMG_RESULT" | jq -r '.image_url')

# Step 2: Download the poster
pixverse asset download $IMAGE_ID --json

# Step 3: Animate into video
VID_RESULT=$(pixverse create video \
  --prompt "Camera slowly pulls back revealing the full sci-fi cityscape, neon elements pulse with subtle glow, gentle atmospheric particles floating, cinematic zoom out reveal" \
  --image "$IMAGE_URL" \
  --model v6 \
  --quality 1080p \
  --duration 5 \
  --json)

VIDEO_ID=$(echo "$VID_RESULT" | jq -r '.video_id')
pixverse task wait $VIDEO_ID --json

# Step 4: Upscale to 2160p
UPSCALE_RESULT=$(pixverse create upscale \
  --video $VIDEO_ID \
  --quality 2160p \
  --json)

FINAL_VIDEO_ID=$(echo "$UPSCALE_RESULT" | jq -r '.video_id')

# Step 5: Download final video
pixverse asset download $FINAL_VIDEO_ID --json
```

### Simplified Version (Poster + Quick Animation)

```bash
# Generate poster
IMG=$(pixverse create image \
  --prompt "Olly Moss style Mondo poster, astronaut silhouette with alien planet in negative space, 2-color: orange, black, minimal" \
  --model gemini-3.1-flash --quality 2160p --aspect-ratio 2:3 --json)

IMAGE_URL=$(echo "$IMG" | jq -r '.image_url')

# Animate with subtle reveal
VID=$(pixverse create video \
  --prompt "Slow cinematic zoom out revealing the full poster, subtle dust particles floating" \
  --image "$IMAGE_URL" \
  --model v6 --quality 1080p --duration 5 --json)

VIDEO_ID=$(echo "$VID" | jq -r '.video_id')
pixverse asset download $VIDEO_ID --json
```

### Genre-Specific Animation Suggestions

| Poster Genre | Animation Effect | Sound Prompt |
|:---|:---|:---|
| Horror | `Shadows creep slowly across the design, flickering light` | `Eerie ambient drone, distant whispers` |
| Sci-Fi | `Neon elements pulse, camera slowly orbits` | `Electronic hum, distant machinery` |
| Western | `Dust blows gently, warm light shifts` | `Desert wind, distant horizon ambiance` |
| Noir | `Venetian blind shadows sweep across, rain appears` | `Rain on pavement, jazz piano distant` |
| Fantasy | `Magical particles drift upward, ethereal glow` | `Mystical ambient tones, wind chimes` |
| Music / Jazz | `Stage lights sweep, warm spotlight glow` | `Soft jazz intro, vinyl crackle` |

### Related Skills
`pixverse:mondo-poster-design`, `pixverse:mondo-poster-pipeline`, `pixverse:create-video`, `pixverse:post-process-video`, `pixverse:asset-management`
