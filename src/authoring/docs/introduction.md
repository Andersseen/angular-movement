---
title: Introduction
description: Angular Movement is a motion library for Angular 21 and 22 — declarative directives, state-driven animation and Web Animations API playback.
group: Start here
order: 1
---

Angular Movement packages the motion that product interfaces need every day — enter and exit, reactive state changes, hover and press feedback, scroll progress, staggered lists, drag and layout transitions — as **declarative directives** for standalone Angular components. Playback runs on the browser's Web Animations API, so there is no extra animation runtime to load.

```html
<div moveEnter="fade-up">This fades up when it enters</div>
```

## Why it exists

Angular can already animate a lot on its own: CSS transitions and keyframes, `animate.enter` and `animate.leave`, and the Web Animations API. Those are the right tools for isolated effects, and [Choose the right tool](/docs/choose-a-tool) says where to stop reaching for a library.

What they leave to you is **coordination and state**: holding a parent until every child has finished leaving, reversing a list row that returns mid-exit, staggering siblings by DOM order, animating one element between named states when a signal changes, or turning scroll position into progress. Angular Movement provides those as reusable primitives that follow Angular conventions — signal inputs, `OnPush`, zoneless change detection and server rendering.

## What you get

- **Angular-native templates.** Attribute directives and structural directives such as `*movePresence`; no imperative setup for the common cases.
- **Reactive where it should be.** `[moveAnimation]`, `moveVariants` and the interaction directives follow their inputs; the one-shot directives (`moveEnter`, `moveLeave`, `moveInView`) say so in their documentation.
- **Safe defaults.** `prefers-reduced-motion` is honoured automatically, every directive is a no-op on the server, and nothing is hidden before hydration.
- **No required setup.** No `@angular/animations`, no module to import, no GSAP or Framer Motion dependency. [`provideMovement`](/docs/reference/provide-movement) is optional global configuration.
- **Honest stability.** Every API is marked stable or experimental; see [API overview and stability](/docs/api).

## What it is not

It does not try to match every feature of Motion for React, and it is not a reason to replace CSS where CSS is enough. Layout, drag and smooth-scroll APIs are **experimental**.

## Where to go next

:::steps

1. **[Get started](/docs/get-started)** — install, configure and animate your first element.
2. **[Animate on enter and leave](/docs/guides/enter)** — the first guide, with a live playground.
3. **[Choose an API](/docs/api-selection)** — which directive for which job, and which ones play once.
4. **[Explore the demos](/demos)** — every directive as a full interactive playground.

:::
