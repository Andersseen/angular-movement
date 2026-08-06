#!/usr/bin/env bash
# PostToolUse hook: flags library files that touch browser globals without an SSR guard.
#
# BEST-PRACTICES.md §2 — the demo site is SSR-rendered by AnalogJS, so an unguarded
# `window`/`document`/observer reference in the library crashes the prerender, not the browser.
#
# Reads the hook payload on stdin, exits 2 (feeds stderr back to Claude) when unguarded.
set -uo pipefail

file=$(jq -r '.tool_input.file_path // empty')
[ -n "$file" ] || exit 0
[ -f "$file" ] || exit 0

case "$file" in
  *projects/movement/src/lib/*.ts) ;;
  *) exit 0 ;;
esac
case "$file" in
  *.spec.ts) exit 0 ;;
esac

# A file-level `ssr-safe:` comment is a deliberate, reviewed exception.
if grep -q 'ssr-safe:' "$file"; then
  exit 0
fi

# Any of these count as a file-level guard: the platform check or the DI token.
# `DOCUMENT` (the Angular token) is uppercase and never matches the globals below,
# which is intentional — injecting DOCUMENT is the SSR-safe way to reach the document.
if grep -qE 'isPlatformBrowser|inject\(DOCUMENT\)|PLATFORM_ID' "$file"; then
  exit 0
fi

globals="window document navigator localStorage sessionStorage matchMedia getComputedStyle
IntersectionObserver ResizeObserver MutationObserver requestAnimationFrame cancelAnimationFrame"

# A `typeof X` check anywhere in the file guards every use of X in it — the call sites
# sit inside that branch, which line-by-line matching cannot see.
unguarded=''
for g in $globals; do
  grep -qE "typeof[[:space:]]+$g" "$file" && continue
  unguarded="${unguarded:+$unguarded|}$g"
done
[ -n "$unguarded" ] || exit 0

hits=$(grep -nE "(^|[^.[:alnum:]_\$])($unguarded)[^[:alnum:]_]" "$file" \
  | grep -vE ":[[:space:]]*(//|\*|/\*)" \
  || true)
[ -n "$hits" ] || exit 0

{
  echo "SSR guard missing in $file (BEST-PRACTICES.md §2)."
  echo "Browser globals used with no isPlatformBrowser / DOCUMENT-token guard:"
  echo "$hits" | head -10
  echo "Guard them with isPlatformBrowser(inject(PLATFORM_ID)) or inject the DOCUMENT token."
  echo "If the call is genuinely unreachable on the server, record why with an"
  echo "\`// ssr-safe: <reason>\` comment in the file instead of leaving it implicit."
} >&2
exit 2
