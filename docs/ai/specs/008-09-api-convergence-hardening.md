# Spec 008 — 0.9 API convergence / pre-1.0 hardening

- **Status:** done
- **Created:** 2026-08-26
- **Last updated:** 2026-08-26
- **Breaks public API:** yes — two narrow removals, see "Breaking changes" below. Requires explicit
  user approval before implementation.
- **Related:** ROADMAP.md (new 0.9 milestone), STATE.md "Next up" items, docs/ai/ARCHITECTURE.md
  stability table

## Problem / motivation

`angular-movement` is at `0.8.0` and functionally rich (21 directives, motion-value signals,
imperative `MoveAnimator`, presence/variants orchestration). CONTEXT.md's stated priority for the
road to 1.0 is "predictability over new features." A full audit (all 21 directives, the engine
pipeline, motion values, tokens, docs, and packaging) found the implementation itself is already
quite mature — deterministic teardown, consistent reduced-motion handling, and correct SSR guards
are the norm, not the exception. What's missing is **convergence**: a few accidental public-API
leaks, one real (narrow) teardown bug, one documented-but-unfixed DX gap (`moveSpringValue`'s
mandatory `injector`), stale docs (STATE.md/ROADMAP.md/MIGRATION.md all understate what shipped in
0.8), and ~25 exported types that were never assigned a `@stability` classification. None of this
requires new features or architectural rework — it requires the kind of fixing-foundations pass
CONTEXT.md and ROADMAP.md already call for before 1.0.

## Proposed solution

A single hardening pass across the areas below. No new directives, no new motion primitives.

### Breaking changes (both narrow, both accidental leaks — need explicit approval)

1. **`MOVE_VARIANTS_PARENT` + `MoveVariantsProvider` become internal.** They live directly in
   `move-variants.directive.ts`, which is barrel-exported — unlike the identical
   `MOVE_STAGGER_PARENT`/`MoveStaggerProvider` and `MOVE_PRESENCE_PARENT`/`MovePresenceProvider`
   pattern, which deliberately live in un-exported `tokens/*.ts` files. Neither
   `MOVE_VARIANTS_PARENT` nor `MoveVariantsProvider` is documented in ARCHITECTURE.md's DI token
   table or used anywhere outside the library itself (verified via grep across `src/` and both
   READMEs) — this is an accidental leak, not a considered public extension point. Moving it to
   `tokens/variants.tokens.ts` (not re-exported) makes it consistent with its two siblings.
2. **`CompositeAnimationControls` (the concrete class) drops out of the public barrel.** Every
   return path already types itself as the public `AnimationControls` interface; the concrete class
   is an engine-internal detail parallel to `AnimationEngine` itself, which ARCHITECTURE.md already
   documents as staying internal so `MoveAnimator` is "the only exported way in." Exporting the
   concrete class is the same kind of accidental leak as (1). `AnimationControls` (the interface)
   stays public and stable — nothing about the public contract changes, only the ability to import
   the internal class directly.

Both are pinned by a new assertion in `movement.spec.ts`, mirroring the existing `AnimationEngine`
guard test.

### Non-breaking changes

**Motion values DX (`moveSpringValue`)** — `injector` becomes optional. When omitted,
`moveSpringValue` calls `assertInInjectionContext` and infers the injector from the calling context
(field initializer, constructor, or `runInInjectionContext`) via `inject(Injector)` — the same
pattern Angular's own `toSignal`/`toObservable` use. Passing `{ injector }` explicitly remains
supported for call sites outside an injection context. This gets the ideal usage from the brief
working without any hidden lifecycle risk, because the effect this creates is still only ever
constructed inside a real injection context — either the caller's own or the one explicitly passed:

```ts
const value = moveValue(0);
const x = moveTransform(value, [0, 1], [0, 100]);
const springX = moveSpringValue(x); // no injector needed inside a field initializer/constructor
```

**Experimental API hardening**

- `SmoothScrollService`/`MoveSmoothScrollDirective` gain a dev-mode (`movementWarn`) warning when a
  second `[moveSmoothScroll]` (or a manual `.init()` call) attempts to activate while the singleton
  is already driving a different element — the exact gap STATE.md already flags as blocking
  promotion out of experimental. Directive `ngOnDestroy` also stops tearing down the shared service
  when it isn't the element that owns the active instance, so a misused second directive can't kill
  scrolling for the first.
