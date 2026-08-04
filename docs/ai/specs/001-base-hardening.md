# Spec 001 — Base Hardening Before New Directives

- **Status:** in-progress
- **Created:** 2026-07-20
- **Last updated:** 2026-08-04
- **Breaks public API:** yes (renames `moveVariants` active input; see details)
- **Related:** `docs/ai/STATE.md` roadmap 0.6, `docs/ai/PLAN-0.6.md` WS-1.x / WS-2.1 / WS-3.1

## Problem / motivation

The library currently passes tests and lint, but an audit surfaced several real bugs and DX inconsistencies that undermine a stable 0.6 base:

- The parallax demo is wired to `moveScroll` instead of `moveParallax`.
- `MoveVariantsDirective` and `MoveAnimateDirective` both declare a `moveAnimate` input, causing collisions and fragile work-arounds.
- Several numeric/boolean inputs do not coerce attribute values, so `moveDuration="400"`, `moveDrag="false"`, or `moveInViewOnce="false"` silently misbehave.
- `moveDrag` and `moveLayout` double-count existing inline transforms when the engine takes over, producing wrong visual results.
- Docs/demo pages use the wrong selector names and import the full `MOVEMENT_DIRECTIVES` array unnecessarily.
- `MoveAnimationDirective` is under-tested and inconsistent with `MoveAnimateDirective` timing inputs.
- Dead constants, duplicate server preset data, and stale API reference data add maintenance burden.

Fixing these before adding new directives/animations gives the project a solid foundation.

## Proposed solution

1. Repair the parallax demo to use `MoveParallaxDirective` and `[moveParallax]`.
2. Rename `MoveVariantsDirective.moveAnimate` to `moveVariant` (with `moveActiveVariant` as an alias) and update all usages/docs/tests.
3. Add shared boolean/number coercion transforms and apply them to all boolean/numeric inputs that may be used as attributes. Verify behavior with unit tests.
4. Reset the inline transform to the base state before the engine animates in `moveDrag` release and `moveLayout` FLIP.
5. Harden `moveDrag` bounds measurement by clearing the active transform during measurement.
6. Backfill tests for `moveAnimation`, boolean/numeric attribute coercion, and reduced-motion / SSR guards.
7. Fix docs/demo selector names, import only the directives used, and update server API reference data.
8. Remove or use dead constants in `constants.ts`.

## Public API changes

- `MoveVariantsDirective` selector input renamed from `moveAnimate` to `moveVariant`.
- `[moveActiveVariant]` added as an alias on `MoveVariantsDirective` for clarity.
- `MoveAnimationDirective` gains `moveDuration`, `moveEasing`, `moveDelay`, `moveDisabled`, and `moveSpring` standalone inputs for parity with `MoveAnimateDirective`.
- `MoveFocusDirective` gains `moveReverseDuration` and `moveReverseEasing` for parity with hover/tap.
- Boolean inputs now accept plain boolean attributes safely; numeric inputs coerce attribute strings.

## Out of scope

- No new directives or presets.
- No animation engine rewrites (only targeted transform composition fixes).
- No demo page redesigns beyond selector/import fixes and the missing focus demo.
- No release/version bump; that happens in a separate release task.

## Acceptance criteria

- [x] Parallax demo uses `[moveParallax]` and `MoveParallaxDirective`.
- [x] `MoveVariantsDirective` no longer declares a `moveAnimate` input; existing variants demos/tests use `moveVariant`.
- [x] All numeric inputs that may be written as attributes use `optionalNumberAttribute` or a required-number transform.
- [x] All boolean inputs that may be written as attributes coerce `''` / `'true'` / `'false'` correctly.
- [ ] `moveDrag` release and `moveLayout` FLIP reset the inline transform before the engine plays, so deltas are not double-counted.
- [ ] `moveDrag` bounds measurement ignores the current drag offset.
- [x] `MoveAnimationDirective` spec covers enter, exit/presence, reduced motion, SSR, and dynamic input changes.
- [x] Focus demo page exists and is registered in the demos navigation.
- [x] Docs and server API reference use correct selector names and complete input lists.
- [x] `constants.ts` no longer contains unused constants.
- [x] `pnpm test:coverage`, `ng lint`, `pnpm build`, `pnpm build:prod`, `pnpm pack:check`, and `pnpm e2e` pass.
- [x] `CHANGELOG.md` Unreleased section and `docs/ai/STATE.md` are updated.

## Implementation plan

- [x] 1. Fix parallax demo wiring (`src/app/pages/demos/parallax.page.ts`).
- [x] 2. Add shared boolean/number coercion helpers in `projects/movement/src/lib/directives/move-animation.utils.ts` and verify with unit tests.
- [x] 3. Rename variants active input and update all consumers/tests/docs.
- [x] 4. Apply boolean/number transforms across all directives.
- [ ] 5. Fix `moveDrag` / `moveLayout` transform double-counting and bounds measurement.
- [x] 6. Add `moveAnimation` standalone inputs and backfill tests.
- [x] 7. Add focus reverse inputs and focus demo page.
- [x] 8. Update docs pages, server API route, and demo imports.
- [x] 9. Clean up `constants.ts` and duplicate server preset data.
- [x] 10. Run verification suite and update `STATE.md` / `CHANGELOG.md`.

## Verification notes

Commands run:

- `pnpm test:coverage`
- `ng lint`
- `pnpm build`
- `pnpm e2e` (if affected routes change)

## Follow-ups (out of scope, noted for later)

- Full reactive input behavior for init-only directives (separate roadmap item).
- Complete e2e expansion for all demo pages.
- Server API auto-generation from library source to avoid staleness.
