---
title: Hover, tap and focus feedback
description: Give buttons, links and cards hover, press and focus feedback that behaves correctly on touch, and reveal content as it scrolls into view.
group: Guides
order: 11
---

Interaction directives animate **while** something is true — the pointer is over the element, it is pressed, it has focus — and reverse when it stops. They follow their inputs after initialisation, so a bound value can change at any time.

## Buttons and links

::source{file="src/docs-snippets/interactions.ts" region="interactions-button" title="buy-button.ts"}

`lift` and `press` are the two interaction presets. They write different style channels (`translate` and `scale`), so they compose on one element.

> [!IMPORTANT]
> Hover means a mouse or a pen: a finger has no hover state, and emulating one is what produces sticky hover and blocked taps. Pair [[api:MoveHoverDirective]] with [[api:MoveTapDirective]] so touch gets press feedback. Neither directive calls `preventDefault()`, so links, buttons and scrolling behave natively.

::playground[interaction]

Each control applies immediately, because these directives are reactive. [Open the full hover playground](/demos/hover) or the [tap](/demos/tap) one.

## Focus

[[api:MoveFocusDirective]] animates while the element has focus. Do not use it as the only focus indicator: keep a visible `:focus-visible` style.

::source{file="src/docs-snippets/interactions.ts" region="interactions-focus" title="field.ts"}

## Reveal on scroll

[[api:MoveInViewDirective]] plays when an element enters the viewport (once by default). It is one-shot, like `moveEnter`.

::source{file="src/docs-snippets/interactions.ts" region="interactions-in-view" title="product-card.ts"}

Elements that start hidden and animate in are revealed once the app has booted, so content _below_ the fold is a good fit; keep above-the-fold content visible in the server-rendered HTML.

**Related:** [`moveWhileHover` playground](/demos/hover) · [`moveWhileTap` playground](/demos/tap) · [`moveWhileFocus` playground](/demos/focus) · [`moveInView` playground](/demos/in-view)
