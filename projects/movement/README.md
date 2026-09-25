# angular-movement

[![CI](https://github.com/Andersseen/angular-movement/actions/workflows/ci.yml/badge.svg)](https://github.com/Andersseen/angular-movement/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/angular-movement.svg)](https://www.npmjs.com/package/angular-movement)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Andersseen/angular-movement/blob/main/LICENSE)

Angular-native motion library powered by the browser Web Animations API and Angular signals. It
provides declarative directives for motion-style states, presets, variants, gestures, spring
physics, SVG path drawing, drag, scroll-driven and layout animation, presence/stagger
orchestration, and imperative motion values (`moveValue`, `moveTransform`, `moveSpringValue`) — all
SSR-safe and zoneless-compatible.

## Features

- Preset-based enter and leave animations
- Custom keyframes for full control
- Spring-driven transitions
- Hover, tap, focus, in-view, and scroll interactions
- Presence orchestration for exit animations before DOM removal, for a single view or a keyed list
- Repeat controls: alternating loops (`repeatType`), `repeatDelay` and cycle counts
- Stagger support for list choreography
- Motion-style variants with `staggerChildren` / `delayChildren` / `when` orchestration
- Per-property transitions, including per-property easing and explicit keyframe `times`
- SVG path drawing with `pathLength` and `pathOffset`
- Drag gestures with constraints, elasticity, momentum, snap points, and a `moveWhileDrag` state
- `lift` / `press` interaction presets that compose on one element
- One timing vocabulary: numbers are milliseconds, or say `"80ms"` / `"0.08s"`
- Imperative API via `MoveAnimator` — `animate()`, `set()`, `clear()`, and pseudo-element /
  View Transition animation
- Works with modern standalone Angular apps
- No `@angular/animations` setup required

## Installation

```bash
npm install angular-movement
```

Peer dependencies:

- @angular/core ^21.2.0 || ^22.0.0
- @angular/common ^21.2.0 || ^22.0.0

## Quick Start

Optionally set library-wide defaults in your app config. The user's `prefers-reduced-motion`
setting is honoured automatically — there is nothing to configure for it.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideMovement } from 'angular-movement';

export const appConfig: ApplicationConfig = {
  providers: [
    provideMovement({
      duration: '320ms', // or 320 — numbers are milliseconds
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }),
  ],
};
```

Import only the directives a component actually uses — that's what keeps route-level
tree-shaking effective:

```ts
import { Component } from '@angular/core';
import { MoveAnimateDirective, MoveHoverDirective, MoveTapDirective } from 'angular-movement';

@Component({
  selector: 'app-demo',
  imports: [MoveAnimateDirective, MoveHoverDirective, MoveTapDirective],
  template: `
    <h2 move="fade-up">Hello movement</h2>
    <button moveWhileHover="lift" moveWhileTap="press">Hover or press me</button>
  `,
})
export class DemoComponent {}
```

`MOVEMENT_DIRECTIVES` (spread into `imports`) remains available, but it pulls in all 21
directives — experimental ones included — and hides what a component depends on. Most components
use one to three; import those.

## Common patterns

Taken from how real apps use the library.

**Product card** — reveal once in view, lift on hover:

```html
<article moveInView="fade-up" moveWhileHover="lift">…</article>
```

**Button or link** — `lift` moves `translate`, `press` moves `scale`, so they compose on one
element. Hover responds to mouse and pen only; a finger has no hover state, so touch gets its
feedback from `moveWhileTap`. Neither directive calls `preventDefault()` — taps, link activation
and scrolling stay native.

```html
<button moveWhileHover="lift" moveWhileTap="press">Buy now</button>
<a routerLink="/pricing" moveWhileHover="lift" moveWhileTap="press">Pricing</a>
```

**Staggered grid:**

```html
<ul moveStagger moveStaggerStep="80ms">
  @for (item of items(); track item.id) {
  <li moveInView="fade-up">{{ item.label }}</li>
  }
</ul>
```

**Imperative animation** — `MoveAnimator` takes an `Element` or the `ElementRef` from
`viewChild()`:

```ts
readonly #animator = inject(MoveAnimator);
readonly toast = viewChild.required<ElementRef<HTMLElement>>('toast');

async dismiss() {
  await this.#animator.animate(this.toast(), { opacity: [1, 0], y: [0, 12] }, { duration: '180ms' })
    ?.finished;
  this.remove();
}

reset() {
  this.#animator.set(this.toast(), { opacity: 1, y: 0 }); // commit a state instantly
  this.#animator.clear(this.toast()); // or drop what the library wrote inline
}
```

**View Transition** — `pseudoElement` animates `::view-transition-new(root)` (or any
pseudo-element) through the same API:

```ts
const transition = document.startViewTransition(() => commitTheme());
await transition.ready;

animator.animate(
  document.documentElement,
  { clipPath: ['circle(0px at 40px 40px)', 'circle(1500px at 40px 40px)'] },
  { duration: '520ms', pseudoElement: '::view-transition-new(root)' },
);
```

Pseudo-element animations use duration, delay, easing and repeat (no springs), commit nothing
when they finish, and are skipped under reduced motion — the DOM change itself is the committed
state. A browser that cannot target pseudo-elements gets a no-op, never an exception. Turn off the
default cross-fade with `::view-transition-old(root), ::view-transition-new(root) { animation:
none; }`.

## Timing units

Every duration, delay and stagger accepts a `MoveTime`:

| Written                    | Means                                                          |
| -------------------------- | -------------------------------------------------------------- |
| `80` (a number, or `"80"`) | 80ms                                                           |
| `"80ms"`                   | 80ms                                                           |
| `"0.08s"`                  | 80ms                                                           |
| `[moveStaggerStep]="0.08"` | **0.08ms** — dev mode warns: _Did you mean "80ms" or "0.08s"?_ |

Numbers are milliseconds forever; that never changes. On static attributes, write the unit
(`moveStaggerStep="80ms"`). The same type is accepted by `provideMovement()`,
`MoveAnimator.animate()`, variants (`duration`, `delay`, `staggerChildren`, `delayChildren`) and
`transition` (`duration`, `delay`, `repeatDelay`). `moveTimeToMs()` converts one when your own
code needs the number.

## Reduced motion

Three layers, strongest first:

1. **The OS `prefers-reduced-motion` setting — automatic.** Every directive and
   `MoveAnimator` jump straight to the end state, including scroll-linked and parallax motion.
   You do not need to query `matchMedia` or pass it anywhere.
2. **`provideMovement({ disabled: true })` — an application kill switch** for app-owned reasons:
   a user-facing "reduce animations" setting, screenshot tests. It is not needed for reduced
   motion, and not needed for SSR (directives are already no-ops on the server).
3. **`moveDisabled` / the `disabled` option** — one element or one `animate()` call.

Avoid a starting style that only an animation undoes (`.card { opacity: 0 }`): users with reduced
motion would never see the element.

## Awaiting and cancellation

`AnimationControls.finished` — and `moveTrigger`'s `play()` — **always resolve and never
reject**: on natural finish, on `cancel()`, when a newer `play()` replaces the running one, when
the owning directive is destroyed, and when something else cancels the underlying animation (a
skipped View Transition). `await …finished` needs no `try/catch`, and the code after it always
runs. (Raw WAAPI differs: its `finished` rejects on cancel.) The promise does not say whether the
animation completed or was cancelled; track that in your own state when it matters.

## Any CSS property

Keyframes are typed for the common shorthands (`x`, `y`, `scale`, `rotate`, `blur`, SVG path
properties), and **any other property passes straight through** to the Web Animations API:

```html
<div [moveEnter]="{ clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'] }">Wipe</div>
<img [moveWhileHover]="{ filter: ['saturate(0.6)', 'saturate(1)'] }" />
<div [moveTarget]="open()" [moveFrames]="{ borderRadius: ['24px', '8px'] }">…</div>
```

## When CSS is the better tool

Angular Movement runs once the app is running — after hydration. An above-the-fold entrance that
must already be moving at first paint belongs in a CSS animation. Use the library for
interaction, reveal-on-scroll, presence, state changes and imperative sequences.

## Common Usage

### API quick reference

| Directive                                        | Use it for                                                              |
| ------------------------------------------------ | ----------------------------------------------------------------------- |
| `[move]` / `[moveAnimate]`                       | Preset, keyframe, or state-object entrance animations.                  |
| `[moveInitial]` / `[moveAnimate]` / `[moveExit]` | Motion-style initial, animate, and exit states.                         |
| `*movePresence`                                  | Wait for child exit animations before removing DOM.                     |
| `moveStagger`                                    | Choreograph children with DOM-order delays.                             |
| `[moveVariants]`                                 | Named states driven by string variant names.                            |
| `[moveTarget]`                                   | Boolean target animations that reverse when the target becomes false.   |
| `[moveTrigger]`                                  | Boolean trigger with reset; bare `moveTrigger` is an imperative handle. |
| `[moveDrag]`                                     | Pointer drag gestures with constraints, momentum, and snap behavior.    |
| `[moveScroll]` / `[moveParallax]`                | Scroll-linked progress and parallax transforms.                         |
| `[moveInView]` / `[moveText]`                    | IntersectionObserver-based reveal animations.                           |

### Recommended API path

Start with the smallest primitive that matches the job:

| Level             | Reach for                                                                    |
| ----------------- | ---------------------------------------------------------------------------- |
| Basic             | `moveEnter`, `moveLeave`, `[move]`, `moveInitial`, `moveAnimate`, `moveExit` |
| Interactions      | `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveInView`             |
| State             | `moveVariants`, `moveTarget`, `moveTrigger`                                  |
| Orchestration     | `movePresence`, `moveStagger`                                                |
| Scroll and layout | `moveScroll`, `moveParallax`, `moveLayout`, `moveSmoothScroll`               |
| Advanced          | `pathLength`, `pathOffset`, `transition`, `spring`, `moveDrag`               |

A few of these look interchangeable but solve different problems:

- `[move]`/`moveAnimate` (preset name or keyframe pairs) vs `[moveAnimation]` (Framer-style
  `{ initial, animate, exit }` single-value states, reactive to `animate` changes) — both describe
  one element's own enter/leave; pick whichever shape you're already thinking in.
- `moveVariants` (DI-propagated named state for a subtree that shares an ancestor, with
  `staggerChildren`/`delayChildren`/`when`) vs `moveTarget`/`moveTrigger` (experimental — connects
  two elements that do **not** share a parent). Prefer `moveVariants` whenever the elements
  involved share an ancestor.
- `moveStagger` (delays direct animated children in DOM order) vs a variant's `staggerChildren`
  (staggers nested `[moveVariants]` subtrees on a variant change).

### Preset animation

```html
<section [move]="'slide-up'">Content</section>
```

### Custom keyframes

```html
<div [move]="{ opacity: [0, 1], y: [20, 0], scale: [0.96, 1] }">Card</div>
```

### Motion-style API

```html
<article
  [moveInitial]="{ opacity: 0, y: 24 }"
  [moveAnimate]="{ opacity: 1, y: 0 }"
  [moveExit]="{ opacity: 0, y: -16 }"
  moveDuration="300ms"
>
  Item
</article>
```

The object-based `[moveAnimation]` API is still available when you prefer a single config object.

### Motion values with signals

Called from a field initializer or constructor of a class Angular constructs (a component,
directive, or service), `moveSpringValue` infers its injector automatically:

```ts
import { Component, computed } from '@angular/core';
import { moveSpringValue, moveTransform, moveValue } from 'angular-movement';

@Component({ selector: 'app-card', template: `...` })
class CardComponent {
  progress = moveValue(0);
  x = moveTransform(this.progress, [0, 1], [0, 120]);
  scale = moveSpringValue(moveTransform(this.progress, [0, 1], [0.9, 1]));
  transform = computed(() => `translateX(${this.x()}px) scale(${this.scale()})`);
}
```

Pass `{ injector }` explicitly only when calling from outside an injection context. It also
respects `prefers-reduced-motion` automatically, jumping straight to the target value instead of
animating.

`moveScroll` and `moveParallax` export a `progress` signal for derived values:

```html
<section #scroll="moveScroll" [moveScroll]="{ opacity: [0, 1] }">{{ scroll.progress() }}</section>
```

### Presence for exit transitions

Use `movePresence` when Angular conditionally removes a view. `moveLeave` and `moveExit` need the
view to stay in the DOM until the exit animation finishes; a direct `@if` / `*ngIf` removal happens
too early for a normal attribute directive to animate.

```html
<ng-container *movePresence="isOpen">
  <aside
    [moveInitial]="{ opacity: 0, x: -24 }"
    [moveAnimate]="{ opacity: 1, x: 0 }"
    [moveExit]="{ opacity: 0, x: 24 }"
  >
    Panel
  </aside>
</ng-container>
```

### Staggered lists

```html
<ul moveStagger moveStaggerStep="80ms">
  <li [move]="'fade-up'">One</li>
  <li [move]="'fade-up'">Two</li>
  <li [move]="'fade-up'">Three</li>
</ul>
```

For the compact form, put the step on the directive itself: `<ul moveStagger="80ms">`.

### Motion-style variants

Variants can be written as simple target states. Use `moveVariant` to set the active state
(`moveActiveVariant` is a permanent, fully-supported alias for the same input — `@deprecated` only
to signal which name to prefer, not scheduled for removal). When the active variant changes,
angular-movement builds keyframes from the previous state to the next state.

```html
<div
  [moveVariants]="{
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.08, rotate: 4 }
  }"
  [moveVariant]="isActive ? 'active' : 'idle'"
