# angular-movement

Angular motion ecosystem with two parts in one repository:

- Reusable npm library for animation directives in Angular.
- Demo and documentation site to explore behavior and integration patterns.

## What This Project Is

This is an open source Angular monorepo focused on declarative UI motion.
It provides production-ready directives for common animation workflows and a live playground-style app to evaluate them.

Repository structure:

- Library package: projects/movement
- Demo and docs app: src

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
- Presence orchestration to let leave animations finish before DOM removal.
- Stagger orchestration for coordinated list motion.
- **SVG path drawing** with `pathLength` / `pathOffset` (WAAPI-powered).
- **Per-property transitions** for different duration / delay per animated property.
- **Trigger directive** for one-shot boolean triggers with imperative controls.

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

### Motion-style variants with per-property transitions

Declare states like Framer Motion and override timing per property:

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

## Contributing

Contributions are welcome through issues and pull requests.
When proposing changes, include:

- Problem statement and expected behavior.
- API impact, if any.
- Tests or demo updates for new behavior.

## License

MIT
