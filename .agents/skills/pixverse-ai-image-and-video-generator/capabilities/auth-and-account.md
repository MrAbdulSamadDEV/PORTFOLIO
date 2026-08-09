---
name: pixverse:auth-and-account
description: Authenticate with PixVerse, check account info, manage credits, configure CLI defaults, and understand workspace-aware behavior
---

# Auth and Account Management

Covers: `auth login`, `auth logout`, `auth status`, `account info`, `account usage`, `subscribe`, `config set/get/list/reset/path/defaults`

---

## auth login

OAuth device flow — the CLI prints an authorization URL, the user opens it in a browser and authorizes, and the token is stored automatically.

```bash
pixverse auth login --json
```

**Browser auto-open behavior:**
- In **interactive mode** (no `--json` / `-p`), the CLI tries to open the authorization URL in the system default browser (`open` on macOS, `xdg-open` on Linux, `Start-Process` on Windows). Failure to open is non-fatal — the URL is still printed.
- In **JSON / pipe mode** (`--json` or `-p`), the CLI does **not** auto-open a browser, so automation environments stay side-effect-free. Agents must read `verification_uri_complete` (or the printed URL) from the output and route the user to it themselves.

JSON output on success:
```json
{
  "success": true,
  "email": "user@example.com",
  "nickname": "user",
  "memberType": 2,
  "tokenExpiresIn": 2592000
}
```

After login, the CLI automatically syncs the active workspace from the server.

Decision tree:
- If exit code 0 -> login succeeded, token is stored in `~/.pixverse/`
- If exit code 1 -> unexpected error, check stderr
- If the user does not complete the browser authorization within the timeout, the command will fail

---

## auth status

Check whether the CLI is currently authenticated and display user info.

```bash
pixverse auth status --json
```

JSON output when logged in:
```json
{
  "authenticated": true,
  "email": "user@example.com",
  "nickname": "user",
  "memberType": "Pro",
  "credits": 650
}
```

JSON output when not logged in (exit code 3):
```json
{
  "authenticated": false,
  "message": "Not logged in"
}
```

Decision tree:
- If `authenticated` is `true` -> proceed with CLI commands
- If `authenticated` is `false` -> run `pixverse auth login --json` first

---

## auth logout

Remove the stored token.

```bash
pixverse auth logout --json
```

JSON output:
```json
{
  "success": true,
  "message": "Token removed"
}
```

Logout also resets the active workspace to personal (ID=0).

---

## account info

Display account details, workspace context, and credit balance. Output varies depending on whether the active workspace is personal or a team.

```bash
pixverse account info --json
```

### JSON output (personal workspace)

```json
{
  "accountId": 12345,
  "email": "user@example.com",
  "nickname": "user",
  "username": "user",
  "memberType": 2,
  "memberLabel": "Pro",
  "isCreator": false,
  "credits": {
    "daily": 100,
    "membership": 500,
    "bonus": 50,
    "total": 650,
    "highQualityTimes": 10,
    "renewalCredits": 500,
    "used": null
  },
  "workspace": {
    "workspaceId": 0,
    "name": "Personal",
    "role": null,
    "memberType": 2,
    "memberLabel": "Pro",
    "memberCount": null,
    "seats": null
  }
}
```

### JSON output (team workspace)

```json
{
  "accountId": 12345,
  "email": "user@example.com",
  "nickname": "user",
  "username": "user",
  "memberType": 3,
  "memberLabel": "Premium",
  "isCreator": false,
  "credits": {
    "daily": null,
    "membership": null,
    "bonus": null,
    "total": 5000,
    "highQualityTimes": null,
    "renewalCredits": null,
    "used": 1200
  },
  "workspace": {
    "workspaceId": 42,
    "name": "My Team",
    "role": "admin",
    "memberType": 3,
    "memberLabel": "Premium",
    "memberCount": 15,
    "seats": 20
  }
}
```

Key fields:
- `credits.total` — total available credits (personal breakdown or team pool)
- `credits.used` — credits consumed (team workspaces only; `null` in personal)
- `credits.daily` / `membership` / `bonus` — personal breakdown (`null` in team context)
- `workspace.workspaceId` — `0` for personal, `> 0` for team
- `workspace.name` — workspace display name
- `workspace.role` — user's role in this workspace (`owner`, `admin`, `member`, `guest`, or `null`)
- `workspace.seats` — total seats in team plan (`null` in personal)
- `memberType` — subscription tier (0 = Free, 1 = Basic, 2 = Pro, 3 = Premium/Team)
- `memberLabel` — human-readable subscription name (always "Premium" in team context)

Decision tree:
- If `credits.total` > 0 -> user can create content
- If `credits.total` == 0 -> wait for daily reset or upgrade subscription at https://app.pixverse.ai/subscribe
- If in a team workspace and credits are low -> team admin should manage via `pixverse workspace manage`
- If exit code 3 -> token expired, re-run `pixverse auth login --json`

---

## account usage

View credit usage history. Behavior differs between personal and team workspaces.

### Personal workspace

```bash
pixverse account usage --json --type used --limit 10
```

Options:
| Flag | Values | Default | Description |
|:---|:---|:---|:---|
| `--type` | `all`, `earned`, `used` | `all` | Filter by transaction type (personal only) |
| `--limit` | 1–100 | `20` | Number of items per page |
| `--page` | any positive integer | `1` | Page number |

