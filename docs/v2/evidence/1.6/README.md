# 1.6 evidence — layout motion and shared-element reliability (spec 021)

Baseline: `main` @ `ed9bacbd7c3acde5961d8a2c1744ba52f9c2b17d`, source version 1.4.0. Machine: macOS,
Chromium 145 / Playwright Firefox + WebKit (macOS build). `contracts.json` (this directory) is the
machine-checked inventory (`pnpm contracts:check` reads the newest version directory); `../1.5/` is
unchanged history.

## Verified baseline and defects

Each row failed on the baseline code in a real browser, or (L5–L7) in a unit test, before its fix.

| #   | Defect                                                       | Reproduction on `ed9bacb`                           | Root cause                                                                                   |
| --- | ------------------------------------------------------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| L1  | Layout change during a FLIP lost; items jump                 | 168 px in two frames (`layout-contract`)            | read suppressed while animating; animation relative to the old layout applied to the new one |
| L2  | Scrolling = layout movement                                  | spurious FLIP of the scroll distance                | snapshots in viewport space                                                                  |
| L3  | Nested hosts re-animate                                      | 6 animations from a no-geometry render (expected 0) | child measured under parent's in-flight transform                                            |
| L4  | Own transform baked into snapshot                            | geometry module / own-transform test                | only the inline `transform` was cleared; `translate`/`scale`/animations ignored              |
| L5  | Replaced FLIP leaks `transform-origin: 0 0`                  | unit                                                | second FLIP saved `0 0` as the "original"                                                    |
| L6  | Registry retains DOM, no cap, global ids, stale after resize | unit                                                | `Map<id, {element, rect}>` pruned on access only                                             |
| L7  | Reduced motion read once                                     | unit                                                | constructor-time read                                                                        |
| L8  | Stale FLIP kept running after change back to its start       | 22×89 px box, intermittent (found by a flaky run)   | null delta returned without retiring the old player                                          |

Hypotheses that did **not** reproduce: forced-layout storm, idle polling, drag+reflow drift.

## Before / after (browser)

Chromium unless stated. Interruption: max box change over two frames when the layout flips mid-FLIP.

| Scenario                                       | Before               | After                                   |
| ---------------------------------------------- | -------------------- | --------------------------------------- |
| Mid-FLIP layout change (demo, ease-out)        | 168 px jump          | < 24 px (asserted), 12/12 repeats green |
| Mid-FLIP layout change (packed, linear 400 ms) | not measured         | 2.5 px (Angular 21), 2.8 px (22)        |
| Render during parent FLIP, children unmoved    | 6 animations created | 0                                       |

## Performance (`e2e/layout-perf.spec.ts`, Chromium, median of 7 full reflows)

| Hosts | Layout reads before → after | Computed-style reads | Animations created | Prepare ms before → after | Idle (1 s) |
| ----- | --------------------------- | -------------------- | ------------------ | ------------------------- | ---------- |
| 10    | 10 → 10                     | 0 → 10               | 10 → 10            | 17.6 → 18.7               | 0 reads    |
| 50    | 50 → 50                     | 0 → 50               | 50 → 50            | 19.1 → 23.4               | 0 reads    |
| 100   | 100 → 100                   | 0 → 100              | 100 → 100          | 24.4 → 15.3               | 0 reads    |

The only measurable cost is one `getComputedStyle()` per host per pass. Timing differences are within
run-to-run noise (spread of 7 runs is 5–25 ms in both); this is **not** proof of equal speed and only
Chromium was timed. Nested three-level layouts, frame pacing and heap/retention were **not**
measured; bounded retention is covered by unit tests (≤128 registry entries, no `Element`
references) and teardown by browser tests.

## Browser results

| Suite                                                         | Chromium | Firefox | WebKit (macOS) |
| ------------------------------------------------------------- | -------- | ------- | -------------- |
| `e2e/layout-contract.spec.ts` (18)                            | pass     | pass    | pass           |
| Packed consumer, Angular 21 and 22 (32 checks each, 8 layout) | pass     | —       | —              |

Linux WebKit (CI) and real Safari are not verified locally. No test was skipped for layout.

## Consumer scenarios (packed tarball, AOT + prerender + hydration)

A dashboard (columns, filter, expand, insert, remove, reorder, 12 un-awaited toggles, mid-FLIP
change, page scroll), a card/detail handover (start on card, natural landing, focus on open/close,
A/B/A/C, mid-handover re-render), and layout + hover + drag (offset held exactly over 10 reflows;
pressing during a FLIP). Reduced motion and no-first-render-FLIP are checked.

## Local verification (this machine)

`pnpm install --frozen-lockfile`, `lint`, `format:check`, `docs:verify` (30 passed),
`contracts:check`, `test:coverage` (601 passed; 90.8 % stmts / 82.8 % branches), `test:site` (43),
`test:scripts` (113), `migrate:test` (19), `migrate:build`, `api:check`, `pack:check`, `build:prod`,
`e2e:static` (72), `validate:consumer` (Angular 21, 22), `validate:consumer:runtime` (21, 22).

`pnpm e2e` (all three projects): 359 passed, 2 skipped, 1 flaky, 4 failed — all failures are
`hero-flow.spec.ts` WebGL tests plus one Firefox `drag-repeat` 20-cycle test timing out under local
parallel load. `hero-flow › organic hero draws a bounded field…` fails identically on clean `main`
here (pre-existing, environment); `drag-repeat` passes 10/10 alone (`--workers=1`).

## Known limitations

See `contracts.json` (`layout-css-only-size-change`, `layout-unsupported-geometry`,
`layout-linux-webkit-and-real-safari`). Untested: RTL, sticky/fixed ancestors, CSS zoom, scroll
containers that differ between a shared pair, physical devices. The contract inventory still has
many `NOT_TESTED` dimensions for other directives — this milestone certifies layout only.

## Release readiness

Not publishable yet: at the start the v1.5.0 Release PR (#99) was open, v1.3.0/v1.4.0 GitHub releases
were drafts and npm `latest` for `angular-movement` was 1.2.0. This branch bumps no version and
adds no `Release-As`: merged after 1.5.0 ships, its `feat` commit yields 1.6.0 through Release
Please. Layout remains **experimental**.
