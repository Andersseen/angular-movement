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

angular-movement addresses this with declarative directives and global configuration so animation rules stay consistent and composable.

## Core Capabilities

- Preset animations: fade, slide, zoom, flip, blur, bounce, pulse, spin.
- Custom keyframes for full control.
- Spring physics support.
- Interaction directives: hover, tap, focus, in-view, scroll, parallax, drag.
- Presence orchestration to let leave animations finish before DOM removal.
- Stagger orchestration for coordinated list motion.

## Install The Library

From npm:

npm install angular-movement

Peer dependencies:

- @angular/core ^21.2.0
- @angular/common ^21.2.0

## Use The Library In Your App

1. Add global defaults with provideMovement.
2. Import MOVEMENT_DIRECTIVES in standalone components.
3. Use directives directly in templates.

Example:

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
