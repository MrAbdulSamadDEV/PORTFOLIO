---
name: pixverse:workspace
description: Manage workspaces — list, switch, check status, and open management page. Covers personal vs team context, roles, credits, and the global --workspace-id override.
---

# Workspace Management

Covers: `workspace list`, `workspace status`, `workspace switch`, `workspace manage`

---

## Concepts

**Workspace** is an organizational context that determines which assets, credits, and team members you are working with.

| Type | ID | Description |
|:---|:---|:---|
| Personal | `0` | Default private workspace for the individual user |
| Team | `> 0` | Shared workspace with role-based access and a shared credit pool |

Key facts:
- The **server** is the source of truth for the active workspace — the CLI syncs with it
- All creation commands (`create video`, `create image`, etc.) automatically operate in the active workspace via the `Workspace-Id` HTTP header
- Switching workspace changes which credits are consumed and which assets are visible
- Workspace state persists across CLI sessions in `~/.pixverse/`

### Roles

| Role | Value |
|:---|:---|
| Owner | `owner` |
| Admin | `admin` |
| Member | `member` |
| Guest | `guest` |

---

## Decision Tree

```
Need to manage workspaces?
├── Want to see all available workspaces? → workspace list
├── Want to check which workspace is active? → workspace status
├── Want to change the active workspace? → workspace switch
├── Want to manage team settings in browser? → workspace manage
└── Want to run ONE command in a different workspace without switching?
    → use global --workspace-id flag (see Global Override below)
```

---

## workspace list

List all workspaces the user has access to.

```bash
pixverse workspace list --json
```

JSON output:
```json
{
  "activeWorkspaceId": 42,
  "workspaces": [
    {
      "workspace_id": 0,
      "name": "Personal",
      "role": null,
      "member_count": null
    },
    {
      "workspace_id": 42,
      "name": "My Team",
      "role": "admin",
      "member_count": 15
    }
  ]
}
```

Key fields:
- `activeWorkspaceId` — the currently active workspace (synced from server)
- `workspaces[].workspace_id` — `0` for personal, `> 0` for team
- `workspaces[].role` — user's role in this workspace (`owner`, `admin`, `member`, `guest`, or `null` for personal)
- `workspaces[].member_count` — total members (team workspaces only)

---

## workspace status

Show the currently active workspace.

```bash
pixverse workspace status --json
```

JSON output (personal):
```json
{
  "workspaceId": 0,
  "name": "Personal"
}
```

JSON output (team):
```json
{
  "workspaceId": 42,
  "name": "My Team",
  "role": "admin",
  "memberCount": 15
}
```

JSON output (workspace no longer accessible):
```json
{
  "workspaceId": 42,
  "name": null
}
```

Decision tree:
- If `name` is `null` → the workspace was removed or the user lost access; switch to another workspace

---

## workspace switch

Change the active workspace. The change is persisted across CLI sessions.

### With explicit ID

```bash
pixverse workspace switch 42 --json
```

JSON output:
```json
{
  "workspaceId": 42,
  "name": "My Team",
  "role": "admin"
}
```

Switch to personal:
```bash
pixverse workspace switch 0 --json
```

### Interactive mode (no ID)

```bash
pixverse workspace switch
```

Shows an interactive selection menu with all available workspaces. The current workspace is marked `(current)`.

**Note:** Interactive mode is not available in `--json` mode — you must provide an explicit ID.

### Validation
- Workspace ID must be a non-negative integer (`0` = personal)
- Invalid IDs exit with code 6 (`VALIDATION_ERROR`)

---

## workspace manage

Open the workspace management page in the browser.

```bash
pixverse workspace manage --json
```

JSON output:
```json
{
  "success": true,
  "url": "https://app.pixverse.ai/team"
}
```

Use this to:
- Invite or remove team members
- Change team plan or billing
- Manage workspace settings

---

## Global Override: `--workspace-id`

Run any command in a specific workspace **without switching** the persistent active workspace.

```bash
pixverse --workspace-id 42 create video --prompt "A sunset" --json
pixverse --workspace-id 0 account info --json
```

Key facts:
- Applies to any command as a **global flag** (before the subcommand)
- **Not persisted** — only affects the single command invocation
- Must be a non-negative integer; invalid values exit with code 6
- Does not apply to `workspace switch` (switch always changes persistent state)

Use case: agents or scripts that need to create content across multiple workspaces without calling `switch` between each operation.

---

## Auto-Recovery

When a workspace becomes inaccessible (e.g. user was removed from a team), the CLI automatically:

1. Resets the active workspace to Personal (ID=0)
2. Appends a message: "...switched to personal workspace. Please retry your command."
3. Exits with code 1

**Exceptions** — auto-recovery does NOT trigger when:
- `--workspace-id` override is active (the user explicitly targeted a workspace)
- The failing request is a workspace management endpoint

---

## Error Handling

| Exit Code | Cause | Recovery |
|:---|:---|:---|
| 0 | Success | — |
| 1 | Workspace error (access denied, removed, etc.) | CLI auto-recovers to personal; retry the command |
| 3 | Token expired | Re-run `pixverse auth login --json` |
| 6 | Invalid workspace ID | Provide a valid non-negative integer |

---

## Examples

### Agent workflow: create in a team workspace

```bash
# Check current workspace
WS=$(pixverse workspace status --json)
echo "$WS" | jq -r '.name'

# Switch to team workspace
pixverse workspace switch 42 --json

# Create video (uses team credits)
pixverse create video --prompt "A rocket launch" --json

# Switch back to personal
pixverse workspace switch 0 --json
```

### Agent workflow: create across workspaces without switching

```bash
# Create in team workspace 42
pixverse --workspace-id 42 create video --prompt "Team content" --json

# Create in personal workspace (same session, no switch needed)
pixverse --workspace-id 0 create video --prompt "Personal content" --json
```

### List workspaces and pick the first team workspace

```bash
FIRST_TEAM=$(pixverse workspace list --json | jq '[.workspaces[] | select(.workspace_id > 0)][0].workspace_id')
pixverse workspace switch "$FIRST_TEAM" --json
```

---

## Related Skills

- `pixverse:auth-and-account` — account info shows workspace context and team credits
- `pixverse:batch-creation` — use `--workspace-id` to batch-create across workspaces
