#!/usr/bin/env bash
set -euo pipefail

git add -A
if git diff --cached --quiet; then
  echo "No changes to commit"
else
  msg="chore: update $(date +%F-%H%M)"
  git commit -m "$msg"
fi

git push -u origin HEAD
