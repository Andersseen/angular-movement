#!/usr/bin/env bash
# Compact session bootstrap: repo state + the live parts of STATE.md + open specs,
# in one call instead of reading five docs end to end.
#
# Does NOT replace docs/ai/ — read the full file whenever you are about to touch
# the area it covers. This is the "where am I" pass, not the "how do I" pass.
set -uo pipefail
cd "${CLAUDE_PROJECT_DIR:-.}" || exit 1

echo "=== REPO ==="
git log --oneline -5
echo ""
git status --porcelain || true
echo ""
echo "branch: $(git rev-parse --abbrev-ref HEAD)   last tag: $(git describe --tags --abbrev=0 2>/dev/null || echo none)"
echo "lib version: $(node -p "require('./projects/movement/package.json').version" 2>/dev/null || echo '?')"

echo ""
echo "=== STATE.md (header + in-progress + next up + gotchas) ==="
awk '
  /^\*\*Last updated/ , /^## What is DONE/ { if (!/^## What is DONE/) print }
  /^## In progress/ , /^## Known gotchas/ { print }
  /^## Known gotchas/ , /^## How to update/ { if (!/^## How to update/ && !/^## Known gotchas/) print }
' docs/ai/STATE.md 2>/dev/null

echo ""
echo "=== OPEN SPECS ==="
for f in docs/ai/specs/[0-9]*.md; do
  [ -e "$f" ] || continue
  status=$(grep -m1 -oE '\*\*Status:\*\*.*' "$f" | sed 's/\*\*Status:\*\* *//')
  case "$status" in
    *done*|*blocked*) continue ;;
  esac
  echo "$f — $status"
  grep -m3 -E '^- \[ \]' "$f" | sed 's/^/    next: /'
done

echo ""
echo "=== CHANGELOG (Unreleased) ==="
awk '/^## \[?Unreleased/,/^## \[?[0-9]/ { if (!/^## \[?[0-9]/) print }' CHANGELOG.md 2>/dev/null | head -25
