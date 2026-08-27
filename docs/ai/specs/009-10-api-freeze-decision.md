# Spec 009 — 1.0 API freeze decision

- **Status:** done
- **Created:** 2026-08-27
- **Last updated:** 2026-08-27
- **Breaks public API:** no. One JSDoc-only `@deprecated` annotation (`moveActiveVariant`, kept
  fully functional) and nine stability-tag promotions (candidate → stable). No renames, removals,
  or signature changes.
- **Related:** `ROADMAP.md` 1.0 section, `docs/ai/ARCHITECTURE.md` stability table, spec 008 (0.9
  convergence/hardening, the immediate predecessor to this one)

## Problem / motivation

0.9 (spec 008) finished converging the implementation: accidental exports removed, reduced-motion
bugs fixed, docs resynced, every export given a `@stability` tag. What's left before `1.0` is not
more implementation work — it's a **decision pass**: for each of the 9 "stable candidate" APIs,
explicitly decide whether its name, signature, and behavior are something the project is willing
to support for the entire `1.x` line. `ROADMAP.md`'s 1.0 section also carries one open question
(secondary `angular-movement/experimental` entry point) that needs a real answer, not another
deferral, and the project has no CI-enforced guard against an accidental public-API change — only
an interactive agent (`public-api-guard`) that has to be remembered and run by hand.

## Proposed solution

A decision-and-hardening pass, no new features:

### Stability promotions (candidate → stable)

All 9 APIs named in the brief promote to stable, plus 5 more found via source audit
(`presets/icon-helpers.ts` — not in the brief's list, but tagged `@stability candidate` in
source) and their supporting types in `presets.types.ts`:

- `[moveAnimation]`
- `*movePresenceFor`
- `moveVariants` (see fix below — was missing its `@stability` tag entirely)
- `moveText`
- `moveLoop`
- `MoveAnimator`
- `moveValue`, `moveTransform`, `moveSpringValue`
- `movePathDraw`, `moveIconPulse`, `moveIconBounce`, `moveIconShake`, `moveIconRotate`
- Supporting types: `MoveRepeatType`, `MoveRepeatOptions`, `MovePropertyTransition`,
  `MoveTransitionConfig`, `MoveVariantState`, `MoveVariantOrchestration`, `MoveVariant`,
  `MoveKeyframeState`, `MoveAnimationConfig`

None are merged, renamed, or redesigned — see the full per-API rationale in the "Decision table"
section below (also reported at the end of this task). The "Stable candidate" tier stays in the
taxonomy (docs) for future new APIs, just empty after this pass.

### One pre-1.0 adjustment (non-breaking)

`MoveVariantsDirective.moveActiveVariant` duplicates `moveVariant` (same value, different input
name). Removing it would be an actual break for no real benefit ("churn is itself a cost"), so it
stays, permanently. It gets a `@deprecated Use \`moveVariant\`; kept as a permanent, fully-supported
alias.` JSDoc tag so the intent is explicit instead of the current ambiguous "legacy alias"
language in the README. Zero runtime change.

Separately (found during the audit, not itself a stability decision): `MoveVariantsDirective` has
**no `@stability` JSDoc tag at all** — a gap in the 0.9 audit. Fixed alongside the stable
promotion.

### Experimental compatibility policy (Option A — decided)

No secondary `angular-movement/experimental` entry point at 1.0. Documented policy for what stays
in the main entry point (`moveLayout`, `moveDrag`, `moveSmoothScroll`/`SmoothScrollService`,
`moveTarget`, `moveTrigger`):

- Experimental exports may change or be removed in any `1.x` **minor**, including breaking
  changes — the one deliberate exception to normal SemVer for this package, mirroring Angular
  CDK's own experimental convention. Every declaration already carries `@stability experimental`
  in source; the README/ARCHITECTURE stability table and this policy paragraph make the SemVer
  exception explicit rather than implicit.
- Every experimental-only breaking change gets its own `### Changed (experimental)` CHANGELOG
  heading, distinct from normal `### Changed`, so grepping for "BREAKING" without reading
  experimental sections still gives an accurate answer for a stable-only consumer.
  removal where practical (soft landing, not a SemVer requirement) — same pattern
  `SmoothScrollService` already uses for its second-instance dev warning.

Option B (secondary entry point) stays available for a future minor if a concrete reason appears;
moving exports now would be pure pre-1.0 migration churn with no architectural win, since
ng-packagr multi-entry-point complexity buys nothing while every experimental API still lives
happily in the same package.

