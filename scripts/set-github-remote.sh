#!/usr/bin/env bash
set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <github-repo-url>"
  echo "Example: $0 git@github.com:your-org/chainlink-convergence-hackathon.git"
  exit 1
fi

url="$1"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$url"
else
  git remote add origin "$url"
fi

echo "origin => $(git remote get-url origin)"
