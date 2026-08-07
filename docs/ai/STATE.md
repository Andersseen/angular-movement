# STATE — Current Project Status

> **Living document.** Whoever finishes a task MUST update this file (see "How to update" at the bottom).
> Paste-friendly: this file is designed to be loaded at the start of every AI session.

**Last updated:** 2026-08-07
**Library version:** `0.6.0` — **published to npm** (`latest`) on 2026-08-07 via the `v0.6.0` tag; GitHub Release created.
**Angular peer range:** `^21.2.0` (`@angular/core`, `@angular/common`)
**Branch state:** `chore/0.7-hardening` — spec 002 complete (see below). Full gate green; not yet merged or released.
**Roadmap phase:** 0.6 shipped; now in 0.7 "Real app validation" (see `ROADMAP.md`)

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

## In progress / recently merged (CHANGELOG "Unreleased")

- **Spec 001 — Base Hardening** is fully closed. Its last open item (`moveLayout` transform
  double-counting) was fixed in spec 002.
- **Spec 002 — 0.7 Hardening** (`docs/ai/specs/002-07-hardening.md`) — **done** on `chore/0.7-hardening`:
  - `moveLayout` FLIP now measures in untransformed layout space (the double-counting fix).
  - Coverage: `MoveScrollDirective` 66.7% → 87.8%, `SmoothScrollService` 66.7% → 96.5%.
    Suite is 261 tests / 89.69% stmts / 82.26% branch.
  - New demos: `/demos/smooth-scroll` and `/demos/values` (signal helpers), both with e2e.
  - `@stability` JSDoc on every public declaration; `moveText`/`moveLoop` classified as candidates.
  - `pnpm docs:check` guard wired into CI — it found and fixed 8 pre-existing doc errors.
  - Gate green: tests, lint, build, e2e (33), pack:check, docs:check, no API-surface diff vs `main`.

## Next up (priority order)

1. Merge `chore/0.7-hardening` into `main`, then Cloudflare deploy.
2. Dynamic input behavior for the 9 init-only directives — needs spec + user sign-off. This is the
   main blocker for freezing the API at 1.0.
3. Validate the library in ≥2 non-demo Angular apps (ROADMAP 0.7's headline item, still untouched).
4. Remaining test hardening from [PLAN-0.6.md](PLAN-0.6.md): reduced-motion and interrupted-animation
   coverage across the directives that still lack it (WS-1.1 / WS-1.2).
5. Decide the Angular peer-range policy for 1.0.

## Known gotchas / open issues (do not "fix" these blindly — they are known)

- `moveLeave` on its own cannot animate elements removed by `@if` — removal happens before the
  directive can run. Correct usage pairs it with `*movePresence`. Demo pages already reflect this.
- Some directives still read certain inputs once at init; making them fully reactive is a roadmap
  item, not a bug to hotfix.
- **`SmoothScrollService` is a root singleton and the demo app calls `init()` in `App`.** Therefore
  `[moveSmoothScroll]` on any container is a silent no-op, and destroying that element tears down the
  global instance. The `/demos/smooth-scroll` page demonstrates the _service_ for this reason. Needs
  a dev-mode warning or a scoped-instance API before `moveSmoothScroll` leaves experimental.
- `docs:check` runs in CI: renaming any selector or input now fails the build until
  `src/app/shared/api/directive-reference.ts` is updated in the same commit. That is intentional.

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
