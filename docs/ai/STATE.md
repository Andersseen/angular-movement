# STATE — Current Project Status

> **Living document.** Whoever finishes a task MUST update this file (see "How to update" at the bottom).
> Paste-friendly: this file is designed to be loaded at the start of every AI session.

**Last updated:** 2026-08-04
**Library version:** `0.6.0` (release prepared on `fix/v1-foundation-hardening`, ready to publish via `v0.6.0` tag)
**Angular peer range:** `^21.2.0` (`@angular/core`, `@angular/common`)
**Branch state:** `fix/v1-foundation-hardening` — docs, demos, tests, e2e, and 0.6.0 release artifacts prepared. Awaiting push and PR to trigger CI publish.
**Roadmap phase:** 0.6 "API hardening" release is staged (see `ROADMAP.md`)

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

- **Spec 001 — Base Hardening** (`docs/ai/specs/001-base-hardening.md`) is done enough for 0.6.0:
  - Done: docs/demo selector/input audit; `moveAnimation` and `moveWhileFocus` demos; `MoveAnimationDirective`
    test hardening; e2e expansion; API stability & input-reactivity docs; parallax demo migration to
    `[moveParallax]`; numeric/boolean input coercion verified and bug-fixed. `test:coverage`, `ng lint`,
    `pnpm build`, `pnpm build:prod`, `pnpm pack:check`, and `pnpm e2e` are green.
  - Release `0.6.0` is staged: `projects/movement/package.json` bumped, `CHANGELOG.md` rolled, commit
    `chore(release): v0.6.0` and tag `v0.6.0` created.
  - Remaining from the original spec (post-0.6.0): `moveDrag`/`moveLayout` transform double-counting fixes
    (needs dedicated spec).

## Next up (priority order)

**Detailed backlog lives in [PLAN-0.6.md](PLAN-0.6.md)** (created 2026-07-06) — work it top-down. Summary:

1. Test hardening: reduced-motion, interrupted-animation, SSR-guard tests (WS-1.x).
2. Dynamic input behavior for the 8 init-only directives — needs spec + user sign-off (WS-2.1).
3. Transform composition fix for `moveLayout`/`moveDrag`/keyframes — needs spec (WS-3.1).
4. Demo gaps: `moveAnimation`, `moveWhileFocus`, smooth scroll, signals helpers; e2e expansion (WS-4.x).
5. Release `0.6.0` + Cloudflare deploy (WS-5.x).

## Known gotchas / open issues (do not "fix" these blindly — they are known)

- `moveLeave` on its own cannot animate elements removed by `@if` — removal happens before the
  directive can run. Correct usage pairs it with `*movePresence`. Demo pages already reflect this.
- Some directives still read certain inputs once at init; making them fully reactive is a roadmap
  item, not a bug to hotfix.

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
