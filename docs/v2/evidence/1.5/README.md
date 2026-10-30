# 1.5 evidence — reliability and repeated-interaction contract

Candidate: branch `fix/1.5-reliability-contract-gate` on `main` = `ce9b03d` (source 1.4.0).
Statuses: **PASS**, **FAIL**, **BLOCKED**, **NOT TESTED**, **KNOWN LIMITATION**. A missing result is
NOT TESTED, never a pass. The machine-checked ledger is [`contracts.json`](contracts.json)
(`pnpm contracts:check`); this file explains it.

Environment: macOS (Darwin 25.6, Apple silicon), Playwright 1.58.2 bundled Chromium / Firefox /
WebKit, Vite dev server, one worker. Timing numbers below are from this machine only.

## Reproduced defects and root causes

| #   | Defect (baseline `ce9b03d`)                                                                                                                                    | Reproduced                                             | Root cause                                                                                  | Regression test                                                                                         |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| D1  | Repeated drag drifts: the card jumps by the previous displacement at press and release, accumulating with same-direction drags (press jump 0 → 46.6 → 93.3 px) | Chromium, `/demos/drag`, free drag, 20 cycles          | Inline transform (already holding the last drag) read as base **and** `#_x/#_y` added again | `drag-repeat.spec.ts` free drag; `move-drag.directive.spec.ts` "does not count the previous drag twice" |
| D2  | A release from an identity base commits to the individual `translate` property — an invisible second copy                                                      | code trace; snap-point path                            | engine takes the atomic-property path when the inline transform is empty                    | covered by snap-points / snap-to-origin scenarios (these passed on the old code — see note)             |
| D3  | Pressing during a release animation jumps to a stale position                                                                                                  | Chromium, frozen mid-release                           | `cancel()` before sampling: WAAPI snaps to the inline style                                 | "pressing during a release animation continues from where it is"                                        |
| D4  | Constant `transform` keyframe in opacity-only animations pins `transform` over a concurrent animation                                                          | Probe: computed transform `none` ~240 ms after release | `composeElementKeyframes` composed every animation onto a non-empty inline transform        | `keyframe-composer.spec.ts` "transform ownership" (fail on old code)                                    |
| D5  | `lostpointercapture` unhandled                                                                                                                                 | review only                                            | no handler                                                                                  | NOT TESTED in a browser (WebKit/Chromium never lost capture in the suite)                               |

Note on D2: Snap-to-origin and snap-point scenarios **passed on the old code**; they are kept as
guards, not claimed as evidence the defect was reproduced. D2 is a code-trace finding.

Hypothesis from the task brief ("base transform + cumulative `#_x/#_y` double counting") was
**confirmed** (D1). It was not the whole story: D3 and D4 are separate faults that only appear in a
real browser, and D4 lives in the shared composer, not in the drag directive.

## Repeated drag results

| Scenario (Chromium, Firefox, WebKit)                            | Before (Chromium)                   | After                   |
| --------------------------------------------------------------- | ----------------------------------- | ----------------------- |
| Free drag, 20 cycles: press jump / follow error / release jump  | up to 93.3 px                       | 0 px on all 20 cycles   |
| X-only 12 cycles, Y-only 8, constraints 10, snap origin 10      | X-only, constraints fail            | pass (tolerance 1.5 px) |
| Momentum 10, interrupted release 6, hover+tap→drag 10, cancel 5 | momentum, interrupt, hover+tap fail | pass                    |

On the old code 6 of 10 drag scenarios fail on Chromium; all 10 pass after the fix.

## Known limitations (explicit, not hidden)

- **Playwright WebKit input, X-only diagonal drag, 2nd drag onward:** only one of eight `pointermove`
  events reaches the page — a capturing `document` listener sees one too, with pointer capture held.
  Identical on the pre-fix code, pure-horizontal path passes. Treated as a harness limitation; the
  scenario uses a horizontal path on WebKit. **Not verified on real Safari.**
- Physical iOS Safari / Android Chromium: **NOT TESTED.** Chromium touch emulation is not a substitute.
- Drag transform decomposition: only the canonical `translate → rotate → scale` order round-trips;
  skew / reordered functions in a consumer's inline transform and stylesheet-only transforms are not
  folded into the origin (unchanged from 1.4).
- 300 of 351 runtime dimension cells are NOT TESTED (see `contracts.json`); only the dimensions with
  a cited test are claimed.

## Verification record (this machine, final candidate tree)

