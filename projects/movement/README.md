# angular-movement

[![CI](https://github.com/Andersseen/angular-movement/actions/workflows/ci.yml/badge.svg)](https://github.com/Andersseen/angular-movement/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/angular-movement.svg)](https://www.npmjs.com/package/angular-movement)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://github.com/Andersseen/angular-movement/blob/main/LICENSE)

Angular-native motion library powered by the browser Web Animations API. It provides declarative
directives for motion-style states, presets, spring physics, SVG path drawing, drag, scroll-driven
animation, and presence/stagger orchestration.

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
- Imperative escape hatch via `MoveAnimator`
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

Register global config and import directives in your app config.

```ts
import { ApplicationConfig } from '@angular/core';
import { provideMovement } from 'angular-movement';

export const appConfig: ApplicationConfig = {
  providers: [
    provideMovement({
      duration: 320,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
      delay: 0,
      disabled: false,
    }),
  ],
};
```

Import only the directives a component actually uses — that's what keeps route-level
tree-shaking effective:

```ts
import { Component } from '@angular/core';
import { MoveAnimateDirective, MoveHoverDirective } from 'angular-movement';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [MoveAnimateDirective, MoveHoverDirective],
  template: `
    <h2 [move]="'fade-up'">Hello movement</h2>
    <button [moveWhileHover]="{ scale: [1, 1.05] }">Hover me</button>
  `,
})
export class DemoComponent {}
```

`MOVEMENT_DIRECTIVES` (spread into `imports`) remains available as a convenience for prototyping
or a component that genuinely uses most of the library.

## Common Usage

### API quick reference

| Directive                                        | Use it for                                                            |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `[move]` / `[moveAnimate]`                       | Preset, keyframe, or state-object entrance animations.                |
| `[moveInitial]` / `[moveAnimate]` / `[moveExit]` | Motion-style initial, animate, and exit states.                       |
| `*movePresence`                                  | Wait for child exit animations before removing DOM.                   |
| `moveStagger`                                    | Choreograph children with DOM-order delays.                           |
| `[moveVariants]`                                 | Named states driven by string variant names.                          |
| `[moveTarget]`                                   | Boolean target animations that reverse when the target becomes false. |
| `[moveTrigger]`                                  | One-shot boolean triggers with reset/imperative controls.             |
| `[moveDrag]`                                     | Pointer drag gestures with constraints, momentum, and snap behavior.  |
| `[moveScroll]` / `[moveParallax]`                | Scroll-linked progress and parallax transforms.                       |
| `[moveInView]` / `[moveText]`                    | IntersectionObserver-based reveal animations.                         |

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
  moveDuration="300"
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
<ul moveStagger [moveStaggerStep]="80">
  <li [move]="'fade-up'">One</li>
  <li [move]="'fade-up'">Two</li>
  <li [move]="'fade-up'">Three</li>
</ul>
```

For the compact form, bind the step directly: `<ul [moveStagger]="80">`.

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
<svg [moveTarget]="animate()" movePreset="icon-bounce" moveDuration="500">
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

fade-up, fade-down, fade-left, fade-right, slide-up, slide-down, slide-left, slide-right, zoom-in,
zoom-out, flip-x, flip-y, bounce-in, blur-in, spin, pulse, shake, swing, wobble, rubber-band,
heart-beat, tada, jello, light-speed, roll-in, icon-draw, icon-pulse, icon-bounce, none

## Exports

Main entrypoint exports:

- MOVEMENT_DIRECTIVES
- All directives
- provideMovement
- Preset and keyframe types
- AnimationControls
- Movement config types and token
- Presets and icon helper functions

## API stability

| Status               | APIs                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Stable**           | `provideMovement`, `MOVEMENT_DIRECTIVES`, `[move]`, `[moveAnimate]`, `moveEnter`, `moveLeave`, `*movePresence`, `moveStagger`, `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveInView`, `moveScroll`, `moveParallax`, `[moveAnimation]`, `*movePresenceFor`, `moveVariants`, `moveText`, `moveLoop`, `MoveAnimator`, `moveValue`, `moveTransform`, `moveSpringValue`, the preset library (`MOVE_PRESETS` and the icon helpers) |
| **Stable candidate** | _(none currently — the 1.0 freeze pass promoted every candidate; new APIs may land here first)_                                                                                                                                                                                                                                                                                                                                         |
| **Experimental**     | `moveLayout`, `moveDrag` (the whole directive — constraints, momentum, snap points, `moveWhileDrag`), `moveSmoothScroll` / `SmoothScrollService`, `moveTarget`, `moveTrigger`                                                                                                                                                                                                                                                           |

Stable APIs follow semantic-versioning expectations. Candidate APIs are feature-complete but may
receive small adjustments. Experimental APIs can change significantly between minor versions.
Every exported type mirrors the stability of the API it supports — see the `@stability` JSDoc tag
on the specific declaration for the authoritative answer.

**Experimental compatibility policy, going into `1.x`:** no secondary `angular-movement/experimental`
entry point — every experimental export stays in this package and may change or be removed in any
`1.x` minor, including breaking changes (the one deliberate SemVer exception, mirroring Angular
CDK's own experimental convention). Every such break gets its own `### Changed (experimental)`
CHANGELOG heading. Where practical, removal is preceded by at least one minor version carrying a
deprecation warning.

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
