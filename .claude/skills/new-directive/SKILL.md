---
name: new-directive
description: Scaffolds a new movement directive end to end — source, colocated Vitest spec, barrel registration, demo page and docs — following the 6-step checklist in docs/ai/ARCHITECTURE.md. Use when adding any new directive to the library.
disable-model-invocation: true
---

# New directive

Adds a directive to the `movement` library. Every step below is required — a directive that exists
but is missing from `MOVEMENT_DIRECTIVES` is invisible to users, and one missing from the barrel is
unreachable from the published package.

## Before you start

This is non-trivial work, so it needs a spec first (`/spec`). The spec must state whether the new
selector or inputs affect the public API — new directives are additive, but a new input on an
existing directive may not be.

Read `projects/movement/src/lib/directives/move-hover.directive.ts` end to end. It is the canonical
pattern: reactive `effect()` over all inputs, `resolveMovementConfig` merge, `prefersReducedMotion`
check, `#currentPlayer` cancellation, cleanup in `ngOnDestroy`.

## The 6 steps

### 1. Source

`projects/movement/src/lib/directives/move-<name>.directive.ts` — start from
`templates/directive.ts.template` in this skill directory.

Non-negotiables (from `docs/ai/BEST-PRACTICES.md`):

- `input()` signals only, never `@Input()`. Numeric/boolean inputs use `optionalNumberAttribute` /
  `optionalBooleanAttribute` from `move-animation.utils` so attribute syntax coerces correctly.
- `#field` private syntax for injected dependencies and internal state.
- Every browser API guarded by `isPlatformBrowser(PLATFORM_ID)` or the injected `DOCUMENT` token.
  A PostToolUse hook blocks the edit otherwise.
- Cancel the previous player before starting a new one; cancel in `ngOnDestroy`.
- Respect `prefersReducedMotion()` and the `disabled` config.
- Delegate to `AnimationEngine.play()` — never call `element.animate()` directly.

### 2. Colocated spec

`move-<name>.directive.spec.ts` — start from `templates/directive.spec.ts.template`. Write it in the
same step as the source, not "at the end". Cover at minimum: attach, the trigger path, reduced
motion, `disabled`, input reactivity, cancellation on destroy, and SSR safety.

### 3. Register in the barrel

`projects/movement/src/lib/movement.ts` — **both** places:

- add the class to the `MOVEMENT_DIRECTIVES` array
- add `export * from './directives/move-<name>.directive';`

Verify with `node .claude/scripts/api-surface.mjs` — it flags `NOT-IN-MOVEMENT_DIRECTIVES` and
`NOT-RE-EXPORTED`.

### 4. Demo page

`src/app/pages/demos/<name>.page.ts`, plus navigation registration. Import only the directives the
page actually uses — the demo site relies on route-level tree-shaking, so never import
`MOVEMENT_DIRECTIVES` wholesale.

### 5. Docs

Add the directive to `src/app/pages/docs/api.page.ts` and `reference.page.ts`, the directive table in
`docs/ai/ARCHITECTURE.md`, and both READMEs if it is a headline feature. Run the
`docs-drift-checker` agent afterwards to confirm nothing was missed.

### 6. Verify and record

Run `/verify` (full gate + `pnpm e2e` since a demo page changed). Then Phase 6: `CHANGELOG.md`
Unreleased → Added, and `docs/ai/STATE.md`.
