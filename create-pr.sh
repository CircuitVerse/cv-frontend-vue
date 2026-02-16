#!/usr/bin/env bash
set -euo pipefail

# Script to push current changes to your fork and create a PR against CircuitVerse/cv-frontend-vue
# This script DOES NOT contain any tokens. Authenticate locally via `gh auth login` or set GITHUB_PAT.

GITHUB_USER="s1dhu98"
FORK_REMOTE="fork"
BRANCH="feat/live-theme-editor"
ORIGIN_OWNER="CircuitVerse"
REPO="cv-frontend-vue"
PR_TITLE="feat: Live Theme Editor (cute & night-sky themes)"
PR_BODY_FILE=".github/PULL_REQUEST_TEMPLATE.md"
COMMIT_MSG="feat: add Live Theme Editor with default themes, export/import, contrast check"

echo "Creating branch $BRANCH..."
git checkout -b "$BRANCH"

echo "Staging changes..."
git add -A
if git diff --cached --quiet; then
  echo "No staged changes to commit; skipping commit step."
else
  echo "Committing changes as $GITHUB_USER..."
  GIT_AUTHOR_NAME="$GITHUB_USER" \
  GIT_AUTHOR_EMAIL="$GITHUB_USER@users.noreply.github.com" \
  GIT_COMMITTER_NAME="$GITHUB_USER" \
  GIT_COMMITTER_EMAIL="$GITHUB_USER@users.noreply.github.com" \
  git commit -m "$COMMIT_MSG"
fi

if ! git remote get-url "$FORK_REMOTE" >/dev/null 2>&1; then
  echo "Adding fork remote (ssh). If you prefer HTTPS, update the remote manually."
  git remote add "$FORK_REMOTE" "git@github.com:${GITHUB_USER}/${REPO}.git"
fi

echo "Pushing branch to fork..."
git push -u "$FORK_REMOTE" "$BRANCH"

if command -v gh >/dev/null 2>&1; then
  echo "Creating PR using gh CLI..."
  gh pr create --title "$PR_TITLE" --body-file "$PR_BODY_FILE" --base main --head "${GITHUB_USER}:${BRANCH}"
  exit 0
fi

if [ -z "${GITHUB_PAT:-}" ]; then
  echo "gh CLI not found and GITHUB_PAT not set. Install and authenticate gh, or export GITHUB_PAT and re-run."
  exit 1
fi

BODY_CONTENT=$(sed 's/"/\\"/g' "$PR_BODY_FILE" | sed ':a;N;$!ba;s/\n/\\n/g')
read -r -d '' PAYLOAD <<EOF
{
  "title": "${PR_TITLE}",
  "head": "${GITHUB_USER}:${BRANCH}",
  "base": "main",
  "body": "${BODY_CONTENT}"
}
EOF

echo "Creating PR via GitHub API..."
curl -s -H "Authorization: token ${GITHUB_PAT}" \
     -H "Accept: application/vnd.github+json" \
     https://api.github.com/repos/${ORIGIN_OWNER}/${REPO}/pulls \
     -d "$PAYLOAD" | jq -r '.html_url // .message' || echo "PR creation response above"
