# Spec 007 — 0.8, part two: closing the Framer Motion parity gaps

- **Status:** done
- **Created:** 2026-08-17
- **Last updated:** 2026-08-17
- **Breaks public API:** no — additive. New inputs, new transition fields, one widened provider
  interface (optional members only).
- **Related:** spec 006 (0.8 part one), `ROADMAP.md` 1.0, the "Follow-ups" list in spec 006

## Problem / motivation

Spec 006 closed one capability hole and the API debt. What it deliberately deferred is the set of
concrete behaviours a Framer Motion user reaches for and does not find here. Individually each is
small; together they are the difference between "an Angular animation library" and "the Framer
Motion of Angular", which is the stated goal in `CONTEXT.md`.

Five gaps, all verified against the source:

1. **No repeat controls.** `WaapiPlayer` never sets `direction`, so every loop restarts hard at
   frame 0 — `moveLoop` cannot breathe, pulse or yoyo, which is most of what looping is for. There
   is no `repeatDelay` either, so a loop cannot pause between cycles.
2. **No `whileDrag`.** Hover, tap and focus each have a `while*` state; drag is the only gesture
   without one, so the near-universal "lift the card while dragging" cannot be expressed.
3. **No per-keyframe timing.** Keyframe arrays are always evenly spaced —
   `keyframe-composer.ts` distributes by index — so `{ x: [0, 100, 0] }` cannot dwell. Per-property
   easing is explicitly unimplemented: `transition-composer.ts:79` warns and falls back to the
   global easing.
4. **No variant orchestration.** `MoveVariantsDirective` propagates the active variant to children
   but nothing else. Framer's `staggerChildren` / `delayChildren` / `when` are what make variants
   worth using over plain state; today staggering requires a separate `moveStagger` directive that
   does not compose with variant switching.
5. **`*movePresenceFor` has no `popLayout`.** An exiting row holds its space for the whole leave, so
   the list only closes the gap after the animation ends instead of reflowing immediately.

## Proposed solution

### 1. Repeat controls

Engine-level `repeat` handling, surfaced two ways: dedicated inputs on `moveLoop` (looping is its
entire job) and transition fields everywhere a `moveTransition` is already accepted.

```html
<!-- breathes instead of snapping back to frame 0 -->
<div [moveLoop]="{ scale: [1, 1.1] }" moveLoopType="reverse" [moveLoopDelay]="200"></div>

<div [moveVariants]="variants" [moveTransition]="{ repeat: 3, repeatType: 'reverse' }"></div>
```

