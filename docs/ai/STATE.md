# STATE — Current Project Status

> **Living document.** Whoever finishes a task MUST update this file (see "How to update" at the bottom).
> Paste-friendly: this file is designed to be loaded at the start of every AI session.

**Last updated:** 2026-08-17
**Library version:** `0.7.0` published; **spec 006 (0.8) implemented, unreleased**.
**Angular peer range:** `^21.2.0 || ^22.0.0` (`@angular/core`, `@angular/common`)
**Branch state:** `feat/08-presence-lists-and-api-freeze` — spec 006 complete, not merged. PR pending
(the user opens it).
**Roadmap phase:** 0.7 is **complete** (see `ROADMAP.md`). 0.8 = spec 006. Next milestone is 1.0.

## What is DONE and stable

- 21 directives exported via `MOVEMENT_DIRECTIVES` (see `docs/ai/ARCHITECTURE.md` for the full table).
- Two animation engines: `WaapiPlayer` (WAAPI wrapper) and `SpringPlayer` (pre-computed spring keyframes).
- 29 named presets (`MovePreset` type in `presets/presets.types.ts`), including icon/SVG presets.
- Signals-native motion helpers: `moveValue`, `moveTransform`, `moveSpringValue` (added in 0.5.0).
- Drag snap points (`moveDragSnapPoints`), stagger step alias (`moveStaggerStep`), `progress` signal on scroll & parallax.
- Demo site with a page per directive under `src/app/pages/demos/`, docs pages (API Reference, Presets), templates page.
- Unit tests (Vitest) colocated with every library source file; Playwright e2e for demo routes.
- CI (GitHub Actions) with explicit permissions/concurrency; Cloudflare Pages deploy on `main` pushes.
- OSS community files: CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, SUPPORT, ROADMAP, RELEASE_CHECKLIST, issue forms, PR template, Dependabot.
- Transform composition hardening: `engines/transform-state.ts` + `composeElementKeyframes()` so
  `moveDrag`, `moveLayout`, and keyframe animations share a single composed `transform` channel.
- `moveSpringValue` now requires `injector` in its config (throws a clear error if missing).
- `SmoothScrollService` respects `prefers-reduced-motion` and no longer overrides native scroll.
- `moveDrag` guards against detached elements during drag/release and uses composed transforms.
- `movePresence` race condition fixed: removal token prevents a stale leave promise from clearing a
  view that was already recreated.
- `moveText` is now reactive to input changes via `effect()`.
- **`*movePresenceFor`** (spec 006): keyed-list presence. Renders the list itself so a removed item
  stays mounted until its leave resolves; per-item `MOVE_PRESENCE_PARENT` scope via a per-view
  `Injector`; `mode: 'sync' | 'wait'`.
- **`MoveAnimator`** (spec 006): the only exported imperative entry point. `AnimationEngine` stays
  internal, pinned by a test in `movement.spec.ts`.
- **Shared layout** (spec 006): `moveLayoutId` works — `SharedLayoutRegistry` (internal) hands a
  mounting element the rect of the element it replaces.
- **`[moveAnimation]` is reactive** on its `animate` state (spec 006), compared by value.
- Demo bundle optimization: every demo page and the demo container import only the specific
  directives they use, improving route-level tree-shaking.
- Public docs aligned with real API: variants use `moveVariant`/`moveActiveVariant`, focus uses
  `moveWhileFocus`, and `moveSpringValue` examples show `{ injector: inject(Injector) }`.
- API stability and input-reactivity sections added to root README, package README, API Guide,
  Reference page, and `docs/ai/ARCHITECTURE.md`.
- Demo pages added for `[moveAnimation]` (object-based Framer-style API) and `[moveWhileFocus]`.
- `MoveAnimationDirective` test suite expanded: keyframes, ignored properties, timing/spring/disabled
  inputs, reduced motion, exit/presence, cancellation, and SSR safety.
- Playwright e2e covers the two new demo routes plus basic interaction tests.
- `moveParallaxContainer` input added to `MoveParallaxDirective` for custom scrollable containers;
  parallax demo migrated from `[moveScroll]` to `[moveParallax]`.
