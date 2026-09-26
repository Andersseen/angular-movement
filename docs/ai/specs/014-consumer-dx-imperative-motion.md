# Spec 014 — 1.2: Consumer DX & Imperative Motion

- **Status:** done (release prepared, not cut)
- **Created:** 2026-09-25
- **Last updated:** 2026-09-25
- **Breaks public API:** no for stable APIs (every stable change is a widening: new union members,
  wider accepted input types, new optional fields, new members). Yes for one experimental API
  (`MoveTriggerDirective`), under the experimental compatibility policy — see "Changed
  (experimental)". Public API changes were requested explicitly by the maintainer in the 1.2
  milestone brief.
- **Related:** spec 013 (post-1.0 hardening), spec 009 (1.0 API freeze), `ROADMAP.md`.

## Problem / motivation

1.1.0 is on npm. This milestone is driven by auditing the real apps that consume the library, not
by adding features. The audit (below) shows the 80% path is `moveWhileHover`, `moveWhileTap`,
`moveInView`, `moveStagger`, `moveEnter`/`[move]` and `provideMovement`, and that each of those
has a concrete, repeated DX problem in real code: fractional-second timing values the library
reads as milliseconds, hover literals copied between apps, a hover directive that fakes hover on
touch, a whole-library import where two directives are used, and apps querying `matchMedia` to
re-implement reduced motion the library already applies. The one advanced consumer (Palette
Crafter) had to misuse an experimental directive as an imperative handle and drop to raw WAAPI
for a View Transition.

## Consumer audit (evidence, 2026-09-25)

Grepped from the local checkouts of each consumer (`../<project>`; `node_modules`/`dist`
excluded). Directive usage counts, most frequent first:

| Consumer        | Pinned version | Dominant usage                                                                             |
| --------------- | -------------- | ------------------------------------------------------------------------------------------ |
| Volt UI         | `^0.8.0`       | `moveWhileTap` 9, `moveWhileHover` 6, `moveEnter`, `moveLoop`, `MoveAnimator`              |
| Palette Crafter | `^0.5.0`       | `MOVEMENT_DIRECTIVES` 18, `moveWhileTap` 12, `moveEnter` 7, `moveStagger` 6, `moveTrigger` |
| Lumen Icons     | `^0.8.0`       | `MOVEMENT_DIRECTIVES` 20, `moveInView` 12, `moveWhileHover` 7, `[move]` 7                  |
| Agentyx         | —              | `moveInView` 15, `moveWhileHover` 11, `moveStaggerStep` 6, `moveWhileTap` 5                |
| Wisp            | —              | `MOVEMENT_DIRECTIVES` 26, `moveEnter` 18, `moveDelay` 5                                    |
| DevFlare        | `0.8.0`        | `moveStagger` 2, `MOVEMENT_DIRECTIVES` 2, `[move]`                                         |
| CV Builder      | `0.7.0`        | `moveEnter` 3, `moveWhileHover` 1                                                          |
| Quartz          | `0.8.0`        | `[move]` 12, `moveDelay` 8, `MOVEMENT_DIRECTIVES` 8, `moveWhileHover` 2                    |
| ForgeCMS        | —              | no usage found — not applicable                                                            |

Findings, each with its location:

1. **Fractional-second timing read as milliseconds.** Agentyx binds `[moveStaggerStep]="0.08"`,
   `"0.09"`, `"0.07"` (`about.component.ts`, `features.component.ts`, `packs.component.ts`,
   `hero.component.ts`) and `[moveTextStagger]="0.035"` — all clearly seconds, all 0.07–0.09 **ms**
   in practice (no visible stagger). Every other consumer uses ms (`[moveStagger]="50"`, `"80"`).
2. **Hover/tap literals re-implemented everywhere.** Volt UI keeps `HOVER_LIFT = { y: [0, -2],
scale: [1, 1.02] }` / `TAP_PRESS = { scale: [1, 0.97] }` in `app/lib/motion.ts`. Other apps copy
   literals: hover `{ y: [0, -10], scale: [1, 1.012] }` ×7, `{ y: [0, -8], scale: [1, 1.01] }` ×2,
   `y` −1…−10; tap `{ scale: [1, 0.96] }` ×6, `0.95` ×4, `0.97` ×2, `0.98` ×2, plus three-keyframe
   taps like `{ scale: [1, 0.97, 1] }` (wrong for a while-held gesture: release replays the bounce).