JSON output:
```json
{
  "total": 100,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "id": 1,
      "type": "used",
      "amount": -10,
      "description": "Video generation",
      "createdAt": "2026-03-01T12:00:00Z"
    }
  ]
}
```

### Team workspace

```bash
pixverse account usage --json --limit 10
```

In a team workspace, the command shows **your personal usage within the team** (last 30 days).

**Important:** The `--type` filter is not supported in team workspaces — only `all` is accepted. Using `--type earned` or `--type used` in a team workspace exits with code 6 (`VALIDATION_ERROR`).

JSON output (team):
```json
{
  "total": 50,
  "page": 1,
  "limit": 10,
  "items": [
    {
      "credit_cost": 10,
      "creation_mode": "text_to_video",
      "model": "v6",
      "created_at": "2026-03-30T14:00:00Z"
    }
  ]
}
```

Note: Team usage items have different fields (`credit_cost`, `creation_mode`, `model`) compared to personal usage items.

---

## subscribe

Open the subscription management page in the browser.

```bash
pixverse subscribe --json
```

**Team workspace guard:** If the active workspace is a team workspace (ID > 0), this command exits with code 6 and a message directing you to use `pixverse workspace manage` instead. Team billing is managed by admins through the web dashboard.

```bash
# In a team workspace, this will fail:
pixverse subscribe --json
# → { "error": "You are in a team workspace. Use \"pixverse workspace manage\"..." }

# Switch to personal first, or use workspace manage:
pixverse workspace switch 0 --json
pixverse subscribe --json
```

---

## config commands

### List all config values

```bash
pixverse config list --json
```

### Get a specific config value

```bash
pixverse config get <key> --json
```

Example:
```bash
pixverse config get output-dir --json
```

### Set a config value

```bash
pixverse config set <key> <value> --json
```

Example:
```bash
pixverse config set output-dir /tmp/pixverse-output --json
```

### Reset all config to defaults

```bash
pixverse config reset --json
```

### Show config file path

```bash
pixverse config path --json
```

JSON output:
```json
{
  "path": "/Users/you/.pixverse/config.json"
}
```

### View per-mode creation defaults

```bash
pixverse config defaults show --json
```

JSON output:
```json
{
  "video": {
    "model": "v5.6",
    "quality": "1080p",
    "duration": "5",
    "aspectRatio": "16:9"
  },
  "image": {
    "model": "qwen-image",
    "quality": "1080p",
    "aspectRatio": "1:1"
  }
}
```

### Set per-mode creation defaults

```bash
pixverse config defaults set --mode video --model v6 --quality 1080p --json
```

This sets default values that apply when you run `pixverse create video` without specifying those flags explicitly. Command-line flags always override defaults.

### Reset per-mode creation defaults

```bash
pixverse config defaults reset --json
```

---

## Steps: First-Time Setup Recipe

1. **Install the CLI**
   ```bash
   npm install -g pixverse
   pixverse --version
   ```

2. **Authenticate**
   ```bash
   pixverse auth login --json
   ```
   The CLI will print a URL. Open it in a browser and authorize. On success, the token is stored in `~/.pixverse/`.

3. **Verify authentication**
   ```bash
   pixverse auth status --json
   ```
   Confirm `authenticated` is `true`.

4. **Check credits**
   ```bash
   pixverse account info --json
   ```
   Parse `credits.total` to confirm the user has credits available.

5. **Check usage history** (optional)
   ```bash
   pixverse account usage --json --type used --limit 10
   ```

6. **Configure defaults** (optional)
   ```bash
   pixverse config defaults set --mode video --model v6 --quality 1080p --json
   ```

7. **Token refresh**: If any command exits with code 3, re-run `pixverse auth login --json`.

8. **Server-to-server access key** (optional, for automation without interactive login):
   - Set `PIXVERSE_ACCESS_KEY=<your-access-key>` in the environment.
   - The CLI sends it as the `Access-Key` header when no user token is available.
   - **Auth priority** (first match wins): explicit `Token` header → stored token (from `pixverse auth login`) → `PIXVERSE_ACCESS_KEY` env var.
   - `PIXVERSE_TOKEN` is **not** a supported env var and is ignored by current CLI versions.

---

## Error Handling

| Exit Code | Cause | Recovery |
|:---|:---|:---|
| 0 | Success | -- |
| 1 | Unexpected error | Check stderr for details |
| 3 | Token expired or invalid | Re-run `pixverse auth login --json` |
| Network error | No internet or API unreachable | Check internet connection, retry |

Example error handling:
```bash
pixverse account info --json 2>/tmp/pixverse_err
EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
  CREDITS=$(cat /dev/stdin | jq -r '.credits.total')
  echo "Available credits: $CREDITS"
elif [ $EXIT_CODE -eq 3 ]; then
  echo "Token expired, re-authenticating..."
  pixverse auth login --json
else
  echo "Error (code $EXIT_CODE):"
  cat /tmp/pixverse_err
fi
```

---

## Related Skills

- `pixverse:workspace` — manage workspaces (list, switch, status)
- `pixverse:create-video` — create videos from text or image
- `pixverse:create-and-edit-image` — create or edit images
- `pixverse:task-management` — check generation progress and wait for completion
- `pixverse:asset-management` — browse, download, or delete generated assets
