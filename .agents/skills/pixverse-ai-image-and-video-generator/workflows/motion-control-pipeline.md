---
name: pixverse:motion-control-pipeline
description: Complete pipeline — animate a character image with motion from a reference video, then optionally enhance and download
---

### Decision: Character Image

```
Character image source?
├── Local file   → --image ./character.jpg (auto-uploads)
├── URL          → --image "https://example.com/character.jpg"
└── Uploaded asset → --image <image-id-or-media-path> (skips upload)
```

> **Image requirement**: Must be a clear **half-body or full-body** shot of a character. Cropped faces, group photos, or abstract images will be rejected.

> **Privacy note**: Local files passed via `--image` are uploaded to PixVerse cloud storage for processing. Do not use sensitive or private files.

### Decision: Motion Reference

```
Motion reference source?
├── Previous generation → --video 123456 (video ID)
└── Local video file    → --video ./dance.mp4 (auto-uploads)
```

### Full Example

```bash
# Step 1: Check credits
pixverse account info --json | jq '.credits'

# Step 2: Generate motion-controlled video
RESULT=$(pixverse create motion-control \
  --image ./character.jpg \
  --video 123456 \
  --quality 720p --json)
VIDEO_ID=$(echo "$RESULT" | jq -r '.video_id')

# Step 3: Download
pixverse asset download $VIDEO_ID --json
```

### Motion Control + Post-Process Pipeline

```bash
# Step 1: Generate motion-controlled video
VID=$(pixverse create motion-control \
  --image ./character.jpg \
  --video 123456 \
  --quality 720p --json | jq -r '.video_id')
pixverse task wait $VID --json

# Step 2: Upscale to 2160p
FINAL=$(pixverse create upscale \
  --video $VID \
  --quality 2160p --json | jq -r '.video_id')
pixverse task wait $FINAL --json

# Step 3: Download
pixverse asset download $FINAL --json
```

### Multiple Variations

```bash
# Generate 4 variations
VIDEO_IDS=$(pixverse create motion-control \
  --image ./character.jpg \
  --video 123456 \
  --count 4 --no-wait --json | jq -r '.video_ids[]')

for ID in $VIDEO_IDS; do
  pixverse task wait $ID --json
  pixverse asset download $ID --json
done
```

### Related Skills

`pixverse:motion-control`, `pixverse:post-process-video`, `pixverse:task-management`, `pixverse:asset-management`
