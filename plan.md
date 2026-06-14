# angular-movement plan

Last updated: 2026-06-14

## Objective

Turn `angular-movement` into a motion library for Angular with a promise close to Framer Motion,
without copying React patterns directly: Angular-native APIs, a Web Animations API-powered runtime,
standalone component ergonomics, signals-friendly design, SSR safety, and no
`@angular/animations` boilerplate.

Product direction:

- Declare motion from Angular templates.
- Use simple state concepts: initial, animate, exit, variants.
- Coordinate presence, stagger, scroll, layout, SVG, and drag through one coherent API.
- Keep the core small, tested, and publishable.

## How to use this file in a new session

At the start of a new session, ask:

```text
Read plan.md and continue with Phase X. Do not restart from scratch; inspect only the files needed
for that phase, implement the change, and verify with the commands listed in the plan.
```

Before changing code:

1. Run `git status --short`.
2. Read the active phase in this file.
3. Read only the files related to that phase.
4. Do not revert unrelated user changes.
5. Before finishing, update the "Current status" section.

Baseline verification commands:

```bash
pnpm test:coverage
pnpm build
pnpm e2e
```

Release/package checks:

```bash
ng build movement
pnpm run pack:check
```

## Initial Analysis

### What exists today

The repository contains:

- `projects/movement`: the publishable Angular library.
- `src`: the AnalogJS demo/docs site.
- The demo app imports the library through a Vite alias:
  `movement -> projects/movement/src/public-api.ts`.

The current core already includes:

- Presets and custom keyframes.
- Motion-style API with `moveInitial`, `moveAnimate`, and `moveExit`.
- Variants through `moveVariants`.
- Presence through `movePresence`.
- Stagger through `moveStagger`.
- Interactions: hover, tap, focus, in-view.
- Scroll/parallax.
- Layout.
- Drag.
- Spring.
- SVG path drawing with `pathLength` / `pathOffset`.
- Per-property transitions.
- WAAPI runtime, with no direct `@angular/animations` dependency in the publishable package.

### Strengths

- The proposal is already differentiated for Angular: low friction, declarative directives, and an
  API that feels familiar to users of motion libraries.
- SVG drawing, presence, variants, drag, and scroll already form a strong product foundation.
- The library does not depend on Framer Motion, GSAP, or `@angular/animations`.
- Unit coverage is already solid across directives and engines.

### Risks

- The API can feel like a collection of directives unless the docs guide the recommended path.
- Variants still need to feel more like a state system than a one-off helper.
- Layout animation needs product-level robustness: FLIP, resize, reorder, edge cases, and tests.
- Drag needs polish to meet user expectations: inertia, snap points, dynamic constraints.
- A motion-values/signals layer is still missing for derived reactive values.
- The demo/docs site needs more reference pages so users can learn the library from the web alone.
- Key demos need dedicated e2e or visual smoke tests.

## Technical Positioning

The library should be described as:

```text
Angular-native motion API powered by the browser Web Animations API.
```

Avoid saying:

- "Built on Angular runtime animation API".
- That the library requires `@angular/animations`.
- That this is a literal Framer Motion port.

If Framer Motion is mentioned, use it as a mental-model reference:

```text
Motion-style state API for Angular: initial, animate, exit, variants, and presence.
```

## Recommended API

Recommended learning path:

| Level         | Primary API                                                                  |
| ------------- | ---------------------------------------------------------------------------- |
| Basic         | `moveEnter`, `moveLeave`, `[move]`, `moveInitial`, `moveAnimate`, `moveExit` |
| Interactions  | `moveWhileHover`, `moveWhileTap`, `moveFocus`, `moveInView`                  |
| State         | `moveVariants`, `moveTarget`, `moveTrigger`                                  |
| Orchestration | `movePresence`, `moveStagger`                                                |
| Scroll/layout | `moveScroll`, `moveParallax`, `moveLayout`, `moveSmoothScroll`               |
| Advanced      | `pathLength`, `pathOffset`, `transition`, `spring`, `moveDrag`               |

The API that should be recommended first for product UI:

```html
<ng-container *movePresence="isOpen()">
  <article
    [moveInitial]="{ opacity: 0, y: 24 }"
    [moveAnimate]="{ opacity: 1, y: 0 }"
    [moveExit]="{ opacity: 0, y: -16 }"
  >
    Panel
  </article>
</ng-container>
```

## Roadmap

### Phase 1. Core Runtime And Transitions

Goal: make the advanced features work reliably.

Status: complete.

Done:

