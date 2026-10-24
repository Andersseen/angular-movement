---
title: Stagger, scroll and loops
description: Coordinate sibling delays by DOM order, bind motion to scroll position, and repeat a short animation.
group: Guides
order: 14
---

## Stagger siblings

[[api:MoveStaggerDirective]] is a context provider: it gives each child's `moveEnter`, `moveInView` or variant a delay computed from its position in the DOM, so it works with `@for` without any manual index bookkeeping. Step accepts a number (milliseconds) or a string with a unit.

::source{file="src/docs-snippets/stagger-and-scroll.ts" region="stagger-list" title="features.ts"}

`moveStaggerDirection` orders the delays from the `first` child, the `last`, or the `center`.

::playground[stagger]

The children use `moveEnter`, which is one-shot, so the playground recreates the list when a setting changes. [Open the full stagger playground](/demos/stagger).

Combine it with `moveInView` to reveal sections one after another as they scroll into view:

::source{file="src/docs-snippets/stagger-and-scroll.ts" region="stagger-reveal" title="sections.ts"}

## Scroll-linked motion

[[api:MoveScrollDirective]] maps scroll progress onto an animation: progress `0` to `1` becomes the timeline from start to end, and the directive exposes `progress` as a signal. [[api:MoveParallaxDirective]] does the same with an automatically computed translate range.

::source{file="src/docs-snippets/stagger-and-scroll.ts" region="scroll-linked" title="scroll-hero.ts"}

Both read the native scroll position (smoothed with a short interpolation) and fall back to the end state under reduced motion. Point `moveScrollContainer` or `moveParallaxContainer` at a selector for an inner scroll container.

> [!NOTE]
> Native scrolling is the default everywhere on this site. `moveSmoothScroll` and `SmoothScrollService` change how wheel and touch scrolling feel and are **experimental**; prefer native scrolling.

## Loops

[[api:MoveLoopDirective]] repeats a preset or keyframes. Use it for short, meaningful loops (a spinner, a subtle pulse) and keep them `aria-hidden` when decorative. Loops stop under reduced motion.

::source{file="src/docs-snippets/stagger-and-scroll.ts" region="loop" title="spinner.ts"}

**Related:** [`moveStagger` playground](/demos/stagger) · [`moveText` playground](/demos/text) · [`moveScroll` playground](/demos/scroll) · [`moveParallax` playground](/demos/parallax) · [`moveLoop` playground](/demos/loop)
