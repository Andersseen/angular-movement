---
name: verify
description: Runs the SDD-WORKFLOW Phase 5 verification gate for this repo — library tests, lint, build, and the conditional e2e / pack checks — picking which conditionals apply from what actually changed. Use before reporting any task done, before committing library changes, and before tagging a release.
---

# Verify

The Phase 5 gate from `docs/ai/SDD-WORKFLOW.md`. Nothing is "done" until this passes. Never report
success with a failing step, and never say "should work" — run it.

## 1. Decide which checks apply

```bash
git status --porcelain && git diff --name-only HEAD
```

| Changed                                                          | Adds                               |
| ---------------------------------------------------------------- | ---------------------------------- |
| `projects/movement/src/**`                                       | core suite (always)                |
| `src/app/pages/**`, `src/app/shared/**`                          | `pnpm e2e`                         |
| `projects/movement/package.json`, `public-api.ts`, `movement.ts` | `pnpm pack:check`                  |
| docs only (`*.md`, `docs/**`)                                    | `pnpm format` only — skip the rest |

## 2. Core suite — in this order

```bash
pnpm test:coverage    # Vitest, library, no watch
pnpm run lint         # ESLint
pnpm build            # also type-checks the library through the Vite alias
pnpm format           # Prettier, always last
```

Order matters: `pnpm build` is the only step that type-checks the library against the demo site, so
it must run after the code is settled and before formatting rewrites files.

## 3. Conditionals

```bash
pnpm e2e              # Playwright — demo routes
pnpm pack:check       # ng build movement + pnpm pack --dry-run
```

If `pnpm e2e` fails on a port conflict, retry with `E2E_PORT=5174 pnpm exec playwright test`
(documented in `RELEASE_CHECKLIST.md`).

## 4. Surface checks — when the API may have moved

If any directive selector, input, or export changed, run these instead of re-reading the source:

```bash
node .claude/scripts/api-surface.mjs
```

For a full audit, hand off to the `public-api-guard` and `docs-drift-checker` agents.

## 5. Report

State each command and its real result. On failure: paste the actual failing output, fix it, and
re-run the whole gate — a partial re-run does not count. If a step cannot be fixed, report the exact
output to the user rather than working around it.

When everything passes, remember Phase 6 is still owed: `CHANGELOG.md` (Unreleased) and
`docs/ai/STATE.md`. The Stop hook will warn if you skip it.