- `composeTransitionKeyframes` preserves string values such as `strokeDasharray`.
- `x`, `y`, `scale`, `rotate`, `blur`, and SVG passthrough values go through the normal keyframe
  composer.
- Tests cover:
  - `x/y + transition`
  - `scale/rotate + transition`
  - `scaleX/scaleY + transition`
  - `rotateX/rotateY + transition`
  - `blur + transition`
  - string `strokeDasharray`
  - discrete CSS string properties
  - `pathLength + opacity + transition` through `AnimationEngine`
  - `pathOffset + opacity + transition` through `AnimationEngine`
- Documented current limitation: per-property transitions support `duration` and `delay` per
  property; different per-property easings fall back to the global easing to keep a single composed
  WAAPI timeline.
- Verified with `pnpm test:coverage`, `pnpm build`, and `pnpm e2e`.

Recommended follow-up:

- Increase `WaapiPlayer` and `SpringPlayer` coverage for finish/cancel/iterations.
- For a future version, decide whether per-property easings are worth supporting through separate
  WAAPI animations per property. For now, the documented warning is the intended behavior.

Success criteria:

- Per-property transitions generate correct WAAPI keyframes.
- SVG drawing compatibility is preserved.
- The behavior is documented and tested.

### Phase 2. Motion-Style API And Variants

Goal: make variants feel like a state system, not a loose directive.

Status: complete.

Tasks:

- Officially define the canonical API:
  - Primary: `moveInitial`, `moveAnimate`, `moveExit`.
  - Reusable state: `moveVariants`.
  - Boolean/reversible: `moveTarget`.
  - One-shot/reset: `moveTrigger`.
- Audit `move-variants.directive.ts`.
- Improve variants with:
  - default transition at the directive level
  - per-property transitions inside variants
  - possible `delayChildren` / `staggerChildren` if it fits with `moveStagger`
  - better composition with `movePresence`
- Add tests for consecutive state changes and cancellation of the previous animation.
- Document patterns:
  - idle/active
  - collapsed/expanded
  - loading/success
  - selected/unselected

Done:

- Added `moveTransition` as a default transition for all variants on a `moveVariants` host.
- Kept variant-level `transition` as the higher-priority override.
- Added `moveExitVariant` so a named variant can play before `movePresence` removes the view.
- Added tests for default transition, transition override, and exit variant playback.
- Documented `moveTransition` and `moveExitVariant` in the root README, package README, and API
  Guide.
- Verified with `pnpm test:coverage`, `pnpm build`, and `pnpm e2e`.

Success criteria:

- Users can build stateful UI without writing imperative animation code.
- Variants are the recommended API for reusable states.

### Phase 3. Layout Animation

Goal: get closer to the magic of Framer Motion `layout`, with Angular constraints.

Status: complete.

Tasks:

- Audit `move-layout.directive.ts`.
- Confirm the FLIP strategy:
  - First
  - Last
  - Invert
  - Play
- Cover:
  - size changes
  - position changes
  - list reorder
  - elements entering/leaving with presence
  - SSR/browser guards
- Create a strong layout/reorder demo.
- Add e2e or visual smoke tests.

Done:

- Audited `move-layout.directive.ts` and confirmed its FLIP strategy:
  - First: keep the previous DOMRect snapshot.
  - Last: read the current DOMRect after Angular render.
  - Invert: animate from previous delta/scale to the new layout.
  - Play: delegate the generated frames to `AnimationEngine`.
- Added explicit browser guard with `PLATFORM_ID` / `isPlatformBrowser`.
- Added zero-size rect protection to avoid invalid scale ratios.
- Refreshed snapshots while layout animation is disabled or reduced motion is active, preventing
  stale layout jumps when re-enabled.
- Restored transform origin and internal state even when the animation engine returns no player.
- Added `move-layout.directive.spec.ts` covering:
  - position and size FLIP frames
  - zero-sized rects
  - disabled snapshot refresh
  - no-player cleanup
  - server platform guard
- Improved the layout demo:
  - deterministic reorder instead of random shuffle
  - item-level `moveLayout`
  - test ids and state attributes for e2e
- Added an e2e smoke test for `/demos/layout` covering grid/list and reorder changes.
- Verified with `pnpm test:coverage`, `pnpm build`, and
  `E2E_PORT=5174 pnpm exec playwright test`.

Success criteria:

- Layout works across real Angular DOM changes.
- The demos do not show obvious visual jumps.

### Phase 4. Drag And Advanced Interactions

Goal: make drag feel like a product feature, not just pointer movement.

Status: complete.

Tasks:

