---
name: pixverse:image-editing-pipeline
description: Iteratively edit an image using I2I — refine until satisfied
---

### Pipeline
1. Create initial image (T2I) or start from existing
2. Review result (download or inspect URL)
3. IF not satisfied → edit with I2I
4. Repeat until satisfied
5. Download final version

### Full Example
```bash
# Step 1: Create initial image
RESULT=$(pixverse create image --prompt "A modern living room with large windows" --model seedream-5.0-lite --quality 1800p --json)
IMAGE_ID=$(echo "$RESULT" | jq -r '.image_id')
IMAGE_URL=$(echo "$RESULT" | jq -r '.image_url')

# Step 2: Review — download to inspect
pixverse asset download $IMAGE_ID --type image --json

# Step 3: Edit — add warm lighting
EDIT_RESULT=$(pixverse create image \
  --prompt "Add warm golden sunset light streaming through the windows" \
  --image "$IMAGE_URL" \
  --model seedream-5.0-lite --quality 1800p --json)
EDIT_ID=$(echo "$EDIT_RESULT" | jq -r '.image_id')

# Step 4: Further edit — add plants
FINAL_RESULT=$(pixverse create image \
  --prompt "Add lush green indoor plants near the windows" \
  --image "$(pixverse asset info $EDIT_ID --type image --json | jq -r '.image_url')" \
  --model seedream-5.0-lite --quality 1800p --json)

# Step 5: Download final
pixverse asset download $(echo "$FINAL_RESULT" | jq -r '.image_id') --type image --json
```

### Prompting Tips
- Be specific about what to change, not what to keep
- Reference spatial locations: "in the top-left corner", "near the window"
- Use style modifiers: "in watercolor style", "photorealistic"

### Related Skills
`pixverse:create-and-edit-image`, `pixverse:asset-management`
