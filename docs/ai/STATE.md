# STATE — Current Project Status

> **Living document.** Whoever finishes a task MUST update this file (see "How to update" at the bottom).
> Paste-friendly: this file is designed to be loaded at the start of every AI session.

**Last updated:** 2026-08-26
**Library version:** `0.8.0` published (tagged, merged via PR #36). **Spec 008 (0.9 API
convergence / pre-1.0 hardening) implemented on `main`, not yet released as `0.9.0`.**
**Angular peer range:** `^21.2.0 || ^22.0.0` (`@angular/core`, `@angular/common`)
**Branch state:** `main`.
**Roadmap phase:** 0.8 is **complete** (see `ROADMAP.md`). 0.9 = spec 008 (hardening, not new
features) — implemented, pending version bump/release. Next milestone after 0.9 is 1.0.

## What is DONE and stable

- 21 directives exported via `MOVEMENT_DIRECTIVES` (see `docs/ai/ARCHITECTURE.md`).
- Two animation engines (`WaapiPlayer`, `SpringPlayer`) behind `AnimationEngine` (internal —
  `MoveAnimator` is the only exported imperative entry point).
- 29 named presets, signals-native motion helpers (`moveValue`, `moveTransform`,
  `moveSpringValue`), presence orchestration (`*movePresence`, `*movePresenceFor` for keyed
  lists), variant orchestration (`staggerChildren`/`delayChildren`/`when`), shared layout
  (`moveLayoutId`), repeat controls, per-property transitions/easing, `moveWhileDrag`.
  Full history lives in `CHANGELOG.md`, not here.
- `pnpm validate:consumer` compiles the packed tarball inside a real Angular app per supported
  major, in CI and before every publish — the only check that exercises the real npm package
  rather than the demo site's Vite source alias.
- Unit tests (Vitest) colocated with every library source file, plus three cross-cutting contract
  specs (`reduced-motion.spec.ts`, `teardown.spec.ts`, `ssr.spec.ts`); Playwright e2e for demo
  routes. `pnpm docs:check` (CI) fails the build if a selector/input renames without updating
  `src/app/shared/api/directive-reference.ts`.

## Done — Spec 008 (0.9 hardening, implemented, not yet released)

See `docs/ai/specs/008-09-api-convergence-hardening.md` for the full audit, plan and acceptance
criteria (all checked). Not yet released as `0.9.0` — version bump/tag/publish is a separate step
(`RELEASE_CHECKLIST.md`). Summary of what it changed:

- Removed two accidental public exports (`MOVE_VARIANTS_PARENT`/`MoveVariantsProvider`,
  `CompositeAnimationControls`) — both engine/DI internals that leaked inconsistently with their
  siblings (`MOVE_STAGGER_PARENT`, `AnimationEngine`), which already stayed internal.
- `moveSpringValue`'s `injector` is now optional (auto-inferred from the calling injection
  context, `toSignal`-style) and it now respects `prefers-reduced-motion` on its own.
- Fixed `moveLayout`/`moveText`/`moveInView` hardcoding `disabled: false` at the engine call site
  after correctly resolving `config.disabled` — silently defeating `MOVEMENT_CONFIG.disabled`.
- Fixed a real `MoveTextDirective` teardown gap (destroy-during-effect race could orphan an
  `IntersectionObserver`) and added missing `MoveParallaxDirective` teardown test coverage.
- `SmoothScrollService` warns in dev mode on second-instance misuse instead of silently going
  inert; a losing directive's `ngOnDestroy` no longer tears down an instance it doesn't own.
- `@stability` JSDoc added to every previously-unclassified export; `moveScroll`/`moveParallax`
  promoted candidate → stable.
- Docs (README ×2, ARCHITECTURE.md, ROADMAP.md, MIGRATION.md, STATE.md) brought back in sync with
  what actually shipped in 0.8.0.
- Full verification gate green: 479 unit tests (94.46% stmts/87.62% branch), lint, build, format,
  docs:check, pack:check, validate:consumer (Angular 21 + 22), e2e (46/47, one confirmed
  pre-existing parallel-load flake — see "Known gotchas").

## Known gotchas / open issues (do not "fix" these blindly — they are known)

- **Watch for the `disabled: false` hardcode pattern.** A directive that resolves
  `config.disabled` (folding in `moveDisabled`, OS reduced motion, and `MOVEMENT_CONFIG.disabled`)
  must pass that resolved value to `engine.play({ disabled: ... })` — not a literal `false`. This
  exact mistake has broken the `MOVEMENT_CONFIG.disabled` kill switch three separate times now
  (`moveScroll`/`moveParallax` in 0.7, `moveLayout`/`moveText`/`moveInView` in 0.9). `AnimationEngine.play()`
  keys off `options.disabled`, never `options.config.disabled`.
- `moveLeave` on its own cannot animate elements removed by `@if` — removal happens before the
  directive can run. Correct usage pairs it with `*movePresence`.