>
  Card
</div>
```

Use `moveTransition` to set a default transition for every variant. A variant-level `transition`
overrides the default:

```html
<div
  [moveVariants]="{
    idle: { opacity: 0.6, scale: 1 },
    active: { opacity: 1, scale: 1.08 }
  }"
  [moveAnimate]="isActive ? 'active' : 'idle'"
  [moveTransition]="{ duration: 420, opacity: { duration: 180 } }"
>
  Card
</div>
```

Use `moveExitVariant` inside `movePresence` when a named variant should play before removal:

```html
<ng-container *movePresence="isOpen">
  <aside
    [moveVariants]="{
      visible: { opacity: 1, x: 0 },
      hidden: { opacity: 0, x: 24 }
    }"
    moveVariant="visible"
    moveExitVariant="hidden"
  >
    Panel
  </aside>
</ng-container>
```

Per-property transitions support different `duration` and `delay` values per property. Different
per-property `easing` values currently fall back to the global easing so the generated WAAPI
keyframes stay in one composed timeline.

### Target presets

Use `moveTarget` when the same boolean should animate forward and back. It accepts either custom
frames or a named preset:

```html
<svg [moveTarget]="animate()" movePreset="icon-bounce" moveDuration="500ms">
  <!-- icon paths -->
</svg>
```

Use `moveTrigger` when `false` should reset instead of reversing:

```html
<button
  [moveTrigger]="submitted()"
  [moveFrames]="{ scale: [1, 1.08, 1], opacity: [1, 0.72, 1] }"
  moveResetState="clear"
