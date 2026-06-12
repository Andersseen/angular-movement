# angular-movement plan

Last updated: 2026-06-12

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

Success criteria:

- Layout works across real Angular DOM changes.
- The demos do not show obvious visual jumps.

### Phase 4. Drag And Advanced Interactions

Goal: make drag feel like a product feature, not just pointer movement.

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

Success criteria:

- Drag feels fluid, predictable, and easy to configure.

### Phase 5. Motion Values And Angular Signals

Goal: create a reactive layer that feels native to Angular.

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

Success criteria:

- Users can derive animations from reactive values without writing manual loops.

### Phase 6. Docs And Demo Site

Goal: let users learn the library from the website alone.

Done:

- New page: `src/app/pages/docs/api.page.ts`.
- Docs sidebar links to API Guide, Basic Motion, Variants, SVG Icons, Drag, and Scroll.
- `README.md` and `projects/movement/README.md` explain Angular-native API + WAAPI runtime.
- Home copy mentions states, presence, SVG drawing, drag, scroll, and layout.
- `@angular/animations` removed as a direct workspace dependency.

Pending:

- Create per-directive docs pages or a single API Reference page.
- Activate a Presets section with real examples.
- Reuse the install block between hero and install sections.
- Add a real npm/pnpm/yarn selector in install docs/home.
- Improve SVG, presence, variants, drag, and scroll examples with product-oriented copy.
- Add a clear "How it works" section: Angular directives -> WAAPI -> final styles.

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
Read plan.md and continue Phase 2: finish the variants API work so variants are the recommended
state API. Keep compatibility, add tests, document the API, and verify with pnpm test:coverage and
pnpm build.
```

For maximum product/docs impact:

```text
Read plan.md and continue Phase 6: create a navigable API Reference for directives and presets,
with real examples for motion-style states, variants, presence, SVG, drag, and scroll. Verify with
pnpm build and pnpm e2e.
```

## Current Status

Date: 2026-06-12.

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

Latest known verification:

- `pnpm test:coverage` passed with 24 test files and 168 tests.
- `pnpm build` passed.
- `pnpm e2e` passed with 18 tests.

Notes:

- e2e previously showed a Vite warning about `front-matter` in `optimizeDeps.include`; it did not
  break the suite, but it should be reviewed in Phase 7.
- The integrated browser tool was not exposed in the previous session, so there was no manual visual
  review through the browser plugin.
