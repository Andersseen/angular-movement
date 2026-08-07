# Spec 002 — 0.7 Hardening: transform composition, scroll coverage, missing demos, API stability

- **Status:** done
- **Created:** 2026-08-07
- **Last updated:** 2026-08-07
- **Breaks public API:** no
- **Related:** `ROADMAP.md` 0.7 "Real app validation", `docs/ai/PLAN-0.6.md` WS-1.3/WS-2.2/WS-3.1/WS-4.3/WS-4.4,
  spec 001 items 5–6 (unfinished), released `v0.6.0` (npm `latest`, 2026-08-07)

## Problem / motivation

`0.6.0` shipped to npm, so the next milestone is `0.7` — the roadmap's "predictability before 1.0"
phase. An audit of the released tree found five concrete gaps that block freezing the API for 1.0:

1. **`moveLayout` measures its FLIP snapshot with a raw `getBoundingClientRect()`**, which includes
   the element's own CSS transform. Any other transform channel (a committed `moveWhileHover`
   scale, a `moveDrag` offset, the tail of a previous FLIP) is therefore baked into the snapshot,
   and then counted a _second_ time when `composeElementKeyframes()` composes the FLIP delta on top
   of the same base transform. This is the last unfinished item of spec 001.
2. **The two least-covered files are the two hardest to debug**: `move-scroll.directive.ts`
   (66.7% stmts / 61.0% branch) and `smooth-scroll.service.ts` (66.7% / 68.6%) — exactly the RAF +
   listener + SSR-guard code paths.
3. **Two documented features have no demo**: `moveSmoothScroll` / `SmoothScrollService`, and the
   signal helpers `moveValue` / `moveTransform` / `moveSpringValue` (the 0.5.0 headline feature).
   Both appear in the docs pages and the server API route but are invisible in `/demos`.
4. **API stability lives only in a README table**, not in JSDoc, so it is invisible in the IDE where
   users actually consume the API.
5. **The directive reference is maintained by hand in three places** — `src/app/pages/docs/api.page.ts`,
   `src/app/pages/docs/reference.page.ts` and `src/server/routes/api/directives.get.ts` — which
   guarantees drift.

## Proposed solution

1. `MoveLayoutDirective` measures its FLIP rects in **untransformed layout space**: when the host
   carries an inline transform, that transform is temporarily cleared for the measurement and
   restored immediately. Snapshot and target rect are then in the same space, so the delta is pure
   layout and the engine's composition on top of the live base transform is correct exactly once.
   Reuses the already-exported-but-unused `hasInlineTransform()` from `engines/transform-state.ts`
   and mirrors the technique `moveDrag` already uses for bounds measurement.
2. Backfill unit tests for the uncovered branches of `MoveScrollDirective` and `SmoothScrollService`
   (custom container, invalid offsets, RAF lerp settle, reduced motion, SSR, destroy cleanup).
3. Add two demo pages following the existing `DemoContainer` + `CodeBlock` pattern, registered in
   `demos.page.ts` nav and covered by the `e2e/demos.spec.ts` route loop.
4. Add `@stable` / `@experimental` JSDoc to the public exports, matching the README table.
5. Consolidate the directive reference into a single source of truth consumed by both docs pages and
   the server API route.

## Out of scope

- No new directives, presets or animations.
- No change to any selector, input name, output name or export (`api-surface.mjs` diff must be empty).
- No change to the init-only/reactive split of any directive (that is a separate 1.0 decision).
- No redesign of existing demo pages beyond adding the two new ones and their nav entries.
- No engine rewrite: `keyframe-composer.ts` / `transform-state.ts` logic is unchanged; only
  `move-layout.directive.ts` changes how it _measures_.
- No version bump or release — this branch targets the `Unreleased` changelog section.

## Acceptance criteria

- [x] `MoveLayoutDirective` does not produce a FLIP when only the host's inline transform changed
      (no layout move), proven by a unit test.
- [x] `MoveLayoutDirective` produces a pure-layout delta when the host carries an inline transform,
      proven by a unit test asserting the FLIP keyframes exclude the transform contribution.
- [x] The inline transform is restored to its exact previous value after measurement.
- [x] `move-scroll.directive.ts` and `smooth-scroll.service.ts` each reach ≥85% statement coverage
      (87.8% and 96.5%, from 66.7% each).
- [x] `/demos/smooth-scroll` and `/demos/values` exist, appear in the demos nav, and render under SSR.
- [x] Both new routes are covered by `e2e/demos.spec.ts`.
- [x] Every export in `lib/movement.ts` carries a `@stability` JSDoc tag consistent with the README
      API-stability table (experimental declarations also carry the standard `@experimental`).