- `moveTarget`/`moveTrigger` vs `moveVariants` vs `[move]`/`moveAnimate`/`[moveAnimation]` vs
  `moveStagger`/`staggerChildren`: document the intended hierarchy in ARCHITECTURE.md and README's
  "Pick the right primitive" table rather than redesigning any of them — each solves a genuinely
  different problem (single enter/leave; Framer-style state object; DI-propagated named states with
  orchestration; cross-tree imperative-ish triggering without a shared parent; direct-child stagger
  vs nested-tree stagger).
- Secondary entry point (`angular-movement/experimental`): documented as a **recommendation for the
  1.0 step**, not implemented now — too few experimental exports today to justify the ng-packagr
  multi-entry-point complexity, per the brief's own instruction to only do this if clearly
  beneficial.

**Reduced-motion consistency fixes** — the audit found the exact `options.disabled` vs
`options.config.disabled` bug class STATE.md already warns about ("that is exactly how the
`moveScroll`/`moveParallax` accessibility bug survived"), still present in three places:
`MoveLayoutDirective#playFlip`, `MoveTextDirective#playAll`, and `MoveInViewDirective#playAnimation`
all resolve a `config.disabled` (which folds in `moveDisabled`, OS reduced motion, and
`MOVEMENT_CONFIG.disabled`) and then call `engine.play(..., { disabled: false })` anyway, discarding
it. None is a _live_ OS-reduced-motion bug today — each has a redundant upstream guard that already
skips the call under reduced motion — but all three make the app-wide `MOVEMENT_CONFIG.disabled` kill
switch silently inert, and are one refactor away from reintroducing a real one. Fix: pass the
resolved `config.disabled` through at each call site, matching every other directive.

Separately, `moveSpringValue` never calls `prefersReducedMotion()` at all — unlike every directive in
the library, it does not automatically honor the OS preference; a consumer gets full spring motion
under reduced motion unless they manually resolve and pass `config.disabled` themselves. Since this
spec already gives `moveSpringValue` a resolvable injector (for the optional-`injector` DX change
above), that same injector can resolve `DOCUMENT` and fold `prefersReducedMotion(...)` into the
disabled check by default — consistent with section 9's requirement that reduced motion be part of
every relevant primitive's public behavior, not just the directives.

**Lifecycle fix** — `MoveTextDirective`'s `effect()` defers its work via `Promise.resolve().then()`.
If the directive is destroyed in the same tick the effect fires, that microtask still runs after
`ngOnDestroy`, creating a new `IntersectionObserver` that nothing will ever disconnect. Guard the
microtask body with a destroyed flag (mirroring how `MovePresenceForDirective` already guards its
own settled-promise continuation with `#destroyed`).

**Test coverage** — teardown assertions added for `MoveParallaxDirective` (currently has correct
teardown code but zero `fixture.destroy()` assertions), a regression test for the `moveText` fix
above, and tests for the new no-injector `moveSpringValue` path.

**Docs**

- `docs/ai/STATE.md` — refresh (0.8.0 is released and merged, not "0.7.0 published, branch pending").
- `ROADMAP.md` — add the missing retroactive `0.8` section (currently jumps straight from 0.7 to
  1.0 despite 0.8.0 being tagged and released) and a new `0.9` section describing this hardening
  pass, making the `0.9 → stabilization → 1.0` path explicit.
- `MIGRATION.md` — fix the reduced-motion item currently misattributed to `0.7.x → 0.8.0` (it
  shipped in `0.7.0` per CHANGELOG), add the missing `[moveAnimation]` reactivity note, and add a
  new `0.8.x → 0.9.0` section for the two breaking removals above plus the `moveSpringValue` DX
  change (additive, but worth a callout).
- `CHANGELOG.md` — populate `Unreleased`.
- Root README + package README — quick-start's primary example switches from
  `imports: [...MOVEMENT_DIRECTIVES]` to naming the directives actually used, with
  `MOVEMENT_DIRECTIVES` kept as a documented convenience option. `@stability` table gains the
  ~25 previously-unclassified type/interface exports (mostly `presets.types.ts`), a `SmoothScrollService`
  row (currently only the `moveSmoothScroll` selector is listed), and promotes `moveScroll` /
  `moveParallax` from candidate to stable (both have zero open gotchas, strong test coverage per
  STATE.md — 87.8%+ — and no behavior change pending). No other promotions: per the brief,
  confidence matters more than a tidy table, and the rest still have plausible small adjustments
  ahead of them.
- `docs/ai/ARCHITECTURE.md` — mirror the stability-table and DI-token-table updates.

## Out of scope

- No new directives, presets, or motion primitives (pinch, reorder, timelines, route transitions,
  View Transition API, animation-builder DSL — none of it).
- No redesign of `[move]`/`moveAnimate`/`[moveAnimation]`/`moveTarget`/`moveTrigger`/`moveVariants` —
  only documentation of the existing hierarchy.
- No secondary `angular-movement/experimental` entry point — documented as a 1.0 recommendation only.
- No promotion of `moveLayout`, `moveDrag`, `moveSmoothScroll`, `moveTarget`, `moveTrigger` out of
  experimental — `moveLayout`'s shared-layout handover and `moveDrag`'s `moveWhileDrag` both shipped
  in 0.8, too recent for a stability upgrade; `moveSmoothScroll`'s singleton constraint is a real API
  shape limitation that a dev warning documents but doesn't remove.
- No change to `AnimationEngine`, `WaapiPlayer`, `SpringPlayer`, or the keyframe/transition composer
  internals — they're already covered by dedicated tests and the audit found no correctness bugs
  there. (One minor, non-functional duplication in `AnimationEngine.play()` — two adjacent
  `if (options.transition && !isSpring)` blocks — is noted as a follow-up, not fixed here, to avoid
  an opportunistic refactor of a high-risk, already-well-tested file.)
- No exhaustive manual test matrix for every composition pair listed in the brief (hover+layout,
  tap+drag, etc.). The engine's transform-ownership model (`transform-state.ts` /
  `keyframe-composer.ts` as the single writer) was reviewed and is sound by construction; only the
  one concrete bug found (`moveText` teardown) gets a new regression test. Untested combinations are
  called out explicitly in the final report as reviewed-not-exhaustively-tested.
