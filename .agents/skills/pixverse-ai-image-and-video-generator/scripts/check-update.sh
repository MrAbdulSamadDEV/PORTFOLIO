#!/bin/bash
# PixVerse Skills — version check
# Called via !`bash ...` in SKILL.md or manually.
# Compares local VERSION against GitHub remote. Prints nothing if up-to-date.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
VERSION_FILE="$REPO_ROOT/VERSION"
REMOTE_URL="https://raw.githubusercontent.com/PixVerseAI/skills/main/VERSION"

# Read local version
if [ ! -f "$VERSION_FILE" ]; then
  echo "> **PixVerse Skills**: VERSION file missing. Run \`bash skills/scripts/update.sh\` to fix."
  exit 0
fi
LOCAL_VERSION=$(tr -d '[:space:]' < "$VERSION_FILE")

# Fetch remote version (2s timeout, fail silently)
REMOTE_VERSION=$(curl -sf --max-time 2 "$REMOTE_URL" 2>/dev/null | tr -d '[:space:]' || true)

if [ -z "$REMOTE_VERSION" ]; then
  # Network unreachable — skip silently
  exit 0
fi

if [ "$LOCAL_VERSION" != "$REMOTE_VERSION" ]; then
  echo "> **PixVerse Skills update available**: v${LOCAL_VERSION} → v${REMOTE_VERSION}. Run \`bash skills/scripts/update.sh\` to update."
fi
