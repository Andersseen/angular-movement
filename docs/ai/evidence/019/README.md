# Spec 019 — implementation and verification evidence

Branch: `feat/site-demo-workbench-ci`. Base: `ad1d3ef` (clean main, fetched and matched at bootstrap).
PR: https://github.com/Andersseen/angular-movement/pull/89.

## Diagnosis and design

The old demos split between a short preview with long controls and independent, long-form pages.
On laptop screens, source and some interactions started below the fold. The new shared workbench
prioritizes a live stage, with compact navigation, controls and source visible together.

References inspected: [Motion](https://motion.dev/examples), [GSAP](https://gsap.com/),
[Anime.js](https://animejs.com/), [Volt UI](https://volt-ui.andersseen.dev/) and
[ForgeCMS](https://forgecms.dev/). The design takes their clear preview hierarchy, compact controls
and restrained surfaces, retaining Angular Movement's typography, indigo accent and actual examples.

Desktop at 1024px and above uses a 224px sidebar, compact header and a remaining-height grid with
roughly 60% stage / 40% controls and source. Each desktop panel scrolls independently. Below 1024px,
a grouped native selector replaces the sidebar and the document scrolls naturally; narrow screens
stack the panels. No demo interaction depends on a screenshot or fake animation.

Migrated routes under `/demos`: `enter`, `leave`, `animate`, `animation`, `hover`, `tap`, `focus`,
`target`, `in-view`, `drag`, `text`, `stagger`, `layout`, `variants`, `loop`, `icons`, `scroll`,
`parallax`, `smooth-scroll`, `presence`, `presence-list`, `values`, `imperative`. `/demos` opens enter.
`DemoWorkbench`, `DemoCodeTabs` and `DemoNavigation` provide the frame; `DemoContainer` adapts the
ordinary examples, while specialized examples compose that same frame. Smooth scroll is scoped to
its preview and releases its RAF on route exit. Replay/reset and generated code follow live state.
The source compilation test checks 25 complete Angular components across the 23 routes.

## Release preparation fix

Failure: [CI run 40195592991](https://github.com/Andersseen/angular-movement/actions/runs/40195592991).
Release Please preserves detected JSON indentation; a compact seed stays compact after a version
update. The custom preparation stage folded only CHANGELOG.md, leaving its generated manifest to
fail the repository's Prettier check. Prettier also preserves existing object wrapping, so adding
spaces to a compact line alone does not establish a stable cross-tool format.

`scripts/release/normalize-manifest.mjs` parses and serializes a multiline object, then formats it
using trusted main's locked Prettier/config, with plugins disabled. Release preparation stages it
with the changelog and pushes only when the diff is nonempty. It does not execute Release PR config,
change workflow permissions, dispatch publication or introduce a push loop.

The regression test invokes the **real Release Please manifest updater** on a compact 1.3.0 seed,
updates it to 1.4.0 in a temporary fixture, normalizes it, checks unchanged semantic values, verifies
Prettier, repeats normalization and verifies that the updater also returns exactly the normalized
bytes. Repository manifest changes are whitespace only; its actual version remains 1.3.0.

Release audit at bootstrap: GitHub v1.3.0 is draft with no publication date; npm latest is 1.2.0.
Site badges explicitly identify 1.3.0 as the source version. No release repair or publication was
performed, and no runtime library API, package version, tag or peer range changed.

## Organic hero background

User reference: [hr.andriipap.dev](https://hr.andriipap.dev/en/) — a Three.js Journey-style
depth-of-field particle scene (the user's current portfolio; the earlier FBO-curl reference was
superseded on 2026-10-26). The shipped renderer is a faithful single-draw-call port of that scene
in native WebGL: fractal simplex curl-noise flow (four octaves, deterministic in time — no FBO or
simulation state), a manual perspective camera with a focal plane, and two populations in one draw
— fine sharp dust (~93%) plus a few large soft bokeh orbs (~7%). Dark theme glows additively;
light theme composites faint premultiplied ink. The field glides toward the pointer (lerped
parallax; nearer particles drift more).

The first pass shipped an analytic trigonometric-curl field with a pause toggle. The user rejected
its look ("a parody") and the toggle ("it only annoys"); the toggle is removed and the OS
reduced-motion preference remains the control, per user decision 2026-10-26.

A forced-SwiftShader stress sample initially scored 30 with 14,628ms TBT (versus baseline 74 /
54.5ms TBT). That exposed CPU shader execution and led to the early software-adapter fallback;
these diagnostic samples are excluded from the final medians. The browser caveat flag alone did
not reject explicitly forced SwiftShader on this Chromium, so both guards are required.
See [MDN context attributes](https://developer.mozilla.org/en-US/docs/Web/API/HTMLCanvasElement/getContext)
and [renderer capability information](https://developer.mozilla.org/en-US/docs/Web/API/WEBGL_debug_renderer_info).

Budgets: 22,000 desktop / 7,500 compact points (light theme draws half), one draw call, 24
draws/s, DPR at most 1.5, backing size at most 1600×1000. Seed data is uploaded once. There are no
signal writes per frame. The renderer runs outside Angular; hidden document, offscreen hero and
reduced motion cancel the loop. Reduced motion draws a static field. Route destruction disconnects
observers, removes listeners and deletes GPU resources. Context loss/restoration and unavailable
WebGL are covered; a CSS dot field preserves a decorative fallback.

Native Chrome local sample (1440×900 viewport, 87 draws): **24.00 draws/s**, backing 1440×872,
median `drawArrays` submission ≈0.006ms, max 0.1ms — main-thread API submission only, **not** GPU
execution time, power draw or performance on every device. Automated shader tests use software
WebGL deliberately, simulating only a hardware adapter capability check; the actual shaders and GL
lifecycle still execute. A separate test exercises the unmodified software adapter and proves
fallback without program creation or drawing. Production requests
`failIfMajorPerformanceCaveat` and also rejects known SwiftShader/llvmpipe/software adapters
before shader compilation. The adapter check is local; its result is not stored or transmitted.
Static budget tests cover small, large and high-DPI screens. The final lazy module size is
recorded in [hero-renderer-metrics.json](hero-renderer-metrics.json).

## Screenshots

| View              | Evidence                                     |
| ----------------- | -------------------------------------------- |
| Previous home     | [Desktop](baseline-home-desktop.png)         |
| Previous demo     | [Desktop](baseline-enter-desktop.png)        |
| Hero dark         | [1440×900](hero-organic-desktop-dark.png)    |
| Hero light        | [1440×900](hero-organic-desktop-light.png)   |
| Hero mobile       | [390×844 dark](hero-organic-mobile-dark.png) |
| Workbench desktop | [1440×900 dark](workbench-desktop-dark.png)  |
| Workbench laptop  | [1366×768 light](workbench-laptop-light.png) |
| Workbench tablet  | [768×1024](workbench-tablet.png)             |
| Workbench mobile  | [390×844](workbench-mobile.png)              |

## Verification

The final hero suite passed **8/8** without retries: live drawing and cadence/buffer limits,
pointer parallax (`uPointer`), theme switching (`uGain`, float-precision tolerant), reduced motion
changes, visibility, intersection, context loss/restoration, unavailable WebGL, compact density,
software-adapter fallback before program creation, route cleanup, and mounted-hero axe checks in
both themes (WCAG 2.1 A, zero violations).
A previous repeated workbench/source suite passed **74/74**. Site unit tests cover the renderer
budgets (35 site tests total). The first stable Angular render is exposed as
`app-root[data-hydrated="true"]`; browser tests wait for it rather than a debug global that appears
before lazy route controls have hydrated. Hover/tap assertions inspect held styles and reversal.

The final production static suite passed **68/68** across Chromium, Firefox and WebKit, with
118 prerendered pages and 91 indexed docs pages. A temporary intermediate full browser run had one
execution-context interruption while Vite reloaded an edited component; it is not used as evidence
of a clean run. The fixed source is verified by the final PR Actions run below.

| Local check                               | Result                                                          |
| ----------------------------------------- | --------------------------------------------------------------- |
| `pnpm test:coverage`                      | 584 tests; statements 94.95%, lines 96.68%                      |
| `pnpm lint`, `pnpm format:check`          | Pass                                                            |
| `pnpm build`, `pnpm build:prod`           | Pass                                                            |
| `pnpm docs:verify`                        | Pass, including snippets/API/content/drift and 30 doctor checks |
| `pnpm test:site`                          | 31 tests                                                        |
| `pnpm test:scripts`                       | 103 tests                                                       |
| `pnpm migrate:test`, `pnpm migrate:build` | 19 tests and build pass                                         |
| `pnpm api:check`, `pnpm pack:check`       | Pass                                                            |
| `pnpm validate:consumer`                  | Angular 21 and 22 strict peer install + AOT pass                |
| `pnpm validate:consumer:runtime`          | Angular 21 and 22, 18 runtime checks each                       |
| `actionlint` 1.7.12                       | Pass                                                            |

Final isolated Lighthouse medians and PR Actions results follow.

## Limits

No manual screen-reader session, physical mobile device, or actual 200% browser-zoom session was
available. Responsive browser geometry covers eight viewport widths; it does not substitute for
those manual checks. Lighthouse is a local lab measurement; field INP, GPU time and battery cost
are not inferred from it. Deployment and npm publication remain outside this task.
