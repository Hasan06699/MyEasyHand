#!/usr/bin/env bash
# Add GitHub remotes for all MyEasyHand platform repos

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ORG="${1:-myeasyhand-platform}"

REPOS=(
  myeasyhand-api
  myeasyhand-web
  myeasyhand-admin
  myeasyhand-customer-app
  myeasyhand-employee-app
)

for repo in "${REPOS[@]}"; do
  cd "$BASE_DIR/$repo"
  if git remote get-url origin &>/dev/null; then
    git remote set-url origin "git@github.com:${ORG}/${repo}.git"
  else
    git remote add origin "git@github.com:${ORG}/${repo}.git"
  fi
  echo "$repo → git@github.com:${ORG}/${repo}.git"
done
