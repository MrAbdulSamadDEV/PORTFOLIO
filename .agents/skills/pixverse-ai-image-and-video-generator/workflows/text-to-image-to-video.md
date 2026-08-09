---
name: pixverse:text-to-image-to-video
description: Generate an image from text, then animate it into a video
---

### Pipeline Steps
1. Auth check
2. Create image: `pixverse create image --prompt "..." --json` → extract `image_id`
3. Wait for image: (built-in, or `pixverse task wait <image_id> --type image --json`)
4. Get image URL: `pixverse asset info <image_id> --type image --json` → extract `image_url`
5. Create video from image: `pixverse create video --prompt "..." --image <image_url> --json`
6. Wait for video
7. Download video

### Full Example
```bash
# Step 1: Generate image
IMG_RESULT=$(pixverse create image --prompt "A cyberpunk cityscape at night with neon lights" --model gemini-3.1-flash --quality 2160p --json)
IMAGE_ID=$(echo "$IMG_RESULT" | jq -r '.image_id')

# Step 2: Get image URL
IMAGE_URL=$(pixverse asset info $IMAGE_ID --type image --json | jq -r '.image_url')

# Step 3: Animate into video
VID_RESULT=$(pixverse create video --prompt "Camera slowly pans across the neon-lit cityscape" --image "$IMAGE_URL" --quality 1080p --json)
VIDEO_ID=$(echo "$VID_RESULT" | jq -r '.video_id')

# Step 4: Download
pixverse asset download $VIDEO_ID --json
```

### Related Skills
`pixverse:create-and-edit-image`, `pixverse:create-video`, `pixverse:asset-management`
