---
title: Animate on enter and leave
description: Animate an element when Angular creates it, shape the timing, and let it finish leaving before it is removed.
group: Guides
order: 10
---

Use [[api:MoveEnterDirective]] when an element should animate once, as Angular creates it: a card that fades up, a toast that slides in, a heading that rises. This is the smallest useful piece of Angular Movement.

## Animate an element when it enters

::source{file="src/docs-snippets/enter.ts" region="enter-basic" title="card.ts"}

`moveEnter` takes a [preset name](/docs/presets) or your own keyframes. It runs **once**, when the directive initialises, and ignores later input changes. That is by design: it describes an entrance, not a state. To animate between states when a signal changes, use [reactive animation and variants](/docs/guides/variants).

::playground[enter]

The playground wraps the directive in a small component. Because `moveEnter` is init-only, changing a control (or pressing **Replay**) recreates the element, which plays the animation again — the page is not pretending the directive is reactive. [Open the full playground](/demos/enter) for every preset.

## Shape the timing

Duration, delay and easing are plain inputs shared by every directive. A bare number is milliseconds; a string states its unit.

::source{file="src/docs-snippets/enter.ts" region="enter-timing" title="toast.ts"}

Defaults for the whole app come from [[api:provideMovement]]; the input on the element always wins.

## Use your own keyframes

Presets are shorthand for keyframes. Pass an object to animate anything the Web Animations API can animate — keyframes are typed for the common shorthands (`x`, `y`, `scale`, `rotate`, `blur`, `opacity`, …) and any other CSS property passes straight through.

::source{file="src/docs-snippets/enter.ts" region="enter-keyframes" title="wipe.ts"}

## Let an element finish leaving

[[api:MoveLeaveDirective]] describes an exit, but it cannot hold a node that Angular has already removed. `@if` destroys its view synchronously, so there is nothing left to animate. Wrap the content in `*movePresence`, which keeps the view in the DOM until every leave animation inside it has finished:

::source{file="src/docs-snippets/enter.ts" region="enter-presence" title="details.ts"}

See [Presence](/docs/guides/presence) for the full model, including keyed lists.

## `[move]` and `moveAnimate`

[[api:MoveAnimateDirective]] (`[move]`, `[moveAnimate]`) is the shorthand for an entrance plus an exit on one element, with `moveInitial` and `moveExit` states. Like `moveEnter` it is one-shot.

::source{file="src/docs-snippets/enter.ts" region="enter-animate" title="hero-title.ts"}

## Limits to know

- Both directives are no-ops on the server and start after hydration. For an above-the-fold entrance that must paint before the app boots, use CSS; see [Accessibility and troubleshooting](/docs/accessibility).
- Reduced motion jumps straight to the end state automatically.
- Unsure which directive to pick? [Choose an API](/docs/api-selection).

**Related:** [`moveEnter` playground](/demos/enter) · [`moveLeave` playground](/demos/leave) · [`moveAnimate` playground](/demos/animate) · [[api:MoveEnterDirective]]