| Check                                                                        | Result                                                                                                                                                                                                                     |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ng test movement` (`pnpm test:coverage`)                                    | PASS — 44 files, 589 tests (+5 new; 4 of them fail on `ce9b03d`)                                                                                                                                                           |
| `pnpm test:site`                                                             | PASS — 43 tests                                                                                                                                                                                                            |
| `pnpm test:scripts`                                                          | PASS — 112 tests (+6 for the inventory checker)                                                                                                                                                                            |
| `pnpm migrate:test` / `migrate:build`                                        | PASS — 19 tests / compiles                                                                                                                                                                                                 |
| `pnpm lint`, `pnpm format:check`, `pnpm docs:verify`                         | PASS (`doq doctor`: 30 passed, 0 failed)                                                                                                                                                                                   |
| `pnpm api:check`                                                             | PASS ×3 on the final tree — see note below                                                                                                                                                                                 |
| `pnpm pack:check`                                                            | PASS                                                                                                                                                                                                                       |
| `pnpm contracts:check`                                                       | PASS — 39 runtime exports; 58 PASS, 300 NOT_TESTED, 1 KNOWN_LIMITATION, 0 FAIL                                                                                                                                             |
| `pnpm build:prod` + `pnpm e2e:static`                                        | PASS — 72 tests                                                                                                                                                                                                            |
| Full Chromium e2e (`playwright test --project=chromium`)                     | 250 pass on first run of the whole suite; the 3 failures were all in the then-new `repeat-contract.spec.ts` (harness faults, fixed) — that spec then passed 7/7. Not re-run as one combined 253-test pass after the fixes. |
| Firefox + WebKit (`drag-repeat`, `touch`, `cross-browser`)                   | PASS — 54 passed, 2 skipped (pre-existing skips), 0 failed                                                                                                                                                                 |
| `pnpm validate:consumer` (Angular 21, 22, strict peers, AOT strictTemplates) | PASS                                                                                                                                                                                                                       |
| `pnpm validate:consumer:runtime` (packed tarball, Chromium)                  | PASS — 19 checks each on Angular 21.2.25 and 22.2.4, including repeated drag (worst error 0.00 px). Not run against a pre-fix tarball, so this check is a guard going forward, not a demonstrated reproduction.            |

`api:check` note: one run in the middle of the session reported a snapshot mismatch; it did not
reproduce (empty diff against `dist`, then three consecutive passes) and no snapshot file changed.
Cause unknown — flagged rather than dismissed.

## Demo coverage matrix (23 routes in `e2e/routes.ts`)

"Scripted" = at least one Playwright test navigates to the route and interacts or asserts beyond
load. It is **not** a manual walkthrough.

| Route                                                                                                                         | Scripted tests (files)                                    | Repeated-interaction contract   |
| ----------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- | ------------------------------- |
| drag                                                                                                                          | composition, cross-browser, demos, drag-repeat            | PASS (10 scenarios, 3 browsers) |
| hover                                                                                                                         | consumer-dx, cross-browser, demos, touch, repeat-contract | PASS (Chromium)                 |
| tap                                                                                                                           | cross-browser, demos, repeat-contract                     | PASS (Chromium)                 |
| variants                                                                                                                      | cross-browser, demos, repeat-contract                     | PASS (Chromium)                 |
| presence                                                                                                                      | composition, cross-browser, demos, repeat-contract        | PASS (Chromium)                 |
| presence-list                                                                                                                 | composition, demos, repeat-contract                       | PASS (Chromium)                 |
| layout                                                                                                                        | cross-browser, demos, repeat-contract                     | PASS (Chromium)                 |
| imperative                                                                                                                    | consumer-dx, repeat-contract                              | PASS (Chromium)                 |
| animate, animation, enter, leave, focus, icons, in-view, loop, parallax, scroll, smooth-scroll, stagger, target, text, values | demos / cross-browser / composition / workbench           | NOT TESTED (single-pass only)   |

Per-demo items from the brief that were **not** done for any route: reduced-motion walk-through,
"switch away and back" cleanup assertions, and checking that each generated source tab compiles
(workbench source tests cover the shared tab mechanics, not each directive's snippet). No demo
defect other than D1–D4 was found, but absence of findings in untested dimensions is not a pass.

## Not done in this milestone (explicitly)

- Repeated/interruption/cleanup contracts for scroll, parallax, smooth-scroll, in-view, text,
  stagger, loop, target, trigger, enter, leave, focus (300 NOT_TESTED cells in `contracts.json`).
- `repeat-contract.spec.ts` on Firefox/WebKit (it is Chromium-only; only the drag suite is cross-browser).
- Performance / frame-pacing / RAF / observer / heap measurements — **no numbers were collected**;
  no performance claim is made. The drag fix adds one `getComputedStyle` + `DOMMatrix` read per
  `pointerdown` (not per `pointermove`).
- Resource cleanup beyond: presence leaves no ghost nodes after 20 mutations, layout/hover/tap/variants/
  `MoveAnimator` end with zero running animations, the packed "teardown" check, and the existing
  teardown unit specs.
- Physical devices; real Safari.
