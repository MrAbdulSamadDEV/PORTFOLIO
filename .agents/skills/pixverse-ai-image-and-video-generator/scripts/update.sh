#!/bin/bash
# PixVerse Skills — pull latest version from GitHub
# Safe: checks for local changes before pulling.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

cd "$REPO_ROOT"

# Ensure this is a git repo
if [ ! -d ".git" ]; then
  echo "Error: $REPO_ROOT is not a git repository. Re-clone from https://github.com/PixVerseAI/skills.git"
  exit 1
fi

# Check for uncommitted changes
if ! git diff --quiet HEAD 2>/dev/null; then
  echo "Warning: you have local changes. Stashing before update..."
  git stash
  STASHED=1
else
  STASHED=0
fi

OLD_VERSION=$(tr -d '[:space:]' < VERSION 2>/dev/null || echo "unknown")

echo "This will pull the latest skills from GitHub and may modify local files."
read -p "Continue? [y/N] " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

git pull origin main --rebase

NEW_VERSION=$(tr -d '[:space:]' < VERSION 2>/dev/null || echo "unknown")

# Restore stashed changes if any
if [ "$STASHED" -eq 1 ]; then
  git stash pop || echo "Warning: stash pop had conflicts. Resolve manually."
fi

if [ "$OLD_VERSION" = "$NEW_VERSION" ]; then
  echo "Already up-to-date (v${NEW_VERSION})."
else
  echo "Updated: v${OLD_VERSION} → v${NEW_VERSION}"
fi
