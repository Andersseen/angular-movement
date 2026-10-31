---
title: Layout motion
description: Animate reflow, resizing and shared-element handovers from application state — what the experimental moveLayout contract guarantees, what it measures, and what it does not support.
group: Guides
order: 17
---

> [!WARNING]
> [[api:MoveLayoutDirective]] is **experimental**. This page is the contract it is tested against; it is not a promise that layout is stable. See [API overview and stability](/docs/api).

Your application owns state, ordering, identity (`track`) and focus. `moveLayout` only animates the _consequence_: after Angular renders, an element that ended up somewhere else animates from where it was painted to its new place.

## Reflow

Put `moveLayout` on the elements that move, not on their container. A container animation scales everything inside it.

::source{file="src/docs-snippets/layout.ts" region="layout-basic" title="dashboard.ts"}

Filtering, inserting, changing columns, expanding a card and resizing a parent all work the same way: change state, and the cards whose box changed animate. A render that moves nothing starts no animation. The [layout playground](/demos/layout) runs each of these.

## What is measured

Every Angular render pass measures each host's **natural box**: its box in layout, with its own transform removed. Comparing natural boxes means a hover scale, a drag offset or a running FLIP is never mistaken for layout movement, and a displacement is never counted twice.

| Supported                                                                                                | Not supported                                                                                  |
| -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Own `transform`, `translate`, `scale`, `rotate` (inline, stylesheet or animated), any `transform-origin` | 3D transforms and axis-form `rotate` — the box is used as painted                              |
| Page and scroll-container scrolling between renders (never reads as movement)                            | A scale or rotation on an ancestor that is _not_ a layout host                                 |
| Nested layout hosts: a child is measured against its parent's final layout while the parent animates     | Content inside a scaling layout host is distorted while that host animates                     |
| Zero-sized and detached hosts are skipped                                                                | Size changes with no Angular render (a media query, a CSS-only resize): absorbed, not animated |

**Not verified:** `direction: rtl`, `position: sticky` or `fixed` ancestors, CSS `zoom`, and Linux WebKit / real Safari have no layout tests yet. They may work; this page does not claim it.

Use `transform` for your own offsets on a layout host. Inline `translate` and `scale` are written by the layout animation itself and are overwritten when it finishes.

## Interruption

A change that lands while an animation is running does not wait and does not jump: the new animation starts from where the element is painted _now_ and replaces the old one. Cancelling is equally safe — dragging the element, `MoveAnimator.set()`/`clear()`, an external `animation.cancel()`, disabling layout, `prefers-reduced-motion` turning on, or destroying the host all stop the animation, restore the `transform-origin` it borrowed and leave measurement working for the next change. A cancelled animation never reverts your state.

## Shared elements

Two different elements with the same `moveLayoutId` hand over: the one that appears animates in from where the other was.

::source{file="src/docs-snippets/layout.ts" region="layout-shared" title="card-detail.ts"}

Rules:

- The id is claimed **once**, when an element first appears, and only if the other element published its box in the last 300 ms. A detail opened minutes later does not fly in from a position nobody remembers.
- Ids share one app-wide namespace. If two regions reuse a local id (several dashboard panels, each with a `"card"`), give each region its own **`moveLayoutScope`** — they will not hand over to each other. Scopes are experimental and additive; without one nothing changes.
- Changing `moveLayoutId` on a live element makes it a new identity.
- The registry keeps four numbers per id, never the element, holds at most 128 ids, and drops them when the window is resized.
- Focus is yours. Move it to the new surface after the state change (`afterNextRender`) and back on close — the [playground](/demos/layout) does.

## With presence, drag and hover

- **Presence.** `*movePresenceFor` with `mode: 'popLayout'` takes the leaving row out of flow, so the rows around it reflow while it is still fading.

  ::source{file="src/docs-snippets/layout.ts" region="layout-presence" title="todo-list.ts"}

- **Drag.** A drag offset is kept exactly through any number of reflows (no drift). Pressing the element during a layout animation cancels it and takes over.
- **Hover.** A held hover scale is not a layout change and starts no animation.

## Reduced motion, SSR and hydration

With `prefers-reduced-motion: reduce` (re-read on every pass) or `moveDisabled`, elements move to their final box immediately. On the server nothing is measured, and hydration records the first snapshot without animating it — there is no first-render transition.

## Cost

One `getBoundingClientRect()` and one `getComputedStyle()` per host per render pass, all reads before any write; no observers, timers or frame loops at rest. In the repository's benchmark a full reflow of 10, 50 and 100 hosts creates exactly one animation per host. Very large lists should animate a visible window, not every row.

**Related:** [layout playground](/demos/layout) · [presence](/docs/guides/presence) · [experimental overview](/docs/guides/experimental) · [accessibility](/docs/accessibility)