- [⚠] The directive reference data has a single definition consumed by both docs pages and the
  server API route. **Partially delivered — see "Deviation" below.**
- [x] `node .claude/scripts/api-surface.mjs` output is byte-identical to `main` (no API drift).
- [x] `pnpm test:coverage`, `ng lint`, `pnpm build`, `pnpm e2e` all pass.
- [x] CHANGELOG.md (Unreleased) and docs/ai/STATE.md updated.

## Deviation from the plan (step 9)

The structured data now has a single definition (`src/app/shared/api/directive-reference.ts`,
consumed by the `/api/directives` route). The two docs pages were **not** rewritten to consume it.

Reason: `api.page.ts` and `reference.page.ts` are editorial. They group directives by intent
("moveWhileHover / moveWhileTap / moveWhileFocus"), curate input subsets, and embed hand-highlighted
code samples. Generating them from the structured reference would change _what they show_, which is
a product decision rather than a mechanical refactor, and it would not remove the underlying risk.

The risk itself — a renamed selector or input silently outliving the rename — is now covered
directly: `pnpm docs:check` validates the structured reference _and_ both editorial pages against
the parsed library source, and runs in CI. That converts the manual `docs-drift-checker` agent into
an enforced gate. Fully data-driving the editorial pages is recorded as a follow-up.

## Implementation plan

- [x] 1. `projects/movement/src/lib/directives/move-layout.directive.ts` — measure untransformed rects.
- [x] 2. `projects/movement/src/lib/directives/move-layout.directive.spec.ts` — tests for the two
     double-counting cases + transform restoration.
- [x] 3. `projects/movement/src/lib/directives/move-scroll.directive.spec.ts` — cover container mode,
     invalid offsets, RAF settle, destroy cleanup.
- [x] 4. `projects/movement/src/lib/scroll/smooth-scroll.service.spec.ts` — cover init/teardown,
     reduced motion, SSR, RAF loop.
- [x] 5. `projects/movement/src/lib/movement.ts` — `@stability` JSDoc on every export.
- [x] 6. `src/app/pages/demos/smooth-scroll.page.ts` + nav entry in `src/app/pages/demos.page.ts`.
- [x] 7. `src/app/pages/demos/values.page.ts` + nav entry.
- [x] 8. `e2e/demos.spec.ts` — add both routes to the smoke loop.
- [x] 9. Single-source the structured reference + `scripts/check-docs-drift.mjs` guard (see Deviation).
- [x] 10. Verify (Phase 5) and record (Phase 6).

## Verification notes

Commands run on `chore/0.7-hardening`, all green:

| Command              | Result                                                           |
| -------------------- | ---------------------------------------------------------------- |
| `pnpm test:coverage` | 261 tests / 29 files pass (was 241). 89.69% stmts, 82.26% branch |
| `ng lint`            | both projects pass                                               |
| `pnpm build`         | demo site builds + prerenders, including both new routes         |
| `pnpm e2e`           | 33 passed                                                        |
| `pnpm pack:check`    | tarball unchanged (6 entries)                                    |
| `pnpm docs:check`    | 20/20 directives match; both editorial pages clean               |
| `api-surface` diff   | identical to `main` — no public API change                       |

Fault-injection checks (the important ones — a test that cannot fail proves nothing):

- Disabling the `moveLayout` fix makes exactly the two new double-counting tests fail; the other six
  layout tests still pass, confirming they discriminate.
- Renaming `moveReverseDuration` in the source makes `docs:check` report the stale doc entry plus the
  undocumented new name; renaming the `[moveLoop]` selector makes it report the selector mismatch.

The drift guard found **8 pre-existing documentation errors** on first run, all fixed here: six
inputs documented as required that are optional in the source, `moveParallaxContainer` (shipped in
0.6.0) never documented, and a `moveSmoothScroll` input documented that never existed.

## Follow-ups (out of scope, noted for later)

- Decide reactive vs init-only per directive and freeze it for 1.0 (9 directives are init-only).
- Validate the library in at least two non-demo Angular apps (ROADMAP 0.7).
- Generate `api-surface` data at build time so the docs reference cannot drift at all, and rewrite
  `api.page.ts` / `reference.page.ts` on top of it (see "Deviation" — needs a product decision about
  showing complete input lists instead of curated subsets).
- `SmoothScrollService` singleton footgun: because the root app calls `init()`, `[moveSmoothScroll]`
  on any container is a silent no-op, and destroying that element tears down the global instance.
  Worth either a dev-mode warning or a scoped-instance API before `moveSmoothScroll` leaves
  experimental.
