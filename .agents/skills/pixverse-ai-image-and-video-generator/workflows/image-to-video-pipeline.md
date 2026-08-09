---
name: pixverse:image-to-video-pipeline
description: Complete pipeline — animate an image into a video and download it
---

### Decision: Image Source
```
Image source?
├── Local file → --image ./photo.jpg (auto-uploads to PixVerse cloud storage)
├── URL → --image "https://example.com/photo.jpg"
└── Uploaded asset → --image <image-id-or-media-path> (skip upload)
```

> **Privacy note**: Local files passed via `--image` are uploaded to PixVerse cloud storage for processing. Do not use sensitive or private files.

### Full Example
```bash
# Create video from image
RESULT=$(pixverse create video \
  --prompt "Gently animate this landscape with flowing water and swaying trees" \
  --image ./landscape.jpg \
  --model v6 --quality 1080p --json)
VIDEO_ID=$(echo "$RESULT" | jq -r '.video_id')

# Download
pixverse asset download $VIDEO_ID --json
```

### Related Skills
`pixverse:create-video`, `pixverse:asset-management`