3. **`MOVEMENT_DIRECTIVES` for two or three directives.** Palette Crafter (18 imports), Lumen
   Icons (20), Wisp (26), Quartz (8), DevFlare (2) — nearly all in components that use one to
   three directives.
4. **Reduced motion re-implemented.** Lumen Icons: `provideMovement({ disabled:
prefersReducedMotion() })`. CV Builder: `provideMovement({ disabled: true })` in the _server_
   config "to keep angular-movement inert during prerendering" — the engine is already a no-op on
   the server.
5. **Imperative-only `MoveTrigger`.** Palette Crafter `(home).page.ts`:
   `[moveTrigger]="false" [moveFrames]="{}" [moveDuration]="520"` purely to get a handle for
   `trigger.play(frames)`; it cannot vary duration between its expand and fade phases
   (`docs/LIB-FINDINGS.md` #2, #4).
6. **View Transitions leave the library.** Palette Crafter `services/theme-reveal.ts` calls raw
   `root.animate({ clipPath }, { pseudoElement: '::view-transition-new(root)' })`
   (`LIB-FINDINGS.md` #3).
7. **Cancellation contract unknown.** Palette Crafter wraps `await trigger.play()` in
   `try/finally` believing cancellation rejects. It does not (`BaseAnimationPlayer.cancel()`
   resolves) — but nothing documents that, and investigation found a real hang instead (below).
8. **Arbitrary CSS passthrough is the "standout feature"** for Palette Crafter (`clipPath`), only
   discoverable by reading `keyframe-composer.ts` (`LIB-FINDINGS.md` #1).
9. **Pre-hydration hero motion** — Volt UI animates its hero in CSS on purpose; a WAAPI directive
   cannot run before hydration. Legitimate limit, documented not "fixed".

## Bugs found during investigation

- **Hover fakes hover on touch and blocks native behavior.** `MoveHoverDirective` binds
  `touchstart` and calls `event.preventDefault()`, which suppresses the synthesized click (a
  `<a moveWhileHover>` is not followable by tap in several browsers) and can block scrolling when
  a gesture starts on the element. Separately, `mouseenter` fires from the browser's compatibility
  mouse events after a tap, which is where sticky hover comes from.
- **`finished` can hang forever.** `BaseAnimationPlayer` resolves `finished` on the WAAPI
  `finish` event or its own `cancel()`, but never on an _external_ cancellation of the underlying
  `Animation` (a skipped View Transition tearing its pseudo-elements down, `el.getAnimations()
.forEach(a => a.cancel())`, a removed pseudo-element). `await controls.finished` then never
  settles.
- **Reduced-motion warning spam.** `resolveMovementConfig()` calls `movementWarn()` on every
  resolution while reduced motion is on — every hover in and out logs.
- **Invalid timing strings produce `NaN`**, which `element.animate()` rejects with a `TypeError`.

## Proposed solution

### 1. Hover semantics (stable, behavioral fix — no signature removed)

`moveWhileHover` listens to `pointerenter`/`pointerleave` and ignores `pointerType === 'touch'`.
Mouse is unchanged. Pen counts as hover-capable (a hovering stylus reports real `pointerenter`
before contact; a non-hovering pen gets `pointerleave` on lift, so there is no sticky state). No
`preventDefault()` anywhere. Touch feedback belongs to `moveWhileTap`, which already uses pointer
events without `preventDefault()`. `onMouseEnter()`/`onMouseLeave()` remain (they are the hover
start/end entry points). `onTouchStart()`/`onTouchEnd()` remain as `@deprecated` no-longer-bound
members so the class shape stays compatible.

### 2. `MoveTime` (stable, additive)

```ts
export type MoveTime = number | `${number}ms` | `${number}s`;
export function moveTimeToMs(value: MoveTime): number;
```

Numbers are milliseconds, forever. A bare numeric string (`moveDuration="300"`) stays ms, as
today. One parser (`engines/move-time.ts`) is used everywhere; resolved config stays numeric ms.
Accepted by: every directive's `moveDuration`/`moveDelay`/`moveReverseDuration`, `moveStagger`,
`moveStaggerStep`, `moveTextStagger`, `moveLoopDelay`; `provideMovement()`'s `duration`/`delay`;
`MoveAnimateOptions.duration`/`delay`/`repeatDelay`; `MovePropertyTransition.duration`/`delay`;
`MoveRepeatOptions.repeatDelay`; `MoveVariant.duration`/`delay`/`staggerChildren`/`delayChildren`;
`MoveAnimationConfig.duration`/`delay`. Not widened: `MovementConfig` (the resolved,
injected shape stays numeric), `MOVEMENT_DEFAULTS`, `times` (offsets, not durations), spring
physics fields.

Dev-mode warning, deduplicated per input + value, for a _numeric_ timing value strictly between
0 and 1 (`0.08`): "moveStaggerStep received 0.08. Numeric timing values are milliseconds. Did you
mean "80ms" or "0.08s"?" Zero, explicit `"0.5ms"` strings and values ≥ 1 never warn. Unparseable
strings warn and fall back to the default instead of producing `NaN`.

### 3. `MoveTriggerDirective` (experimental — changed)

```html
<div #overlay="moveTrigger" moveTrigger></div>
```

```ts
await trigger.play({ opacity: [0, 1] }, { duration: '180ms', easing: 'ease-out' });
```

- `moveTrigger` is optional. A bare attribute (or no binding) is imperative-only: no declarative
  play/reset. A bound boolean keeps today's behavior exactly.
- `moveFrames` is optional; frames can come from `play(frames)` alone.
- `play(frames?, options?: MoveAnimateOptions)`. Resolution order: `MOVEMENT_CONFIG` → directive
  inputs → `play()` options → reduced motion.
- `reset()`/destroy cleanup use the frames that were last played, not only `moveFrames`.

### 4. `MoveAnimator` (stable, additive)

- `animate(target: Element | ElementRef<Element>, keyframes, options)`.
- `MoveAnimateOptions` gains `repeat`, `repeatType`, `repeatDelay`, `pseudoElement`; timing fields
  accept `MoveTime`.
- `set(target, state: MoveKeyframeState)` — commit a state instantly through the same composition
  the directives use (cancels the target's in-flight engine animation first).
- `clear(target, properties?)` — remove what the library wrote inline.
- Positioning: `MoveAnimator` is the imperative API; `MoveTrigger` is for declarative trigger
  relationships.

### 5. Pseudo-element / View Transition interop (stable, additive)

`animator.animate(document.documentElement, { clipPath: [...] }, { pseudoElement:
'::view-transition-new(root)', duration: 520 })`. Pseudo-element animations: plain WAAPI timing
(duration/delay/easing/iterations/repeat), `fill: 'backwards'`, never `commitStyles()` (it throws
for pseudo-elements, and there is no inline style to commit to), never registered with the
active-player registry. Unsupported browser (no `KeyframeEffect.pseudoElement`) or an invalid
selector → no-op, `null`, `onDone` still runs, no throw. Reduced motion / `disabled` → skip the
pseudo animation entirely; the caller's DOM change is the committed state. Spring and per-property
transitions are not applied to pseudo-elements (dev warning).

### 6. `finished` contract (stable, documented + hardened)

`AnimationControls.finished` **always resolves and never rejects**: on natural finish, on
`cancel()`, on preemption (drag), on the owner's destroy, and — new — when the underlying WAAPI
animation is cancelled by something else. Documented on the interface and in the docs.

### 7. Presets `lift` and `press` (stable, additive)

`lift`: `{ y: [0, -4] }`. `press`: `{ scale: [1, 0.97] }`. Deliberately on separate channels:
the engine writes atomic `translate`/`scale`, and a tap's release commits `scale: 1` — a `lift`
that also scaled would lose its scale every time the element was pressed while hovered. Keeping
lift on `translate` and press on `scale` makes `moveWhileHover="lift" moveWhileTap="press"` compose
exactly. −4px is the median of the audited hover lifts; 0.97 is Volt UI's `TAP_PRESS`.

### 8. Import DX — decision: no new aggregates

Focused aggregates (`MOVEMENT_INTERACTION_DIRECTIVES`, …) save one or two identifiers and add a
taxonomy to learn; the audited components use 1–3 directives, so the narrow import _is_ the short
path once examples show it. Instead: every README/docs/MCP/skill example imports the directives
it uses; MCP `get_example` returns the narrow `import` line; `MOVEMENT_DIRECTIVES` JSDoc steers
away from itself.

### 9. Documentation

Common patterns (product card, button, staggered grid, imperative, View Transition, reduced
motion, when to use CSS instead); reduced-motion layering (OS preference automatic →
`config.disabled` app kill switch → `moveDisabled` per element); arbitrary CSS properties;
cancellation contract; timing units. Demo site timing normalized to one teaching style: `"80ms"`
strings for static attributes, numbers (ms) for bound expressions.

### 10. Sequence API — investigated, deferred

`await animator.animate(a)?.finished; commit(); await animator.animate(b)?.finished;` already
expresses the Palette Crafter flow, and with the `finished` contract above it cannot reject or
hang. A `sequence()` primitive would need its own controls type with unclear
`pause`/`currentTime` semantics and a cancellation token — a new stable type for a two-line
convenience. Revisit if a consumer needs whole-chain cancellation.

## Out of scope

- No engine rewrite, no new engine, no shared RAF scheduler, no timeline DSL, no `sequence()`.
- No focused directive aggregates; `MOVEMENT_DIRECTIVES` unchanged.
- No promotion of any experimental API (re-evaluated below; none ready).
- No pre-hydration/first-paint mechanism (documented instead).
- No enumeration of CSS properties into `MoveKeyframeProperties`.
- No `experimental` secondary entry point, no new dependency.
- No publishing. The release is prepared, not cut.

## Acceptance criteria

- [x] `moveWhileHover` never calls `preventDefault()`, ignores touch pointers, handles mouse and
      pen; unit tests + touch-emulated e2e on Chromium, Firefox, WebKit (link with
      `moveWhileHover="lift" moveWhileTap="press"` navigates on tap, touchstart not
      default-prevented, no sticky hover state).
- [x] `MoveTime` + `moveTimeToMs()` exported; parser unit-tested (numbers, `ms`, `s`, bare numeric
      strings, whitespace, invalid, negative).
- [x] Every timing input listed in §2 accepts `MoveTime`; `moveStaggerStep="80ms"`, `"0.08s"`,
      `[moveStaggerStep]="80"` produce identical delays; `[moveStaggerStep]="0.08"` stays 0.08ms
      and warns once.
- [x] `provideMovement({ duration: '320ms' })` injects `duration: 320`.
- [x] `<div moveTrigger>` with no other input works imperatively; `play(frames, options)` honours
      the documented resolution order (tested per layer).
- [x] `MoveAnimator` accepts `ElementRef`; `set`/`clear` exist and are tested; `pseudoElement`
      passes through to WAAPI, skips commit, no-ops when unsupported / reduced motion.
- [x] `finished` resolves on external cancellation of the underlying animation (test).
- [x] `lift`/`press` presets exist, reverse cleanly, compose on one element (unit + e2e).
- [x] Arbitrary CSS property passthrough pinned by a test (`clipPath`, `filter`, `borderRadius`).
- [x] Consumer fixture compiles the new API against the packed tarball on Angular 21 and 22.
- [x] MCP snapshot regenerated; skill + MCP guidance cover units, presets, imperative API,
      reduced motion, narrow imports, CSS for first paint; `get_example` returns a narrow import.
- [x] Docs: common patterns, reduced motion, timing, cancellation, View Transition recipe,
      arbitrary CSS; demo timing values normalized.
- [x] `api-report.txt`, `CHANGELOG.md`, `MIGRATION.md`, `docs/ai/STATE.md`, `ARCHITECTURE.md`
      updated.
- [x] Full gate passes: `test:coverage`, `test:site`, `lint`, `format:check`-equivalent, `build`,
      `build:prod`, `docs:check`, `api:check`, `pack:check`, `validate:consumer`, `e2e`,
      `mcp:test`.

## Implementation plan

- [x] 1. `engines/move-time.ts` (+ spec) — type, parser, attribute transforms, warning.
- [x] 2. Directive timing inputs → time transforms (all directives in §2).
- [x] 3. `presets.types.ts` — widen timing fields; `transition-composer.ts`, `easing-groups.ts`,
     `animation-engine.service.ts`, `waapi-player.ts`, `move-variants.directive.ts`,
     `move-animation.directive.ts` — normalize at read.
- [x] 4. `providers/provide-movement.ts`, `tokens/movement.tokens.ts` — `MoveTime` input,
     JSDoc for reduced-motion layering.
- [x] 5. `move-animation.utils.ts` — dedupe the reduced-motion warning.
- [x] 6. `move-hover.directive.ts` (+ spec) — pointer events.
- [x] 7. `base-player.ts` (+ spec) — resolve on external cancel; optional no-commit mode.
- [x] 8. `animation-engine.service.ts` (+ spec) — `pseudoElement` path.
- [x] 9. `move-animator.service.ts` (+ spec) — ElementRef, options, `set`/`clear`.
- [x] 10. `move-trigger.directive.ts` (+ spec) — imperative mode, per-call options.
- [x] 11. `presets.ts`/`presets.types.ts` (+ spec) — `lift`, `press`.
- [x] 12. `movement.ts` — exports + JSDoc.
- [x] 13. Demo site: patterns page, View Transition demo, timing normalization, reference data.
- [x] 14. e2e: touch suite (3 browsers), View Transition (Chromium), lift+press composition.
- [x] 15. Consumer fixture.
- [x] 16. MCP: guidance, `get_example` import line, snapshot, skill.
- [x] 17. READMEs, MIGRATION, CHANGELOG, ARCHITECTURE, ROADMAP, STATE; `api-report.txt`.
- [x] 18. Full gate; record results below.

## Experimental API re-evaluation

None promoted. Promotion needs a mature shape, real usage, strong tests and no open architectural
limit; the audit found almost no external usage of any of them.

- **`moveTrigger`** — improved this minor (imperative mode, per-call options) precisely because its
  shape was still moving; one audited consumer, used as an imperative handle that `MoveAnimator`
  now serves better. Stays experimental; its future is "declarative trigger", and whether it keeps
  an imperative surface at all is open.
- **`moveTarget`** — one audited use (Lumen Icons). No shape problems found, but no usage evidence
  to justify freezing it.
- **`moveDrag`** — no audited usage; no bug found, no redesign done.
- **`moveLayout`** — no audited usage; the `SharedLayoutRegistry` age-out design is still the only
  answer to handover ordering.
- **`moveSmoothScroll` / `SmoothScrollService`** — this spec found and fixed a real bug that made
  spec 013's keyboard-scroll fix inert for page scroll. Still a root singleton (the API-shape limit
  noted in spec 008), so still not ready.

## Verification notes

All run on 2026-09-25 on this branch.

- `pnpm test:coverage`: **580/580** (was 512), 44 files. Coverage 95.01 / 88.37 / 98.18 / 96.75
  (stmts / branches / funcs / lines) vs baseline 94.84 / 87.78 / 98.06 / 96.67 — all up.
- `pnpm test:site`: 11/11.
- `pnpm lint`: clean (both projects). Two intentional suppressions, each with a reason comment
  (the deprecated `onTouchStart` parameter; a prototype getter the pseudo-element feature detection
  depends on).
- Prettier check: all files formatted.
- `pnpm build`, `pnpm build:prod` (incl. SSR prerender): pass.
- `pnpm docs:check`: no drift (21 directives).
- `pnpm api:check`: matches the regenerated `api-report.txt`. Diff reviewed before regenerating:
  additive/widening only for stable APIs; directive timing inputs keep their
  `InputSignalWithTransform<number | undefined, unknown>` declarations; `MoveTriggerDirective`
  changes are experimental.
- `pnpm pack:check`: pass. Size: fesm 256,076 → 275,190 B raw (mostly JSDoc); **minified+gzip
  22,029 → 23,403 B (+1,374 B, +6.2%)** for the whole library, measured against a `main` build.
- `pnpm validate:consumer`: packed tarball installs and AOT-builds with `strictTemplates` on
  **Angular 21 and 22**, including `validation/consumer/src/consumer-dx.ts` (every `MoveTime` path,
  presets, trigger imperative mode, `MoveAnimator` incl. `pseudoElement`, and a `@ts-expect-error`
  proving `MoveTime` rejects `'fast'`).
- `pnpm mcp:test` 26/26, `pnpm mcp:build` pass; stdio smoke test of the built server:
  `tools/list` shows `get_guidelines`, `get_example moveWhileHover` returns the narrow import and
  `moveWhileHover="lift"`.
- `pnpm e2e`: **121 passed, 1 flaky, 2 skipped** across Chromium/Firefox/WebKit. Flaky = the
  pre-existing, documented `enter demo replays with the newly selected preset` (passed on retry).
  Skipped = the CDP touch-drag test on Firefox/WebKit, by design. New: `touch.spec.ts` (tap on a
  `lift`+`press` link navigates, `touchstart` not default-prevented, no sticky hover — all three
  engines; touch-scroll from the link — Chromium), `consumer-dx.spec.ts` (lift+press composition,
  MoveAnimator, real View Transition reveal incl. reduced motion, two-phase trigger), and a
  cross-browser keyboard/programmatic scroll test.
- Test honesty: the first e2e run passed three touch tests vacuously — the dev server was serving
  no client JS (pre-existing `vite/client` typing break) and the hydration wait was a
  `typeof`-truthy check. Both fixed; the new smooth-scroll unit tests were confirmed to fail against
  the old service code.

## Final report

1. **Version found:** npm `latest` = `1.1.0`; repo `1.1.0`; tag `v1.1.0`; peer range
   `^21.2.0 || ^22.0.0`. MCP `0.1.0`.
2. **Target:** `1.2.0` (MCP `0.2.0`).
3. **Consumers audited:** see "Consumer audit" — 8 with usage, ForgeCMS without.
4. **Bugs:** hover `preventDefault()`/sticky hover on touch; `finished` hanging on external
   cancel; reduced-motion warning spam; `NaN` from invalid timing strings; `SmoothScrollService`
   page-scroll resync inert (+ idle writes cancelling WebKit smooth scroll); MCP snapshot extractor
   producing zero directives; dev server/e2e broken on `main` since PR #58; stagger demo snippet
   showing the child preset on `moveStagger`.
5. **DX problems:** seconds-as-numbers timing; copied hover/tap literals (incl. three-keyframe
   taps); `MOVEMENT_DIRECTIVES` taught by our own onboarding; manual reduced-motion wiring;
   dummy-input `moveTrigger`; raw WAAPI for View Transitions; undocumented cancellation.
   6–13. See "Proposed solution" §1–§9 and the CHANGELOG.
6. **Stable API changes:** additive/widening only — `MoveTime`, `moveTimeToMs`,
   `MoveAnimationTarget`, `MoveAnimator.set/clear`, `MoveAnimateOptions.pseudoElement`, presets
   `lift`/`press`, widened timing field types, `MoveHoverDirective.onPointerEnter/onPointerLeave`
   (+ deprecated `onTouchStart/onTouchEnd`), behavioral hover change on touch.
7. **Experimental:** `MoveTriggerDirective` (optional inputs, bare-attribute imperative mode,
   `play(frames, options)`); `SmoothScrollService` internal fix.
   16–19. See "Verification notes".
8. **Remaining limitations:** no pre-hydration animation (CSS); completion vs cancellation not
   distinguishable; springs/per-property transitions not applied to pseudo-elements; the touch
   scroll e2e is Chromium-only (needs CDP).
9. See "Experimental API re-evaluation".
10. **Ready to publish:** yes, after merge — everything is under `## Unreleased`, the gate is green,
    and `pnpm release minor --push` / an `mcp-v0.2.0` tag cut it.
11. **1.3 focus:** a way to tell completion from cancellation if consumers ask; decide
    `moveTrigger`'s long-term shape (declarative-only vs. keeping the handle); Angular 22 in the
    library's own CI matrix; SSR-render the packed package in the consumer fixture.

## Follow-ups (out of scope, noted for later)

- `sequence()` if a consumer needs whole-chain cancellation (see §10).
- A way to tell completion from cancellation (`finished` resolves for both). Would need either a
  new optional member on the stable `AnimationControls` or a separate return value — not needed by
  any audited consumer yet.
- An SSR-rendered initial-state mechanism for above-the-fold entrances.
