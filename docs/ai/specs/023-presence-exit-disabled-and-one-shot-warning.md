# Spec 023 — Presence exits read `moveDisabled` at leave time; one-shot dev warning

- **Status:** done
- **Created:** 2026-11-23
- **Last updated:** 2026-11-23
- **Breaks public API:** no. No new inputs, exports or selectors. Behavior: a leave reads its inputs
  when the element leaves (one microtask after the pass that removed it) instead of at entrance.
- **Related:** consumer report from a site built on 1.6 (carousel with `*movePresenceFor`,
  `moveSpringValue`, `moveVariants`, `MoveAnimator` + View Transitions)

## Problem / motivation

1. 🔴 `[moveDisabled]="!changed()"` on an `img` inside `*movePresenceFor` (so the server-rendered first
   photo does not fade in again after hydration) also removed its exit: the outgoing photo vanished.
   Two causes: `moveAnimate` / `moveLeave` / `[moveAnimation]` / `moveVariants` checked a config
   snapshotted at entrance, and the presence directives call `playLeave()` from their own effect,
   which runs before the leaving view's bindings are refreshed in that pass — so even a live read
   still saw the old value. Consumer workaround: `moveLeave` on a wrapper, `moveEnter` on the `img`.
2. 🟢 One-shot directives ignore input changes after playing (documented), but nothing tells you at
   runtime — an easy mistake.
3. 🟢 Docs gaps: the SSR "do not replay the entrance after hydration" pattern; SVG + `moveLoop`
   (`transform-box: fill-box`, `r` is unreliable).

## Proposed solution

1. `playLeave()` defers by one microtask (`afterLeaveBindings()` in `move-animation.utils.ts`), then
   reads `moveDisabled`, `prefers-reduced-motion` and the exit inputs. A token bumped by every leave,
   `cancelLeave()` and `ngOnDestroy()` drops a deferred leave that became stale (revived in the same
   tick → no exit starts). Applied to `MoveAnimateDirective`, `MoveLeaveDirective`,
   `MoveAnimationDirective`, `MoveVariantsDirective`.
2. `warnOnChangeAfterPlay()` in `dev-warn.ts`: dev-mode-only effect that warns once when the entrance
   input of `moveEnter`, `moveAnimate` (`move` / `moveAnimate` / `moveInitial`) or `moveInView`
   changes (by value) after the directive consumed it. `moveDisabled` is deliberately not watched.
3. Presence guide section + compiled snippet `presence-hydration`; SVG tip in the loops section;
   README reactivity paragraphs; `api.md` input-reactivity note.

```html
<img
  *movePresenceFor="let src of slide(); trackBy: bySrc"
  move="fade-up"
  [moveDisabled]="!changed()"
  [src]="src"
  alt=""
/>
```

## Out of scope

- 🟠 `moveEnter` with an SSR/CSS mode (emit a class + CSS variables on the server) — new public API.
- 🟠 Pausable autoplay timer (`moveTimer(duration, { paused })` / `moveProgress`) — new public API.
- Separate `moveEnterDisabled` / `moveLeaveDisabled` inputs: unnecessary once the leave reads live.
- `moveVariants` replaying the active variant when `moveDisabled` (or another config input) changes —
  its effect tracks those inputs; pre-existing, harmless (same-state replay), not touched.
- Stagger delay still included in `moveAnimate`'s leave config (pre-existing).

## Acceptance criteria

- ✅ Carousel-shaped tests for `moveAnimate`, `moveLeave`, `[moveAnimation]`, `moveVariants`: the
  server-rendered item plays its exit after navigation (`presence-leave-disabled.spec.ts`); the
  `moveAnimation` / `moveVariants` cases fail against the previous source.
- ✅ Disabling right before removal skips the exit; a leave cancelled before it began never starts;
  an item revived in the same tick never starts its exit (`move-leave`, `move-presence-for` specs).
- ✅ Warning fires once per directive, not for same-value literals, not for `moveDisabled`
  (`one-shot-warning.spec.ts`).
- ✅ `pnpm docs:verify` passes (snippet compiles).
- ✅ Phase 5 gate (see Verification notes).
- ✅ CHANGELOG (Unreleased) and STATE updated.

## Implementation plan

- [x] 1. `directives/presence-leave-disabled.spec.ts` — reproduce (all fail before the fix).
- [x] 2. `move-animation.utils.ts` — `afterLeaveBindings()`; deferred, tokenized `playLeave()` in
      `move-animate`, `move-leave`, `move-animation`, `move-variants` directives.
- [x] 3. Existing tests that asserted a synchronous leave start now await one microtask
      (`move-leave`, `move-presence`, `move-presence-for`, `reduced-motion` specs).
- [x] 4. `dev-warn.ts` `warnOnChangeAfterPlay()` + wiring in `move-enter`, `move-animate`,
      `move-in-view`; `one-shot-warning.spec.ts`.
- [x] 5. Docs: `guides/presence.md`, `guides/stagger-and-scroll.md`, `api.md`, both READMEs,
      `src/docs-snippets/presence.ts`; `pnpm docs:sync`.

## Verification notes

- Unit: 627/627 (`ng test movement`). New presence tests verified red against the old directives.
- See the PR for the full gate output (lint, build, format, e2e, docs:verify, pack:check).

## Follow-ups (out of scope, noted for later)

- SSR-safe entrance (`moveEnter` CSS mode or a preset → `@keyframes` helper).
- Pausable autoplay timer / progress directive.