- No new consumer-validation app — `pnpm validate:consumer` (added in 0.7) already compiles the
  packed tarball against representative usage per supported Angular major; this spec runs it, not
  rebuilds it.
- `SmoothScrollService#applyMomentum`'s untracked RAF chain — noted as a minor hygiene nit by the
  audit, self-terminating and not a real leak. Fixed opportunistically only if it's a trivial,
  low-risk one-line change; not a blocking acceptance criterion.

## Acceptance criteria

- [x] `MOVE_VARIANTS_PARENT`/`MoveVariantsProvider` no longer exported from `public-api.ts`; internal
      usages updated to import from `tokens/variants.tokens.ts`.
- [x] `CompositeAnimationControls` no longer exported from `public-api.ts`; `AnimationControls`
      interface remains exported and unchanged.
- [x] `movement.spec.ts` asserts both are absent from the public barrel.
- [x] `moveSpringValue` works with no `injector` in config when called inside an injection context;
      throws a clear `assertInInjectionContext`-style error otherwise; explicit `{ injector }` still
      works identically. Covered by `move-values.spec.ts`.
- [x] `moveSpringValue` skips spring animation and jumps to target under `prefers-reduced-motion`,
      same as `config.disabled`. Covered by `move-values.spec.ts`.
- [x] `MoveLayoutDirective`, `MoveTextDirective`, `MoveInViewDirective` pass their resolved
      `config.disabled` to `engine.play()` instead of a hardcoded `false`. Covered by existing specs
      plus a new assertion per directive that `MOVEMENT_CONFIG.disabled: true` suppresses animation.
- [x] `SmoothScrollService`/`MoveSmoothScrollDirective` warn (dev-mode only) on second-instance
      misuse and no longer tear down an instance they don't own. Covered by
      `smooth-scroll.service.spec.ts` / a new `move-smooth-scroll.directive.spec.ts` case.
- [x] `MoveTextDirective` cannot create an orphan `IntersectionObserver` after `ngOnDestroy`. Covered
      by a new regression test in `move-text.directive.spec.ts` (verified it fails without the fix).
