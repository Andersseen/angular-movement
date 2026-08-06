#!/usr/bin/env bash
# Stop hook: SDD-WORKFLOW.md Phase 6 ("Record") is mandatory but easy to drop when a
# session ends mid-task. Warns — never blocks — when library source changed in the
# working tree without the matching CHANGELOG / STATE bookkeeping.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:-.}" || exit 0
git rev-parse --git-dir >/dev/null 2>&1 || exit 0

changed=$(git status --porcelain -- projects/movement/src 2>/dev/null)
[ -n "$changed" ] || exit 0

missing=''
git status --porcelain -- CHANGELOG.md 2>/dev/null | grep -q . || missing='CHANGELOG.md (Unreleased)'
git status --porcelain -- docs/ai/STATE.md 2>/dev/null | grep -q . ||
  missing="${missing:+$missing, }docs/ai/STATE.md"
[ -n "$missing" ] || exit 0

count=$(echo "$changed" | wc -l | tr -d ' ')
jq -n --arg m "$missing" --arg c "$count" \
  '{systemMessage: ("Phase 6 (Record) pending — " + $c + " library file(s) changed but not recorded in: " + $m)}'