### CI guard for the public API surface

`ng-packagr` already rolls up the entire public surface (every exported class/interface/type/
function, full signatures, full JSDoc incl. `@stability` tags) into one file after
`ng build movement`: `dist/movement/types/angular-movement.d.ts`. Reusing that (rather than
extending the regex-based `.claude/scripts/api-surface.mjs`, which only parses `*.directive.ts`
files and misses `MoveAnimator`, motion values, presets, and tokens) gives a CI-checkable golden
file with zero new extraction logic:

1. `projects/movement/api-report.txt` — committed snapshot of that generated file.
2. `pnpm run api:snapshot` — rebuilds the library and overwrites the snapshot (contributor runs
   this deliberately when a public API change is intended, and the snapshot diff shows up in the
   PR for review).
3. `pnpm run api:check` — rebuilds and diffs against the committed snapshot; fails with a unified
   diff and a pointer to `api:snapshot` on mismatch.
4. Wired into `.github/workflows/ci.yml` **and** `.github/workflows/release.yml`, each right after
   that workflow's existing "Build library" step (reuses the build, no second `ng build`). Release
   needs its own copy because a `v*.*.*` tag can point at a commit that never went through PR CI —
   without it the freeze guard is skippable exactly at the irreversible step.

`.claude/scripts/api-surface.mjs` and the `public-api-guard` agent are unchanged — they remain the
right tool for an agent doing a human-readable, classified (BREAKING/ADDITIVE/INTERNAL) review
during a PR. The new snapshot is the mechanical CI gate; the agent is the judgment layer.

### Test coverage for adversarial state transitions

Added only where an actual gap exists (see "Decision table" for what's already covered):

- `move-values.spec.ts` — destroying the owning environment while a `moveSpringValue` RAF loop is
  mid-flight stops the loop (no further `requestAnimationFrame` after destroy).
- `move-variants.directive.spec.ts` — nested `[moveVariants]` child with no `moveVariant` of its
  own follows the parent's `activeVariant`; rapid `A → B → C` switching before `B`'s player
  settles only lets `C` reach the engine, with `B`'s player cancelled.
- `move-presence-for.directive.spec.ts` — a nested `*movePresenceFor` (list-of-lists) tears down
  its inner scope correctly when the outer item is removed.
- `move-loop.directive.spec.ts` — switching `moveLoop` through several presets in a row cancels
  every prior player (no leak).
- `move-animation.directive.spec.ts` — `cancelLeave()` (the hook `*movePresenceFor` calls on
  revive) cancels an in-flight leave player, and a subsequent `animate` change still plays a fresh
  enter afterward.

### Consumer-level TypeScript ergonomics (brief §8)

`validation/consumer/src/app.ts` is the only thing that type-checks the **shipped** `.d.ts` under
AOT + `strictTemplates`, and an audit found it did not exercise several APIs this spec freezes. It
is extended to cover each of them, so the frozen ergonomics are verified per supported Angular
major rather than assumed:

- `moveTransform`'s **string/unit** overload, annotated `Signal<string>` — a real assertion, since
  the numeric overload resolving instead would fail the assignment. Pins the overload order.
- The five icon helpers, bound straight into directive inputs (incl. on SVG geometry).
- `MOVE_PRESETS` indexing by preset name.
- `MoveTransitionConfig` with per-property timing and `times`.
- `moveLoopType` / `moveLoopDelay` / `moveLoopCount` repeat inputs.
- `moveSpringValue`'s **auto-inferred** injector path (the fixture previously only used the
  explicit `{ injector }` form — i.e. the 0.9 DX contract being frozen was never consumer-tested).
- `MoveAnimateOptions`, `MovePresenceForMode`, `MoveSpringValueConfig` as **nameable** types, not
  just inferred from inline literals.

## Out of scope

- No new directives, presets, or motion primitives (timelines, reorder, gestures, route
  transitions, View Transition API — none of it).
- No redesign of any stable or candidate API. `[moveAnimation]` vs `[move]`/`moveAnimate`,
  `moveVariants`' orchestration model, and `*movePresenceFor`'s tracking/mode semantics are kept
  exactly as they are — the audit found each internally coherent, not in need of a fix.
- No promotion of `moveLayout`, `moveDrag`, `moveSmoothScroll`/`SmoothScrollService`, `moveTarget`,
  `moveTrigger` out of experimental — `SmoothScrollService`'s root-singleton limitation in
  particular is a real API-shape constraint, not missing polish.