- [x] `MoveParallaxDirective` has `fixture.destroy()` teardown assertions in its spec.
- [x] Every previously-unclassified public export carries a `@stability` JSDoc tag.
- [x] README (root + package) and `docs/ai/ARCHITECTURE.md` stability tables match the source
      exactly; quick-start primary example imports named directives, not `MOVEMENT_DIRECTIVES`.
- [x] `ROADMAP.md` has an `0.8` section and a `0.9` section.
- [x] `MIGRATION.md` has a `0.8.x → 0.9.0` section and the `0.7`/`0.8` misattribution is fixed.
- [x] `docs/ai/STATE.md` reflects the real current state.
- [x] `CHANGELOG.md` `Unreleased` section documents every change above.
- [x] `pnpm test:coverage`, `ng lint`, `pnpm build`, `pnpm format` all pass.
- [x] `pnpm docs:check` passes (no selector/input drift).
- [x] `pnpm pack:check` and `pnpm validate:consumer` pass.
- [x] `pnpm e2e` passes (no new failures introduced).
- [x] `node .claude/scripts/api-surface.mjs --json` diffed against `main` shows only the two intended
      removals — no accidental additions/removals elsewhere. Independently confirmed by the
      `public-api-guard` agent.

## Implementation plan

1. `projects/movement/src/lib/tokens/variants.tokens.ts` — new file, move `MOVE_VARIANTS_PARENT` +
   `MoveVariantsProvider` here.
2. `projects/movement/src/lib/directives/move-variants.directive.ts` — import from the new tokens
   file instead of declaring locally; keep `MoveStaggerDirection`-style local type exports as-is.
3. `projects/movement/src/lib/directives/move-animate.directive.ts` — update the `MOVE_VARIANTS_PARENT`
   import path.
4. `projects/movement/src/lib/movement.ts` — remove `MOVE_VARIANTS_PARENT`/`MoveVariantsProvider`
   from what `move-variants.directive.ts`'s `export *` surfaces (i.e., they're no longer exported
   from that file at all); remove `CompositeAnimationControls` export, keep
   `engines/animation-controls` export.
5. `projects/movement/src/lib/movement.spec.ts` — add assertions that both are absent from
   `publicApi`.
6. `projects/movement/src/lib/values/move-values.ts` — `moveSpringValue`: make `injector` optional,
   add `assertInInjectionContext` + `inject(Injector)` fallback; resolve `DOCUMENT` from that
   injector and fold `prefersReducedMotion(...)` into the disabled check alongside `config.disabled`.
7. `projects/movement/src/lib/values/move-values.spec.ts` — update the "throws without injector"
   test to match the new error path; add a field-initializer test that omits `injector`; add a
   reduced-motion test (spring jumps straight to target).
8. `projects/movement/src/lib/scroll/smooth-scroll.service.ts` — track the owning element/instance
   explicitly; warn via `movementWarn` on conflicting `init()`.
9. `projects/movement/src/lib/scroll/move-smooth-scroll.directive.ts` — only call `#scroll.destroy()`
   when this directive's element is the one the service is currently bound to.
10. `projects/movement/src/lib/scroll/smooth-scroll.service.spec.ts` /
    `move-smooth-scroll.directive.spec.ts` — new tests for the warning + non-destructive teardown.
11. `projects/movement/src/lib/directives/move-text.directive.ts` — guard the deferred microtask with
    a destroyed flag; fix `#playAll` to pass resolved `config.disabled` instead of `false`.
12. `projects/movement/src/lib/directives/move-text.directive.spec.ts` — regression test for the
    destroy-during-effect race plus a `MOVEMENT_CONFIG.disabled` assertion.
13. `projects/movement/src/lib/directives/move-parallax.directive.spec.ts` — add teardown assertions.
    13a. `projects/movement/src/lib/directives/move-layout.directive.ts` — `playFlip` passes resolved
    `config.disabled` instead of `false`.
    13b. `projects/movement/src/lib/directives/move-in-view.directive.ts` — `#playAnimation` passes
    resolved `config.disabled` instead of `false`.
    13c. `projects/movement/src/lib/directives/move-layout.directive.spec.ts` /
    `move-in-view.directive.spec.ts` — add `MOVEMENT_CONFIG.disabled: true` suppression assertions.
