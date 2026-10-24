---
title: Accessibility and troubleshooting
description: How Movement treats reduced motion, SSR and hydration, and what to check when an animation does not behave.
group: Concepts
order: 24
---

## Reduced motion

When the operating system asks for reduced motion, directives skip the animation and apply the final styles. You can also turn motion off globally with `provideMovement({ disabled: true })` or per element with `moveDisabled`. The decision is taken when an animation starts, so toggling the OS setting affects the next animation.

> [!IMPORTANT]
> Reduced motion removes _motion_, not feedback. Keep state changes visible (colour, opacity) and never rely on an animation to communicate information that is not otherwise available.

The layers, strongest first — the OS preference always wins, and you only configure the other two when your app has its own reason to:

1. **OS `prefers-reduced-motion` — automatic.** Every directive and `MoveAnimator` jump straight to the end state, including scroll-linked and parallax motion.
2. **`provideMovement({ disabled })` — an app kill switch.** For app-owned reasons: a user setting, visual-regression tests.
3. **`moveDisabled` / `disabled` — one animation.** Per element or per `animate()` call.

::source{file="src/docs-snippets/patterns.ts" region="patterns-reduced-config" title="app.config.ts"}

Avoid a starting style that only an animation undoes (`.card { opacity: 0 }`): users with reduced motion would never see the element.

## SSR and hydration

- The server renders your HTML as written; animation APIs are no-ops on the server.
- Movement does not hide content before hydration. Prefer CSS for critical above-the-fold motion.
- Elements that animate in from `opacity: 0` start once the app has booted. Content below the fold is a good fit for `moveInView`.

## Keyboard and focus

- Animating an element does not change its focusability. Do not animate focusable elements out with `pointer-events` alone.
- Presence keeps an element in the DOM while it leaves. Focus inside a leaving panel stays there until removal; move focus yourself (for example back to the trigger) when you close a dialog.
- `moveSmoothScroll` is experimental and changes how wheel and touch scrolling feel; prefer native scrolling.

## Troubleshooting

| Symptom                                           | Likely cause and fix                                                                                                                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Nothing animates after a signal changes           | You are probably using a one-shot API (`moveAnimate`, `moveEnter`, `moveInView`). Use `[moveAnimation]`, `moveVariants` or `MoveAnimator`. |
| `moveLeave` never plays when an `@if` turns false | The view is destroyed before the directive can run. Wrap it in `*movePresence`, or use `*movePresenceFor` for lists.                       |
| Duration looks 1000× too fast                     | Numbers are milliseconds. `0.3` means 0.3ms; write `"0.3s"` or `300`.                                                                      |
| No animation in tests or on the server            | Where the Web Animations API is unavailable (server rendering, jsdom) final styles are applied without animating.                          |

## Timing units

A bare number is always milliseconds. Use a string to state the unit explicitly; in development a suspicious value such as `0.08` logs a hint (`Did you mean "80ms" or "0.08s"?`).

::source{file="src/docs-snippets/patterns.ts" region="patterns-timing" title="timing.ts"}

**Related:** [Patterns](/docs/patterns) · [Choose the right tool](/docs/choose-a-tool)
