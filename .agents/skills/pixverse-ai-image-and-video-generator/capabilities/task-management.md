---
name: pixverse:task-management
description: Check generation task or MiniApp project status and wait for completion
---

# Task Management

Check the status of generation tasks or MiniApp projects and wait for them to complete.

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)
- One or more task IDs (`video_id`, `image_id`, or `audio_id`) from `pixverse create`, or a `project_id` from `pixverse miniapps create`

## When to Use

```
Check on a generation?
├── Check one status? → pixverse task status <id> --json
├── Check several in parallel? → pixverse task status <id1> <id2> ... --json
├── Check a MiniApp project? → pixverse task status <project_id> --type miniapps --json
└── Wait until done? → pixverse task wait <id> [--type miniapps] --json --timeout 300
```

Use task management when:

- You submitted a creation with `--no-wait` and need to check on it later
- You want to poll a previously submitted task
- You are running batch workflows and need to track multiple tasks

## Steps

1. Note the `video_id`, `image_id`, `audio_id`, or MiniApp `project_id` from the creation output.
2. Use `pixverse task status <id> --json` for one task, or pass multiple IDs to query them in parallel. Add `--type miniapps` for project IDs.
3. If not yet complete, use `pixverse task wait <id> --json` to block until done. Add `--type miniapps` for a project.
4. Parse the JSON output to get the final result (URL, metadata).

## Commands Reference

### task status <ids...>

Check current generation status without waiting. One positional ID preserves the original single-object JSON shape. Two or more positional IDs use the batch result map. The existing comma-separated `--ids` form also always uses the batch shape.

| Flag | Description | Values |
|:---|:---|:---|
| `--type <video\|image\|audio\|miniapps>` | Task type | `video` (default), `image`, `audio`, `miniapps` |
| `--ids <id1,id2,...>` | Alternative comma-separated batch syntax | Do not combine with positional IDs |
| `--json` | Output as JSON | flag |

Batch behavior:

- Queries all unique IDs in parallel.
- De-duplicates repeated IDs.
- Captures per-ID failures in the result map instead of aborting the other queries.
- Do not rely on exit code alone: inspect every keyed result for an `error` field.

JSON output (video):

```json
{
  "id": 123456,
  "type": "video",
  "status": "processing",
  "status_code": 10,
  "prompt": "...",
  "model": "v5.6",
  "created_at": "...",
  "video_url": null,
  "cover_url": null,
  "duration": null
}
```

JSON output (image):

```json
{
  "id": 789012,
  "type": "image",
  "status": "completed",
  "status_code": 1,
  "prompt": "...",
  "model": "qwen-image",
  "created_at": "...",
  "image_url": "https://..."
}
```

JSON output (MiniApp project):

```json
{
  "id": 987654,
  "type": "miniapps",
  "status": "processing",
  "status_code": 10,
  "app_id": "magic_extend",
  "created_at": "...",
  "url": null,
  "assets": []
}
```

JSON output (batch):

```json
{
  "123456": { "id": 123456, "type": "video", "status": "processing", "status_code": 10 },
  "123457": { "error": "Task not found", "code": 400001, "trace_id": "..." }
}
```

### task wait <id>

Block until a generation task completes or times out.

| Flag | Description | Values |
|:---|:---|:---|
| `--type <video\|image\|audio\|miniapps>` | Task type | `video` (default), `image`, `audio`, `miniapps` |
| `--timeout <seconds>` | Max wait time | default `300` |
| `--json` | Output as JSON | flag |

JSON output (video completed):

```json
{
  "id": 123456,
  "type": "video",
  "status": "completed",
  "video_url": "https://...",
  "cover_url": "https://...",
  "prompt": "...",
  "model": "v5.6",
  "duration": 5,
  "created_at": "..."
}
```

JSON output (image completed):

```json
{
  "id": 789012,
  "type": "image",
  "status": "completed",
  "image_url": "https://...",
  "prompt": "...",
  "model": "qwen-image",
  "created_at": "..."
}
```

JSON output (MiniApp project completed):

```json
{
  "id": 987654,
  "type": "miniapps",
  "status": "completed",
  "app_id": "magic_extend",
  "url": "https://...",
  "assets": [
    { "type": "image", "id": 123456, "url": "https://..." }
  ],
  "created_at": "..."
}
```

## Status Codes

| Code | Label | Meaning | Action |
|:---|:---|:---|:---|
| 5 | WAITING | Queued | Keep polling |
| 9 | QUEUE | In queue | Keep polling |
| 10 | PROCESSING | Generating | Keep polling |
| 1 | NORMAL | Done -- success | Use result |
| 8 | FAILED | Generation failed | Exit code 5 |
| 7 | NOT_APPROVED | Content policy violation | Exit code 5 |

## Examples

Check video status:

```bash
pixverse task status 123456 --json
```

Check image status:

```bash
pixverse task status 789012 --type image --json
```

Check several tasks in parallel:

```bash
pixverse task status 123456 123457 123458 --type video --json

# Existing comma-separated form remains supported:
pixverse task status --ids 123456,123457,123458 --type video --json
```

Check or wait for a MiniApp project:

```bash
pixverse task status 987654 --type miniapps --json
pixverse task wait 987654 --type miniapps --timeout 600 --json
```

Batch project status queries are also supported when every ID is a MiniApp `project_id`:

```bash
pixverse task status 987654 987655 --type miniapps --json
```

Wait for video completion:

```bash
pixverse task wait 123456 --json
```

Wait with extended timeout:

```bash
pixverse task wait 123456 --timeout 600 --json
```

Wait for image completion:

```bash
pixverse task wait 789012 --type image --json
```

Batch workflow -- submit multiple, then wait:

```bash
VID1=$(pixverse create video --prompt "ocean waves" --no-wait --json | jq -r '.video_id')
VID2=$(pixverse create video --prompt "mountain sunset" --no-wait --json | jq -r '.video_id')
pixverse task wait $VID1 --json
pixverse task wait $VID2 --json
```

## Error Handling

| Exit Code | Meaning |
|:---|:---|
| 0 | Success -- task completed |
| 2 | Timeout -- task did not complete within the specified time. Increase `--timeout` or accept partial result |
| 3 | Authentication error (token invalid/expired) |
| 4 | Credit/subscription limit reached |
| 5 | Generation failed or content policy violation |
| 6 | Validation error (invalid ID/type or mixing positional IDs with `--ids`) |
| 7 | Concurrent generation limit; wait for a slot and retry |

For a batch containing different typed errors, the process exit code is deterministic and uses this priority: authentication (`3`) > insufficient credits (`4`) > concurrency limit (`7`) > timeout (`2`) > generation failure (`5`). Results for every ID are still emitted before exit.

Exit code 2 (TIMEOUT) is the most common error for task management. If a task consistently times out, consider:

- Increasing the `--timeout` value
- Checking system status or trying again later
- Using `task status` to inspect the current state without blocking

## Related Skills

- `pixverse:create-video` -- create videos from text or images
- `pixverse:create-and-edit-image` -- create and edit images
- `pixverse:asset-management` -- browse, download, and delete assets
- `pixverse:miniapps` -- discover MiniApps and create projects