- Several directives are **one-shot by design** (`[move]` / `moveAnimate`, `moveEnter`, `moveLeave`,
  `moveInView`, `moveSmoothScroll`): they describe a single entrance or exit, so they ignore later
  input changes. This is the frozen 1.0 contract, not a gap — see the reactivity table in
  `ARCHITECTURE.md`. `moveLoop`, `moveText` and `[moveAnimation]` **are** reactive.
- **`[moveAnimation]` compares its `animate` state by value, deliberately.** Templates bind an object
  literal, which is a new reference every change detection pass; a reference comparison would replay
  the animation forever. Do not "simplify" it to an identity check.
- **`SharedLayoutRegistry` has no release-on-destroy, deliberately.** A `moveLayoutId` handover
  destroys the outgoing element and creates the incoming one in the same pass with no guaranteed
  order, so dropping the entry alongside its element loses the rect in exactly the case the feature
  exists for. Entries age out via `SHARED_LAYOUT_MAX_AGE_MS` instead.
- **`*movePresenceFor` revives returning keys _before_ its placement loop, not inside it.** Reviving
  inline made the loop skip the very entry it was about to place, and the resulting view-container
  index could run past the end. Its leave resolution also has to `markForCheck()`: it runs from a
  settled promise, outside change detection, so a zoneless app would never check the views it
  creates or removes there.
- **`SmoothScrollService` is a root singleton.** `[moveSmoothScroll]` on a second element (or a
  manual `.init()` call while a directive already owns it) now warns in dev mode instead of
  silently doing nothing (spec 008); it is still a real API-shape limit, not just a missing
  warning, so the directive stays experimental. `activeElement` exposes which element currently
  owns it.
- **`SmoothScrollService` governs the page scroll only.** Anything that also supports a custom
  container (`moveScroll`, `moveParallax`) must defer to it _only_ when no container is set —
  getting this wrong left `moveScrollContainer` completely inert on any site using smooth scroll.
  The container's own `scrollTop` always wins.
- **The demo site does NOT exercise the published package** — `vite.config.ts` aliases
  `movement` to the library source. Only `pnpm validate:consumer` compiles the real tarball. A
  green CI job other than that one is not evidence the package installs.
- `docs:check` runs in CI: renaming any selector or input now fails the build until
  `src/app/shared/api/directive-reference.ts` is updated in the same commit. That is intentional.
- **The engine writes atomic `translate` / `scale` / `rotate`, and only switches to a composed
  `transform` when the element already has one.** Asserting on `getComputedStyle(el).transform`
  alone will report `"none"` for a working animation. Read every channel (see `motionState()` in
  `e2e/demos.spec.ts`). Pinned by a unit test; do not "unify" it.
- Several directives defer their first play by a microtask, and `moveText` / `moveInView` need an
  `IntersectionObserver` hit. Tests that only call `detectChanges()` pass vacuously — always await
  `whenStable()` and include a control case.
- **Never assert an absence with `expect.poll`.** `expect.poll(...).toBe(0)` on an animation count
  matches its first sample (before anything is created) and silently tests nothing. Wait a settle
  window, then assert once. Playwright's `reducedMotion` fixture does not reach `matchMedia` here;
  use `page.emulateMedia({ reducedMotion: 'reduce' })`.

## Next up (priority order) — the road to 1.0

1. **Cut the `0.9.0` release** for spec 008 (already implemented on `main`) — follow
   `RELEASE_CHECKLIST.md`.
2. At least four e2e tests are now known to flake under parallel load (`animation demo plays enter
and exit through movePresence`, `drag demo moves the card…`, `smooth scroll demo exposes the
live service readout`, and — newly observed while verifying spec 008 —
   `scroll demo maps container scroll onto the element transform`) — each asserts a transient
   mid-animation/mid-scroll state from outside the page and passes reliably single-worker. Worth
   its own spec before 1.0 (increase timeouts, assert from inside `page.evaluate`, or reduce
   worker count for this file).
3. Toolchain upgrade: this repo builds on Angular 21 / TypeScript 5.9 while supporting consumers on
   Angular 22 / TypeScript 6. Needs its own spec.
4. Add Angular 22 to the CI matrix for the library's own unit tests, not just the consumer app.
5. SSR-render the built package in the consumer fixture (needs an `ssr.entry` server).
6. Revisit a secondary `angular-movement/experimental` entry point once the experimental surface
   (`moveLayout`, advanced `moveDrag`, `moveSmoothScroll`, `moveTarget`/`moveTrigger`) has more
   real-world mileage — documented as a 1.0-time decision in `ROADMAP.md`, not started now.

## Release process (when asked to release)

Follow `RELEASE_CHECKLIST.md`. Key commands: `pnpm test:coverage` → `ng build movement` →
`pnpm pack:check` → `pnpm lib:publish`. Version bumps in `projects/movement/package.json`,
changelog entry moves from Unreleased to a versioned section.

---

## How to update this file (mandatory after finishing a task)

1. Update **Last updated** date and any changed version numbers.
2. Move completed items into "What is DONE"; add new work to "In progress".
3. If you discovered a new gotcha, add it to "Known gotchas".
4. Keep this file under ~80 lines — it must stay cheap to load into every session. Summarize; don't append forever.
