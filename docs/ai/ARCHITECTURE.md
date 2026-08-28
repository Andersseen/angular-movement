# ARCHITECTURE — File Map and Data Flow

## Top-level layout

```
projects/movement/src/       ← THE LIBRARY (published to npm)
  public-api.ts              ← single entry point; re-exports lib/movement.ts
  lib/
    movement.ts              ← MOVEMENT_DIRECTIVES array + ALL public exports
    constants.ts
    directives/              ← one file per directive + colocated .spec.ts
    engines/                 ← animation backends, MoveAnimator (public imperative API), easing-groups, composite-controls
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

## Browser support and testing strategy (spec 013)

E2E coverage is split by cost/value, not run identically everywhere:

- **Chromium** (`e2e/demos.spec.ts`, `docs.spec.ts`, `home.spec.ts`, `composition.spec.ts`) — the
  full comprehensive suite, including the adversarial composition scenarios (drag+hover+tap+
  variants, presence+layout+variants, presence+destroy-mid-transition, scroll+transform+spring
  chains, SVG+variants+presence). These need real WAAPI timing and are too expensive to triple.
- **Chromium + Firefox + WebKit** (`e2e/cross-browser.spec.ts`) — a small, high-value smoke suite:
  one assertion each for `[move]`, enter/leave, presence, variants, hover/focus/tap, drag pointer
  interaction, layout animation, scroll progress, SVG animation, spring completion, and
  reduced-motion. Exists to catch browser-specific WAAPI/pointer-event/IntersectionObserver
  differences that unit tests (mocked engine) and a Chromium-only e2e suite cannot see.

CI installs and runs all three browsers; only the smoke file runs on Firefox/WebKit, keeping the
added CI time bounded to that file's own runtime rather than tripling the whole suite.

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

`MoveAnimator` (`engines/move-animator.service.ts`) is the same pipeline for callers without a
directive: it resolves partial options through `resolveMovementConfig` + reduced motion and delegates
to `AnimationEngine.play()`. It is the **only** exported way in — `AnimationEngine` stays internal so
1.0 can freeze the barrel without freezing the engine, and `movement.spec.ts` pins that.

`engines/keyframe-composer.ts` and `engines/transition-composer.ts` build WAAPI keyframes from
`MoveKeyframes` (handling transform composition and per-property transitions).
`engines/transform-state.ts` reads and writes composed CSS `transform` strings so `moveDrag`,
`moveLayout`, and keyframe animations do not fight over inline styles.

## Directive reference (all 21 — selectors matter, several are NOT the obvious name)

| Class                       | Selector(s)                     | Purpose                                                                                                            |
| --------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `MoveAnimateDirective`      | `[move]`, `[moveAnimate]`       | Entrance + leave animation; integrates with presence                                                               |
| `MoveAnimationDirective`    | `[moveAnimation]`               | Framer-style `{ initial, animate, exit }` state objects                                                            |
| `MoveEnterDirective`        | `[moveEnter]`                   | One-shot enter trigger                                                                                             |
| `MoveLeaveDirective`        | `[moveLeave]`                   | Leave trigger — **only works inside `*movePresence`**                                                              |
| `MoveHoverDirective`        | `[moveWhileHover]` ⚠️           | Hover (mouse + touch) with auto-reverse                                                                            |
| `MoveTapDirective`          | `[moveWhileTap]` ⚠️             | Press/tap                                                                                                          |
| `MoveFocusDirective`        | `[moveWhileFocus]` ⚠️           | Focus                                                                                                              |
| `MoveInViewDirective`       | `[moveInView]`                  | IntersectionObserver trigger                                                                                       |
| `MoveScrollDirective`       | `[moveScroll]`                  | Scroll progress → `currentTime` (fixed 1000ms linear; progress 0–1 maps to time 0–1000). Exposes `progress` signal |
| `MoveParallaxDirective`     | `[moveParallax]`                | Parallax translate from `speed × (windowHeight + elHeight)`. Exposes `progress` signal                             |
| `MovePresenceDirective`     | `*movePresence` (structural)    | Awaits children's `playLeave()` before view removal                                                                |
| `MovePresenceForDirective`  | `*movePresenceFor` (structural) | Keyed list that holds a removed item's view until its leave resolves; per-item presence scope                      |
| `MoveStaggerDirective`      | `[moveStagger]`                 | Per-child delays via DI (`MOVE_STAGGER_PARENT`); direction first/last/center; `moveStaggerStep`                    |
| `MoveVariantsDirective`     | `[moveVariants]`                | Named variant states propagated to children                                                                        |
| `MoveLayoutDirective`       | `[moveLayout]`                  | FLIP-style layout animation; `moveLayoutId` shares a rect between two nodes (`SharedLayoutRegistry`)               |
| `MoveDragDirective`         | `[moveDrag]`                    | Drag with constraints, axis lock, `moveDragSnapPoints`                                                             |
| `MoveTextDirective`         | `[moveText]`                    | Text splitting/animation                                                                                           |
| `MoveLoopDirective`         | `[moveLoop]`                    | Looping animation                                                                                                  |
| `MoveTargetDirective`       | `[moveTarget]`                  | Named target for triggers                                                                                          |
| `MoveTriggerDirective`      | `[moveTrigger]`                 | Triggers animations on targets                                                                                     |
| `MoveSmoothScrollDirective` | `[moveSmoothScroll]`            | Custom smooth-scroll containers (with `SmoothScrollService`)                                                       |

## API stability

Use this classification when documenting or consuming the public API. Stable APIs follow
semantic-versioning expectations; experimental APIs can change significantly between minor
versions.

| Status               | Directives / helpers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stable**           | `provideMovement`, `MOVEMENT_DIRECTIVES`, `MOVEMENT_STABLE_DIRECTIVES`, `[move]`, `[moveAnimate]`, `moveEnter`, `moveLeave`, `*movePresence`, `moveStagger`, `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveInView`, `moveScroll`, `moveParallax`, `[moveAnimation]`, `*movePresenceFor`, `moveVariants`, `moveText`, `moveLoop`, `MoveAnimator`, `moveValue`, `moveTransform`, `moveSpringValue`, the preset library (`MOVE_PRESETS`, `movePathDraw`, `moveIconPulse`, `moveIconBounce`, `moveIconShake`, `moveIconRotate`) |
| **Stable candidate** | _(none currently — spec 009 promoted every 0.9 candidate to stable after review; this tier stays in the taxonomy for future new APIs)_                                                                                                                                                                                                                                                                                                                                                                                                 |
| **Experimental**     | `MOVEMENT_EXPERIMENTAL_DIRECTIVES`, `moveLayout`, `moveDrag` (the whole directive — constraints, momentum, snap points, `moveWhileDrag`), `moveSmoothScroll` / `SmoothScrollService`, `moveTarget`, `moveTrigger`                                                                                                                                                                                                                                                                                                                      |

Every exported type mirrors the stability of the API it supports (`@stability` JSDoc tag on the
declaration is authoritative). `AnimationControls` and the `MovementConfig` family are stable on
their own — their shape hasn't changed since 0.5. `CompositeAnimationControls` and
`MOVE_VARIANTS_PARENT`/`MoveVariantsProvider` are internal, not part of the public barrel (see spec
008): every `AnimationControls`-typed return path already covers the former, and the latter mirrors
`MOVE_STAGGER_PARENT`/`MOVE_PRESENCE_PARENT`, which were never public either.
`MoveVariantsDirective.moveActiveVariant` carries `@deprecated` (spec 009) — it stays a permanent,
fully-supported alias for `moveVariant`, never silently removed; the tag only signals which name to
prefer in new code.

### `MOVEMENT_DIRECTIVES` aggregate policy (spec 013)

`MOVEMENT_DIRECTIVES` (all 21) is itself stable, and its contents are unchanged from before spec
013 — but it was never stability-pure: 5 of its 21 members (`MoveLayoutDirective`,
`MoveDragDirective`, `MoveSmoothScrollDirective`, `MoveTargetDirective`, `MoveTriggerDirective`) are
individually experimental, and nothing said so before spec 013. Rather than abruptly redefining an
already-stable exported constant's contents (a real behavior change for any consumer spreading it),
spec 013 added the split additively: `MOVEMENT_STABLE_DIRECTIVES` (the 16 stable directives) and
`MOVEMENT_EXPERIMENTAL_DIRECTIVES` (the 5 experimental ones), with `MOVEMENT_DIRECTIVES` now defined
as their concatenation and its JSDoc corrected to say so explicitly. `movement.spec.ts` locks down
that composition (no overlap, no omissions) as a regression contract. A future major may redefine
`MOVEMENT_DIRECTIVES` to equal `MOVEMENT_STABLE_DIRECTIVES` — the same kind of soft landing
`moveActiveVariant`'s deprecation uses — noted here as intent, not executed now.

### Experimental compatibility policy (decided in spec 009, reaffirmed in spec 013, for 1.x)

No secondary `angular-movement/experimental` entry point — every experimental export stays in the
main entry point (Option A). This is the one deliberate exception to normal SemVer for this
package. Spec 013 re-audited this for the post-1.0 hardening pass (current `ng-package.json` —
still a single `entryFile`, no secondary entry points configured — and the current experimental
surface) and found nothing has changed: still zero dependencies that would justify isolating
consumers from, so the original decision stands unchanged. See the "Remaining risks" note at the
bottom of spec 013 for when this would be worth revisiting.

- Experimental exports may change or be removed in any `1.x` **minor**, including breaking
  changes to inputs, outputs, or behavior — mirroring Angular CDK's own experimental convention.
  Every declaration already carries `@stability experimental` in source and the table above.
- Every experimental-only breaking change gets its own `### Changed (experimental)` CHANGELOG
  heading, separate from the normal `### Changed`, so a stable-only consumer scanning changelogs
  for breaks never has to read experimental sections to get an accurate answer.
