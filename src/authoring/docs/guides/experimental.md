---
title: 'Experimental: layout and drag'
description: Layout transitions, drag gestures, boolean targets and smooth scrolling are experimental — what they do, and why they have dedicated playgrounds instead of embedded ones.
group: Guides
order: 16
---

> [!WARNING]
> Everything on this page is **experimental**. It may change significantly between minor versions. See [API overview and stability](/docs/api) for the exact list and the compatibility policy.

## Drag

[[api:MoveDragDirective]] makes an element follow the pointer and settle with constraints, elastic edges, momentum, snap-to-origin or snap points. `moveWhileDrag` holds a state while the gesture is active (for example, lifting a card).

::source{file="src/docs-snippets/experimental.ts" region="experimental-drag" title="draggable.ts"}

Drag depends on pointer capture, constraints measured from real layout and touch behaviour that a generic controls panel cannot represent. It has a dedicated surface: [open the drag playground](/demos/drag).

## Layout

[[api:MoveLayoutDirective]] animates an element from where it was to where it is after a layout change, with a FLIP technique, and can share an identity between elements.

::source{file="src/docs-snippets/experimental.ts" region="experimental-layout" title="reorder.ts"}

Layout transitions need real DOM measurements across a re-render, so they are shown in the [layout playground](/demos/layout), not in a controls panel. The measured contract — supported geometry, interruption, shared elements, limits — is in [Layout motion](/docs/guides/layout).

## Targets and triggers

[[api:MoveTargetDirective]] plays forward while a boolean is true and reverses when it becomes false; [[api:MoveTriggerDirective]] resets or exposes an imperative handle. Prefer [variants](/docs/guides/variants) or [[api:MoveAnimator]] in stable code. See the [target playground](/demos/target).

## Smooth scroll

[[api:MoveSmoothScrollDirective]] and [[api:SmoothScrollService]] interpolate wheel and touch input on a scroll container. They change a basic browser behaviour, so they are opt-in and this site does not enable them globally. See the [smooth-scroll playground](/demos/smooth-scroll).

**Related:** [drag](/demos/drag) · [layout](/demos/layout) · [target](/demos/target) · [smooth scroll](/demos/smooth-scroll)
