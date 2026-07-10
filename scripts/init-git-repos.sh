#!/usr/bin/env bash
# Initialize Git repositories with branch strategy for all MyEasyHand platform repos

set -euo pipefail

BASE_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ORG="myeasyhand-platform"

REPOS=(
  myeasyhand-api
  myeasyhand-web
  myeasyhand-admin
  myeasyhand-customer-app
  myeasyhand-employee-app
)

for repo in "${REPOS[@]}"; do
  REPO_PATH="$BASE_DIR/$repo"

  if [ ! -d "$REPO_PATH" ]; then
    echo "SKIP: $repo (directory not found)"
    continue
  fi

  echo "=== Initializing $repo ==="
  cd "$REPO_PATH"

  if [ ! -d .git ]; then
    git init -b main
  fi

  git add -A

  if ! git rev-parse --verify HEAD &>/dev/null; then
    git commit -m "$(cat <<'EOF'
chore: initial repository scaffold for MyEasyHand platform

Phase 1 — repository architecture, standard config files, CI/CD workflows,
Docker setup, and folder structure for Clean Architecture implementation.
EOF
)"
  elif ! git diff --cached --quiet 2>/dev/null; then
    git commit -m "chore: update repository scaffold"
  else
    echo "  Already committed, skipping commit"
  fi

  for branch in staging development; do
    if ! git show-ref --verify --quiet "refs/heads/$branch"; then
      git branch "$branch"
    fi
  done

  if ! git remote get-url origin &>/dev/null; then
    git remote add origin "git@github.com:${ORG}/${repo}.git"
    echo "  Remote: git@github.com:${ORG}/${repo}.git"
  fi

  echo "  Branches: $(git branch --list | tr '\n' ' ')"
  echo ""
done

echo "Done! Push with: git push -u origin main staging development"
