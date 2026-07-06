# PLAN — Ship `angular-movement` 0.6.0 + Demo Site Refresh

- **Status:** approved backlog — not started
- **Created:** 2026-07-06 (evidence-based audit of the codebase at commit `926a20c`)
- **Target:** minor release `0.6.0` (npm) + updated demo site deploy
- **How to use this file:** work top-down by phase. Before starting any WS-item, create a spec in
  `docs/ai/specs/` (per `SDD-WORKFLOW.md`), link it in the tracking table below, and tick items as
  they land. Update `STATE.md` after each finished item. This file outlives any single session.

## Why these items (audit evidence, verified 2026-07-06)

1. **8 directives are init-only** (use `ngOnInit`/`afterNextRender` with no `effect()` on inputs):
   `move-animate`, `move-animation`, `move-enter`, `move-leave`, `move-in-view`, `move-loop`,
   `move-text`, `move-smooth-scroll`. Changing their inputs after init silently does nothing.
   Roadmap 0.6 explicitly calls this out ("clarify dynamic input behavior").
2. **Reduced-motion is under-tested**: only `move-target.directive.spec.ts` and
   `move-animation.utils.spec.ts` reference it. All other directives rely on untested plumbing.
3. **Transform composition is the known weak point** (roadmap 0.6): `moveLayout`, `moveDrag`, and
   keyframe animations can fight over inline `transform` styles.
4. **Demo site has gaps** — directives/APIs with docs mentions but NO live demo page:
   - `[moveAnimation]` (the Framer-style flagship API) — no demo
   - `[moveWhileFocus]` — no demo
   - `[moveSmoothScroll]` + `SmoothScrollService` — no demo
   - Signals helpers `moveValue` / `moveTransform` / `moveSpringValue` (headline 0.5.0 feature) — no demo
5. **e2e is thin**: `e2e/demos.spec.ts` only visits `/demos/layout` and `/demos/leave`. Roadmap 0.7
   wants drag/scroll/presence/variants coverage — pulling part of that forward de-risks 0.6.
6. **CHANGELOG "Unreleased" already has content** (community files, CI changes) waiting for a release vehicle.
7. **Peer range is `^21.2.0`** — before releasing, check the current Angular stable and decide
   whether to widen peers (needs verification against the actual Angular release calendar; do NOT
   assume — run `pnpm outdated` and check angular.dev).

---

## Phase 1 — Test hardening (do first: everything else builds on trust in the suite)

**WS-1.1 — Reduced-motion test coverage** · P0 · size M
Add reduced-motion cases to the specs of every animation-playing directive (mock
`matchMedia`/`prefersReducedMotion`). Assert: animation is skipped or replaced per
`resolveMovementConfig` rules, final styles still applied.
_Files:_ `projects/movement/src/lib/directives/*.spec.ts`
_Done when:_ every directive that calls `AnimationEngine.play()` has ≥1 reduced-motion test; `pnpm test:coverage` passes.

**WS-1.2 — Interrupted-animation tests** · P0 · size S
Tests for rapid re-trigger (hover in/out fast, tap spam, in-view flicker): previous player is
cancelled, no orphan animations, `ngOnDestroy` cancels running players.
_Files:_ specs for `move-hover`, `move-tap`, `move-in-view`, `move-loop`, `move-drag`.
_Done when:_ cancel-before-replay and destroy-cancel asserted for those five.

**WS-1.3 — SSR-guard tests** · P1 · size S
Simulate server platform (`PLATFORM_ID = 'server'`) for `AnimationEngine`, `MoveInViewDirective`
(IntersectionObserver), `MoveScrollDirective`, `MoveParallaxDirective`, `SmoothScrollService`.
Assert: no browser API touched, no errors thrown.
_Done when:_ the five files above have server-platform tests.

## Phase 2 — Dynamic input behavior (core 0.6 API-hardening item)

**WS-2.1 — Decide + document per-directive input reactivity** · P0 · size M · **needs a spec + user sign-off**
For each of the 8 init-only directives decide: (a) make inputs reactive via `effect()`, or
(b) keep init-only and document it. Recommendation: make reactive where cheap and semantically
obvious (`move-animate`, `move-animation`, `move-loop`, `move-in-view` options); keep init-only
where re-init is destructive (`move-text` splitting, `move-smooth-scroll`) and document.
_Files:_ the 8 directives + their specs; document the verdict in `docs/ai/ARCHITECTURE.md` and the docs site reference page.
_Done when:_ every directive's reactivity is either implemented+tested or explicitly documented; no silent no-ops remain.

**WS-2.2 — Stable vs experimental API classification** · P1 · size S
Tag every export in `lib/movement.ts` as stable or experimental (JSDoc `@experimental` +
a table in README and docs site). Candidates for experimental: `moveLayout`, `moveDrag` snap
points, `moveTrigger`/`moveTarget`, smooth scroll.
_Done when:_ README + docs reference page show the classification; JSDoc added.

