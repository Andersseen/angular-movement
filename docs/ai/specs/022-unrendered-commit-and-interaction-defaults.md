# Spec 022 — Unrendered commit safety and lift/press defaults

- **Status:** done
- **Created:** 2026-11-16
- **Last updated:** 2026-11-16
- **Breaks public API:** no. Additive: `moveWhileHover` / `moveWhileTap` are no longer required inputs.
- **Related:** consumer report (Angular 22 zoneless app on 1.2.x)

## Problem / motivation

1. `BaseAnimationPlayer`'s finish listener called `commitStyles()` unguarded. On an unrendered target
   (`display: none` on it or an ancestor, e.g. a column hidden by a media query) every engine throws
   `InvalidStateError`, so `cancel()`, the `finished` resolution and `onDone` were skipped: an uncaught
   page error, a WAAPI animation left behind, and `finished` never settling — contradicting the
   "always resolves, never rejects" contract.
2. `moveWhileHover` / `moveWhileTap` were `input.required`, so an app directive composing them with
   `hostDirectives` either failed NG2019 (not exposed) or forced every use site to bind them (NG8008).
3. Undocumented: moving presets animate `translate` and commit it inline, replacing a centring
   `translate` from the stylesheet.

## Proposed solution

1. Commit through `commitFinalState()`: try `commitStyles()`; if it throws, write the keyframe playback
   ends on (respecting `direction`/`iterations`) into the inline style; swallow any failure. The finish
   listener resolves and calls `onDone` in a `finally`. `base-player.ts` is the only `commitStyles` call
   site in the library.
2. `moveWhileHover` defaults to `'lift'`, `moveWhileTap` to `'press'`; `''`, `null` and `undefined`
   fall back to the default (so a bare attribute works).
3. README + patterns page: hostDirectives composition and the translate-wrapper caveat.

```html
<button moveWhileHover moveWhileTap>Buy now</button>
```

## Out of scope

- A shipped composite directive (`[movePressable]`): the defaults make an app-side composition a few
  lines, so a new public directive is not added. Revisit if users ask for it.
- Other engines' `cancel`/`finish` paths, layout directive (no `commitStyles` there).

## Acceptance criteria

- ✅ An entrance under `display: none` finishes with no page error, no residual animation and opacity 1
  once shown — `e2e/cross-browser.spec.ts` (Chromium, Firefox, WebKit); fails on all three without the fix.
- ✅ Throwing `commitStyles` still cancels, resolves and calls `onDone`; the end keyframe is inline —
  `engines/base-player.spec.ts`.
- ✅ Bare attributes, hostDirectives composition (unexposed and exposed) and `moveDisabled` forwarding
  compile and behave — `directives/interaction-defaults.spec.ts` (NG2019/NG8008 without the change).
- ✅ Docs: library README, root README, `src/authoring/docs/patterns.md` (compiled snippets).
- ✅ `pnpm test:coverage`, `ng lint`, `pnpm build`, `pnpm docs:verify` pass.

## Verification notes

See the PR / Phase 5 run of 2026-11-16.

## Follow-ups

- Optional `[movePressable]` composite directive if demand appears.
