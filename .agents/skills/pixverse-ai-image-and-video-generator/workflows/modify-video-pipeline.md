---
name: pixverse:modify-video-pipeline
description: Complete pipeline — edit video content with AI (replace subjects, swap outfits, change scenes), then optionally upscale and download
---

### Decision: Video Source

```
Video source?
├── Video ID from a previous generation → --video 123456
└── Local file                          → --video ./my-video.mp4 (auto-uploads)
```

> **Privacy note**: Local files passed via `--video` are uploaded to PixVerse cloud storage for processing. Do not use sensitive or private files.

### Decision: Keyframe

```
Which moment to modify?
├── First frame (default) → --keyframe-time 0 (or omit)
└── Specific time         → --keyframe-time <ms> (e.g. 3000 for 3 seconds)
```

### Full Example

```bash
# Modify a video at the 2-second mark
RESULT=$(pixverse create modify \
  --video 123456 \
  --prompt "Transform the sky into a vivid aurora borealis" \
  --keyframe-time 2000 \
  --quality 720p --json)
VIDEO_ID=$(echo "$RESULT" | jq -r '.video_id')

# Download
pixverse asset download $VIDEO_ID --json
```

### Modify + Post-Process Pipeline

```bash
# Step 1: Modify the video
MODIFIED=$(pixverse create modify \
  --video 123456 \
  --prompt "Add dramatic storm clouds and lightning" \
  --json | jq -r '.video_id')
pixverse task wait $MODIFIED --json

# Step 2: Upscale
FINAL=$(pixverse create upscale \
  --video $MODIFIED \
  --quality 2160p --json | jq -r '.video_id')

# Step 3: Download
pixverse asset download $FINAL --json
```

### Related Skills

`pixverse:modify-video`, `pixverse:post-process-video`, `pixverse:asset-management`
