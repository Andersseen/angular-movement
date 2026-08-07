# Changelog

## Unreleased

## [0.7.0] - 2026-08-07

### Fixed

- **`moveScroll` and `moveParallax` ignored `prefers-reduced-motion`.** Both hardcoded
  `disabled: false` in the config handed to the engine and never consulted the user's preference, so
  scroll-linked and parallax motion — precisely the kind WCAG 2.3.3 asks to suppress, and the kind
  most likely to affect users with vestibular disorders — kept running with "Reduce motion" enabled.
  Both now skip animating entirely, leaving the element in its natural CSS state so scroll-driven
  reveals stay readable rather than stuck at an invisible initial keyframe. Covered by unit tests
  and by browser-level e2e that emulates the media query.
- The demo site advertised **v0.5.0** in the navbar while npm was on 0.6.0. The version is now
  injected from `projects/movement/package.json` at build time, so it cannot go stale again.
- `moveLayout` no longer double-counts the host's own CSS transform. FLIP snapshots are now measured
  in untransformed layout space, so a committed `moveWhileHover` scale, a `moveDrag` offset, or the
  tail of a previous FLIP can no longer leak into the delta — a plain hover scale on a
  `[moveLayout]` element used to trigger a spurious layout animation. Closes the last open item of
  spec 001.
- Documentation drift found by the new `docs:check` gate: six directive inputs were documented as
  required when they are optional in the source (`moveEnter`, `moveLeave`, `moveInView`, `moveText`,
  `moveScroll`, `moveLoop`), `moveParallaxContainer` (shipped in 0.6.0) was never documented, and a
  `moveSmoothScroll` input was documented that has never existed.

### Added

- Test hardening for 1.0 (spec 003). The suite went from 241 to **372** unit tests and 25 to **39**
  e2e tests; statement coverage 86.66% → **93.49%**, branch 80.65% → **86.36%**. No library file is
  below 87.5% statements, and `base-player.ts` / `waapi-player.ts` are at 100%.
  - Three cross-cutting contract specs replace what would have been ~50 near-identical per-directive
    tests, asserting at the `Element.animate()` boundary rather than on internal config:
    `reduced-motion.spec.ts` (12 directives, each with a control case proving the assertion can
    fail), `teardown.spec.ts` (no animation survives destroy; re-triggering cancels the previous
    one), and `ssr.spec.ts` (18 directives render on the server without touching `Element.animate`,
    `IntersectionObserver` or `requestAnimationFrame`).
  - `base-player.ts` had no spec at all; it now has one covering the finish/commit/cancel sequence,
    `once` listener registration, missing `commitStyles`, and the idle-cancel branch.
  - `waapi-player.ts` covers the infinite-iteration path used by `moveLoop`, which must never fire
    `onDone`.
  - e2e interaction tests for drag, presence, variants, stagger, in-view and scroll — the coverage
    ROADMAP 0.7 asks for.
  - `moveStagger` gained integration coverage: its previous tests registered plain elements by hand,
    so a broken `MOVE_STAGGER_PARENT` wiring would not have been caught.
- `data-testid` anchors on the presence, variants, stagger, in-view and scroll demo pages so e2e has
  stable selectors.
- `@stability` JSDoc tag (`stable` / `candidate` / `experimental`) on every public declaration, so
  the guarantee is visible in the IDE instead of only in the README table. Experimental declarations
  also carry the standard `@experimental` tag.
- `pnpm docs:check` (`scripts/check-docs-drift.mjs`) — validates documented selectors, input names
  and required flags against the parsed library source, and checks that both docs pages only mention
  identifiers that still exist. Runs in CI.
- `src/app/shared/api/directive-reference.ts` — single definition of the structured directive
  reference, now consumed by the `/api/directives` route.
- Live demo pages for `moveSmoothScroll` / `SmoothScrollService` and for the signal helpers
  `moveValue` / `moveTransform` / `moveSpringValue`, both registered in the demos nav and covered by
  Playwright.
- Test coverage for the two weakest files: `MoveScrollDirective` (66.7% → 87.8% statements; custom
  container mode, malformed offsets, RAF lerp settle, teardown) and `SmoothScrollService`
  (66.7% → 96.5%; touch drag, momentum decay, nested scrollables, clamping).

### Changed

- `moveText` and `moveLoop` are now classified as stable candidates in the API-stability table; they
  were previously unlisted.

## [0.6.0] - 2026-08-04

### Added

- Open source community files: contributing guide, code of conduct, support policy, security
  policy, and roadmap.
- GitHub issue forms, pull request template, and Dependabot configuration.
- `engines/transform-state.ts` and `composeElementKeyframes()` for unified transform composition.
- `Release` GitHub Actions workflow that publishes the library to npm (with provenance) and creates
  a GitHub Release when a `v*.*.*` tag is pushed (requires the `NPM_TOKEN` secret).