- Audit `move-drag.directive.ts`.
- Review:
  - dynamic constraints
  - inertia/momentum
  - snap points
  - snap-to-origin
  - axis lock
  - elasticity
  - start/move/end outputs
- Improve tests for constraints and momentum.
- Create a demo with a draggable card, visible constraints, and snap behavior.
- Document the difference between `moveWhileTap` and `moveDrag`.

Done:

- Audited `move-drag.directive.ts` and confirmed the existing baseline:
  - axis lock through `moveDrag="x"` / `moveDrag="y"`
  - object and element constraints
  - elasticity during overdrag
  - optional momentum projection
  - snap-to-origin
  - start/move/end outputs
- Added `moveDragSnapPoints` as a real public input.
- Snap resolution now chooses the nearest configured point, respects axis locks, and clamps the
  final target to constraints.
- Strengthened drag tests for:
  - deterministic momentum projection
  - momentum clamped by constraints
  - nearest snap point selection
  - snap points with locked axes
- Improved the drag demo with:
  - visible constraint area
  - visible snap points
  - a Snap Points control
  - updated live code output
- Documented when to use `moveWhileTap` versus `moveDrag` in the root README, package README, and
  API Guide.
- Verified with `pnpm test:coverage`, `pnpm build`, and
  `E2E_PORT=5174 pnpm exec playwright test`.

Success criteria:

- Drag feels fluid, predictable, and easy to configure.

### Phase 5. Motion Values And Angular Signals

Goal: create a reactive layer that feels native to Angular.

Status: complete.

Idea:

- Something like motion values, but built around signals.
- Possible APIs:
  - `moveValue(initial)`
  - `moveSpringValue(source, config)`
  - `moveTransform(source, inputRange, outputRange)`
  - helpers for scroll progress

Tasks:

- Decide whether this should live as exported functions or directives.
- Prototype a small API with tests.
- Integrate with `moveScroll` and `moveParallax`.
- Document examples with `computed()`.

Done:

- Added a small exported signals-native API:
  - `moveValue(initial)` returns a writable Angular signal.
  - `moveTransform(source, inputRange, outputRange, options)` returns a derived `computed()` signal.
  - `moveSpringValue(source, config)` returns a spring-smoothed readonly signal.
- `moveTransform` supports:
  - numeric interpolation
  - multi-stop ranges
  - default clamping
  - optional extrapolation with `{ clamp: false }`
  - matching CSS unit strings such as `px`
  - discrete fallback for non-interpolable strings
- `moveSpringValue` uses Angular `effect()` plus `requestAnimationFrame`, avoids tracking its own
  internal value with `untracked()`, and supports disabled/immediate mode.
- Exported the helpers from the package public API.
- `moveScroll` already exposed `progress`; `moveParallax` now also exposes `progress` as a signal.
- Added tests for the new values API and for `moveParallax.progress`.
- Documented signal-derived motion in the root README, package README, and API Guide.
- Verified with `pnpm test:coverage`, `pnpm build`, and
  `E2E_PORT=5174 pnpm exec playwright test`.

Success criteria:

- Users can derive animations from reactive values without writing manual loops.

### Phase 6. Docs And Demo Site

Goal: let users learn the library from the website alone.

Status: complete.

Done:

- New page: `src/app/pages/docs/api.page.ts`.
- Docs sidebar links to API Guide, Basic Motion, Variants, SVG Icons, Drag, and Scroll.
- `README.md` and `projects/movement/README.md` explain Angular-native API + WAAPI runtime.
- Home copy mentions states, presence, SVG drawing, drag, scroll, and layout.
- `@angular/animations` removed as a direct workspace dependency.
- Added a shared install command component with npm, pnpm, and yarn selectors.
- Reused the install command component in the home hero, home install section, and Get Started docs.
- Added `src/app/pages/docs/reference.page.ts` as a navigable API Reference grouped by product job:
  basic motion, state/orchestration, interactions/gestures, scroll/layout/SVG, and helpers.
- Added `src/app/pages/docs/presets.page.ts` with real examples for product UI reveals,
  feedback/attention, and SVG icon presets.
- Activated sidebar links for API Reference, Presets, and Layout.
- Added a clear "How it works" explanation in the API Guide and home section:
  Angular directives -> keyframe composition -> WAAPI -> final styles.
- Added `e2e/docs.spec.ts` covering `/docs/api`, `/docs/reference`, `/docs/presets`, and the
  package-manager selector in `/docs/get-started`.
- Verified with `pnpm test:coverage`, `pnpm build`, and
  `E2E_PORT=5174 pnpm exec playwright test`.

Success criteria:

