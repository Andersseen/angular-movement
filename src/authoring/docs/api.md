---
title: API overview and stability
description: How the API is organised, which parts are stable or experimental, and which directives read their inputs once.
group: Concepts
order: 21
---

The library has a broad surface, but most teams learn it in this order: basic motion, interaction motion, state variants, orchestration, then advanced runtime features. Each stage links to a guide; the generated [API reference](/docs/reference) is the complete contract.

## Recommended path

| Stage         | Job                              | APIs                                                                         | Guide                                                        |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Basic         | Entrance and exit                | `[move]`, `moveEnter`, `moveLeave`, `moveInitial`, `moveAnimate`, `moveExit` | [Animate on enter and leave](/docs/guides/enter)             |
| Interaction   | Pointer and focus states         | `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveInView`             | [Hover, tap and focus](/docs/guides/interactions)            |
| State         | Targets and variants             | `moveAnimation`, `moveVariants`, `moveVariant`, `moveTarget`, `moveTrigger`  | [Reactive animation and variants](/docs/guides/variants)     |
| Orchestration | Presence and stagger             | `movePresence`, `movePresenceFor`, `moveStagger`, `moveStaggerStep`          | [Presence](/docs/guides/presence)                            |
| Scroll        | Motion linked to the viewport    | `moveScroll`, `moveParallax`, `moveLoop`, `moveText`                         | [Stagger, scroll and loops](/docs/guides/stagger-and-scroll) |
| Values        | Signals and imperative animation | `moveValue`, `moveTransform`, `moveSpringValue`, `MoveAnimator`              | [Motion values](/docs/guides/signals)                        |
| Experimental  | Layout, drag, smooth scroll      | `moveLayout`, `moveDrag`, `moveSmoothScroll`, `moveTarget`, `moveTrigger`    | [Experimental](/docs/guides/experimental)                    |

## How it works

Angular Movement is Angular-native at the template API level and runs on the browser's Web Animations API at runtime:

1. **Declare.** Use directives and signal-driven inputs directly in Angular templates.
2. **Compose.** Movement resolves presets, variants, transforms, SVG paths and transitions into keyframes.
3. **Commit.** WAAPI plays the timeline and the engine writes the final styles back safely, then cancels the animation so nothing leaks.

A spring is simulated up front and handed to WAAPI as a keyframe list with `linear` easing; reduced motion and server rendering apply the final styles without animating.

## First API to reach for

For app UI, `moveInitial`, `moveAnimate` and `moveExit` map directly onto initial state, target state and exit state:

```html title=motion-style.html
<ng-container *movePresence="isOpen()">
  <article
    [moveInitial]="{ opacity: 0, y: 24 }"
    [moveAnimate]="{ opacity: 1, y: 0 }"
    [moveExit]="{ opacity: 0, y: -16 }"
  >
    Panel
  </article>
</ng-container>
```

When a named preset is enough, use `[move]`, `moveEnter` and `moveLeave`. For exits, wrap conditional content in `movePresence`: a direct `@if` removes the element before `moveLeave` can run. Per-property transitions can have different `duration`, `delay` and `easing`; independent properties such as `opacity` run as separate animations, while the transform channels (`x`, `y`, `scale`, `rotate`, …) share one easing because they compose into a single `transform`.

## API stability

Stable APIs follow semantic-versioning expectations. Experimental APIs can change significantly in a minor version. Every public declaration carries a `@stability` tag, shown on its [reference page](/docs/reference).

| Status       | Directives and helpers                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Stable       | `provideMovement`, `MOVEMENT_STABLE_DIRECTIVES`, `MOVEMENT_DIRECTIVES` (includes experimental members), `[move]`, `[moveAnimate]`, `moveEnter`, `moveLeave`, `*movePresence`, `*movePresenceFor`, `moveStagger`, `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveInView`, `moveScroll`, `moveParallax`, `[moveAnimation]`, `moveVariants`, `moveText`, `moveLoop`, `MoveAnimator`, `moveValue`, `moveTransform`, `moveSpringValue`, `MOVE_PRESETS` and the icon helpers, `MoveTime` / `moveTimeToMs` |
| Candidate    | None currently — the 1.0 freeze pass promoted every candidate. New APIs may land here first.                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Experimental | `moveLayout`, `moveDrag` (the whole directive), `moveSmoothScroll` / `SmoothScrollService`, `moveTarget`, `moveTrigger`, `MOVEMENT_EXPERIMENTAL_DIRECTIVES`                                                                                                                                                                                                                                                                                                                                                   |

> [!NOTE]
> Deprecated members stay supported within the major version: for example `moveActiveVariant` is a permanent alias of `moveVariant`. The reference marks them **Deprecated** with the replacement.

## Input reactivity

Most interaction directives react to input changes while they are active. A few read their configuration once at initialisation, by design:

- **Reactive after init:** `moveWhileHover`, `moveWhileTap`, `moveWhileFocus`, `moveVariants`, `moveTarget`, `moveTrigger`, `moveScroll`, `moveParallax`, `moveDrag`, `moveLoop`, `moveText`, and the `animate` state of `[moveAnimation]`.
- **Init-only:** `moveAnimate` / `[move]`, `moveEnter`, `moveLeave`, `moveInView`, `moveSmoothScroll`. Wrap the element in `*movePresence` or recreate the view to replay.

[Choose an API](/docs/api-selection) turns this into a decision guide.