- No secondary `angular-movement/experimental` entry point (Option A decided instead).
- No `1.0.0` version bump, tag, or release — same pattern as spec 008: implemented on `main`,
  released as its own separate step later.
- No rewrite of `AnimationEngine`/`WaapiPlayer`/`SpringPlayer` or the composer internals.
- No exhaustive manual composition matrix (hover+layout, drag+destroy, etc.) beyond the specific
  adversarial cases listed above — those are the ones with a plausible, previously-untested failure
  mode; the rest were reviewed conceptually against the transform-ownership model established in
  spec 008 and found sound by construction.
- `moveText`'s "host text must be static, not re-interpolated by Angular elsewhere" constraint is
  documented (README note) but not redesigned or newly tested — it's an existing constraint of
  owning and replacing the host's children, not a regression.

## Acceptance criteria

- [x] Every stable-candidate API (9 named + 5 icon-helper functions found via audit) has an
      explicit stable/stay-candidate/adjust decision, recorded in this spec and the final report.
- [x] `MoveVariantsDirective` carries a `@stability` JSDoc tag (previously missing).
- [x] `moveActiveVariant` carries a `@deprecated` JSDoc tag; runtime behavior unchanged; covered by
      no new test (JSDoc-only) but existing alias tests still pass unmodified.
- [x] Experimental compatibility policy is written down in README (root + package) and
      `docs/ai/ARCHITECTURE.md` in the same words used in this spec.
- [x] `pnpm run api:check` exists, passes against a freshly generated snapshot, and is wired into
      `ci.yml` after the library build step.
- [x] `pnpm run api:check` is manually confirmed to fail on a deliberate local change (temporary,
      reverted) before being trusted as a real gate.
- [x] The 5 new adversarial tests listed above are added and pass; any real bug they surface is
      fixed with a minimal change and called out explicitly in the final report.
- [x] `docs/ai/ARCHITECTURE.md`, both READMEs, and `src/app/pages/docs/api.page.ts` stability
      tables list zero remaining "stable candidate" entries from the current audit.
- [x] `ROADMAP.md`'s 1.0 section reflects the experimental-entry-point decision as made, not open.
- [x] `CHANGELOG.md` (Unreleased) documents every promotion, the `@deprecated` tag, the CI guard,
      and the new tests.
- [x] `docs/ai/STATE.md` updated per the mandatory Phase 6 record step.
- [x] `pnpm test:coverage`, `ng lint`, `pnpm build`, `pnpm format`, `pnpm run docs:check`,
      `pnpm pack:check` all pass.

## Implementation plan

1. `docs/ai/specs/009-10-api-freeze-decision.md` — this file.
2. JSDoc stability-tag pass: `move-animation.directive.ts`, `move-variants.directive.ts` (add
   missing tag + `@deprecated` on `moveActiveVariant`), `move-presence-for.directive.ts`,
   `move-loop.directive.ts`, `move-text.directive.ts`, `move-animator.service.ts`,
   `values/move-values.ts`, `presets/icon-helpers.ts`, `presets/presets.types.ts` — flip
   `@stability candidate` → `@stability stable` (+ prose) everywhere it supports a promoted API.
3. `scripts/update-api-snapshot.mjs`, `scripts/check-api-snapshot.mjs` — new, small, dependency-free.
4. `package.json` — add `api:snapshot` / `api:check` scripts.
5. `projects/movement/api-report.txt` — generate initial committed snapshot.
6. `.github/workflows/ci.yml` — add "Check public API surface" step after "Build library".
7. New tests: `move-values.spec.ts`, `move-variants.directive.spec.ts`,
   `move-presence-for.directive.spec.ts`, `move-loop.directive.spec.ts`,
   `move-animation.directive.spec.ts`.
8. Docs: `docs/ai/ARCHITECTURE.md`, `README.md`, `projects/movement/README.md`,
   `src/app/pages/docs/api.page.ts`, `ROADMAP.md`, `MIGRATION.md` (if warranted).
9. `CHANGELOG.md` (Unreleased), `docs/ai/STATE.md`.
10. Full verification gate; record results below.

## Verification notes

