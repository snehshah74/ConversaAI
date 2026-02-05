#!/bin/bash
# Start frontend with workaround for Next.js workspace root 404 issue
# (when package-lock.json exists in parent dirs like ~/)

set -e
cd "$(dirname "$0")"

# Temporarily hide parent lockfile so Next.js uses this directory as root
PARENT_LOCK="$HOME/package-lock.json"
BACKUP="$HOME/package-lock.json.bak"
if [ -f "$PARENT_LOCK" ]; then
  echo "Temporarily moving $PARENT_LOCK to fix 404..."
  mv "$PARENT_LOCK" "$BACKUP"
  trap "mv '$BACKUP' '$PARENT_LOCK' 2>/dev/null; echo 'Restored lockfile'" INT TERM EXIT
fi

echo "Starting frontend on http://localhost:3000"
npm run dev
