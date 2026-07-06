# ARCHITECTURE — File Map and Data Flow

## Top-level layout

```
projects/movement/src/       ← THE LIBRARY (published to npm)
  public-api.ts              ← single entry point; re-exports lib/movement.ts
  lib/
    movement.ts              ← MOVEMENT_DIRECTIVES array + ALL public exports
    constants.ts
    directives/              ← one file per directive + colocated .spec.ts
    engines/                 ← animation backends (see below)
    presets/                 ← named presets, types, icon helpers
    tokens/                  ← movement.tokens.ts, presence.tokens.ts, stagger.tokens.ts
    providers/provide-movement.ts
    values/move-values.ts    ← moveValue / moveTransform / moveSpringValue signal helpers
    scroll/                  ← SmoothScrollService + MoveSmoothScrollDirective

src/                         ← THE DEMO SITE (AnalogJS: Vite + SSR + file-based routing)
  app/pages/                 ← routes: (home).page.ts, demos/, docs/, templates.page.ts
  app/pages/demos/<name>/    ← one demo folder per directive
  app/shared/components/     ← CodeBlock, DemoContainer, etc.
  server/routes/api/         ← Nitro API routes (.get.ts / .post.ts)

e2e/                         ← Playwright tests (demo site)
vite.config.ts               ← alias: movement → projects/movement/src/public-api.ts
```

**Critical fact:** the demo site consumes the library **source** via Vite alias — no build step
between them. Library type errors break the site build immediately.

## The animation pipeline (how everything flows)

```
Template directive (e.g. [moveWhileHover]="{ scale: [1, 1.1] }")
  → resolveMoveFrames()            directives/move-animation.utils.ts — preset name or keyframes → MoveKeyframes
  → resolveMovementConfig()        merges MOVEMENT_CONFIG defaults + per-directive inputs + prefers-reduced-motion
  → AnimationEngine.play()         engines/animation-engine.service.ts
      ├─ SSR? → no-op              (isPlatformBrowser guard)
      ├─ disabled? → apply final styles instantly
      ├─ spring config? → SpringPlayer   (pre-computes keyframes @60fps Euler integration, then WAAPI easing:'linear')
      └─ otherwise    → WaapiPlayer      (element.animate(); commits styles on finish, then cancels — avoids WAAPI fill leak)
  → returns AnimationControls      { play, pause, cancel, currentTime, finished }
```

`engines/keyframe-composer.ts` and `engines/transition-composer.ts` build WAAPI keyframes from
`MoveKeyframes` (handling transform composition and per-property transitions).

## Directive reference (all 20 — selectors matter, several are NOT the obvious name)

| Class                       | Selector(s)                  | Purpose                                                                                                            |
| --------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `MoveAnimateDirective`      | `[move]`, `[moveAnimate]`    | Entrance + leave animation; integrates with presence                                                               |
| `MoveAnimationDirective`    | `[moveAnimation]`            | Framer-style `{ initial, animate, exit }` state objects                                                            |
| `MoveEnterDirective`        | `[moveEnter]`                | One-shot enter trigger                                                                                             |
| `MoveLeaveDirective`        | `[moveLeave]`                | Leave trigger — **only works inside `*movePresence`**                                                              |
| `MoveHoverDirective`        | `[moveWhileHover]` ⚠️        | Hover (mouse + touch) with auto-reverse                                                                            |
| `MoveTapDirective`          | `[moveWhileTap]` ⚠️          | Press/tap                                                                                                          |
| `MoveFocusDirective`        | `[moveWhileFocus]` ⚠️        | Focus                                                                                                              |
| `MoveInViewDirective`       | `[moveInView]`               | IntersectionObserver trigger                                                                                       |
| `MoveScrollDirective`       | `[moveScroll]`               | Scroll progress → `currentTime` (fixed 1000ms linear; progress 0–1 maps to time 0–1000). Exposes `progress` signal |
| `MoveParallaxDirective`     | `[moveParallax]`             | Parallax translate from `speed × (windowHeight + elHeight)`. Exposes `progress` signal                             |
| `MovePresenceDirective`     | `*movePresence` (structural) | Awaits children's `playLeave()` before view removal                                                                |
| `MoveStaggerDirective`      | `[moveStagger]`              | Per-child delays via DI (`MOVE_STAGGER_PARENT`); direction first/last/center; `moveStaggerStep`                    |
| `MoveVariantsDirective`     | `[moveVariants]`             | Named variant states propagated to children                                                                        |
| `MoveLayoutDirective`       | `[moveLayout]`               | FLIP-style layout animation                                                                                        |
| `MoveDragDirective`         | `[moveDrag]`                 | Drag with constraints, axis lock, `moveDragSnapPoints`                                                             |
| `MoveTextDirective`         | `[moveText]`                 | Text splitting/animation                                                                                           |
| `MoveLoopDirective`         | `[moveLoop]`                 | Looping animation                                                                                                  |
| `MoveTargetDirective`       | `[moveTarget]`               | Named target for triggers                                                                                          |
| `MoveTriggerDirective`      | `[moveTrigger]`              | Triggers animations on targets                                                                                     |
| `MoveSmoothScrollDirective` | `[moveSmoothScroll]`         | Custom smooth-scroll containers (with `SmoothScrollService`)                                                       |

## DI tokens

| Token                  | File                        | Provided by                                    | Consumed by                                                                   |
| ---------------------- | --------------------------- | ---------------------------------------------- | ----------------------------------------------------------------------------- |
| `MOVEMENT_CONFIG`      | `tokens/movement.tokens.ts` | `provideMovement(config)` (or factory default) | every directive                                                               |
| `MOVE_STAGGER_PARENT`  | `tokens/stagger.tokens.ts`  | `MoveStaggerDirective`                         | child animation directives                                                    |
| `MOVE_PRESENCE_PARENT` | `tokens/presence.tokens.ts` | `MovePresenceDirective`                        | `MoveAnimateDirective`, `MoveLeaveDirective`, `MoveAnimationDirective` (exit) |

Defaults (`MOVEMENT_DEFAULTS`): `duration: 300`, `easing: 'cubic-bezier(0.16, 1, 0.3, 1)'`,
`delay: 0`, `disabled: false`, `iterations: 1`.

## Data shapes you must respect

- **Keyframes are value pairs**: `{ opacity: [0, 1], y: [20, 0] }` — arrays of [from, to] (`MoveValuePair`).
- **`moveAnimation` states are single values**: `{ initial: { opacity: 0 }, animate: { opacity: 1 } }` —
  the directive converts them to pairs internally. Only properties present in **both** `initial`
  and `animate` are animated.
- Shorthand transform properties: `x`, `y`, `scale`, `rotate`, `blur`, plus SVG ones
  (`pathLength`, `strokeDashoffset`, …) — see `MoveKeyframeProperties` in `presets/presets.types.ts`.
- Springs: `{ stiffness?, damping?, mass?, velocity? }` (`MoveSpring`).

## Adding a new directive — the complete checklist

1. Create `projects/movement/src/lib/directives/move-<name>.directive.ts` (copy the pattern from
   `move-hover.directive.ts` — it is the canonical example).
2. Create colocated `move-<name>.directive.spec.ts` (copy test pattern from `move-hover.directive.spec.ts`).
3. Add the class to the `MOVEMENT_DIRECTIVES` array **and** add an `export * from` line in `lib/movement.ts`.
4. Add a demo page: `src/app/pages/demos/<name>/` (+ register in the demos navigation if applicable).
5. Update docs pages if the API Reference lists directives.
6. Run the full verification suite (see SDD-WORKFLOW.md step 5).
