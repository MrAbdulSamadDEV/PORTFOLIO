---
name: pixverse:text-to-video-pipeline
description: Complete pipeline — generate a video from a text prompt and download it
---

### Pipeline Steps
1. Check auth: `pixverse auth status --json`
2. Check credits: `pixverse account info --json` → verify `credits.total > 0`
3. Create video: `pixverse create video --prompt "..." --json`
4. (Built-in wait by default; or with `--no-wait` use: `pixverse task wait <id> --json`)
5. Download: `pixverse asset download <video_id> --json`

### Full Example
```bash
# Step 1: Verify authentication
pixverse auth status --json

# Step 2: Check credits
CREDITS=$(pixverse account info --json | jq -r '.credits.total')
if [ "$CREDITS" -lt 1 ]; then echo "Insufficient credits"; exit 1; fi

# Step 3: Create video (waits by default)
RESULT=$(pixverse create video --prompt "A majestic eagle soaring over snow-capped mountains at golden hour" --model v6 --quality 1080p --aspect-ratio 16:9 --duration 5 --json)
VIDEO_ID=$(echo "$RESULT" | jq -r '.video_id')

# Step 4: Download
pixverse asset download $VIDEO_ID --json
```

### Error Recovery
- Exit 3 → re-authenticate: `pixverse auth login --json`
- Exit 4 → insufficient credits, wait for daily reset or upgrade
- Exit 5 → generation failed, try a different prompt or parameters
- Exit 2 → timeout, re-check with `pixverse task status <id> --json`

### Related Skills
`pixverse:create-video`, `pixverse:task-management`, `pixverse:asset-management`, `pixverse:auth-and-account`
