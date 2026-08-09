---
name: pixverse:video-production
description: Full video production pipeline — create, extend, upscale, add voiceover/music, and download
---

### Pipeline
1. Create base video (T2V, I2V, or Motion Control)
2. Optionally extend duration
3. Upscale to final resolution
4. Optionally generate a voiceover (`create voice`) or music track (`create music`) and mux it on with `ffmpeg`
5. Download

### Full Example
```bash
# Step 1: Create base video
RESULT=$(pixverse create video --prompt "A person walking through a forest" --model v6 --quality 720p --duration 5 --json)
VID=$(echo "$RESULT" | jq -r '.video_id')

# Step 2: Extend to make it longer
EXTENDED=$(pixverse create extend --video $VID --prompt "Continue walking deeper into the forest" --duration 5 --json | jq -r '.video_id')
pixverse task wait $EXTENDED --json

# Step 3: Upscale to 2160p
FINAL=$(pixverse create upscale --video $EXTENDED --quality 2160p --json | jq -r '.video_id')
pixverse task wait $FINAL --json

# Step 4: Download
pixverse asset download $FINAL --json
```

### Variations
- **Motion control start**: Replace Step 1 with `pixverse create motion-control --image ./char.jpg --video <ref-id> --json` to animate a character with reference motion, then continue with extend/upscale
- **Add a voiceover** (after upscale): generate the audio standalone, then mux it on — speech is no longer a video command:
  ```bash
  pixverse create voice --text "Welcome to the forest" --output ./vo.mp3 --json
  VIDEO_FILE=$(pixverse asset download $FINAL --dest . --json | jq -r '.file')
  ffmpeg -i "$VIDEO_FILE" -i ./vo.mp3 -c:v copy -c:a aac -shortest ./final.mp4
  ```
- **Add a music track**: `pixverse create music --prompt "calm ambient forest score" --output ./score.mp3 --json`, then mux the same way
- Skip extend if original duration is sufficient

### Related Skills
`pixverse:create-video`, `pixverse:motion-control`, `pixverse:post-process-video`, `pixverse:create-voice`, `pixverse:create-music`, `pixverse:task-management`, `pixverse:asset-management`
