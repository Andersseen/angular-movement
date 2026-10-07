# Validation and the 2.0 evidence gate

**Plan, not certification.** No new library/browser/device/performance/consumer test runs were made
for this documentation task. [AUDIT](AUDIT.md) attributes historical evidence. Existing compile
fixtures, mock tests and demo tests remain valuable layers, but cannot alone certify 2.0.

## Evidence record

For each gate keep candidate commit/tarball hash, app revision, Angular/TypeScript/runtime versions,
browser build/OS/device, scenario, command or manual steps, expected/actual result, skips, trace/report
link, limitations, reviewer and comparison baseline. Store future evidence under a release-specific
folder such as `docs/v2/evidence/1.9/`; no empty passing report is created now. A blank/missing/skip
cell is **not validated**, not a pass. Retest material changes on the candidate that will ship.

## Angular and package matrix

Current peers are `^21.2.0 || ^22.0.0`. Proposed continuing policy: current plus previous supported
Angular major, explicitly maintained and reviewed against upstream schedules at each minor. No
calendar forecast or automatic peer expansion. [Angular policy](https://angular.dev/reference/releases).

| Candidate dimension                                | Existing baseline                                             | Required before freeze                                                                                              |
| -------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Angular 21.2 minimum and latest supported 21 patch | Consumer AOT with resolved ^21; source unit/site toolchain 21 | Minimum/latest AOT, runtime, SSR/hydration and incompatible-peer negative check                                     |
| Angular 22 minimum and latest supported 22 patch   | Consumer AOT with resolved ^22                                | Unit/runtime subset, Router, layout/drag and packed SSR/hydration; verify appropriate TypeScript                    |
| Later current/previous majors at release time      | No claimed support in this plan                               | Update policy/peers only after equivalent evidence; record exact compiler versions                                  |
| Narrow imports/all aggregates/type surface         | API snapshot and strictTemplates fixture                      | Public member ledger and AOT tarball checks plus measured core/narrow bundles                                       |
| npm artifact                                       | validate:consumer packs/installs/AOT-compiles                 | Execute packed app in browser and server, real hydrate, exports/license/peers; source-alias build is not equivalent |
| MCP/tooling                                        | Historical snapshot/tool tests                                | Versioned snapshot, examples/guidelines and any migration rule match candidate API                                  |

Use `pnpm test:coverage`, `pnpm run lint`, `pnpm build`, `pnpm docs:check`, `pnpm api:check`,
`pnpm pack:check`, `pnpm validate:consumer`, `pnpm e2e`, and MCP checks when relevant. New runtime/
packed SSR/hydration/performance harnesses need explicit implementation work; these commands do not
already cover every cell. Tests should assert behavior at native boundaries, not merely spy on config.

## Browser matrix

| Capability                          | Chromium                     | Firefox          | WebKit                                            | Required assertion                                                                           |
| ----------------------------------- | ---------------------------- | ---------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| WAAPI/transition/repeat/settlement  | Full today                   | Smoke today      | Smoke today                                       | Independent groups, cancel/commit failure, teardown; targeted full contract cases in each    |
| Presence/layout/gesture composition | Several demo scenarios today | Limited smoke    | Limited smoke                                     | Nested/rapid/restore cases across all engines; no detached writer                            |
| Router/View Transition              | Theme reveal test, Chromium  | No route proof   | No route proof                                    | Native path where available; forced-unsupported path everywhere; redirect/error/supersession |
| Scroll/values                       | Demo and count evidence      | Smoke            | Smoke                                             | Background/resume, keyboard/programmatic scroll, long-session perf                           |
| Physical touch                      | Emulation/CDP only           | Emulation subset | Release assertion may be omitted in Linux harness | Actual iOS Safari and Android Chromium, versions recorded                                    |

Feature-detect supported native paths rather than hardcoding browser availability. Test a forced
unsupported path even on browsers that support it. Record unsupported native capability as expected
fallback; distinguish it from accidentally skipping an intended assertion. Expand targeted contracts,
not every visual demo three times. Recheck native support at each candidate release.

## Environment and interaction matrices

| Environment                                             | Required result                                                                                                    |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Browser SPA/zoneless                                    | Signal updates and promise continuations render without Zone; owner teardown cleans every resource                 |
| Packed SSR                                              | No animation/rect/observer/RAF access; requested content/keys preserved; provider isolation                        |
| Hydration                                               | No mismatch/duplicate view, event replay once, first stable snapshot without FLIP; delayed and deferred boundaries |
| No JavaScript / first paint                             | Readable/focusable content and usable navigation, no hidden forever entrance                                       |
| OS reduced motion initially on/off and changed mid-work | Every retained subsystem responds with correct functional final state and no decorative work                       |
| App disabled/config override                            | Consistent behavior across direct, spring, drag release, layout, groups and pseudo targets                         |

| Input                       | Scenario and pass condition                                                                                  |
| --------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Mouse                       | Hover/tap/focus plus drag, rapid enter/leave, outside release and primary-button rules                       |
| Touch                       | Links activate, scroll starts on animated content, axis drag preserves chosen panning, cancel does not fling |
| Pen where practical         | Hover and contact distinguished; pressure unused unless justified; cancellation/capture restored             |
| Keyboard                    | Focus visible, scrollIntoView/End not fought, accessible reorder alternative and announcements               |
| Assistive technology/manual | Text split has one reading equivalent; exiting content does not retain focus or swallow activation           |

## Stress scenarios and measurable acceptance

Budgets below are **proposed release criteria**, not measurements of current speed. Ratify against
pinned desktop and low-end physical hardware in 1.3/1.8; document any changed threshold and rationale
before calling a gate passed. Use warm-up, at least five repeat runs, median and p95; retain raw traces.

| Workload                                                 | Measurement / proposed pass criterion                                                                                                 |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 1/10/50/100 live springs and derived values              | Frame scripting/RAF count, missed frames, settle time; pure computed adds zero RAF; zero active callbacks after destroy               |
| 300/500 values if app use is realistic                   | Characterize scaling/heap; mark beyond budget explicitly instead of claiming universal smoothness                                     |
| 10/50/100 concurrent WAAPI players                       | Setup/commit/cancel time and compositing; no JS-per-frame loop introduced for finite leaves                                           |
| 100 layout nodes, three nested layout levels             | Rect-read count and forced layouts; batched read/write per invalidation, no per-node read/write alternation; no spurious FLIP at rest |
| 1,000 presence rows / repeated reorder                   | Sync cost vs baseline; keys/context correct, no quadratic growth regression beyond baseline without documented reason                 |
| 100 cancellation/destruction races per path              | All handles settle within two event-loop turns after explicit cancellation; stale onDone/state commits zero                           |
| 100 rapid route navigations/back-forward/redirects       | Final URL/view/focus correct, no unhandled ready rejection or pending visual owner                                                    |
| Drag interrupted by layout/state/exit; presence + layout | No double translation, stuck projection, momentum after cancel or app-style loss                                                      |
| Background 60 seconds then resume                        | No burst integrating hidden elapsed time, final intent correct, settled scopes remain idle                                            |
| 1,000 mount/unmount cycles plus 30-minute session        | Zero retained library-owned detached elements/players/listeners after cleanup/GC; no monotonic retained-size slope                    |

For a defined representative 60Hz 100-value/layout workload, target p95 Movement scripting plus
forced-layout work ≤4ms/frame on reference desktop and ≤8ms/frame on the recorded low-end device,
with missed frames <5%. These targets reserve frame budget for the application; 120Hz devices require
scaled frame-budget reporting. Results outside budget block promotion of the affected workload or
require a narrower supported contract. Attribute cost with app/framework control runs.

Heap noise is not a leak threshold: inspect retaining paths, compare cycles 100–1,000 after GC where
available, and allow only bounded documented caches. Detached Elements held by library registries are
failures after their promised scope lifetime. Resting signal springs/layout produce zero ongoing RAF;
smooth-scroll idle costs must be measured and its retained policy explicitly approved.

Production inspector delta must be zero bytes/zero retained listeners when not imported/enabled.
Capture core and narrow import min+gzip; investigate >5% or >1 KiB gzip increase in a narrow stable
example (whichever is smaller) against 1.2 baseline before accepting; a documented useful addition
may justify the increase, but not hidden tooling. No new runtime dependency. Do not reuse whole-library
historical gzip as proof of a narrow-import budget.

## Real consumer cohort

These are **proposed recruitment targets**, not completed pilots. Confirm owner participation,
application availability and candidate install before recording any evidence.

| Profile / candidate                                              | Workflows and milestone evidence                                                                |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Marketing/landing: Lumen Icons, Wisp or Quartz                   | 1.3 native/CSS comparison, in-view, touch links, no-JS/first paint; historic static usage only  |
| Dashboard/SaaS: Volt UI consumer app or Agentyx                  | 1.4 async workflow cancellation; 1.6 filtering/resizing lists; 1.8 long session                 |
| Interactive app: Palette Crafter                                 | 1.4 staged imperative work, 1.5 navigation/theme snapshots, 1.6 card/detail, 1.7 drag/touch     |
| Angular SSR app: selected existing SSR app, confirmed with owner | Tarball server render/hydrate, slow/deferred hydration, Router direct-load and first navigation |
| Optional ForgeCMS pilot                                          | No audited Movement usage in 014; only recruit if a concrete workflow warrants adoption         |

Require at least **four distinct real applications** spanning those profiles before 2.0, with at least
one using packed SSR, two proving layout in distinct workflows, one proving gesture on physical touch,
and two reviewed migration projects. A profile may share workflows but two copies of the same fixture
are not two consumers. Record bugs, manual migration minutes, wrappers/restrictions, performance and
maintainer feedback. Keep fixture CI for fast reproduction; real-app evidence supplements it.

## Release readiness ledger

All rows start unfulfilled. A retained capability's gate may be removed only by an explicit scope
rejection/deprecation decision with migration, not by quietly skipping validation.

- [ ] Major retained subsystems have shipped and been used during 1.x.
- [ ] Ownership/composition/cancellation and every blocking decision are resolved.
- [ ] Orchestration nested/error/teardown contracts have consumer evidence.
- [ ] Router native/fallback/cancel/redirect/nested-outlet navigation passes.
- [ ] Layout has two consumer workflows and nested/scroll/interrupt evidence.
- [ ] Gestures have actual touch devices and keyboard alternatives.
- [ ] Reactive/performance/memory/hidden-tab budgets have reproducible reports.
- [ ] Supported Angular/package/browser/environment matrices pass on candidate artifacts.
- [ ] Reduced motion and dynamic preference changes pass for every retained subsystem.
- [ ] Every export/member and experimental family has a final stability/migration disposition.
- [ ] Deprecated removals have justified benefits and executable migration paths.
- [ ] Migration preview/tool is deterministic, idempotent and tested in real applications.
- [ ] Production tooling/tree-shaking/package boundaries meet budget and dependency constraints.
- [ ] Real consumer cohort and migration rehearsals are reviewed, with limitations published.
- [ ] A significant breaking-change benefit outweighs costs; otherwise remain 1.x.