- `repeatType: 'loop'` → restart (today's behaviour, stays the default).
  `'reverse'` → alternate direction each cycle.
- `repeatDelay` is implemented by padding the keyframe timeline with a hold on the final value,
  because WAAPI has no per-iteration delay.
- `SpringPlayer` already warns that `iterations !== 1` glitches; repeat on a spring keeps that
  warning rather than pretending to support it.

### 2. `whileDrag`

```html
<div moveDrag [moveWhileDrag]="{ scale: [1, 1.05] }"></div>
```

The drag directive must stay the **single writer** of the host transform while a drag is active —
that is the invariant `transform-state.ts` exists to protect. So `whileDrag` is not handed to the
engine mid-drag; the directive tweens the gesture channels itself and composes them with the drag
translate in one write, then releases back through the engine on drag end.

### 3. Per-keyframe timing and per-property easing

```html
<div
  [moveTarget]="on()"
  [moveFrames]="{ x: [0, 100, 0] }"
  [moveTransition]="{ times: [0, 0.8, 1], opacity: { easing: 'linear' } }"
></div>
```

- `times` maps keyframe values onto explicit offsets instead of even spacing.
- Per-property easing works by splitting the play into one animation for the **transform group**
  (which must stay a single composed channel) plus one per independent property. The transform
  group's channels necessarily share an easing; that limitation gets documented rather than warned
  about at runtime.

### 4. Variant orchestration

```ts
variants = {
  open: { opacity: 1, staggerChildren: 60, delayChildren: 100, when: 'beforeChildren' },
};
```

`MoveVariantsProvider` gains optional members so children can register and ask for their own delay —
the same shape `MOVE_STAGGER_PARENT` already uses, so the two compose instead of competing.

### 5. `mode: 'popLayout'`

Exiting rows are taken out of flow (`position: absolute` at their measured rect) so the remaining
rows close the gap immediately while the exit animation plays.

## Out of scope

- No change to any existing selector, input name or output name. `api-surface` diff must show
  additions only.
- No new runtime dependency.
- Spring + repeat is **not** made glitch-free; the existing warning stands.
- True per-property easing **within** the transform group (impossible in one WAAPI animation, and
  splitting transforms across animations makes them fight over the same channel).
- The three pre-existing flaky e2e tests (recorded in `STATE.md`) — still their own task.
- No version bump; that happens at release.

## Acceptance criteria

- [x] `repeatType: 'reverse'` alternates direction; `'loop'` keeps restarting; default is unchanged.
- [x] `repeatDelay` holds the final value between cycles, verified on the composed keyframes.
- [x] `moveLoop` exposes the repeat controls and its existing behaviour is unchanged when they are absent.
- [x] `[moveWhileDrag]` scales/rotates during a drag and releases afterwards, **without** losing or
      double-counting the drag translate (asserted on the composed transform).
- [x] `times` produces the given offsets; a mismatched length is rejected with a dev warning.
- [x] Per-property easing no longer warns; independent properties get their own easing, and the
      transform group keeps one.
- [x] `staggerChildren` / `delayChildren` produce increasing per-child delays in DOM order;
      `when: 'afterChildren'` delays the parent's own animation.
- [x] `mode: 'popLayout'` takes the exiting row out of flow so siblings reflow immediately.
- [x] Reduced motion still disables every one of the above.
- [x] Unit tests per feature; `pnpm test:coverage`, `ng lint`, `pnpm build`, `pnpm e2e`,
      `pnpm pack:check`, `pnpm validate:consumer` all pass.
- [x] Docs (both READMEs, `ARCHITECTURE.md`, directive reference), CHANGELOG, STATE.md updated.

## Implementation plan

Ordered by value against risk. Each step is its own commit.

- [x] 1. Repeat controls — `presets.types.ts`, `engines/waapi-player.ts`,
     `engines/animation-engine.service.ts`, `directives/move-loop.directive.ts` + specs.
- [x] 2. `moveWhileDrag` — `directives/move-drag.directive.ts`, `engines/transform-state.ts` + specs.
- [x] 3. `mode: 'popLayout'` — `directives/move-presence-for.directive.ts` + spec.
- [x] 4. Variant orchestration — `directives/move-variants.directive.ts`, `tokens/` + specs.
- [x] 5. `times` + per-property easing — `engines/keyframe-composer.ts`,
     `engines/transition-composer.ts`, `engines/animation-engine.service.ts` + specs.
- [x] 6. Demos for each, directive reference entries, docs, CHANGELOG, STATE.md.

## Verification notes

All five landed as separate commits, each with unit tests, and three were also driven in a real
browser because animation defects are invisible to jsdom.

- **Repeat**: the live animation moves from `direction: 'normal'` to `'alternate'` when the control
  is toggled, `repeatDelay` takes the cycle from 1000ms to 1400ms, and sampled `scale` descends
  through intermediate values (1.048 → 1.037 → 1.024 → 1.012 → 1.000) rather than jumping — which is
  what "it yoyos" actually means.
- **`moveWhileDrag`**: mid-drag the host reads
  `translate(60px, 20px) rotate(1.99deg) scale(1.06)` — the translate is exactly the pointer delta
  and appears once, so the gesture is neither losing nor doubling it — and returns to `none` after
  release.
- **`popLayout`**: 60ms after removing the first row it is still mounted at `position: absolute`
  while the rows below have already moved up (501→474px, 555→528px), and they stay there when it is
  finally removed, so there is no end-of-animation jump.

One existing test needed updating rather than deleting: `transition-composer` used to warn that
per-property easing was unsupported, and the assertion pinned that string. The branch is now only
reachable for transform channels, so the test was rewritten around that narrower, still-true claim.

Full gate: 461 unit tests green, `ng lint` clean, `pnpm build` (incl. SSR prerender), `pnpm e2e`,
`pnpm pack:check` and `pnpm validate:consumer` on Angular 21 and 22.

## Follow-ups (out of scope, noted for later)

- Gesture priority when hover + tap + drag are on the same element.
- `moveDrag` position as a two-way binding / imperative reset.