## Phase 3 — Transform composition (highest-risk item; isolate it)

**WS-3.1 — Compose transforms instead of overwrite** · P0 · size L · **needs its own spec**
`moveLayout`, `moveDrag`, and keyframe players must not clobber each other's inline `transform`.
Approach to evaluate in the spec: single per-element transform registry in
`engines/transition-composer.ts` / `keyframe-composer.ts` (each source owns named channels:
translate/scale/rotate), or CSS `translate`/`scale`/`rotate` independent properties.
_Files:_ `engines/keyframe-composer.ts`, `engines/transition-composer.ts`, `move-layout.directive.ts`, `move-drag.directive.ts` + specs.
_Done when:_ a demo combining drag + layout + hover keyframes on one element behaves correctly;
regression tests cover the combination; no public API change (or spec'd if unavoidable).

## Phase 4 — Demo site completion (parallelizable with Phase 3)

**WS-4.1 — `moveAnimation` demo page** · P0 · size S
The flagship Framer-style API has no live demo. Add `src/app/pages/demos/animation/` +
nav entry in `demos.page.ts` (Basic Animations group). Show `{ initial, animate, exit }` with
`*movePresence`, and the both-keys rule.
**WS-4.2 — `moveWhileFocus` demo** · P1 · size S — form-field focus ring/scale example; nav under Interaction.
**WS-4.3 — Smooth scroll demo** · P1 · size S — `moveSmoothScroll` container + `SmoothScrollService`; nav under Scroll Effects.
**WS-4.4 — Signals helpers demo** · P1 · size M — `moveValue`/`moveTransform`/`moveSpringValue`
interactive playground (e.g. spring-follow cursor card); these were the 0.5.0 headline and are invisible today.
_Done when (4.x):_ each page follows the existing demo pattern (`DemoContainer` + `CodeBlock`),
appears in nav, renders under SSR, and has an e2e smoke test.

**WS-4.5 — e2e expansion** · P1 · size M
Extend `e2e/demos.spec.ts`: visit **every** route in `DEMO_GROUPS` (loop over the nav config),
assert no console errors + key element visible. Add interaction tests for drag (pointer),
presence (toggle + exit completes), scroll (progress changes on scroll).
_Done when:_ every demo route is smoke-tested; 3 interaction tests added; `pnpm e2e` green.

## Phase 5 — Release 0.6.0 + deploy

**WS-5.1 — Dependency & peer audit** · P0 · size S
`pnpm outdated`; decide Angular peer range (widen only if a new major is actually stable — verify,
don't assume). Patch-bump devDeps that are safe. No new runtime deps (rule).
**WS-5.2 — Release execution** · P0 · size S
Follow `RELEASE_CHECKLIST.md`: move CHANGELOG Unreleased → `[0.6.0]` with all shipped items;
bump `projects/movement/package.json` to `0.6.0`; `pnpm test:coverage` → `ng lint` →
`ng build movement` → `pnpm pack:check` → `pnpm lib:publish`; tag + GitHub release.
**WS-5.3 — Demo deploy + STATE refresh** · P0 · size XS
`pnpm deploy` (Cloudflare Pages); update `docs/ai/STATE.md` (version, done list, drop stale
gotchas fixed by WS-2.1/WS-3.1) and `ROADMAP.md` (mark 0.6 done).

---

## Suggested execution order & tracking

| #   | Item                               | Priority | Spec     | Status |
| --- | ---------------------------------- | -------- | -------- | ------ |
| 1   | WS-1.1 Reduced-motion tests        | P0       | —        | ☐      |
| 2   | WS-1.2 Interrupted-animation tests | P0       | —        | ☐      |
| 3   | WS-4.1 `moveAnimation` demo        | P0       | —        | ☐      |
| 4   | WS-2.1 Dynamic input behavior      | P0       | required | ☐      |
| 5   | WS-1.3 SSR-guard tests             | P1       | —        | ☐      |
| 6   | WS-3.1 Transform composition       | P0       | required | ☐      |
| 7   | WS-4.2/4.3/4.4 Remaining demos     | P1       | —        | ☐      |
| 8   | WS-4.5 e2e expansion               | P1       | —        | ☐      |
| 9   | WS-2.2 Stable/experimental tags    | P1       | —        | ☐      |
| 10  | WS-5.1→5.3 Release + deploy        | P0       | —        | ☐      |

**Sizing note:** S ≈ one focused session, M ≈ 1–2 sessions, L ≈ needs its own spec + multiple sessions.
**Minimum viable 0.6.0** if time is short: items 1, 2, 3, 4, 10 (skip WS-3.1 → move it to 0.6.1 and
say so in CHANGELOG under Known limitations).
