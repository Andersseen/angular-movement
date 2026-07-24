# Changelog

## Unreleased

### Added

- Open source community files: contributing guide, code of conduct, support policy, security
  policy, and roadmap.
- GitHub issue forms, pull request template, and Dependabot configuration.
- `engines/transform-state.ts` and `composeElementKeyframes()` for unified transform composition.

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

### Fixed

- Transform composition between `moveLayout`, `moveDrag`, and keyframe animations now uses a single
  composed `transform` channel, avoiding fights over inline styles.
- `moveDrag` guards against detached elements during pointer events and release animations.
- `movePresence` no longer removes a recreated view if a stale leave promise resolves after a quick
  toggle back to visible.
- `MoveSmoothScrollDirective` no longer fails to compile — `moveSmoothScrollLerp` coerces to a
  required number instead of an incompatible `number | undefined`.

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
