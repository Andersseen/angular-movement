# angular-movement

Angular-native motion library powered by the browser Web Animations API. It provides declarative
directives for motion-style states, presets, spring physics, SVG path drawing, drag, scroll-driven
animation, and presence/stagger orchestration.

## Features

- Preset-based enter and leave animations
- Custom keyframes for full control
- Spring-driven transitions
- Hover, tap, focus, in-view, and scroll interactions
- Presence orchestration for exit animations before DOM removal
- Stagger support for list choreography
- Motion-style variants and per-property transitions
- SVG path drawing with `pathLength` and `pathOffset`
- Drag gestures with constraints, elasticity, momentum, and snap-to-origin
- Works with modern standalone Angular apps
- No `@angular/animations` setup required

## Installation

```bash
npm install angular-movement
```

Peer dependencies:

- @angular/core ^21.2.0
- @angular/common ^21.2.0

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

```ts
import { Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  selector: 'app-demo',
  standalone: true,
  imports: [...MOVEMENT_DIRECTIVES],
  template: `
    <h2 [move]="'fade-up'">Hello movement</h2>
    <button [moveWhileHover]="{ scale: [1, 1.05] }">Hover me</button>
  `,
})
export class DemoComponent {}
```

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
| `[moveDrag]`                                     | Pointer drag gestures with constraints, momentum, and snap-to-origin. |
| `[moveScroll]` / `[moveParallax]`                | Scroll-linked progress and parallax transforms.                       |
| `[moveInView]` / `[moveText]`                    | IntersectionObserver-based reveal animations.                         |

### Recommended API path

Start with the smallest primitive that matches the job:

| Level             | Reach for                                                                    |
| ----------------- | ---------------------------------------------------------------------------- |
| Basic             | `moveEnter`, `moveLeave`, `[move]`, `moveInitial`, `moveAnimate`, `moveExit` |
| Interactions      | `moveWhileHover`, `moveWhileTap`, `moveFocus`, `moveInView`                  |
| State             | `moveVariants`, `moveTarget`, `moveTrigger`                                  |
| Orchestration     | `movePresence`, `moveStagger`                                                |
| Scroll and layout | `moveScroll`, `moveParallax`, `moveLayout`, `moveSmoothScroll`               |
| Advanced          | `pathLength`, `pathOffset`, `transition`, `spring`, `moveDrag`               |

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

### Presence for exit transitions

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

### Motion-style variants

Variants can be written as simple target states. When the active variant changes,
angular-movement builds keyframes from the previous state to the next state.

```html
<div
  [moveVariants]="{
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.08, rotate: 4 }
  }"
  [moveAnimate]="isActive ? 'active' : 'idle'"
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
    moveAnimate="visible"
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
  (moveDragEnd)="onDragEnd($event)"
>
  Drag me
</div>
```

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
