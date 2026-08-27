# Spec 010 — Demo site decomposition, UI lib bump, drag-demo fix, test coverage

- **Status:** done (phases A/B/C/E complete; phase D shipped its 3 highest-value extractions —
  `InfoCard`, the `CodeBlock` copy button, and the `animate.page.ts` → `DemoContainer` rework were
  scoped in but deferred as lower-value/higher-risk relative to what shipped — see Follow-ups)
- **Created:** 2026-08-27
- **Last updated:** 2026-08-27
- **Breaks public API:** no (demo site only — `projects/movement` public API is untouched)
- **Related:** owner request to audit/harden the site now that the library is at its 1.0 API freeze
  (spec 009). Not on the "road to 1.0" roadmap in STATE.md — this is site-only maintenance.

## Problem / motivation

The demo/docs site (`src/app/`) grew organically alongside the library and has four separate rough
edges the owner flagged directly:

1. Several page components are large, monolithic single files that re-implement UI blocks (page
   headers, prev/next footers, API tables, range-slider controls, code panels) that already appear
   near-identically in multiple other files, instead of being extracted into small reusable
   standalone components.
2. `@voltui/components` (pinned `^0.2.0`, latest `1.0.1`) and `lumen-icons` (pinned `^0.1.0`, latest
   `0.2.0`) are outdated. Both are used in exactly one file (`templates.page.ts`).
3. The `/demos/drag` demo lets a visitor drag the free-axis card almost entirely out of the visible
   preview pane (no bounds by default) with no way to bring it back — `[showReplay]="false"` hides
   the reset button this demo would otherwise have. Confirmed live via Playwright.
4. `src/app/` has zero unit tests (`find src/app -name "*.spec.ts"` → 0 files) and 8 of 22 demo
   routes have only a generic smoke e2e test (no interaction assertion): `animate`, `enter`, `hover`,
   `icons`, `loop`, `tap`, `target`, `text`.

Additionally the Docs sidebar (`src/app/pages/docs.page.ts`) mixes 6 links that point straight at
`/demos/*` routes into the docs nav, which contradicts the site's own docs/demos split (Docs should
explain; Demos should let you play).

## Proposed solution

Five independent, ordered phases (each individually shippable/revertable):

