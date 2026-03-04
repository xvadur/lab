#!/usr/bin/env bash
set -euo pipefail

git fetch origin
git rebase origin/main