- Where practical, an experimental API gets one minor version carrying a dev-mode warning or
  `@deprecated` tag before removal (a soft landing, not a SemVer requirement) — the same pattern
  `SmoothScrollService` already uses for its second-instance warning.

A secondary entry point remains an option for a future minor if a concrete reason appears (e.g. an
experimental API needing a dependency stable consumers shouldn't pay for) — not adopted now because
moving today's experimental exports would be pure migration churn with no architectural win.

`moveTarget`/`moveTrigger` vs `moveVariants`: variants propagate a named state through DI to
nested `[moveVariants]` children sharing an ancestor; target/trigger instead connect two elements
that do _not_ share a parent via a plain boolean signal, with no DI propagation — prefer variants
whenever the elements involved share an ancestor. `moveStagger` vs a variant's `staggerChildren`:
the former delays direct animated children in DOM order (flat lists); the latter staggers nested
`[moveVariants]` subtrees on a variant change (stateful children, not just one-shot entrances).

## Input reactivity

Frozen for 1.0 — two groups, decided rather than accidental.

- **Reactive**: `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveVariants`, `moveTarget`,
  `moveTrigger`, `moveScroll`, `moveParallax`, `moveDrag`, `moveLoop`, `moveText`, and
  `[moveAnimation]`'s `animate` state.
- **One-shot by design**: `moveAnimate` / `[move]`, `moveEnter`, `moveLeave`, `moveInView`,
  `moveSmoothScroll`. They describe a single entrance or exit, so they play once and ignore later
  input changes; wrap the element in `*movePresence` / `*movePresenceFor` or re-create the view to
  replay.

`[moveAnimation]` compares its `animate` state **by value**. A template binding an object literal
hands the input a new reference every change detection pass, so a reference comparison would replay
the animation continuously.

## DI tokens

| Token                                                  | File                        | Provided by                                    | Consumed by                                                                                                                                                                                          |
| ------------------------------------------------------ | --------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MOVEMENT_CONFIG`                                      | `tokens/movement.tokens.ts` | `provideMovement(config)` (or factory default) | every directive                                                                                                                                                                                      |
| `MOVE_STAGGER_PARENT`                                  | `tokens/stagger.tokens.ts`  | `MoveStaggerDirective`                         | child animation directives                                                                                                                                                                           |
| `MOVE_PRESENCE_PARENT`                                 | `tokens/presence.tokens.ts` | `MovePresenceDirective`                        | `MoveAnimateDirective`, `MoveLeaveDirective`, `MoveAnimationDirective` (exit), `MoveHoverDirective`, `MoveTapDirective`, `MoveFocusDirective` (spec 013 — see "Transform ownership and composition") |
| `MOVE_VARIANTS_PARENT` (internal, not barrel-exported) | `tokens/variants.tokens.ts` | `MoveVariantsDirective`                        | `MoveVariantsDirective` (nested), `MoveAnimateDirective`                                                                                                                                             |

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

## Transform ownership and composition (spec 013)

Two independent writers touch an element's `transform`, and post-1.0 hardening formalized how they
interact — see `engines/active-player-registry.ts` (internal, not barrel-exported):

- **Engine-driven** (`AnimationEngine.play()`): every keyframe/spring-based directive —
  `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveVariants`, `moveLayout`'s FLIP tween,
  `[move]`/`moveAnimate`, `[moveAnimation]`, `moveLoop`, `moveTarget`/`moveTrigger`. These animate
  through a real WAAPI `Animation`; `keyframe-composer.ts` decides whether to write atomic
  `translate`/`scale`/`rotate` or one composed `transform` string (see the gotcha above), and
  `BaseAnimationPlayer` commits the final style and cancels the animation on natural finish.
- **Direct** (`transform-state.ts`): `MoveDragDirective` alone. It writes one composed `transform`
  string on every `pointermove`, bypassing WAAPI entirely — this is what makes drag feel
  immediate, but it also means drag never participates in the browser's own animation compositing.

**The answers to the ownership questions this raises:**

- _Who owns `translateX` during drag?_ Drag does, exclusively, from `pointerdown` forward.
  `AnimationEngine.play()` registers every player it creates in the active-player registry, keyed
  by host element; `MoveDragDirective.onPointerDown()` looks up and cancels whatever is registered
  for its host before reading the base transform. Without this, a `moveWhileHover`/`moveVariants`/
  `moveLayout` animation still mid-flight at the instant a drag starts would later `commitStyles()`
  its own final transform over whatever the drag wrote in between, discarding drag movement — a
  real bug found and fixed in spec 013.
- _Can hover scale compose with drag translate?_ Only when hover's animation has already settled
  before the drag starts (the common case — hover finishes, then the user drags). If hover is still
  mid-flight, drag's preemption above cancels it outright rather than trying to merge channels; the
  library does not attempt live channel-level merging between the two writers.
- _What happens when a variant simultaneously defines `x`, or `moveLayout` and `moveDrag` overlap?_
  Same mechanism, same answer: drag preempts on `pointerdown`. Two engine-driven directives
  targeting the same element (e.g. hover and a variant) are not preempted by each other — that is
  normal WAAPI layering, not a conflict this registry resolves.
- _What happens when a presence exit starts during an active hover/tap/focus?_
  `MoveHoverDirective`/`MoveTapDirective`/`MoveFocusDirective` each optionally register with
  `MOVE_PRESENCE_PARENT` (spec 013) purely to cancel their own current player once `*movePresence`
  begins removing the view — they have no leave animation of their own, they just get out of the
  way so the real leave animation (from `MoveAnimateDirective`/`MoveVariantsDirective`) doesn't
  race them. Before spec 013 this was undefined — a hover animation could keep running (and
  racing) after the exit had already started.
- _What happens when Angular destroys the element while several players are active?_ Each
  directive cancels only its own player in `ngOnDestroy()`; there is no shared teardown. This
  already worked correctly (verified by tracing `BaseAnimationPlayer.cancel()`, which is idempotent
  and always resolves `finished`) and needed no change.

Deliberately **not** generalized into "any new engine-driven animation cancels the previous one on
the same element" — two WAAPI animations composing concurrently on different properties (a hover
fade and a variant slide, say) is normal, desired layering; cancelling one because another started
would be a new regression, not a fix. The bug this registry solves is specific to drag's bypass of
WAAPI, so only drag preempts.

## Motion Values runtime model (spec 013)

`moveValue()` is a bare `signal()`. `moveTransform()` is a pure `computed()` — no RAF, ever,
regardless of how many are derived from the same source. `moveSpringValue()` runs one independent
`requestAnimationFrame` loop per call (Euler-integration spring physics), torn down via the
underlying `effect()`'s own cleanup — confirmed correct by the existing destroy test and extended
in spec 013 with deterministic benchmarks at 1/10/50/100 concurrent springs
(`values/move-values.spec.ts`).

**Finding: the one-RAF-loop-per-spring architecture is acceptable, unchanged.** Real browsers batch
every callback registered for the same frame into one native tick — N independent
`requestAnimationFrame` registrations cost N closure invocations per frame, not N separate timers.
The benchmarks found linear (not quadratic) growth in registrations as spring count increases, no
leaked frames at any scale on teardown, and no duplicate work when multiple `moveTransform()`
values are derived from one shared spring. No shared/batched scheduler was introduced — measurement
did not justify the added complexity.

## `moveTransform()` interpolation contract (spec 013)

`moveTransform()` only interpolates numbers and numeric strings that share the same trailing unit
(`"0px"`→`"100px"`, `"0%"`→`"100%"`, `"0deg"`→`"180deg"`, `"0rem"`→`"2rem"`, …) — the unit is
captured verbatim, not enumerated, so any matching-unit pair works. Internally this is an ordered
list of small interpolator functions (`VALUE_INTERPOLATORS` in `values/move-values.ts`), each
returning `undefined` to fall through to the next when it doesn't apply — the intended extension
point for a future strategy (e.g. color) rather than a growing conditional.

Mismatched units (`"10px"`→`"2rem"`), non-numeric strings (`"red"`→`"blue"`), and values with
embedded functions (`"translateX(0px)"`→`"translateX(100px)"`) are all things `moveTransform()`
deliberately does not interpolate — arbitrary CSS-string interpolation was never the contract. They
fall to a discrete switch at the midpoint of the range (`progress < 0.5 ? from : to`), same as
before spec 013, but now with a dev-mode warning (`movementWarn()`, once per distinct pair, not per
frame) instead of silently snapping — the gap spec 013 found and closed: a caller expecting smooth
output previously got an unannounced hard jump with no way to discover why.

## Smooth-scroll architectural status (spec 013)

`SmoothScrollService`/`moveSmoothScroll` stays in the main entry point, still experimental — no
package split. It is the library's only root-singleton, page-level-scroll-owning service (252 lines
before spec 013, vs. ~150 for a typical directive's source+spec combined), a genuinely different
shape from every other directive, but with no dependency or size concern that would justify
isolating it. Spec 013 found and fixed a real, previously-undocumented accessibility gap: the
service had no keyboard or native-scroll listener at all, so its RAF lerp loop would fight native
keyboard scrolling (arrows, Page Up/Down, Home/End, Tab-triggered focus-into-view) by snapping
`scrollTop` back toward a stale target on the very next frame. Fixed with a `scroll` listener that
detects a `scrollTop` change the service did not itself write and resyncs to it instead of fighting
it — internal only, no public API change, still respects `prefers-reduced-motion` (unchanged, the
service no-ops entirely when reduced motion is active).

## Adding a new directive — the complete checklist

1. Create `projects/movement/src/lib/directives/move-<name>.directive.ts` (copy the pattern from
   `move-hover.directive.ts` — it is the canonical example).
2. Create colocated `move-<name>.directive.spec.ts` (copy test pattern from `move-hover.directive.spec.ts`).
3. Add the class to the `MOVEMENT_DIRECTIVES` array **and** add an `export * from` line in `lib/movement.ts`.
4. Add a demo page: `src/app/pages/demos/<name>/` (+ register in the demos navigation if applicable).
5. Update docs pages if the API Reference lists directives.
6. Run the full verification suite (see SDD-WORKFLOW.md step 5).
