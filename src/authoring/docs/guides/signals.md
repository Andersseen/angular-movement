---
title: Motion values and imperative animation
description: Derive continuous motion from signals with moveValue, moveTransform and moveSpringValue, or animate an element you hold a reference to with MoveAnimator.
group: Guides
order: 15
---

Not every animation is "play this when that happens". Two stable tools cover the rest.

## Motion values are signals

[[api:moveValue]] holds a number, [[api:moveTransform]] maps it onto any output range, and [[api:moveSpringValue]] smooths a value with spring physics. They are plain signals, so they compose with `computed` and work under zoneless change detection.

::source{file="src/docs-snippets/signals.ts" region="signals-values" title="meter.ts"}

::playground[signals]

Drag the progress control: the position is derived directly from the signal, and the spring follows it. Under reduced motion the spring jumps straight to its target. [`moveSpringValue`](/docs/reference/move-spring-value) creates an effect, so call it from an injection context (a field initialiser or constructor) or pass `injector` explicitly.

[Open the full signals playground](/demos/values).

## Imperative animation: `MoveAnimator`

When a handler or a service should animate an element it holds a reference to, inject [[api:MoveAnimator]]. It takes an `Element` or an `ElementRef`, handles reduced motion and server rendering for you, and its `finished` promise **always resolves** — unlike raw WAAPI, whose `finished` rejects on cancel.

::source{file="src/docs-snippets/signals.ts" region="signals-animator" title="toast-dismiss.ts"}

`pseudoElement` animates `::view-transition-new(root)` (or any pseudo-element) through the same API, which is how a View Transition reveal is written. Unsupported browsers get a no-op, and under reduced motion the pseudo-element animation is skipped while your DOM change still applies. See the [imperative playground](/demos/imperative).

## Choosing

- A finite animation on an element you hold a reference to: `MoveAnimator`.
- A continuous number you bind in the template (pointer position, scroll progress, a slider): motion values.

**Related:** [`moveValue` playground](/demos/values) · [`MoveAnimator` playground](/demos/imperative) · [Patterns](/docs/patterns)
