# Spec 003 — Test hardening for 1.0 confidence

- **Status:** done
- **Created:** 2026-08-07
- **Last updated:** 2026-08-07
- **Breaks public API:** no
- **Related:** `docs/ai/PLAN-0.6.md` WS-1.1 / WS-1.2 / WS-1.3 / WS-4.5 (all previously open),
  `ROADMAP.md` 0.7 "richer e2e coverage for drag, scroll, presence, and variants", spec 002

## Problem / motivation

Before freezing the API at 1.0 the suite has to be trustworthy enough that "green" means "works".
An audit of the suite after spec 002 found it was not:

- **17 of 19 directive specs had no reduced-motion test** and **17 had no SSR test**, even though
  both are shipping requirements (accessibility, and AnalogJS renders on the server).
- **6 specs had no destroy/cancel test**, so the library's most likely memory-leak class — a leaked
  WAAPI animation holding its element alive — was almost entirely unguarded.
- The engines everything else depends on were the least covered code in the repo:
  `base-player.ts` had **no spec file at all** (50% branch), `animation-engine.service.ts` 70.2%
  branch, `keyframe-composer.ts` 74.7%.
- e2e had smoke tests for every route but interaction tests for only four; drag, scroll, presence,
  variants, stagger and in-view were unverified end to end.

## Proposed solution

Cover the contracts, not the lines. Three cross-cutting specs replace what would otherwise be ~50
near-identical per-directive tests, and they assert at the boundary that actually matters
(`Element.animate()`) rather than on internal config plumbing:

1. `reduced-motion.spec.ts` — 12 directives × {reduced motion on, reduced motion off}. The "off"
   half is a control group that proves the assertions can fail.
2. `teardown.spec.ts` — every directive cancels its animations on destroy; re-triggering cancels the
   previous animation instead of stacking.
3. `ssr.spec.ts` — 18 directives render on the server without throwing and without touching
   `Element.animate`, `IntersectionObserver` or `requestAnimationFrame`.

Plus engine specs, the remaining per-directive gaps, and six e2e interaction tests.

## Out of scope

- No library behaviour change. This spec only adds tests (plus `data-testid` anchors on five demo
  pages so e2e has stable selectors).
- No change to any selector, input, output or export.
- No new demo pages.

## Acceptance criteria

- [x] `base-player.ts` has a spec and reaches 100% statement and branch coverage.
- [x] `waapi-player.ts` reaches 100% statement and branch coverage, including the infinite-iteration
      path used by `moveLoop`.
- [x] Every directive that can start an animation has a reduced-motion test **and** a control test
      proving the assertion discriminates.
- [x] Every such directive has a destroy test asserting no animation is left running.
- [x] Every directive touching browser APIs has a server-platform test.
- [x] e2e covers drag, presence, variants, stagger, in-view and scroll interactions.
- [x] No library file below 85% statement coverage.
- [x] `pnpm test:coverage`, `ng lint`, `pnpm build`, `pnpm e2e`, `pnpm pack:check`, `pnpm docs:check`
      all pass; `api-surface` identical to `main`.
- [x] CHANGELOG.md (Unreleased) and docs/ai/STATE.md updated.

## Results

| Metric             | Before spec 002 | After spec 002 | After spec 003 |
| ------------------ | --------------- | -------------- | -------------- |
| Unit tests         | 241             | 261            | **372**        |
| Statement coverage | 86.66%          | 89.69%         | **93.49%**     |
| Branch coverage    | 80.65%          | 82.26%         | **86.36%**     |
| e2e tests          | 25              | 33             | **39**         |
| Worst file (stmts) | 66.7%           | 76.4%          | **87.5%**      |

`base-player.ts` and `waapi-player.ts` are both at 100/100.

## What the new tests found

Every finding below came from a test that was written to fail if the behaviour were wrong:

1. **The reduced-motion control group caught a vacuous suite.** Four directives
   (`moveEnter`, `moveAnimate`, `moveAnimation`, `moveText`) defer their first play by a microtask,
   so a synchronous `detectChanges()` asserts before anything happens. Without the control half,
   all 12 reduced-motion assertions would have passed while testing nothing.
2. **`moveText` and `moveInView` never play without an intersection.** Discovered the same way;
   both now get an explicit `IntersectionObserver` trigger in the test.
3. **The SSR rAF counter needed calibrating, not asserting to zero.** Angular's own zoneless
   scheduler calls `requestAnimationFrame` once per fixture — measured with a directive-free
   component, not assumed. The spec now compares against that live baseline so it stays honest if
   Angular changes its scheduling.
4. **Two e2e "failures" were wrong assertions, not library bugs.** The variants and scroll demos do
   animate (`getAnimations().length === 1` in a real browser), but the engine writes atomic
   `translate`/`scale`/`rotate` rather than `transform` when the element has no pre-existing
   transform. Verified in Chromium before changing anything. The e2e helper now reads every channel,
   and the asymmetry is pinned by a unit test so nobody "fixes" it.
5. **`moveStagger` had no integration coverage.** Its existing tests registered plain `<div>`s by
   hand, so a broken `MOVE_STAGGER_PARENT` token wiring would not have been caught. There is now a
   test asserting the delays real `moveEnter` children receive.

## Verification notes

All green on `chore/0.7-hardening`:

| Command              | Result                                                 |
| -------------------- | ------------------------------------------------------ |
| `pnpm test:coverage` | 372 tests / 33 files pass. 93.49% stmts, 86.36% branch |
| `ng lint`            | both projects pass                                     |
| `pnpm build`         | demo site builds and prerenders                        |
| `pnpm e2e`           | 39 passed (8.9s warm)                                  |
| `pnpm pack:check`    | tarball unchanged (6 entries)                          |
| `pnpm docs:check`    | 20/20 directives match; both docs pages clean          |
| `api-surface` diff   | identical to `main`                                    |

Fault injection, to prove the new guards bite:

- Removing `this.#currentPlayer?.cancel()` from `MoveHoverDirective.ngOnDestroy` makes exactly the
  hover teardown test fail.
- The reduced-motion control group failed on first run, which is what exposed finding 1 above.

**Note on e2e duration:** a cold run after editing demo pages took 15.1 minutes because Vite
compiles each route on first hit; a warm run is 8.9s. Not a regression, but CI pays the cold cost.

## Follow-ups (out of scope, noted for later)

- `move-parallax`, `move-in-view`, `move-drag` and `move-variants` sit at 88–91% statements; the
  remainder is mostly pointer-geometry maths that is better covered by e2e than by unit mocks.
- Consider caching Vite's transform cache in CI to cut the cold e2e run.
- Visual regression tests for selected demos (ROADMAP "Later ideas") would catch the class of bug
  that finding 4 shows unit tests cannot see.
