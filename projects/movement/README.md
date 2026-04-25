# angular-movement

Lightweight Angular motion library with declarative directives, presets, spring physics, scroll-driven animation, and presence/stagger orchestration.

## Features

- Preset-based enter and leave animations
- Custom keyframes for full control
- Spring-driven transitions
- Hover, tap, focus, in-view, and scroll interactions
- Presence orchestration for exit animations before DOM removal
- Stagger support for list choreography
- Works with modern standalone Angular apps

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

### Preset animation

```html
<section [move]="'slide-up'">Content</section>
```

### Custom keyframes

```html
<div [move]="{ opacity: [0, 1], y: [20, 0], scale: [0.96, 1] }">Card</div>
```

### Framer-style API

```html
<article
  [moveAnimation]="{
      initial: { opacity: 0, y: 24 },
      animate: { opacity: 1, y: 0 },
      exit: { opacity: 0, y: -16 },
      duration: 300
   }"
>
  Item
</article>
```

### Presence for exit transitions

```html
<ng-container *movePresence="isOpen">
  <aside [move]="'fade-right'" [moveAnimateLeave]="'fade-left'">Panel</aside>
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

## Available Presets

fade-up, fade-down, fade-left, fade-right, slide-up, slide-down, slide-left, slide-right, zoom-in, zoom-out, flip-x, flip-y, bounce-in, blur-in, spin, pulse, none

## Exports

Main entrypoint exports:

- MOVEMENT_DIRECTIVES
- All directives
- provideMovement
- Preset and keyframe types
- Animation engine/control types
- Tokens for advanced integration

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
