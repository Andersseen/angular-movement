# Changelog

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
