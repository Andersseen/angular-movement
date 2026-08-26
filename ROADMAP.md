# Roadmap

This roadmap is intentionally focused on making angular-movement stable and useful in real Angular
projects. New features are welcome, but the main priority before `1.0` is predictability.

## 0.6 - API hardening — released 2026-08-07

- [x] Define which APIs are stable and which are experimental.
- [x] Tighten transform composition so layout, drag, and keyframe animations do not fight over
      inline styles.
- [x] Add more tests for interrupted animations, reduced motion, SSR guards, and nested directives.
- [ ] Clarify dynamic input behavior for directives that currently run once on init — documented in
      the README, but the reactive-vs-init-only decision is deferred to 1.0.

## 0.7 - Real app validation — complete

- [x] Add richer e2e coverage for drag, scroll, presence, and variants.
- [x] Test the library in at least two non-demo Angular apps. `pnpm validate:consumer` compiles the
      packed package inside a real Angular app per supported major, in CI and before every publish.
      It immediately found the library uninstallable on Angular 22.
- [x] Improve docs around common Angular patterns such as `@if`, `@for`, SSR, and standalone imports
      (`/docs/patterns`).
- [x] Add migration notes for any renamed or deprecated APIs (`MIGRATION.md`).

## 0.8 - Presence lists and API freeze prep — released 2026-08-17

- [x] `*movePresenceFor` — keyed-list presence: a removed item stays mounted until its own leave
      animations resolve, with per-item presence scope and `mode: 'sync' | 'wait'`.
- [x] `MoveAnimator` — the only exported imperative entry point; `AnimationEngine` stays internal
      so 1.0 can freeze the barrel without freezing the engine.
- [x] Shared layout (`moveLayoutId`) — a mounting element animates in from the rect of the element
      it replaces.
- [x] `[moveAnimation]` becomes reactive to its `animate` state (compared by value, deliberately).
- [x] Repeat controls (`repeatType: 'reverse'`, `repeatDelay`, cycle counts), `moveWhileDrag`,
      `mode: 'popLayout'`, variant orchestration (`staggerChildren`/`delayChildren`/`when`),
      `transition.times` and real per-property easing.
- [x] Angular 22 peer support (`^21.2.0 || ^22.0.0`), found and fixed by `validate:consumer`.

## 0.9 - API convergence / pre-1.0 hardening — this milestone

0.8 made the library feature-complete for the shape 1.0 wants to freeze. 0.9 is not another
feature milestone — it audits everything shipped so far and fixes what a 1.0 freeze can't carry
forward: accidental public exports, inconsistent reduced-motion handling, one real teardown bug,
and docs that had drifted from what actually shipped. See
`docs/ai/specs/008-09-api-convergence-hardening.md` for the full audit and change list.

- [x] Public API audit: two accidental barrel leaks removed (`MOVE_VARIANTS_PARENT` /
      `MoveVariantsProvider`, `CompositeAnimationControls`) — both internal implementation details
      with the same status as `AnimationEngine`, which already stayed internal.
      **Breaking, narrow, zero known external usage.**
- [x] Every previously-unclassified public export now carries a `@stability` JSDoc tag.
      `moveScroll` and `moveParallax` promoted candidate → stable (strong coverage, no open
      gotchas since their 0.7 reduced-motion fix).
- [x] `moveSpringValue`'s `injector` becomes optional — inferred automatically from the calling
      injection context, the same convention `toSignal`/`toObservable` use. It also now respects
      `prefers-reduced-motion` on its own, closing a gap where every directive did but this
      signal-first helper didn't.
- [x] Fixed three directives (`moveLayout`, `moveText`, `moveInView`) that resolved
      `config.disabled` correctly but then hardcoded `disabled: false` at the engine call site,
      silently defeating the app-wide `MOVEMENT_CONFIG.disabled` kill switch — the same bug class
      that broke `moveScroll`/`moveParallax` reduced-motion in 0.7.
- [x] Fixed a real teardown gap: `MoveTextDirective` could create an orphaned
      `IntersectionObserver` if destroyed in the same tick its effect fired.
- [x] `SmoothScrollService` (root singleton) now warns in dev mode on second-instance misuse
      instead of silently going inert, and a losing directive's `ngOnDestroy` no longer tears down
      an instance it doesn't own.
- [x] Documented the intended hierarchy between overlapping-looking primitives
      (`[move]`/`moveAnimate` vs `[moveAnimation]`; `moveVariants` vs `moveTarget`/`moveTrigger`;
      `moveStagger` vs a variant's `staggerChildren`) instead of redesigning any of them.
- [x] Quick-start docs recommend importing individual directives; `MOVEMENT_DIRECTIVES` stays
      documented as a convenience option.

## 1.0 - Stable release

`0.9 → stabilization / real-world bug fixing → 1.0` is the intended path — no large feature
milestone sits between them.

- Freeze the public API surface.
- Publish stable docs for each directive.
- Confirm Angular peer dependency policy. **Decided:** support the current and previous majors
  (`^21.2.0 || ^22.0.0` today), each verified by `validate:consumer` in CI.
- Keep package output minimal and verified with `pack:check`.
- Provide clear upgrade notes from the latest `0.x` release.
- Revisit whether a secondary `angular-movement/experimental` entry point is worth the ng-packagr
  multi-entry-point complexity once `moveLayout`, advanced `moveDrag`, `moveSmoothScroll`, and
  `moveTarget`/`moveTrigger` have enough real-world mileage to either graduate or consolidate.

## Later ideas

- Visual regression tests for selected demos.
- More preset packs for product UI, icons, and route transitions.
- Better imperative controls for advanced orchestration.
- Additional examples for dashboards, SaaS apps, marketing pages, and mobile UI.
