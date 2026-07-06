# SDD WORKFLOW — Spec-Driven Development Process

Every non-trivial task follows this loop: **Understand → Spec → Plan → Implement → Verify → Record.**
"Non-trivial" = anything beyond a typo/copy fix, a doc tweak, or a one-line bug fix with an obvious cause.

## Phase 0 — Session bootstrap (every session, ~2 minutes)

1. Read `docs/ai/CONTEXT.md` and `docs/ai/STATE.md`.
2. Run `git status` and `git log --oneline -5` to see where the repo actually is.
3. Check `docs/ai/specs/` for an existing spec covering your task. If one exists, resume it — don't restart.

## Phase 1 — Understand

- Read the code you will touch **before** proposing anything. Minimum:
  the target file(s), their `.spec.ts`, and one similar existing implementation
  (e.g. adding an interaction directive → read `move-hover.directive.ts` end to end).
- Restate the task in one sentence. If you cannot, ask the user — do not guess requirements.

## Phase 2 — Spec (write it BEFORE any code)

1. Copy `docs/ai/specs/_TEMPLATE.md` to `docs/ai/specs/NNN-short-name.md`
   (NNN = next number: `001`, `002`, …).
2. Fill in every section. The two sections that catch most errors:
   - **Out of scope** — what you will NOT touch (be explicit: files, APIs, behaviors).
   - **Acceptance criteria** — checkable statements, each verifiable by a command or a manual step.
3. If the task changes public API (`lib/movement.ts` exports, directive selectors, input names),
   the spec MUST say so explicitly and get user confirmation before implementation.
4. Show the spec to the user for approval when the task is ambiguous or user-facing.
   For clearly-scoped internal work, proceed but keep the spec as the contract.

## Phase 3 — Plan

Inside the spec's "Implementation plan" section, list ordered steps with exact file paths.
Rules of thumb:

- Smallest viable change; no opportunistic refactors (file a note in the spec's "Follow-ups" instead).
- New directive → follow the 6-step checklist in `docs/ai/ARCHITECTURE.md`.
- Touching engines (`engines/`) is high-risk: everything depends on them. Plan extra test coverage.

## Phase 4 — Implement

- Follow `docs/ai/BEST-PRACTICES.md` — those rules are mandatory.
- Work in spec order; tick checkboxes in the spec as you go (it doubles as progress tracking, so a
  session that dies mid-task can be resumed by the next one).
- Write/update the colocated `.spec.ts` in the same step as the code, not "at the end".

## Phase 5 — Verify (all must pass — no exceptions, no "should work")

```bash
pnpm test:coverage       # library unit tests, no watch
ng lint                  # ESLint
pnpm build               # demo site production build — also type-checks the library via the alias
pnpm format              # Prettier (run last)
```

- If the change affects a demo page or user-visible behavior: `pnpm e2e` (Playwright) or at
  minimum `pnpm dev` and manually verify the affected route.
- If the change affects the npm package output: `pnpm pack:check`.
- If any step fails: fix it. If you cannot, report the exact failing output to the user —
  never claim success with failing checks.

## Phase 6 — Record (mandatory, this is what keeps sessions cheap)

1. Mark acceptance criteria in the spec as ✅/❌ and set its Status to `done` (or `blocked` + why).
2. Update `CHANGELOG.md` → **Unreleased** section (Added/Changed/Fixed).
3. Update `docs/ai/STATE.md` (last-updated date, done/in-progress lists, new gotchas).
4. Commit with a Conventional Commit message. One logical change per commit.

## Decision escalation — STOP and ask the user when:

- A change would break or rename any public API.
- You need a new dependency (answer is almost certainly no).
- Tests fail for reasons unrelated to your change.
- The task contradicts CONTEXT.md non-goals or a "Known gotcha" in STATE.md.
- Two roadmap items conflict and the spec doesn't resolve it.