- New adversarial tests (5) verified individually via targeted `ng test movement --include=...`
  runs before the full suite — each caught a real gap in the mock, not the library:
  - `move-values.spec.ts` destroy test initially failed because `createRafMock()`'s
    `cancelAnimationFrame` was a no-op that never removed the pending callback (a mocking gap, not
    a library bug — the real `moveSpringValue` teardown was already correct). Fixed the mock to
    track pending frames by id and only then did the test pass, proving the effect's `onCleanup`
    genuinely stops the RAF loop on destroy.
  - `move-variants.directive.spec.ts` A→B→C test initially expected 3 players instead of 2 — the
    engine-play spy is installed after the initial mount already played once. Fixed the
    expectation, not the directive.
  - All other new tests (nested `*movePresenceFor` teardown, repeated `moveLoop` cancellation,
    `MoveAnimationDirective.cancelLeave()`) passed on the first real run.
  - No adversarial case surfaced an actual library bug — every stable-candidate promotion holds.
- Added a first spec file for `presets/icon-helpers.ts` (previously 0% covered) since its 5
  functions are now stable — 7 tests, pure input/output assertions.
- `pnpm test:coverage`: **491/491 passed**, 40 files (up from 479 at the end of spec 008 + 5
  adversarial tests + 7 icon-helper tests).
- `ng lint`: two new categories of errors surfaced and fixed:
  - The generated `projects/movement/api-report.d.ts` snapshot was picked up by the `movement`
    project's `lintFilePatterns` (`projects/movement/**/*.ts`, which matches `*.d.ts`) and failed
    on hundreds of unrelated rules. Renamed the snapshot to `api-report.txt` — it is diffed as
    text, never compiled or imported, so the extension change has no functional effect and
    sidesteps the lint-glob question entirely.
  - `new Promise(() => {})` (a deliberately-never-settling promise used in two new tests) tripped
    `@typescript-eslint/no-empty-function`; changed to `new Promise(() => undefined)`.
  - Clean on re-run, both projects.
- `pnpm build`: passes — the demo site type-checks the library through the Vite alias with no
  errors, including the `src/app/pages/docs/api.page.ts` stability-table and reactivity-list edits.
- `pnpm format`: applied; only whitespace/table-width normalization on the docs this spec wrote.
- `pnpm run docs:check`: passes — 21 documented directives match source.
- `pnpm run pack:check`: passes.
- `pnpm run api:check`: passes against the freshly generated snapshot. Independently verified the
  guard actually works: temporarily added an accidental export to `movement.ts`, rebuilt, and
  confirmed `api:check` fails with a clear unified diff naming exactly that export; reverted, and
  confirmed it passes clean again. Regenerated the snapshot once more after the `moveText` JSDoc
  caveat was added (a legitimate JSDoc-only public-surface change caught by the same guard).
- `pnpm validate:consumer`: **passes on Angular 21 and 22** — packed tarball installs with no peer
  conflict and builds AOT with `strictTemplates` on both, including every newly-covered API listed
  above. Run again after extending the fixture; no cast or workaround was needed anywhere, which is
  the actual evidence for the "stable TypeScript ergonomics" criterion.
- `pnpm e2e`: **47/47 passed**, no flakes, including the four tests STATE.md flags as
  parallel-load-flaky. Worth recording how it failed first: a **stale `vite` dev server left
  running for ~17h** on the e2e port was serving a module graph from before 0.9.0 added
  `SmoothScrollService.activeElement`, so it answered HTTP 500 and Playwright's
  `reuseExistingServer: true` reused it and timed out waiting for readiness. Not a code defect —
  killing the stale process made the suite pass. Note the first run reported "exit code 0" because
  the command was piped through `tail`, which masked Playwright's real exit status; re-run
  unpiped to get a trustworthy code.
- Public API surface audited programmatically against the built rollup: **68 exports, 68
  classified** — 58 `stable`, 0 `candidate`, 10 `experimental`, and the experimental set matches
  the documented list exactly. No `TODO`/`FIXME` or stray `console.log` in library source.
- Confirmed `projects/movement/api-report.txt` is **not** included in the packed tarball (only
  `fesm2022/`, `LICENSE`, `package.json`, `README.md`, `types/`).

## Follow-ups (out of scope, noted for later)

- Secondary `angular-movement/experimental` entry point — Option A decided for 1.0; revisit only
  if a concrete need appears (e.g. an experimental API wanting a dependency stable consumers
  shouldn't pay for).
- `moveText` re-interpolation constraint — worth a dedicated doc page or example if it comes up as
  a real user question; not a defect today.