- `pnpm release <patch|minor|major|X.Y.Z>` script that bumps the library version, rolls the
  `CHANGELOG.md` Unreleased section, commits, and tags (supports `--dry-run` and `--push`).
- Redesigned, more visual root README with a screenshot hero, badge row, feature grid, and
  collapsible recipes.
- Live demo pages for `[moveAnimation]` and `[moveWhileFocus]`.
- Playwright interaction tests for the new animation and focus demos.
- API stability and input-reactivity tables/sections in the README, package README, API Guide,
  Reference page, and `docs/ai/ARCHITECTURE.md`.
- `moveParallaxContainer` input on `MoveParallaxDirective` for custom scrollable containers.

### Changed

- CI now has explicit permissions, concurrency, manual dispatch, and shared Node version config.
- Cloudflare deploy now runs on `main` pushes and manual dispatch instead of all pull requests, so
  external contributions are not blocked by missing deployment secrets.
- README files now expose CI, npm, license, contribution, security, and roadmap entry points.
- `moveSpringValue` now requires `injector` in its config.
- `SmoothScrollService` skips initialization when `prefers-reduced-motion` is active.
- `moveText` is now reactive to input changes.
- Demo pages and the demo container now import only the specific directives they use instead of
  pulling in the full `MOVEMENT_DIRECTIVES` array, improving route-level tree-shaking.
- `MoveVariantsDirective`'s active-variant input renamed from `moveAnimate` to `moveVariant` (with
  `moveActiveVariant` as an alias), removing the selector collision with `MoveAnimateDirective`.
- Numeric and boolean directive inputs now coerce attribute values, so bare/string attributes like
  `moveDuration="400"` and `moveInViewOnce="false"` behave as expected.
- Root and package README examples now use the correct active-variant input (`moveVariant` /
  `moveActiveVariant`), focus selector (`moveWhileFocus`), and `moveSpringValue` config with
  `{ injector: inject(Injector) }`.
- `move-animation.utils.spec.ts` now covers `optionalNumberAttribute`, `numberAttribute`,
  `optionalBooleanAttribute`, and `booleanAttribute` coercion.
- `move-parallax.directive.spec.ts` now includes tests for `moveParallaxContainer` behavior.

### Fixed

- Transform composition between `moveLayout`, `moveDrag`, and keyframe animations now uses a single
  composed `transform` channel, avoiding fights over inline styles.
- `moveDrag` guards against detached elements during pointer events and release animations.
- `movePresence` no longer removes a recreated view if a stale leave promise resolves after a quick
  toggle back to visible.
- `MoveSmoothScrollDirective` no longer fails to compile — `moveSmoothScrollLerp` coerces to a
  required number instead of an incompatible `number | undefined`.
- `MoveAnimationDirective` test suite expanded to cover keyframe conversion, ignored properties,
  timing/spring/disabled inputs, reduced motion, exit/presence behavior, cancellation, and SSR
  safety.
- `optionalBooleanAttribute` now treats an empty string attribute as `true`, matching standard HTML
  boolean attribute behavior and the helper's documented contract.
- Parallax demo now uses `[moveParallax]` with `moveParallaxContainer` instead of `[moveScroll]`.

### Removed

- Unused constants from the internal `constants.ts` (kept only `DEFAULT_PERSPECTIVE` and the spring
  simulation constants that are actually referenced by the engines).

## [0.5.0] - 2026-06-15

### Added

- `moveStaggerStep` as an explicit stagger interval alias, while keeping `[moveStagger]="80"`.
- `moveDragSnapPoints` for snap-target drag interactions with axis-lock and constraint support.
- Signals-native motion helpers: `moveValue`, `moveTransform`, and `moveSpringValue`.
- `moveParallax` now exposes a `progress` signal, matching `moveScroll`.
- Docs pages for API Reference and Presets, plus e2e coverage for docs routes.
- Shared npm/pnpm/yarn install command selector across home and docs.
- Release checklist for test, build, e2e, package, and publish checks.

### Changed

- Documentation now positions the package as an Angular-native API powered by the Web Animations
  API.
- Demo pages for layout, loop, target, SVG icons, and leave now better match production usage.
- `moveLeave` examples now use `movePresence`, because direct `@if` / `*ngIf` removal happens
  before an attribute directive can animate.

### Fixed

- Child `[move]` animations no longer get disabled by an ancestor `moveVariants`; only a same-host
  `moveVariants` owns `moveAnimate`.
- `movePresence` now cancels in-flight leave players when removal is interrupted by a quick toggle
  back to visible.
