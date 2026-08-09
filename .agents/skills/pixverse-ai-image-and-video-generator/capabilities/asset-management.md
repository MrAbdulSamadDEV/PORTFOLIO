---
name: pixverse:asset-management
description: Browse, inspect, download, upload, and delete generated media assets and MiniApp projects
---

# Asset Management

Browse, inspect, download, upload, and delete generated video, image, and audio assets or MiniApp projects from your PixVerse account.

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)
- For download: write access to the destination directory

## When to Use

```
Manage assets?
├── Browse history?      → pixverse asset list --type video --json
├── Browse uploads?      → pixverse asset list --source upload --json
├── Browse MiniApps?     → pixverse asset list --type miniapps --json
├── Filter off-peak?     → pixverse asset list --off-peak --json
├── Get details?         → pixverse asset info <id> --json
├── Download?            → pixverse asset download <id> --json
├── Upload file or URL?  → pixverse asset upload <input> --json
└── Delete?              → pixverse asset delete <id> --json
```

## Steps

1. Use `pixverse asset list --json` to browse your generation history.
2. Use `pixverse asset info <id> --json` to inspect a specific asset.
3. Use `pixverse asset download <id> --json` to save an asset locally.
4. Use `pixverse asset upload <input> --json` to upload a local file or HTTPS URL.
5. Use `pixverse asset delete <id> --json` to remove an asset.

For MiniApp projects, use the `project_id` returned by `miniapps create` and pass `--type miniapps` explicitly to every asset operation.

## Commands Reference

### asset list

Browse generation history with pagination.

| Flag | Description | Values |
|:---|:---|:---|
| `--type <video\|image\|audio\|miniapps>` | Asset type | `video` (default), `image`, `audio`, `miniapps` |
| `--source <create\|upload>` | Asset source | `create` (default), `upload` |
| `--off-peak` | Filter off-peak generations only | flag (only valid with `--type video --source create`) |
| `--limit <n>` | Items per page | `1`–`100`, default `20` |
| `--page <n>` | Page number | default `1` |
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "items": [...],
  "total": 100,
  "page": 1,
  "limit": 20,
  "has_more": true
}
```

For `--type miniapps`, the list contains MiniApp projects with normalized `id` values. Projects are created-only: `--source upload` and `--off-peak` are invalid.

### asset info <id>

Get full details of a specific asset.

| Flag | Description | Values |
|:---|:---|:---|
| `--type <video\|image\|audio\|miniapps>` | Asset type (auto-detected if omitted) | `video`, `image`, `audio`; `miniapps` must be explicit |
| `--json` | Output as JSON | flag |

JSON output: full VideoDetail or ImageDetail object from the API.

For `--type miniapps`, JSON preserves the backend project detail and adds stable fields including `id`, `project_id`, `app_id`, `status`, `status_code`, `url`, `first_frame`, `assets`, and `created_at`.

### asset download <id>

Download an asset to the local filesystem.

| Flag | Description | Values |
|:---|:---|:---|
| `--type <video\|image\|audio\|miniapps>` | Asset type (auto-detected if omitted) | `video`, `image`, `audio`; `miniapps` must be explicit |
| `--dest <path>` | Destination directory | default: current directory |
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "id": 123456,
  "type": "video",
  "file": "/path/to/downloaded/file.mp4"
}
```

MiniApp project download resolves and downloads the primary generated child asset: the first video, otherwise the first image. JSON identifies both the project and downloaded child asset:

```json
{
  "id": 987654,
  "type": "miniapps",
  "asset_id": 123456,
  "asset_type": "image",
  "file": "/path/to/downloaded/file.png"
}
```

### asset upload <input>

Upload a local file or HTTPS URL to the asset library.

| Flag | Description | Values |
|:---|:---|:---|
| `<input>` | Local file path or HTTPS URL (required argument) | jpg, png, webp, mp4, mov |
| `--json` | Output as JSON | flag |

> **Image auto-compression:** Local images exceeding `1920×1920` pixels or `5 MB` are auto-resized and re-encoded before upload (progressive JPEG/WebP, transparency preserved). The original file on disk is not modified. Videos are uploaded as-is. Only `https://` URLs are accepted; `http://` is rejected.

JSON output:

```json
{
  "id": 123456,
  "type": "video",
  "name": "clip.mp4",
  "path": "upload/abc123.mp4",
  "url": "https://...",
  "created_at": "2026-01-01T00:00:00Z"
}
```

### asset delete <id>

Delete an asset from your account.

| Flag | Description | Values |
|:---|:---|:---|
| `--type <video\|image\|audio\|miniapps>` | Asset type (auto-detected if omitted) | `video`, `image`, `audio`; `miniapps` must be explicit |
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "id": 123456,
  "type": "video",
  "deleted": true
}
```

MiniApp projects are created-only and delete by `project_id`:

```json
{
  "id": 987654,
  "asset_id": 987654,
  "type": "miniapps",
  "source": "create",
  "deleted": true
}
```

## Examples

List recent videos:

```bash
pixverse asset list --json
```

List uploaded videos:

```bash
pixverse asset list --source upload --json
```

List off-peak video generations:

```bash
pixverse asset list --off-peak --json
```

List images, page 2:

```bash
pixverse asset list --type image --page 2 --json
```

List with custom page size:

```bash
pixverse asset list --type video --limit 50 --json
```

List MiniApp projects:

```bash
pixverse asset list --type miniapps --json
```

Get video details:

```bash
pixverse asset info 123456 --json
```

Get image details:

```bash
pixverse asset info 789012 --type image --json
```

Download a video to current directory:

```bash
pixverse asset download 123456 --json
```

Download to a specific directory:

```bash
pixverse asset download 123456 --dest ./output --json
```

Download an image:

```bash
pixverse asset download 789012 --type image --json
```

Inspect and download a MiniApp project:

```bash
pixverse asset info 987654 --type miniapps --json
pixverse asset download 987654 --type miniapps --dest ./output --json
```

Upload a local file:

```bash
pixverse asset upload ./clip.mp4 --json
```

Upload from a URL:

```bash
pixverse asset upload "https://example.com/photo.jpg" --json
```

Delete an asset:

```bash
pixverse asset delete 123456 --json
```

Delete a MiniApp project:

```bash
pixverse asset delete 987654 --type miniapps --json
```

Pipeline -- create, wait, download:

```bash
VID=$(pixverse create video --prompt "a sunset over the ocean" --json | jq -r '.video_id')
pixverse task wait $VID --json
pixverse asset download $VID --dest ./renders --json
```

## Error Handling

| Exit Code | Meaning |
|:---|:---|
| 0 | Success |
| 1 | Generic API error (e.g., asset not found) |
| 3 | Authentication error (token invalid/expired) |
| 6 | Validation error (invalid flags/arguments) |

## Related Skills

- `pixverse:saved-folders` -- organize assets into named folders
- `pixverse:create-video` -- create videos from text or images
- `pixverse:create-and-edit-image` -- create and edit images
- `pixverse:task-management` -- check status and wait for tasks
- `pixverse:miniapps` -- discover MiniApps and create projects