- `optionalBooleanAttribute` coercion bug fixed: empty-string boolean attributes now resolve to `true`.
- `move-animation.utils.spec.ts` covers `optionalNumberAttribute`, `numberAttribute`,
  `optionalBooleanAttribute`, and `booleanAttribute`.

## Recently released (in `0.7.0`)

- **Spec 001 — Base Hardening** is fully closed. Its last open item (`moveLayout` transform
  double-counting) was fixed in spec 002.
- **Spec 002 — 0.7 Hardening** (`docs/ai/specs/002-07-hardening.md`) — **done**, released in `0.7.0`:
  - `moveLayout` FLIP now measures in untransformed layout space (the double-counting fix).
  - Coverage: `MoveScrollDirective` 66.7% → 87.8%, `SmoothScrollService` 66.7% → 96.5%.
    Suite is 261 tests / 89.69% stmts / 82.26% branch.
  - New demos: `/demos/smooth-scroll` and `/demos/values` (signal helpers), both with e2e.
  - `@stability` JSDoc on every public declaration; `moveText`/`moveLoop` classified as candidates.
  - `pnpm docs:check` guard wired into CI — it found and fixed 8 pre-existing doc errors.
- **Spec 003 — Test hardening** (`docs/ai/specs/003-test-hardening.md`) — **done**, released in `0.7.0`.
  Closes PLAN-0.6 WS-1.1 / WS-1.2 / WS-1.3 / WS-4.5, all previously open.
  - **372 unit tests** (from 241), **93.49% stmts / 86.36% branch**, **39 e2e** (from 25).
    No library file below 87.5% stmts; `base-player.ts` and `waapi-player.ts` at 100%.
  - Three cross-cutting contract specs — `reduced-motion.spec.ts`, `teardown.spec.ts`,
    `ssr.spec.ts` — assert at the `Element.animate()` boundary instead of on config plumbing.
  - e2e interaction tests for drag, presence, variants, stagger, in-view, scroll.
  - Gate green: tests, lint, build, e2e (39), pack:check, docs:check, no API-surface diff vs `main`.
- **Spec 004 — Complete 0.7** (`docs/ai/specs/004-complete-07.md`) — **done**:
  - `pnpm validate:consumer` compiles the **packed** package inside a real Angular app per supported
    major. Nothing did this before: the demo site uses a Vite source alias, so packaging breakage was
    structurally invisible.
  - It immediately found the library **uninstallable on Angular 22** (peers were `^21.2.0` only).
    Range widened to `^21.2.0 || ^22.0.0`; both majors verified.
  - Runs in CI and as the last gate in `release.yml` before publish.
  - `/docs/patterns` and `MIGRATION.md` close the remaining 0.7 docs items.
- **Spec 005 — scroll container vs smooth scroll** (`docs/ai/specs/005-scroll-container-smooth-scroll.md`)
  — **done**. Found while chasing a flaky e2e test that turned out to be reporting a real defect:
  `moveScrollContainer` / `moveParallaxContainer` were inert whenever `SmoothScrollService` ran.
  Fixed in both directives, with unit + e2e regressions verified against the unfixed code.
  e2e is now 5 consecutive clean runs (43 passed, zero flaky).
- **Audit pass (post-003)** — two real defects found and fixed:
  - `moveScroll` / `moveParallax` ignored `prefers-reduced-motion` (both hardcoded
    `disabled: false`). Now guarded, with unit tests plus browser-level e2e using `emulateMedia`.
  - The navbar advertised `v0.5.0`; the version is now injected from the library `package.json`
    via `vite.config.ts` (`__MOVEMENT_VERSION__` → `src/app/shared/version.ts`).
  - Checked and found healthy: no listener leaks, all internal `routerLink`s resolve, peer range
    matches the installed Angular (21.2.2 vs `^21.2.0`), `movementWarn` is `ngDevMode`-guarded, and
    `movePresence` / `moveStagger` need no `ngOnDestroy` (ViewContainerRef and child unregistration
    handle it).

## Next up (priority order) — the road to 1.0

