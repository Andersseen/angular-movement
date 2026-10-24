---
title: Reactive animation and variants
description: Animate an element between states whenever a signal changes, with a single target or with named variants.
group: Guides
order: 12
---

`moveEnter` plays once. When an element should move **between states** — selected, expanded, loading, in error — bind the state and let the animation follow it. There are two reactive APIs; both are stable.

## One element, one computed target: `moveAnimation`

[[api:MoveAnimationDirective]] takes a single `initial`, `animate` and `exit` state and animates whenever `animate` changes. It compares the state by value, so an object literal in the template does not replay on every change-detection pass. Only properties present in **both** `initial` and `animate` are animated.

::source{file="src/docs-snippets/variants.ts" region="variants-animation" title="card-state.ts"}

## Named states: `moveVariants`

Use [[api:MoveVariantsDirective]] when states have names, a whole subtree shares the active variant, or you want `staggerChildren` and `delayChildren`. Set the active variant with `moveVariant`.

::source{file="src/docs-snippets/variants.ts" region="variants-named" title="selectable.ts"}

::playground[variants]

> [!WARNING]
> On a host with `moveVariants`, set the state with `moveVariant` (or its alias `moveActiveVariant`) — not `moveAnimate`, which `moveVariants` takes over.

## Which one?

| You have…                                 | Use                         |
| ----------------------------------------- | --------------------------- |
| One element and a computed target         | `moveAnimation`             |
| Named states, shared by a subtree         | `moveVariants`              |
| A boolean that plays forward and reverses | `moveTarget` (experimental) |

[Choose an API](/docs/api-selection) has the full comparison, including which directives are one-shot.

**Related:** [`moveAnimation` playground](/demos/animation) · [`moveVariants` playground](/demos/variants) · [`moveTarget` playground](/demos/target) (experimental)
