---
name: movement-usage
description: Use the angular-movement animation library correctly by querying its MCP tools (get_guidelines, list_directives, get_directive, list_presets, get_example) instead of guessing selectors, inputs, timing units or imports. Use whenever writing, reviewing, or debugging a [move*] template binding, or when asked to animate something in an Angular app that has angular-movement installed.
---

# movement-usage

`angular-movement` is a directive-based Angular animation library (`[moveEnter]`, `[moveWhileHover]`,
`[moveDrag]`, `[moveAnimation]`, etc.). Its API is not large, but it is not something to guess —
selector names, input names and preset names are exact strings, and a wrong guess fails silently
or throws at runtime rather than producing a type error. (`moveHover` is a plausible-looking but
wrong guess — the real selector is `moveWhileHover`; this is exactly the kind of mistake `get_directive`
exists to catch before it ships.)

This skill pairs with the `movement` MCP server (installed via `npx angular-movement-mcp init`,
already wired into this repo's `.mcp.json` if you're reading this file from `.claude/skills/`).

## Before writing any `[move*]` binding

0. Call `get_guidelines` once per task — it carries the conventions below with examples.
1. Call `list_directives` (optionally with a `filter`, e.g. `"drag"` or `"hover"`) to find the
   right directive instead of assuming one exists.
2. Call `get_directive` with the class name or selector to get its exact inputs (name, type,
   required, default), outputs, and public signals.
3. Call `get_example` to get a minimal, structurally-valid template skeleton for that directive's
   main input before writing the real binding. Use the `importStatement` it returns.
4. Call `list_presets` when a value needs to be one of the built-in `MovePreset` strings (e.g.
   `'fade-up'`) — do not invent a preset name.

## Conventions worth knowing

- Every directive selector is prefixed `move` (`[moveEnter]`, `[moveWhileHover]`, `[moveDrag]`, …) —
  never invent a selector without a `move` prefix, and never assume the rest of the name without
  checking `list_directives`/`get_directive` first.
- `[moveAnimation]` takes a **single-value** state object (`{ initial, animate, exit }`), not
  arrays of keyframes — check `get_directive` before writing multi-value keyframes into it.
- Some directives are one-shot by design (they play once and ignore later input changes) —
  `get_directive`'s `oneShot` field tells you this; `null` means it isn't documented either way,
  so don't assume reactivity.
- `provideMovement(config)` sets library-wide defaults (`duration`, `easing`, `delay`, `disabled`)
  — check whether an app already configures this before hardcoding per-directive durations/easings.
- **Imports:** import the directives the component uses (`imports: [MoveHoverDirective,
MoveTapDirective]`). Do not write `imports: [MOVEMENT_DIRECTIVES]` for a component that uses one
  to three directives — it pulls in all 21, experimental ones included.
- **Timing units:** a number is always **milliseconds**. `[moveStaggerStep]="0.08"` is 0.08ms, not
  80ms. Write `moveStaggerStep="80ms"` or `"0.08s"` on static attributes; `provideMovement`,
  `MoveAnimator` options, variants and `transition` accept the same `MoveTime` values.
- **Interaction presets:** `moveWhileHover="lift"` and `moveWhileTap="press"` instead of
  hand-written literals; they compose on one element. Tap keyframes have two values — a
  three-value tap (`[1, 0.97, 1]`) replays on release.
- **Touch:** `moveWhileHover` is mouse/pen only; touch never hovers. Add `moveWhileTap` for touch
  feedback. Neither calls `preventDefault()`.
- **Reduced motion is automatic.** Never query `matchMedia('(prefers-reduced-motion…)')` to pass
  into `provideMovement({ disabled })`, and never disable motion for SSR — directives are already
  no-ops on the server. `disabled` is an app-level kill switch; `moveDisabled` is per element.
- **Imperative animation:** from TypeScript, `inject(MoveAnimator)` —
  `animate(target, keyframes, options)` accepts an `Element` or `ElementRef`; `set()` / `clear()`
  commit or remove a state. Do not add a template element with `moveTrigger` just to get a handle;
  `moveTarget`/`moveTrigger` are experimental and meant for declarative trigger relationships.
- **Awaiting:** `controls.finished` and `moveTrigger.play()` always resolve (also on cancel) —
  no `try/catch` needed.
- **View Transitions:** `animator.animate(document.documentElement, frames, { pseudoElement:
'::view-transition-new(root)' })` — not raw `element.animate()`.
- **Any CSS property** passes through keyframes (`clipPath`, `filter`, `borderRadius`, …).
- **First paint:** the library runs after hydration. An above-the-fold entrance that must animate
  at first paint belongs in CSS.

## When the MCP tools don't cover it

If a question is about animation _behavior_ (timing curves, spring physics tuning, SSR behavior)
rather than the API surface, the tools here won't help — fall back to the library's own README/
docs site rather than guessing.