- The packaged npm artifact now includes the MIT license file.
- Per-property transition composition now preserves string values such as `strokeDasharray`.
- Transform and SVG properties such as `x`, `y`, `scale`, `rotate`, `blur`, and `pathLength` use
  the same keyframe composition path as normal animations.
- Layout animation handles browser guards, zero-size rects, disabled refresh, and no-player cleanup.
- Removed unused `/api/generate` server endpoint.

## [0.4.0] - 2026-06-07

### Added

- **Motion-style bindings** — `MoveAnimateDirective` now supports `[moveInitial]`,
  `[moveAnimate]`, and `[moveExit]` state objects for a Framer Motion-like authoring flow.
- **Target presets** — `MoveTargetDirective` can now resolve named presets via `movePreset`,
  so boolean target animations work with either `[moveFrames]` or preset names.
- **Demo smoke coverage** — Playwright now validates every demo route so regressions in the docs
  app surface before publishing.

### Changed

- `moveAnimate` now accepts string variant names when used together with `moveVariants`, removing
  the need for `$any()` casts in Angular templates.
- Updated demos to use the new binding API and corrected install/import examples to the published
  `angular-movement` package name.

### Fixed

- Fixed SSR/template type issues in the drag, variants, and icon demos.
- Fixed icon target demos that used `movePreset` without custom `moveFrames`.

## [0.3.0] - 2026-05-23

### Added

- **Demo app: SVG Icons page** — New interactive demo at `/demos/icons` showcasing:
  - `moveTrigger` with `pathLength` / `pathOffset` drawing
  - `moveVariants` with per-property `transition` overrides
  - `movePathDraw()` helper function
  - `icon-bounce` preset on multi-part SVGs
- **Version bump** to `0.3.0` across library package and demo UI.

## [0.2.0] - 2026-05-23

### Added

- **SVG path drawing** — Official support for `pathLength`, `pathOffset`, and `pathSpacing` on SVG geometry elements (`<path>`, `<circle>`, `<line>`, `<polyline>`, etc.). These are automatically converted to `strokeDasharray` / `strokeDashoffset` under the hood.
- **Per-property transitions** — `MoveTransitionConfig` allows different `duration`, `delay`, and `easing` per animated property when using WAAPI. Useful for icon animations where opacity and path drawing should run on different timings.
- **`MoveTriggerDirective`** — New directive (`[moveTrigger]`, `exportAs: 'moveTrigger'`) for one-shot boolean triggers. Unlike `moveTarget`, `false` does not reverse the animation; it resets to `initial`, `final`, or `clear` state. Supports imperative `play()`, `reset()`, and `set(state)` methods.
- **Motion-style variants with transitions** — `MoveVariant` now accepts an optional `transition` field with per-property overrides. Works seamlessly in `MoveVariantsDirective`.
- **Icon helpers** — New preset functions for common icon micro-animations:
  - `movePathDraw(overrides?)`
  - `moveIconPulse(overrides?)`
  - `moveIconBounce(overrides?)`
  - `moveIconShake(overrides?)`
  - `moveIconRotate(overrides?)`
- **New string presets** — `icon-draw`, `icon-pulse`, `icon-bounce` added to `MOVE_PRESETS`.
- **`moveReverseDuration="0"` stable reset** — `MoveHoverDirective` and `MoveTapDirective` now clear inline styles immediately when reverse duration is `0`, preventing residual transforms on interrupted interactions.
- **Improved `MoveKeyframes` typing** — Added explicit SVG properties: `pathLength`, `pathOffset`, `pathSpacing`, `strokeDashoffset`, `strokeDasharray`, `fillOpacity`, `strokeOpacity`. `MoveValuePair` now accepts `string` values (e.g. for `strokeDasharray`).

### Changed

- `AnimationEngine.play()` now normalizes `pathLength` / `pathOffset` into `strokeDasharray` + `strokeDashoffset` before creating the player.
- `MoveTargetDirective` accepts an optional `[moveTransition]` input for per-property timing overrides.
- `MoveVariantsDirective` forwards variant-level `transition` config to the engine.
- `WaapiPlayer` constructor now accepts pre-computed `Keyframe[]` arrays (used by the transition composer).

### Fixed

- Residual inline styles on rapid hover/tap interruptions are now cleaned reliably via `clearComposedStyle(el, Object.keys(frames))`.
- `MoveTriggerDirective` ensures no broken transforms or stroke dash styles remain after cancellation when `moveResetState` is set to `'clear'`.

## [0.1.0] - 2026-05-22

### Added

- `MoveTargetDirective` - animate any element with a boolean trigger, including smooth reverse.
- `AnimationEngine` now auto-sets `strokeDasharray` when animating `strokeDashoffset` on SVGGeometryElements.
