# angular-movement

[![CI](https://github.com/Andersseen/angular-movement/actions/workflows/ci.yml/badge.svg)](https://github.com/Andersseen/angular-movement/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/angular-movement.svg)](https://www.npmjs.com/package/angular-movement)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Angular motion ecosystem with two parts in one repository:

- Reusable npm library for animation directives in Angular.
- Demo and documentation site to explore behavior and integration patterns.

## What This Project Is

This is an open source Angular monorepo focused on declarative UI motion. The library exposes
Angular-native directives and state APIs, while runtime playback is powered by the browser Web
Animations API.

Repository structure:

- Library package: projects/movement
- Demo and docs app: src

Community and maintenance:

- Contributing guide: [CONTRIBUTING.md](CONTRIBUTING.md)
- Roadmap: [ROADMAP.md](ROADMAP.md)
- Security policy: [SECURITY.md](SECURITY.md)
- Release checklist: [RELEASE_CHECKLIST.md](RELEASE_CHECKLIST.md)

## What Problems It Solves

UI animation in Angular often becomes repetitive and hard to maintain:

- Rewriting enter and leave transitions for each component.
- Mixing imperative animation logic into component code.
- Inconsistent timings and easing across teams.
- Missing orchestration for staggered lists and exit animations.
- Friction when implementing interactions like hover, in-view, parallax, and scroll progress.
- Lack of first-class SVG path-drawing animation support.

angular-movement addresses this with declarative directives and global configuration so animation rules stay consistent and composable.

## Core Capabilities

- Preset animations: fade, slide, zoom, flip, blur, bounce, pulse, spin, icon-draw, icon-pulse, icon-bounce.
- Custom keyframes for full control.
- Spring physics support.
- Interaction directives: hover, tap, focus, in-view, scroll, parallax, drag.
- Advanced drag gestures with axis lock, constraints, elasticity, momentum,
  snap-to-origin, snap points, and start/move/end outputs.
- Presence orchestration to let leave animations finish before DOM removal.
- Stagger orchestration for coordinated list motion.
- **SVG path drawing** with `pathLength` / `pathOffset` (WAAPI-powered).
- **Per-property transitions** for different duration / delay per animated property.
- **Trigger directive** for one-shot boolean triggers with imperative controls.
- No `@angular/animations` setup required for library consumers.

## Install The Library

From npm:

```bash
npm install angular-movement
```

Peer dependencies:

- @angular/core ^21.2.0
- @angular/common ^21.2.0

## Use The Library In Your App

1. Add global defaults with provideMovement.
2. Import MOVEMENT_DIRECTIVES in standalone components.
3. Use directives directly in templates.

Example:

```ts
import { ApplicationConfig } from '@angular/core';
import { provideMovement } from 'angular-movement';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

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

import { Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'angular-movement';

@Component({
  selector: 'app-demo-card',
  standalone: true,
  imports: [...MOVEMENT_DIRECTIVES],
  template: `
    <h2 [move]="'fade-up'">Hello movement</h2>
    <button [moveWhileHover]="{ scale: [1, 1.05] }">Hover me</button>
  `,
})
export class DemoCardComponent {}
```

## SVG Icon Animations

angular-movement v0.2.0 adds first-class support for SVG path drawing and icon micro-animations.

## Motion-style API

Use separate `initial`, `animate`, and `exit` state bindings when you want a
Framer Motion-style template:

```html
<ng-container *movePresence="isOpen">
  <article
    [moveInitial]="{ opacity: 0, y: 24 }"
    [moveAnimate]="{ opacity: 1, y: 0 }"
    [moveExit]="{ opacity: 0, y: -16 }"
    moveDuration="300"
  >
    Card
  </article>
</ng-container>
```

The existing `[moveAnimation]="{ initial, animate, exit }"` object API remains
available for config-heavy cases.

## Recommended API Path

Start with the smallest primitive that matches the job:

| Level             | Reach for                                                                    |
| ----------------- | ---------------------------------------------------------------------------- |
| Basic             | `moveEnter`, `moveLeave`, `[move]`, `moveInitial`, `moveAnimate`, `moveExit` |
| Interactions      | `moveWhileHover`, `moveWhileTap`, `moveFocus`, `moveInView`                  |
| State             | `moveVariants`, `moveTarget`, `moveTrigger`                                  |
| Orchestration     | `movePresence`, `moveStagger`                                                |
| Scroll and layout | `moveScroll`, `moveParallax`, `moveLayout`, `moveSmoothScroll`               |
| Advanced          | `pathLength`, `pathOffset`, `transition`, `spring`, `moveDrag`               |

`moveLeave` plays when a parent `movePresence` keeps the view alive during removal. A plain `@if`
or `*ngIf` removes the element immediately, so there is no DOM node left to animate.

## Motion Values With Signals

Use `moveValue`, `moveTransform`, and `moveSpringValue` when animation state should be derived from
Angular signals instead of fixed keyframes.

```ts
import { computed } from '@angular/core';
import { moveSpringValue, moveTransform, moveValue } from 'angular-movement';

const progress = moveValue(0);
const x = moveTransform(progress, [0, 1], [0, 120]);
const scale = moveSpringValue(moveTransform(progress, [0, 1], [0.9, 1]));
const transform = computed(() => `translateX(${x()}px) scale(${scale()})`);
```

Scroll directives expose progress as a signal, so you can derive other values without writing a
manual scroll loop:

```html
<section
  #scroll="moveScroll"
  [moveScroll]="{ opacity: [0, 1] }"
  [style.--progress]="scroll.progress()"
>
  Scroll-linked content
</section>
```

## Drag Gestures

`moveDrag` supports free drag, axis-locked drag, constraints, elasticity,
momentum, snap-to-origin, snap points, and output events:

```html
<div
  moveDrag="x"
  [moveDragConstraints]="{ left: -120, right: 120 }"
  [moveDragElastic]="0.35"
  [moveDragMomentum]="true"
  [moveDragSnapPoints]="[{ x: -120, y: 0 }, { x: 0, y: 0 }, { x: 120, y: 0 }]"
  (moveDragStart)="onDragStart($event)"
  (moveDragMove)="onDragMove($event)"
  (moveDragEnd)="onDragEnd($event)"
>
  Drag me
</div>
```

Use `moveWhileTap` for press feedback that returns when the pointer is released, such as button
compression or a pressed card state. Use `moveDrag` when the element should follow the pointer and
keep a real position, with optional constraints, momentum, snap-to-origin, or snap points.

### Path drawing

Animate `pathLength` from `0` to `1` to draw a stroke. The engine automatically measures the element's total length and converts it to WAAPI-compatible `strokeDasharray` / `strokeDashoffset` keyframes.

```html
<svg width="24" height="24" viewBox="0 0 24 24">
  <path
    [moveTarget]="animate()"
    [moveFrames]="{ pathLength: [0, 1], opacity: [0, 1] }"
    moveDuration="700"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    d="M4 12l4-4 4 4 8-8"
  />
</svg>
```

### Icon helpers

Import helper functions to quickly create icon keyframes:

```ts
import { movePathDraw, moveIconPulse } from 'angular-movement';
```

```html
<path
  [moveTarget]="animate()"
  [moveFrames]="movePathDraw({ opacity: [0, 0.72, 0] })"
  moveDuration="760"
/>
```

For preset-based icon animations, `moveTarget` also accepts `movePreset`:

```html
<svg [moveTarget]="animate()" movePreset="icon-bounce" moveDuration="500">
  <!-- icon paths -->
</svg>
```

### Motion-style variants with per-property transitions

Declare simple target states like Framer Motion. When `moveAnimate` changes,
angular-movement creates keyframes from the previous state to the next one:

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

For one-shot effects, variants can also use explicit keyframe arrays and override
timing per property:

```html
<path
  [moveVariants]="{
    normal: { pathLength: 1, opacity: 1 },
    draw: {
      pathLength: [0, 1],
      opacity: [0, 0.72, 0],
      transition: { duration: 760, opacity: { duration: 300, delay: 100 } }
    }
  }"
  [moveAnimate]="animate() ? 'draw' : 'normal'"
/>
```

You can also provide a default transition for every variant with `moveTransition`. A variant-level
`transition` wins when both are present:

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

For presence exits, point `moveExitVariant` at the variant that should play before removal:

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

Per-property transitions currently support different `duration` and `delay` values per property.
Different per-property `easing` values are detected in development, but the animation falls back to
the global easing so the generated WAAPI keyframes stay in one composed timeline.

### One-shot trigger (no reverse)

Use `moveTrigger` when you want to play an animation on `true` and reset cleanly on `false` (no reverse animation):

```html
<path
  #motion="moveTrigger"
  [moveTrigger]="animate()"
  [moveFrames]="{ pathLength: [0, 1], opacity: [0, 1] }"
  moveDuration="700"
  moveResetState="clear"
/>
```

Or call it imperatively from TypeScript:

```ts
@ViewChild('motion') motion!: MoveTriggerDirective;

this.motion.play();
this.motion.reset();
this.motion.set({ opacity: 0.5, pathLength: 0.5 });
```

## What You Can Explore In The Demo

The demo site includes focused pages for:

- Animate
- Enter and Leave
- Hover and Tap
- In View
- Scroll and Parallax
- Presence
- Layout
- Drag
- Variants
- Text animation
- SVG Icons (new in v0.2.0)

These pages show both visual behavior and integration patterns you can copy into real projects.

## Open Source Goals

- Keep API ergonomic for Angular teams using standalone components.
- Provide predictable animation defaults with opt-in customization.
- Maintain examples and docs close to source code.
- Favor SSR-safe and production-oriented implementation details.
- Keep the public API small and stable: directives, config, presets, helpers,
  and control interfaces are public; low-level players and composers are
  implementation details.

## Contributing

Contributions are welcome through issues and pull requests.
When proposing changes, include:

- Problem statement and expected behavior.
- API impact, if any.
- Tests or demo updates for new behavior.

## License

MIT
