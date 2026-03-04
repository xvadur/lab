#!/usr/bin/env bash
set -euo pipefail

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <topic>"
  exit 1
fi

topic_raw="$1"
topic="$(echo "$topic_raw" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g')"
if [[ -z "$topic" ]]; then
  echo "Topic must contain at least one alphanumeric character"
  exit 1
fi

timestamp="$(date +%Y%m%d-%H%M)"
branch="feature/${topic}-${timestamp}"

git checkout -b "$branch"
echo "Created and switched to $branch"