- Users understand what to install, what to import, which API to use first, and why no boilerplate
  is required.

### Phase 7. Product Quality And Release

Goal: publish with confidence.

Tasks:

- Add e2e or visual smoke tests for:
  - home
  - `/docs/api`
  - `/demos/icons`
  - `/demos/variants`
  - `/demos/drag`
  - `/demos/layout`
- Validate or remove `/api/generate` if unused.
- Raise coverage for:
  - `SmoothScrollService`
  - `WaapiPlayer`
  - `SpringPlayer`
- Create release checklist:
  - `pnpm test:coverage`
  - `pnpm lint`
  - `pnpm e2e`
  - `pnpm build`
  - `pnpm run pack:check`
- Review package exports, npm README, and changelog.

Success criteria:

- Before publishing, there is real confidence in runtime, docs, demos, and package output.

## Recommended Next Task

For maximum technical impact:

```text
Read plan.md and continue Phase 7: add product-quality checks for release confidence. Start with
visual/e2e smoke coverage for /docs/api and the strongest demos, then review package exports and
pack checks.
```

For maximum product/docs impact:

```text
Read plan.md and continue Phase 7: review package exports, npm README, changelog, and release
checklist. Verify with ng build movement, pnpm run pack:check, pnpm build, and pnpm e2e.
```

## Current Status

Date: 2026-06-14.

Repository status when this file was created:

- `git status --short` was clean before creating `plan.md`.
- `plan.md` was the only file created in that task.

Current technical status:

- Phase 1 is complete.
- Core per-property transitions are fixed.
- Transition composer and SVG drawing tests cover `x/y`, `scale/rotate`, `scaleX/scaleY`,
  `rotateX/rotateY`, `blur`, string `strokeDasharray`, discrete CSS strings, `pathLength`, and
  `pathOffset`.
- The per-property easing limitation is documented: `duration`/`delay` per property are supported;
  different easings fall back to the global easing.
- Docs include `API Guide`.
- Root README and package README explain Angular-native API + WAAPI runtime.
- `@angular/animations` is no longer a direct dependency in `package.json`.
- Phase 2 is complete:
  - `moveVariants` supports default `moveTransition`.
  - Variant-level `transition` overrides default `moveTransition`.
  - `moveExitVariant` lets variants participate in `movePresence` exits.
  - README and API Guide document the new variants behavior.
- Phase 3 is complete:
  - `moveLayout` has explicit browser guards, zero-size rect protection, disabled snapshot refresh,
    and cleanup when no player is returned.
  - Layout unit tests cover FLIP position/size, zero-size rects, disabled refresh, no-player cleanup,
    and server platform behavior.
  - The layout demo uses deterministic reorder and item-level `moveLayout`.
  - e2e includes a `/demos/layout` grid/list/reorder smoke test.
- Phase 4 is complete:
  - `moveDrag` supports `moveDragSnapPoints`.
  - Snap points work with axis locks and constraint clamping.
  - Momentum behavior is covered with deterministic tests.
  - The drag demo shows a visible constraint area and snap targets.
  - README and API Guide explain the difference between `moveWhileTap` and `moveDrag`.
- Phase 5 is complete:
  - `moveValue`, `moveTransform`, and `moveSpringValue` are exported from the public API.
  - Motion values are built on Angular signals and `computed()`.
  - `moveTransform` covers numeric, multi-stop, unit-string, clamped, and extrapolated mappings.
  - `moveSpringValue` provides spring-smoothed derived signals with disabled/immediate mode.
  - `moveScroll` and `moveParallax` both expose `progress` signals for derived values.
  - README and API Guide document signal-derived motion patterns.
- Phase 6 is complete:
  - Docs include a navigable API Reference and Presets page.
  - Docs sidebar links to API Guide, API Reference, Presets, Basic Motion, Variants, Layout, SVG
    Icons, Drag, and Scroll.
  - Home, install docs, and install section share the npm/pnpm/yarn install selector.
  - API Guide and home explain the runtime path: Angular directives -> composed keyframes -> WAAPI
    -> committed final styles.
  - e2e covers the new docs routes and package-manager selector.

Latest known verification:

- `pnpm test:coverage` passed with 26 test files and 186 tests.
- `pnpm build` passed.
- `E2E_PORT=5174 pnpm exec playwright test` passed with 23 tests.

Notes:

- e2e previously showed a Vite warning about `front-matter` in `optimizeDeps.include`; it did not
  break the suite, but it should be reviewed in Phase 7.
- The integrated browser tool was not exposed in the previous session, so there was no manual visual
  review through the browser plugin.