1. ~~Dynamic input behavior for the init-only directives~~ — **resolved by spec 006.** The contract
   is now two deliberate groups (reactive vs one-shot-by-design), the docs match the code, and
   `[moveAnimation]` became reactive. The API is ready to freeze at 1.0.
2. **Three pre-existing e2e tests flake under parallel load** and are unrelated to spec 006:
   `animation demo plays enter and exit through movePresence`, `drag demo moves the card…`, and
   `smooth scroll demo exposes the live service readout`. They pass on retry, so the suite reports
   green, which is how they went unnoticed. Each asserts a transient mid-animation state from
   outside the page — the same class of bug spec 006's own e2e hit and fixed by observing inside a
   single `page.evaluate`. Worth its own spec before 1.0.
3. Toolchain upgrade: 37 outdated packages. This repo still builds on Angular 21 / TypeScript 5.9
   while supporting consumers on Angular 22 / TypeScript 6. Needs its own spec.
4. Add Angular 22 to the CI matrix for the library's own unit tests, not just the consumer app.
5. SSR-render the built package in the consumer fixture (needs an `ssr.entry` server).

## Known gotchas / open issues (do not "fix" these blindly — they are known)

- `moveLeave` on its own cannot animate elements removed by `@if` — removal happens before the
  directive can run. Correct usage pairs it with `*movePresence`. Demo pages already reflect this.
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
- **`SmoothScrollService` is a root singleton and the demo app calls `init()` in `App`.** Therefore
  `[moveSmoothScroll]` on any container is a silent no-op, and destroying that element tears down the
  global instance. The `/demos/smooth-scroll` page demonstrates the _service_ for this reason. Needs
  a dev-mode warning or a scoped-instance API before `moveSmoothScroll` leaves experimental.
- **`SmoothScrollService` governs the page scroll only.** Anything that also supports a custom
  container (`moveScroll`, `moveParallax`) must defer to it _only_ when no container is set —
  getting this wrong left `moveScrollContainer` completely inert on any site using smooth
  scroll, this one included (spec 005). The container's own `scrollTop` always wins.
- **Beware assertions that pass on a settling animation.** The e2e scroll test sampled its
  baseline mid-lerp and then asserted "it changed" — so it reported green for months while the
  feature under test was frozen. Settle first, then assert, and confirm the action you performed
  actually did something.
- **The demo site does NOT exercise the published package** — `vite.config.ts` aliases
  `movement` to the library source. Only `pnpm validate:consumer` compiles the real tarball,
  which is why a broken peer range, `exports` map or `.d.ts` stays green everywhere else. That
  blind spot is how `0.7.0` shipped uninstallable on Angular 22. A green CI job other than that
  one is not evidence the package installs.
- `docs:check` runs in CI: renaming any selector or input now fails the build until
  `src/app/shared/api/directive-reference.ts` is updated in the same commit. That is intentional.
- **The engine writes atomic `translate` / `scale` / `rotate`, and only switches to a composed
  `transform` when the element already has one.** Asserting on `getComputedStyle(el).transform`
  alone will report `"none"` for a working animation — this cost two false e2e failures. Read every
  channel (see `motionState()` in `e2e/demos.spec.ts`). Pinned by a unit test; do not "unify" it.
- Several directives defer their first play by a microtask, and `moveText` / `moveInView` need an
  `IntersectionObserver` hit. Tests that only call `detectChanges()` pass vacuously — always await
  `whenStable()` and include a control case.
- **Never assert an absence with `expect.poll`.** `expect.poll(...).toBe(0)` on an animation count
  matches its first sample (before anything is created) and silently tests nothing — this produced a
  green reduced-motion e2e over a live bug. Wait a settle window, then assert once. Likewise,
  Playwright's `reducedMotion` fixture did not reach `matchMedia` here; use
  `page.emulateMedia({ reducedMotion: 'reduce' })` and assert the emulation took effect.
- `AnimationEngine.play()` keys off `options.disabled`, **not** `options.config.disabled`. A
  directive that resolves a disabled config but still passes `disabled: false` will animate anyway —
  that is exactly how the `moveScroll` / `moveParallax` accessibility bug survived.

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
