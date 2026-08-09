---
name: pixverse:miniapps
description: Discover PixVerse MiniApps, inspect their live parameter schemas, create projects, and manage the generated project assets
---

# PixVerse MiniApps

PixVerse MiniApps are preset, single-purpose generators. The CLI discovers the available apps and their parameter schemas from the backend instead of bundling a fixed local catalog.

## Prerequisites

- PixVerse CLI v1.3.0 or later, installed and authenticated (`pixverse auth login`)
- A valid subscription and enough credits for the selected MiniApp
- For upload parameters, a PixVerse media path returned by `pixverse asset upload`

## When to Use

```text
Run a MiniApp?
├── Discover available apps?   → pixverse miniapps list --json
├── Learn an app's parameters? → pixverse miniapps info <id> --json
├── Submit a project?          → pixverse miniapps create --id <id> --params <json> --json
├── Check or wait?             → pixverse task status|wait <project_id> --type miniapps --json
└── Inspect/download/delete?   → pixverse asset <command> <project_id> --type miniapps --json
```

Always call `miniapps info <id> --json` before constructing `--params`. App availability and schemas are backend-defined and can change independently of the CLI.

## Discover MiniApps

### miniapps list

List the apps currently available to the authenticated user. Apps with `can_create: false` are omitted.

```bash
pixverse miniapps list --json
```

```json
{
  "items": [
    {
      "app_id": "magic_extend",
      "name": "Magic Extend",
      "description": "Extend an image beyond its original frame",
      "can_create": true
    }
  ]
}
```

Human-readable output uses an ID / Name / Description table.

### miniapps info <id>

Fetch one app's live details. In JSON mode the original backend payload is preserved and a flat `params_schema` is added.

```bash
pixverse miniapps info magic_extend --json
```

Each normalized parameter contains:

| Field | Meaning |
|:---|:---|
| `name` | Key to place in the `--params` JSON object |
| `component` | Backend renderer component, when different from `name` |
| `required` | Whether the field must be supplied |
| `type` | `enum`, `upload`, `text`, or `unknown` |
| `options` | Allowed submitted values for an enum |
| `max_count` | Maximum number of uploaded media paths, when declared |
| `max_video_size_mb` | Per-video size limit, when declared |
| `max_length` | Text length limit, when declared |
| `note` | Explanation when the type cannot be inferred |

Example normalized fragment:

```json
{
  "app_id": "magic_extend",
  "params_schema": [
    {
      "name": "image",
      "required": true,
      "type": "upload",
      "max_count": 1
    },
    {
      "name": "ratio",
      "required": true,
      "type": "enum",
      "options": ["16:9", "9:16"]
    }
  ]
}
```

The normalizer flattens schema groups and reports fields it cannot infer as `unknown`; it does not invent types, defaults, or enum values. Human-readable output also prints a required-fields-only, copy-pasteable `miniapps create` example.

## Create a Project

```bash
pixverse miniapps create \
  --id magic_extend \
  --params '{"image":"<media-path>","ratio":"16:9"}' \
  --json
```

| Flag | Description | Values / Default |
|:---|:---|:---|
| `--id <app_id>` | MiniApp ID | required; obtain from `miniapps list` |
| `--params <input>` | App arguments as a JSON object | required; literal JSON, file path, or `-` for stdin |
| `--output <path>` | Download the completed project's primary asset | optional destination directory |
| `--no-wait` | Return immediately after submission | flag |
| `--timeout <seconds>` | Polling timeout | default `300` |
| `--json` | Pure JSON output | required for agent workflows |

`--params` must parse as a JSON object. Arrays, primitives, malformed JSON, missing `--id`, and missing `--params` are validation errors. The CLI validates JSON syntax but leaves app-specific field validation to the backend.

Parameters from files or stdin:

```bash
pixverse miniapps create --id image_region_editor --params ./args.json --json
printf '%s' '{"image":"upload/example.png"}' | \
  pixverse miniapps create --id image_region_editor --params - --json
```

### Media parameters

Upload fields require PixVerse media paths, not local paths or URLs. Upload first and use the returned `path`:

```bash
MEDIA_PATH=$(pixverse asset upload ./source.png --json | jq -r '.path')
SCHEMA=$(pixverse miniapps info magic_extend --json)

pixverse miniapps create \
  --id magic_extend \
  --params "$(jq -nc --arg image "$MEDIA_PATH" '{image: $image, ratio: "16:9"}')" \
  --no-wait \
  --json
```

### Submitted JSON

With `--no-wait`, creation returns the project query ID:

```json
{
  "id": 987654,
  "project_id": 987654,
  "app_id": "magic_extend",
  "trace_id": "...",
  "status": "submitted"
}
```

Use `project_id` for every later `task` and `asset` command.

### Completed JSON

When waiting succeeds, the project payload includes the following fields. `trace_id` is present when the API returned a trace header:

```json
{
  "id": 987654,
  "project_id": 987654,
  "app_id": "magic_extend",
  "status": "completed",
  "status_code": 1,
  "url": "https://...",
  "first_frame": "https://...",
  "assets": [
    { "type": "image", "id": 123456, "url": "https://..." }
  ],
  "created_at": "2026-08-05T00:00:00Z",
  "trace_id": "..."
}
```

When `--output` is supplied, `local_path` is added. If a project has multiple assets, only the primary asset is downloaded: the first video, otherwise the first image.

## Manage a Project

MiniApp projects use `project_id` and always require the explicit `--type miniapps` selector:

```bash
pixverse task status 987654 --type miniapps --json
pixverse task wait 987654 --type miniapps --json
pixverse asset list --type miniapps --json
pixverse asset info 987654 --type miniapps --json
pixverse asset download 987654 --type miniapps --dest ./output --json
pixverse asset delete 987654 --type miniapps --json
```

Projects are not included in asset type auto-detection. They are created-only, so `--source upload` is invalid with `--type miniapps`. `asset download` downloads only the primary underlying video or image.

## End-to-End Agent Pattern

```bash
APP_ID=magic_extend
SCHEMA=$(pixverse miniapps info "$APP_ID" --json)

# Construct PARAMS from .params_schema and user input.
PARAMS='{"image":"upload/example.png","ratio":"16:9"}'

PROJECT_ID=$(pixverse miniapps create \
  --id "$APP_ID" \
  --params "$PARAMS" \
  --no-wait \
  --json | jq -r '.project_id')

pixverse task wait "$PROJECT_ID" --type miniapps --json
pixverse asset download "$PROJECT_ID" --type miniapps --dest ./output --json
```

## Error Handling

| Exit Code | Meaning |
|:---|:---|
| 0 | Success |
| 1 | API or app-specific error |
| 2 | Project polling timed out |
| 3 | Authentication expired |
| 4 | Insufficient credits |
| 5 | Project generation failed or was rejected |
| 6 | Invalid ID, JSON, flags, or timeout |
| 7 | Concurrent generation limit; wait and retry safely |

## Related Skills

- `pixverse:asset-management` — project listing, inspection, download, and deletion
- `pixverse:task-management` — project status and polling
- `pixverse:auth-and-account` — authentication and credit checks
