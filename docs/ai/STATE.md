# STATE — Current Project Status

> **Living document.** Whoever finishes a task MUST update this file (see "How to update" at the bottom).
> Paste-friendly: this file is designed to be loaded at the start of every AI session.

**Last updated:** 2026-08-07
**Library version:** `0.7.0` — published to npm (`latest`) on 2026-08-07 via the `v0.7.0` tag.
**Angular peer range:** `^21.2.0` (`@angular/core`, `@angular/common`)
**Branch state:** `main` — specs 002 and 003 merged and released as `0.7.0`.
**Roadmap phase:** 0.7 is **complete** (see `ROADMAP.md`). Next milestone is 1.0.

## What is DONE and stable

- 20 directives exported via `MOVEMENT_DIRECTIVES` (see `docs/ai/ARCHITECTURE.md` for the full table).
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

1. Dynamic input behavior for the 9 init-only directives — needs spec + user sign-off. **The only
   remaining blocker for freezing the API at 1.0.**
2. Toolchain upgrade: 37 outdated packages. This repo still builds on Angular 21 / TypeScript 5.9
   while supporting consumers on Angular 22 / TypeScript 6. Needs its own spec.
3. Add Angular 22 to the CI matrix for the library's own unit tests, not just the consumer app.
4. SSR-render the built package in the consumer fixture (needs an `ssr.entry` server).

## Known gotchas / open issues (do not "fix" these blindly — they are known)

- `moveLeave` on its own cannot animate elements removed by `@if` — removal happens before the
  directive can run. Correct usage pairs it with `*movePresence`. Demo pages already reflect this.
- Some directives still read certain inputs once at init; making them fully reactive is a roadmap
  item, not a bug to hotfix.
- **`SmoothScrollService` is a root singleton and the demo app calls `init()` in `App`.** Therefore
  `[moveSmoothScroll]` on any container is a silent no-op, and destroying that element tears down the
  global instance. The `/demos/smooth-scroll` page demonstrates the _service_ for this reason. Needs
  a dev-mode warning or a scoped-instance API before `moveSmoothScroll` leaves experimental.
- **`scroll demo maps container scroll onto the element transform` is intermittently flaky** on
  its first attempt (~1 run in 5); `retries: 1` plus the route warm-up keep the suite green. Three
  attempts to fix the cause made it worse and were reverted, so do not retry them blindly:
  resetting the container to `scrollTop = 0` scrolls the element out of view, which makes
  `moveScroll` detach its scroll listener so later synthetic events do nothing; scrolling by a
  small delta instead left the transform unchanged for a reason not yet identified. The demo does
  use `moveScrollContainer`, so the listener is on the container, not the window.
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