**A — Docs nav cleanup.** Remove the 6 `/demos/*` links from `docs.page.ts`'s sidebar (Basic Motion,
Variants, Layout, SVG Icons, Drag, Scroll). They stay reachable from `/demos` as today. No new docs
content is written for these topics (owner's explicit choice) — Docs keeps only genuine doc pages.

**B — UI lib bump + `templates.page.ts` decomposition.** Bump `@voltui/components` to `1.0.1` and
`lumen-icons` to `0.2.0`. Verified via that library's own `MIGRATION.md`: only 3 breaking renames
exist between 0.x and 1.0 (`volt-navigation-menu-link`, `(resizing)`, `(dragOver)`), none used here.
Then split `templates.page.ts` (410 lines) into the page shell + extracted `TemplateHero`,
`TemplateFeatureGrid`, `TemplateSteps`, `TemplateCta` components (or similar breakdown — exact seams
decided during implementation), each standalone, OnPush, reusable.

**C — Fix the drag demo.** `drag.page.ts` gets the same reset mechanism every other replay-capable
demo already uses (`enter.page.ts` is the reference: an `@if`-gated `showDemo` signal toggled off/on
via `setTimeout`, wired to `(replay)`). Enable the replay button (drop `[showReplay]="false"`) and
call `replay()` from `onStateChange()` too, so flipping any control (axis/constrain/momentum/snap)
also returns the card to its origin instead of leaving it wherever it was last dragged.
Library-level default drag bounds are explicitly **out of scope** here (see Follow-ups).

**D — Shared-component extraction.** Based on a codebase pass (see Implementation plan), extract:
`PageHeader`, `DocsFooterNav`, `ApiStabilityTable` (also fixes a real content drift between the two
existing copies), `InfoCard`, `RangeSlider`, and add an optional copy-button to the existing
`CodeBlock`. Refactor `demos/animate.page.ts` to consume `DemoContainer`'s existing
`customControls` (range type) instead of hand-building its own controls panel + code panel.

**E — Test coverage.** Add `@testing-library/angular` + `@testing-library/dom` as devDependencies,
scoped to `src/app/**` only (the library keeps its mandatory `TestBed` + `vi` pattern per
BEST-PRACTICES.md — untouched). Wire a `test` architect target for the `angular-movement` project in
`angular.json` (mirrors the existing `movement` project's `@angular/build:unit-test` +
`tsconfig.spec.json`, which already exists but is unused). Add unit tests for every component
extracted in phase D. Add missing Playwright interaction assertions for the 8 under-tested routes
plus a positive (non-reduced-motion) assertion for `parallax`.

## Out of scope

- Any change to `projects/movement` (the library itself), including `MoveDragDirective` gaining
  default bounds/clamping — noted as a Follow-up, needs its own spec (touches public directive
  behavior).
- Writing net-new documentation content for the 6 topics removed from the Docs sidebar.
- Decomposing every page in the site — only the files identified in the Implementation plan.
- Visual/design changes (colors, layout, Tailwind theme) — this is a structural/code-health pass.
- Changing the flaky-under-parallel-load e2e tests already tracked in STATE.md's "Next up" #2 — out
  of scope for this spec (separate, already-known issue).

## Acceptance criteria

- [x] Docs sidebar (`docs.page.ts`) contains only links to routes under `/docs/*`.
- [x] `@voltui/components@1.0.1` and `lumen-icons@0.2.0` installed; `templates.page.ts` renders
      identically (manually verified in-browser) and is decomposed into ≥3 extracted components.
- [x] `/demos/drag`: dragging the free-axis card and clicking Replay returns it to origin; changing
      any control also resets its position. Verified live via Playwright.
- [x] `PageHeader`, `DocsFooterNav`, `ApiStabilityTable`, `RangeSlider` exist as standalone
      components under `src/app/shared/components/` and are used by ≥2 call sites each.
      `InfoCard` deferred — see Follow-ups.
- [ ] `CodeBlock` copy-button — deferred, see Follow-ups.
- [x] `ng test angular-movement` (`pnpm test:site`) runs and passes (5 files, 11 tests), covering
      every component extracted in phase D that shipped.
- [x] The 8 previously-smoke-only e2e routes each get a real interaction assertion in
      `e2e/demos.spec.ts`; `parallax` gets a positive functional assertion. Full suite: 46 passed.
- [x] `pnpm test:coverage` (491 tests), `ng lint`, `pnpm build`, `pnpm format` all pass.
- [x] `docs/ai/STATE.md` updated. CHANGELOG.md intentionally **not** touched — it documents the
      published `projects/movement` package only, and this spec is entirely demo-site-only (no
      change to what gets published).

## Implementation plan

- [x] 1. `src/app/pages/docs.page.ts` — remove the 6 `/demos/*` sidebar links (phase A).
- [x] 2. `package.json` — bump `@voltui/components` to `^1.0.1`, `lumen-icons` to `^0.2.0`; `pnpm install`.
- [x] 3. `src/app/pages/templates.page.ts` — extracted `TemplateHero` (+ nested
     `TemplateLivePreview`), `TemplateFeatureGrid`, `TemplateSteps`, `TemplateCta` under
     `src/app/pages/templates/sections/**` (mirrors the existing `home/sections/` pattern). Page
     shell is now 19 lines composing the four sections.
- [x] 4. `src/app/pages/demos/drag.page.ts` — added `showDemo` signal + `@if`, dropped
     `[showReplay]="false"`, wired `(replay)="replay()"`, calls `replay()` from `onStateChange()`.
     Verified live via Playwright: drag-out-of-bounds + Replay returns the card to the exact
     origin coordinates; changing any control also resets it.
- [x] 5a. `src/app/shared/components/page-header/`, `docs-footer-nav/`,
      `api-stability-table/` added; wired into `docs/api.page.ts`, `docs/reference.page.ts`,
      `docs/presets.page.ts`, `docs/get-started.page.ts`, `docs/introduction.page.ts`. Also fixed
      the real content drift: `reference.page.ts`'s stability table still listed
      `[moveAnimation]`/`moveVariants`/`moveScroll`/`moveParallax`/`moveValue`/`moveTransform`/
      `moveSpringValue` as "Stable candidate" — stale from before spec 009 promoted all of them to
      Stable. Both pages now render the identical, current table. Verified all 5 docs routes load
      with 0 console errors and identical visual output.
- [x] 5b. `RangeSlider` added under `src/app/shared/components/range-slider/`. Wired into
      `demo-container.ts` (duration/delay sliders) and `demos/animate.page.ts` (8 sliders: opacity,
      y, x, scale, rotate, blur, duration, delay), replacing ~190 hand-rolled lines with the shared
      component. Caught and fixed a real duplicate-DOM-id bug of our own making along the way: an
      `id` component input doubles as a literal DOM attribute on the host element, colliding with
      the inner `<input>`'s id — renamed the input to `controlId`. Verified live: dragging the
      Scale slider to 1.5 updates both the preview and the generated code output correctly, and
      `demos/enter` (uses `DemoContainer`'s shared duration/delay sliders) still renders with 0
      console errors.
- [ ] 5c. `InfoCard` — deferred (lower value: three separate small `@for` blocks, mostly styling
      repetition, not a functional risk). Left for a future pass.
- [ ] 6. `src/app/shared/components/code-block/code-block.ts` — optional `showCopy` input.
     Deferred alongside 5c/7 for the same reason — the bigger, higher-value wins (dependency bump,
     drag fix, docs cleanup, RangeSlider, test infra) are prioritized first in this pass.
- [ ] 7. `src/app/pages/demos/animate.page.ts` — rework to use `DemoContainer`'s `customControls`
     instead of a hand-built panel is a bigger architectural change with more risk than the
     RangeSlider extraction alone delivered; deferred as a follow-up rather than bundled in here.
- [x] 8. `angular.json` — added `test` architect target to the `angular-movement` project
     (`@angular/build:unit-test`, `tsConfig: tsconfig.spec.json`, which already existed unused).
     `package.json` — added `test:site` script.
- [ ] 9. Add `@testing-library/angular`, `@testing-library/dom` as devDependencies.
- [ ] 10. Add `.spec.ts` next to every component from steps 3, 5, 6.
- [ ] 11. `e2e/demos.spec.ts` — add interaction assertions for `animate`, `enter`, `hover`, `icons`,
      `loop`, `tap`, `target`, `text`; add a positive assertion for `parallax`.

## Verification notes

- `pnpm test:coverage` (library): 40 files, 491 tests, all passed.
- `pnpm test:site` (new demo-site target): 5 files, 11 tests, all passed.
- `ng lint`: both projects clean.
- `pnpm build`: full production build + prerender succeeded.
- `pnpm format`: clean (7 files reformatted by the run itself, no manual changes needed after).
- `pnpm exec playwright test e2e/demos.spec.ts`: 46 passed. 3 tests flagged "flaky" (failed once,
  passed on Playwright's built-in retry) — all 3 are the pre-existing parallel-load-only flakiness
  class already tracked in STATE.md's gotchas/"Next up" #2 (verified `animate`/`enter` are 6/6
  solid under `--workers=1 --repeat-each=3`).
- Manually verified live via Playwright MCP (not just automated tests): `/templates` (visual parity
  before/after decomposition, 0 console errors except the pre-existing upstream `lumen-icons` one),
  all 5 `/docs/*` pages (0 console errors, sidebar has no demo links), `/demos/drag` (drag-out then
  Replay returns to exact origin coordinates; confirmed via `getBoundingClientRect()` before/after),
  `/demos/animate` (Scale slider → 1.5 updates both preview and generated code).
- Confirmed the `@voltui/components`/`lumen-icons` bump is safe: read that library's own
  `MIGRATION.md` — only 3 breaking renames between 0.x and 1.0, none used in this repo.

## Follow-ups (out of scope, noted for later)

- `MoveDragDirective` (library) has no default bounds for free-axis drag — worth a spec on whether
  it should clamp to the nearest positioned/overflow-hidden ancestor by default, since every future
  consumer hits the same "dragged out of view" issue this demo had.
- `demo-container.ts` (543 lines) could itself be split further (`PresetSelect`,
  `EasingButtonGroup`) once `RangeSlider` lands — deferred to keep this spec's diff reviewable.
- Write real Docs content for the 6 topics removed from the sidebar, if the owner later wants Docs
  to cover them narratively instead of only as interactive demos.
- **Upstream `lumen-icons` SSR/hydration bug (pre-existing, not introduced by this spec's bump):**
  any `<lmn-*>` icon nested as projected content inside a `@voltui/components` component that has
  a `move*` directive on an ancestor (confirmed on `<lmn-sparkles>` inside `volt-badge` and
  `<lmn-arrow-right slot="trailing">` inside `volt-button`, both in `templates/sections/hero/`)
  throws `NG0500` during hydration ("expected `<svg>` but found a comment node"). Reproduced
  identically at both `lumen-icons@0.1.0` and `0.2.0` — confirmed NOT a regression from this spec's
  bump. `ngSkipHydration` on the icon's own host tag did **not** suppress it. Purely a console
  error today (the icon still renders correctly post-hydration-recovery, no visual break) — but
  worth a proper fix in the `lumen-icons` package itself (root cause likely in `LmnIconBase` or how
  its `@if(variant() === 'filled')` branch interacts with being projected into another component's
  content). Icons used standalone (not projected into a Volt component) did not reproduce this.
