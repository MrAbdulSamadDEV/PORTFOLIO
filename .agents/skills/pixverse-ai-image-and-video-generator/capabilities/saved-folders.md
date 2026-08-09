---
name: pixverse:saved-folders
description: Organize generated and uploaded assets into named folders — create, browse, rename, and manage folder contents
---

# Saved Folders

Organize your generated and uploaded assets into named folders for easy retrieval and management.

## Prerequisites

- PixVerse CLI installed and authenticated (`pixverse auth login`)

## When to Use

```
Want to organize assets?
├── See all folders?            → pixverse saved list --json
├── Browse folder contents?     → pixverse saved items <folder_id> --json
├── Create a folder?            → pixverse saved new <name> --json
├── Rename a folder?            → pixverse saved rename <folder_id> <name> --json
├── Add assets to a folder?     → pixverse saved add <ids...> --type video --json
├── Remove assets from folder?  → pixverse saved remove <ids...> --type video --json
└── Delete a folder?            → pixverse saved delete <folder_id> --json
```

## Concepts

- Every account has a **default** folder (referenced as `default` in CLI commands).
- The default folder cannot be renamed or deleted.
- Folders hold references to assets — deleting a folder does not delete the assets themselves.
- Assets are classified by **type** (`video` or `image`) and **source** (`create` for generated, `upload` for uploaded).

---

## Commands Reference

### saved list

List all saved folders.

| Flag | Description | Values |
|:---|:---|:---|
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "folders": [
    {
      "folder_id": 666666,
      "folder_label": "default",
      "name": "Saved",
      "asset_count": 42,
      "created_at": "2026-01-01T00:00:00Z"
    }
  ],
  "total": 1
}
```

### saved items [folder_id]

List assets in a folder.

| Flag | Description | Values |
|:---|:---|:---|
| `[folder_id]` | Folder ID (positional argument) | `default` (default), or numeric ID |
| `--type <type>` | Asset type filter | `all` (default), `video`, `image` |
| `--source <source>` | Asset source filter | `create` (default), `upload` |
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

### saved new <name>

Create a new folder.

| Flag | Description | Values |
|:---|:---|:---|
| `<name>` | Folder name (required argument) | -- |
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "folder_id": 12345,
  "folder_label": "12345",
  "name": "My Folder"
}
```

### saved rename <folder_id> <name>

Rename an existing folder. Cannot rename the default folder.

| Flag | Description | Values |
|:---|:---|:---|
| `<folder_id>` | Folder ID (required argument) | numeric ID |
| `<name>` | New folder name (required argument) | -- |
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "folder_id": 12345,
  "folder_label": "12345",
  "name": "New Name",
  "renamed": true
}
```

### saved add <ids...>

Add one or more assets to a folder.

| Flag | Description | Values |
|:---|:---|:---|
| `<ids...>` | Asset IDs to add (required argument, space-separated) | -- |
| `--folder <folder_id>` | Target folder | `default` (default), or numeric ID |
| `--type <type>` | Asset type (**required**) | `video`, `image` |
| `--source <source>` | Asset source | `create` (default), `upload` |
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "folder_id": 666666,
  "folder_label": "default",
  "added": [123456, 123457]
}
```

### saved remove <ids...>

Remove one or more assets from a folder.

| Flag | Description | Values |
|:---|:---|:---|
| `<ids...>` | Asset IDs to remove (required argument, space-separated) | -- |
| `--folder <folder_id>` | Target folder | `default` (default), or numeric ID |
| `--type <type>` | Asset type (**required**) | `video`, `image` |
| `--source <source>` | Asset source | `create` (default), `upload` |
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "folder_id": 666666,
  "folder_label": "default",
  "removed": [123456, 123457]
}
```

### saved delete <folder_id>

Delete a folder. Cannot delete the default folder.

| Flag | Description | Values |
|:---|:---|:---|
| `<folder_id>` | Folder ID (required argument) | numeric ID |
| `--json` | Output as JSON | flag |

JSON output:

```json
{
  "folder_id": 12345,
  "folder_label": "12345",
  "deleted": true
}
```

---

## Examples

List all folders:

```bash
pixverse saved list --json
```

Browse videos in the default folder:

```bash
pixverse saved items --json
```

Browse uploaded images in a specific folder:

```bash
pixverse saved items 12345 --type image --source upload --json
```

Create a folder and add videos to it:

```bash
FOLDER=$(pixverse saved new "Project Alpha" --json | jq -r '.folder_id')
pixverse saved add 111 222 333 --folder "$FOLDER" --type video --json
```

Remove assets from a folder:

```bash
pixverse saved remove 111 222 --folder 12345 --type video --json
```

Rename and then delete a folder:

```bash
pixverse saved rename 12345 "Archived" --json
pixverse saved delete 12345 --json
```

Pipeline -- create video, then organize into a folder:

```bash
VID=$(pixverse create video --prompt "A sunset over the ocean" --json | jq -r '.video_id')
pixverse saved add "$VID" --type video --json
```

---

## Error Handling

| Exit Code | Meaning |
|:---|:---|
| 0 | Success |
| 1 | Generic API error (e.g., folder not found) |
| 3 | Authentication error (token invalid/expired) |
| 6 | Validation error (invalid folder ID, missing --type, cannot rename/delete default folder) |

## Related Skills

- `pixverse:asset-management` -- browse, download, upload, and delete individual assets
- `pixverse:create-video` -- create videos from text or images
- `pixverse:create-and-edit-image` -- create and edit images
