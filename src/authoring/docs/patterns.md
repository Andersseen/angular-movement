---
title: Angular patterns
description: The patterns real apps reach for most — hover and press feedback, reveal-on-scroll, staggered lists, imperative animation — and how Movement behaves alongside the Angular features you already use.
group: Concepts
order: 22
---

Where there is a common mistake, it is stated first.

## Common patterns

### Product card

Reveal once when scrolled into view, lift on hover. Import the two directives the component uses.

::source{file="src/docs-snippets/patterns.ts" region="patterns-product-card" title="product-card.ts"}

### Button interaction

`lift` and `press` are the two interaction presets. Hover only responds to a mouse or pen — a finger has no hover state — so pair it with `moveWhileTap` for touch feedback. Neither directive calls `preventDefault()`.

::source{file="src/docs-snippets/patterns.ts" region="patterns-buttons" title="buttons.ts"}

### Staggered grid

::source{file="src/docs-snippets/patterns.ts" region="patterns-grid" title="grid.ts"}

### Imperative animation

[[api:MoveAnimator]] is the TypeScript API. It takes an `Element` or the `ElementRef` from `viewChild()`, and adds `set()` / `clear()` for committing or removing a state without hand-writing styles.

::source{file="src/docs-snippets/signals.ts" region="signals-animator" title="toast-dismiss.ts"}

### View Transition

`pseudoElement` animates `::view-transition-new(root)` (or any pseudo-element) through the same API. Unsupported browsers get a no-op, and under reduced motion the pseudo-element animation is skipped while your DOM change still applies. See the [live demo](/demos/imperative).

```ts title=theme-reveal.ts
const transition = document.startViewTransition(() => commitTheme());
await transition.ready;

animator.animate(
  document.documentElement,
  { clipPath: ['circle(0px at 40px 40px)', 'circle(1500px at 40px 40px)'] },
  { duration: '520ms', pseudoElement: '::view-transition-new(root)' },
);
```

## Timing units

Every duration, delay and stagger accepts a `MoveTime`: a number is milliseconds, and a string can say `"80ms"` or `"0.08s"`. On static attributes, write the unit — it reads unambiguously.

::source{file="src/docs-snippets/patterns.ts" region="patterns-timing" title="timing.ts"}

## Reduced motion

Three layers, strongest first; the OS preference always wins. The full explanation is on [Accessibility and troubleshooting](/docs/accessibility#reduced-motion).

::source{file="src/docs-snippets/patterns.ts" region="patterns-reduced-element" title="first-render.ts"}

## When CSS is the better tool

Angular Movement runs after hydration, so it cannot animate the first paint. For an above-the-fold entrance that must be in motion before the app boots, use a CSS animation. Use the library for everything that happens once the app is running: interaction, reveal-on-scroll, presence, state changes, imperative sequences.

```css title=hero.css
/* Above-the-fold entrance that must exist before hydration → CSS. */
.hero {
  animation: hero-in 600ms cubic-bezier(0.16, 1, 0.3, 1) both;
}
@keyframes hero-in {
  from {
    opacity: 0;
    translate: 0 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .hero {
    animation: none;
  }
}
```

## Any CSS property

Keyframes are typed for the common shorthands (`x`, `y`, `scale`, `blur`, …), and any other property passes straight through to the Web Animations API.

::source{file="src/docs-snippets/patterns.ts" region="patterns-passthrough" title="passthrough.ts"}

## Awaiting and cancellation

Unlike raw WAAPI, whose `finished` rejects on cancel, Angular Movement's `finished` (and `moveTrigger.play()`) always resolve — on natural finish, `cancel()`, a second `play()` replacing the first, the owner being destroyed, or a skipped View Transition. It never rejects, so no `try/catch` is needed. It does not say _how_ the animation ended; when that matters, track it yourself:

::source{file="src/docs-snippets/patterns.ts" region="patterns-cancellation" title="sequence.ts"}

## `@if` and leave animations

This is the single most common surprise. `@if` destroys the view synchronously, so by the time a leave animation could run, the element is already gone. The directive is not broken — there is simply no node left.

```html title="does not animate.html"
@if (isOpen()) {
<div [moveLeave]="{ opacity: [1, 0] }">Panel</div>
}
```

```html title="works.html"
<ng-container *movePresence="isOpen()">
  <div [moveEnter]="{ opacity: [0, 1] }" [moveLeave]="{ opacity: [1, 0] }">Panel</div>
</ng-container>
```

`*movePresence` holds the view in the DOM, waits for every registered child's leave animation, and only then removes it. See [Presence](/docs/guides/presence).

## `@for` and stagger

`moveStagger` derives each child's delay from its position in the DOM, so it works with `@for` without any manual index bookkeeping.

::source{file="src/docs-snippets/patterns.ts" region="patterns-stagger-for" title="list.ts"}

Your `track` expression matters more than it looks:

```ts title=track.ts
// ✗ track by index: Angular reuses DOM nodes, so reordering does not re-run
//   enter animations and moveLayout sees no position change.
@for (item of items(); track $index) { … }

// ✓ track by a stable identity
@for (item of items(); track item.id) { … }
```

## Server-side rendering

Every directive is a no-op on the server and starts after hydration. There is no configuration and no `@defer` needed — the content is in the SSR payload, which is what you want for SEO. If you write your own motion around the library, guard it the same way:

```ts title=ssr.ts
import { isPlatformBrowser } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';

const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
```

Avoid hiding content in CSS and relying on an animation to reveal it: the server renders that state, and users with reduced motion never see it change.

```html title=layout.html
<div [moveEnter]="{ opacity: [0, 1] }">Visible in the SSR payload</div>
```

## Standalone imports

There is no NgModule. Import the directives a component uses — usually one to three. `MOVEMENT_DIRECTIVES` still works, but it pulls in every directive (experimental ones included) and hides the component's real dependencies; `MOVEMENT_STABLE_DIRECTIVES` is the stability-pure aggregate.

::source{file="src/docs-snippets/patterns.ts" region="patterns-narrow-imports" title="save-button.ts"}