>
  Submit
</button>
```

### Drag gestures

```html
<div
  moveDrag="x"
  [moveDragConstraints]="{ left: -120, right: 120 }"
  [moveDragMomentum]="true"
  [moveDragElastic]="0.35"
  [moveDragSnapPoints]="[{ x: -120, y: 0 }, { x: 0, y: 0 }, { x: 120, y: 0 }]"
  (moveDragEnd)="onDragEnd($event)"
>
  Drag me
</div>
```

Use `moveWhileTap` for temporary press feedback. Use `moveDrag` when the element should follow the
pointer and settle into a real position with constraints, momentum, snap-to-origin, or snap points.

### Scroll progress

```html
<section [moveScroll]="{ opacity: [0, 1], y: [48, 0] }" [moveScrollOffset]="['0 1', '1 0']">
  Revealed by scroll
</section>
```

## Available Presets

Interaction (for `moveWhileHover` / `moveWhileTap`): **lift**, **press**.

Entrance and exit: fade-up, fade-down, fade-left, fade-right, slide-up, slide-down, slide-left, slide-right, zoom-in,
zoom-out, flip-x, flip-y, bounce-in, blur-in, spin, pulse, shake, swing, wobble, rubber-band,
heart-beat, tada, jello, light-speed, roll-in, icon-draw, icon-pulse, icon-bounce, none

## Exports

Main entrypoint exports:

- All directives (and the `MOVEMENT_DIRECTIVES` / `MOVEMENT_STABLE_DIRECTIVES` /
  `MOVEMENT_EXPERIMENTAL_DIRECTIVES` aggregates)
- `provideMovement`, `MOVEMENT_CONFIG`, `MOVEMENT_DEFAULTS` and the config types
- `MoveAnimator` (with `MoveAnimateOptions`, `MoveAnimationTarget`) and `AnimationControls`
- `MoveTime` and `moveTimeToMs`
- Preset and keyframe types, `MOVE_PRESETS` and the icon helper functions
- `moveValue`, `moveTransform`, `moveSpringValue`

## API stability

| Status               | APIs                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stable**           | `provideMovement`, `MOVEMENT_DIRECTIVES`, `MOVEMENT_STABLE_DIRECTIVES`, `[move]`, `[moveAnimate]`, `moveEnter`, `moveLeave`, `*movePresence`, `moveStagger`, `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveInView`, `moveScroll`, `moveParallax`, `[moveAnimation]`, `*movePresenceFor`, `moveVariants`, `moveText`, `moveLoop`, `MoveAnimator`, `moveValue`, `moveTransform`, `moveSpringValue`, the preset library (`MOVE_PRESETS` and the icon helpers), `MoveTime` / `moveTimeToMs` |
| **Stable candidate** | _(none currently — the 1.0 freeze pass promoted every candidate; new APIs may land here first)_                                                                                                                                                                                                                                                                                                                                                                                                    |
| **Experimental**     | `MOVEMENT_EXPERIMENTAL_DIRECTIVES`, `moveLayout`, `moveDrag` (the whole directive — constraints, momentum, snap points, `moveWhileDrag`), `moveSmoothScroll` / `SmoothScrollService`, `moveTarget`, `moveTrigger`                                                                                                                                                                                                                                                                                  |

Stable APIs follow semantic-versioning expectations. Candidate APIs are feature-complete but may
receive small adjustments. Experimental APIs can change significantly between minor versions.
Every exported type mirrors the stability of the API it supports — see the `@stability` JSDoc tag
on the specific declaration for the authoritative answer.

`MOVEMENT_DIRECTIVES` itself is stable, but its **contents** are not stability-pure — it includes
all five experimental directives. `MOVEMENT_STABLE_DIRECTIVES` / `MOVEMENT_EXPERIMENTAL_DIRECTIVES`
(added in the post-1.0 hardening pass, spec 013) split it additively, without changing
`MOVEMENT_DIRECTIVES`'s own contents, for consumers who want a stability-pure spread.

**Experimental compatibility policy, going into `1.x`:** no secondary `angular-movement/experimental`
entry point — every experimental export stays in this package and may change or be removed in any
`1.x` minor, including breaking changes (the one deliberate SemVer exception, mirroring Angular
CDK's own experimental convention). Every such break gets its own `### Changed (experimental)`
CHANGELOG heading. Where practical, removal is preceded by at least one minor version carrying a
deprecation warning. Reaffirmed in spec 013 after re-auditing `ng-package.json` and the current
experimental surface — still no dependency stable consumers would need isolating from, so no
package split.

## Input reactivity

Two deliberate groups, frozen for 1.0:

- **Reactive** — changing an input while the directive is alive updates or replays the animation:
  `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveVariants`, `moveTarget`, `moveTrigger`,
  `moveScroll`, `moveParallax`, `moveDrag`, `moveLoop`, `moveText`, and `[moveAnimation]`'s
  `animate` state.
- **One-shot by design** — these describe a single entrance or exit, so they play once and ignore
  later input changes: `moveAnimate` / `[move]`, `moveEnter`, `moveLeave`, `moveInView`,
  `moveSmoothScroll`. To play one again, wrap the element in `*movePresence` / `*movePresenceFor`
  or re-create the view.

`[moveAnimation]` compares its `animate` state **by value**, so binding an object literal straight
in the template does not replay the animation on every change detection pass.

## Development

Build library:

```bash
ng build movement
```

Run library tests:

```bash
ng test movement
```

Run coverage:

```bash
ng test movement --coverage --watch=false
```

## License

MIT