14. `@stability` JSDoc pass across `presets/presets.types.ts`, `presets/icon-helpers.ts`,
    `engines/animation-controls.ts`, `engines/move-animator.service.ts` (options type),
    `tokens/movement.tokens.ts`, `providers/provide-movement.ts`, `values/move-values.ts` (config
    type), `directives/move-drag.directive.ts` (exported types), `directives/move-presence-for.directive.ts`
    (exported types), `directives/move-stagger.directive.ts` (exported type).
15. `README.md`, `projects/movement/README.md`, `docs/ai/ARCHITECTURE.md` — stability table updates,
    quick-start example change, DI token table addition, primitive-hierarchy clarification.
16. `ROADMAP.md`, `MIGRATION.md`, `docs/ai/STATE.md`, `CHANGELOG.md` — updates described above.
17. Run full Phase 5 verification (see Acceptance criteria) and record results in this spec's
    "Verification notes".

## Verification notes

- `pnpm test:coverage`: **479/479 passed**, 39 files. 94.46% stmts / 87.62% branch / 96.26% funcs
  (up from 93.49%/86.36% at the start of this spec). `move-text.directive.ts`'s new destroy-race
  regression test was verified to actually fail without the fix (guard temporarily reverted, test
  failed as expected, fix restored, test passed again) — not a vacuous assertion.
- `ng lint`: initially 4 errors (`@typescript-eslint/no-empty-function` on
  `mockImplementation(() => {})` in two new spec files) — fixed by switching to
  `mockReturnValue(undefined)`, matching the existing pattern already used elsewhere in
  `smooth-scroll.service.spec.ts`. Clean on re-run, both projects.
- `pnpm build`: passes — type-checks the library through the demo site's Vite source alias with no
  errors, across all barrel/type changes.
- `pnpm format`: applied; only whitespace/table-width normalization on the docs this spec wrote.
- `pnpm docs:check`: no drift — 21 documented directives match source.
- `pnpm pack:check`: passes. Manually confirmed `MOVE_VARIANTS_PARENT` and
  `CompositeAnimationControls` are absent from the built `dist/movement/types/angular-movement.d.ts`
  (not just the source barrel).
- `pnpm validate:consumer`: passes for Angular 21 and 22 — packed tarball installs with no peer
  conflict and builds AOT with `strictTemplates` on both.
- `pnpm e2e`: 46/47 passed on the first run; one flake
  (`scroll demo maps container scroll onto the element transform`) passed on Playwright's own
  retry. Re-ran that test in isolation 4× single-worker — passed every time — confirming it's
  parallel-load timing flakiness (the same class STATE.md already documents for three other e2e
  tests), not a regression from this work. Not fixed here; it's the kind of issue STATE.md's
  "Next up" item 2 already earmarks for its own spec before 1.0. Every other e2e test, including
  routes for directives touched by this spec (`/demos/scroll`, `/demos/layout`, `/demos/text`,
  `/demos/in-view`, `/demos/smooth-scroll`, `/demos/values`), passed cleanly.
- Public API diff independently verified by the `public-api-guard` agent against `HEAD`: the
  `api-surface.mjs --json` diff (every directive's selector/inputs/outputs/signals) is empty, and
  the only barrel-level change is the removal of the `composite-controls` `export *` line —
  matching exactly the two approved removals, nothing else.

## Follow-ups (out of scope, noted for later)

- `AnimationEngine.play()` has two adjacent `if (options.transition && !isSpring)` blocks that could
  collapse into one — cosmetic, not a bug, left alone to avoid touching a high-risk file
  opportunistically.
- `SmoothScrollService#applyMomentum`'s RAF chain isn't tracked in `#rafId` — self-terminating, not a
  leak, but inconsistent with the rest of the class. Worth a one-line fix in a future pass.
- A real `angular-movement/experimental` secondary entry point, once there's enough experimental
  surface (`moveLayout`, `moveDrag` advanced options, `moveSmoothScroll`, `moveTarget`/`moveTrigger`)
  to justify the packaging complexity — evaluate again at the 1.0 planning stage.
- Full manual/e2e composition matrix from the brief (hover+layout, tap+drag, variants+staggerChildren,
  shared layout+presence, etc.) — reviewed conceptually against the transform-ownership model, not
  exercised as a dedicated test suite. Worth its own spec if a real bug report surfaces in one of
  these combinations.
