# STATE — Current Project Status

> **Living document.** Whoever finishes a task MUST update this file (see "How to update" at the bottom).
> Paste-friendly: this file is designed to be loaded at the start of every AI session.

**Last updated:** 2026-08-28
**Library version:** `1.0.0` published to npm and tagged (`chore(release): v1.0.0`, 2026-08-27).
Spec 013 (post-1.0 hardening) is implemented on this branch, not yet released.
**Angular peer range:** `^21.2.0 || ^22.0.0` (`@angular/core`, `@angular/common`)
**Branch state:** `main` includes the v1.0.0 release commit. Site work (spec 010) is on
`chore/010-site-decomposition-and-hardening`, rebased on top of it.
**Roadmap phase:** **1.0.0 is out.** Spec 009 made the API-freeze decisions (see
`docs/ai/specs/009-10-api-freeze-decision.md`); the release commit itself was made directly (not
through a spec) and briefly existed only as a tag, disconnected from `main` — fast-forwarded `main`
to include it. If future sessions see the nav badge or `projects/movement/package.json` disagree
with the latest git tag, check for the same kind of orphaned release commit before assuming the
version is just stale.

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

## Done — Spec 008 (0.9 API convergence / hardening) — released as 0.9.0

Public API audit (2 accidental exports removed), `moveSpringValue` DX + reduced-motion fix, 3
`disabled: false` hardcode bugs fixed, `MoveTextDirective` teardown race fixed, `SmoothScrollService`
dev warning, docs resync. Full detail in `docs/ai/specs/008-09-api-convergence-hardening.md` and
`CHANGELOG.md`.

## Done — Spec 009 (1.0 API freeze decision, implemented, not yet released)

See `docs/ai/specs/009-10-api-freeze-decision.md` for the full audit and decision table. Decisions
only — no feature work, no redesign:

- Every 0.9 stable-candidate promoted to stable (`[moveAnimation]`, `*movePresenceFor`,
  `moveVariants`, `moveText`, `moveLoop`, `MoveAnimator`, `moveValue`, `moveTransform`,
  `moveSpringValue`), plus 5 icon-helper presets found via the same source audit. "Stable
  candidate" is now empty in the taxonomy (kept for future new APIs).
- `MoveVariantsDirective` gained the `@stability` tag it was missing; `moveActiveVariant` is now
  `@deprecated` (permanent alias, not removed).
- Experimental-vs-`1.x`-SemVer policy decided explicitly (Option A: no secondary
  `angular-movement/experimental` entry point; experimental exports may break in any `1.x` minor,
  documented in both READMEs and ARCHITECTURE.md).
- New CI guard: `pnpm run api:check` diffs the ng-packagr type rollup against a committed snapshot
  (`projects/movement/api-report.txt`) — catches accidental barrel changes in review. Wired into
  **both** `ci.yml` and `release.yml` (a tag can point at a commit that never went through PR CI).
- `validation/consumer` extended to type-check every newly-stable API against the shipped `.d.ts`:
  `moveTransform`'s string/unit overload, the icon helpers, `MOVE_PRESETS`, `MoveTransitionConfig`,
  the repeat inputs, `moveSpringValue`'s auto-inferred injector, and the option/config types as
  nameable types. It previously covered none of these.
- 5 new adversarial-state-transition tests added (destroyed `moveSpringValue` owner, nested
  variant inheritance, rapid variant A→B→C, nested `*movePresenceFor` teardown, repeated
  `moveLoop` cancellation, `MoveAnimationDirective.cancelLeave()`) — none surfaced a real bug.
- Full verification gate green: 491 unit tests, lint, build, format, `docs:check`, `pack:check`,
  `api:check` (manually confirmed it fails on a deliberate drift, then passes clean),
  `validate:consumer` (Angular 21 + 22), e2e 47/47.

## Done — Spec 010 (demo site decomposition, UI lib bump, drag fix, test coverage)

Site-only maintenance pass, not on the library's road-to-1.0 track — see
`docs/ai/specs/010-site-decomposition-and-hardening.md`.

- Docs sidebar (`docs.page.ts`) no longer links straight to `/demos/*` — it only contains genuine
  doc pages; those 6 topics stay reachable from `/demos`.
- `@voltui/components` → `1.0.1`, `lumen-icons` → `0.2.0` (only consumer: `templates.page.ts`).
  `templates.page.ts` (410 lines) decomposed into `templates/sections/{hero,feature-grid,steps,cta}`
  - a nested `TemplateLivePreview`, mirroring the existing `home/sections/` pattern.
- Fixed a real bug: `/demos/drag`'s free-axis card could be dragged almost fully out of its preview
  pane with no way back (`[showReplay]="false"` hid the reset button). Now uses the same
  `showDemo` `@if`-toggle replay pattern as every other demo, and also resets on any control change.
- New shared components (`src/app/shared/components/`): `PageHeader`, `DocsFooterNav`,
  `ApiStabilityTable`, `RangeSlider` — each with a `.spec.ts`. Fixed a real content-drift bug while
  extracting `ApiStabilityTable`: `docs/reference.page.ts` still listed several 1.0-promoted APIs
  (`[moveAnimation]`, `moveVariants`, `moveScroll`, `moveParallax`, `moveValue`, `moveTransform`,
  `moveSpringValue`) as "Stable candidate" — stale since spec 009. Both docs pages now render the
  identical, current table.
- `InfoCard`, `CodeBlock` copy-button, and reworking `demos/animate.page.ts` onto `DemoContainer`'s
  `customControls` were scoped in but deferred (lower value / higher risk relative to what shipped)
  — noted as Follow-ups in the spec.
- **Demo site testing infra now exists** (previously zero unit tests under `src/app/`):
  `angular.json` gained a `test` target for the `angular-movement` project (`pnpm test:site`),
  using the `tsconfig.spec.json` that existed unused since scaffolding. `@testing-library/angular` +
  `@testing-library/dom` added as devDependencies, **scoped to `src/app/**`only** — the library
keeps its mandatory`TestBed`+`vi` pattern (BEST-PRACTICES.md) untouched.
- e2e: added real interaction assertions for the 8 routes that only had a smoke test (`animate`,
  `enter`, `hover`, `icons`, `loop`, `tap`, `target`, `text`) plus a positive (non-reduced-motion)
  assertion for `parallax`. Full suite green (46 passed + the pre-existing flaky-under-parallel-load
  category, unchanged in kind — see gotchas below).

## Done — Spec 011 (light/dark theme, vertex-editor-lite, release sync)

Site-only, same session as spec 010 — see `docs/ai/specs/011-theme-and-code-editor.md`.

- **`main` was behind its own `v1.0.0` tag** (release commit existed only as a pushed tag, never
  merged) — fast-forwarded. Nav badge now correctly reads `v1.0.0`; npm already had it published.
- **Light + dark themes**: `ThemeService` (`src/app/shared/theme.service.ts`), `data-theme` on
  `<html>`, blocking inline script in `index.html` resolves it before first paint (no FOUC, no
  hydration mismatch — it never touches anything Angular hydrates). Dark is still the bare `:root`
  default; light is a new `:root[data-theme='light']` block, same hue angles as dark. Toggle in
  the navbar (lumen-icons sun/moon).
- **`vertex-editor-lite`** (https://github.com/Andersseen/vertex, downloaded straight from the
  GitHub Release into `public/`, loaded via a plain `<script defer>`) replaced every demo's
  hand-highlighted "HTML Output" panel — `DemoContainer` (18 routes) plus the two demos with their
  own separate panel (`animate`, `animation`). Docs prose code blocks (`CodeBlock`) were left alone
  — owner's explicit scope choice; noted as a Follow-up.
- Full verification green: 491 + 11 unit tests, lint, build, format, e2e 47/47 (only the two
  pre-existing parallel-load-flaky tests flagged, confirmed still solid single-worker).

## Done — Spec 013 (post-1.0 hardening pass)

See `docs/ai/specs/013-post-1.0-hardening.md` for the full audit. Not a feature milestone — real
bugs found and fixed, one architectural decision reaffirmed, one additive API split, new
cross-browser and composition e2e coverage.

- Two real bugs fixed: `MoveDragDirective` now preempts any in-flight engine-driven animation on
  `pointerdown` (via new internal `engines/active-player-registry.ts`) instead of racing it, and
  `SmoothScrollService` no longer fights native keyboard scrolling (it now resyncs on a foreign
  `scrollTop` change instead of snapping back toward a stale target).
  `MoveHoverDirective`/`MoveTapDirective`/`MoveFocusDirective` also now cancel their own player
  once a `*movePresence` exit begins, instead of potentially racing the real leave animation.
- `moveTransform()`'s interpolation is now an explicit, ordered list of strategies
  (`VALUE_INTERPOLATORS` in `move-values.ts`) and warns (dev-mode, once per distinct pair) when it
  falls back to a discrete midpoint switch for mismatched units/colors/transform-functions, instead
  of silently snapping. Public signature unchanged.
- `MOVEMENT_STABLE_DIRECTIVES` / `MOVEMENT_EXPERIMENTAL_DIRECTIVES` — new, additive aggregates.
  `MOVEMENT_DIRECTIVES` is now defined as their concatenation (same 21 members); its JSDoc now
  says explicitly that it includes experimental directives.
- Motion Values (`moveSpringValue`) benchmarked at 1/10/50/100 concurrent springs — one
  independent RAF loop per call is acceptable (linear registration growth, no leaks); no shared
  scheduler introduced.
- Secondary `angular-movement/experimental` entry point: re-audited, spec 009's decision
  reaffirmed (still no dependency stable consumers would need isolating from).
- New `e2e/cross-browser.spec.ts` (12 tests) runs on Chromium+Firefox+WebKit; new
  `e2e/composition.spec.ts` (7 tests, Chromium) covers adversarial multi-primitive scenarios.
  `motionState`/`settledMotionState` extracted from `demos.spec.ts` into `e2e/motion-state.ts`.
  `drag.page.ts` and `scroll.page.ts` gained minimal demo markup (hover/tap on the drag card;
  a moveTransform+moveSpringValue element chained off the scroll directive's own `progress`
  signal) so these compositions are actually exercisable, not just theoretical.
- Full verification gate green: 512 unit tests (up from 491), lint, build, format, `docs:check`,
  `api:check` (manually confirmed it fails on the deliberate export additions, then passes clean
  after regenerating the snapshot), `pack:check`, `build:prod`, `validate:consumer` (Angular 21 +
  22), e2e 101/101 across all three browsers (1 pre-existing, already-documented parallel-load
  flake retried clean — not introduced by this pass).

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
- **`pnpm e2e` piped through `tail` reports the wrong exit code.** `playwright test | tail -40`
  yields `tail`'s status, so a total webServer failure looks like a pass. Redirect to a file and
  echo `$?` instead. Related: `reuseExistingServer: true` means a **stale `vite` left running on
  the e2e port** gets reused — one that outlived a library change serves a cached module graph and
  answers HTTP 500, and the suite dies on a 120s readiness timeout that looks nothing like the real
  cause. Check `lsof -ti:5174` and `curl` the port before believing an e2e failure.
- **Never assert an absence with `expect.poll`.** `expect.poll(...).toBe(0)` on an animation count
  matches its first sample (before anything is created) and silently tests nothing. Wait a settle
  window, then assert once. Playwright's `reducedMotion` fixture does not reach `matchMedia` here;
  use `page.emulateMedia({ reducedMotion: 'reduce' })`.
- **A component `@Input`/`input()` literally named `id` (or another global HTML attribute name)
  still lands on the host element as a real DOM attribute**, even though Angular also reads it as
  the input's initial value — a static-text attribute binding on a component tag is still a real
  attribute in the rendered DOM. `RangeSlider` originally took `id`, which collided with its own
  inner `<input [id]>` and produced two elements sharing one id. Renamed to `controlId`. Same class
  of bug VoltUI's own changelog independently flagged and fixed. Avoid naming a component input
  after any standard HTML attribute (`id`, `class`, `style`, `title`, ...).
- **`MoveParallaxDirective`'s custom-container scroll only reliably engages from a real wheel
  gesture in tests** (`page.mouse.wheel(...)` over the container) — a synthetic
  `container.dispatchEvent(new Event('scroll'))` after setting `scrollTop` directly did not move
  the layers in the e2e run, even though it does in a manually-driven browser session. If a
  parallax/scroll e2e assertion mysteriously sees no movement, try a real wheel gesture before
  assuming the directive is broken.
- **A newly discovered, pre-existing `lumen-icons` bug (not caused by anything in this repo):**
  any `<lmn-*>` icon nested as projected content inside a `@voltui/components` component (confirmed
  on `<lmn-sparkles>` inside `volt-badge` and `<lmn-arrow-right slot="trailing">` inside
  `volt-button`, both in `templates/sections/hero/hero.ts`) throws `NG0500` during hydration.
  Reproduced identically at `lumen-icons@0.1.0` and `0.2.0`. `ngSkipHydration` on the icon's own
  host tag did not suppress it. Console-only today (the icon still renders correctly after
  hydration's recovery) — needs a real fix in the `lumen-icons` package itself, not here.
- **`public/web-editor-lite.min.js` is a manually-downloaded static asset, not an npm dependency** —
  fetched directly from the `vertex` repo's GitHub Release (its own installer script runs arbitrary
  piped code, which this environment correctly refuses to execute; `curl` to the named asset is the
  same result without that). No update mechanism exists yet — see spec 011 Follow-ups.
- The e2e tests known to flake under parallel load (STATE.md's "Next up" #2) grew from 4 to 6 with
  spec 010's new `animate` and `enter` demo tests — both are rock-solid single-worker
  (`--workers=1 --repeat-each=3`, 6/6) and only flake under the default parallel worker count, same
  as the 4 pre-existing ones. Not a new problem, just a bigger instance of the tracked one.
- **`projects/movement-mcp/` (spec 012) is a fully standalone pnpm package, deliberately not part
  of any workspace.** Its own `node_modules`/`pnpm-lock.yaml`, own `pnpm install`
  (`pnpm run mcp:install` from root). This is why `angular-movement`'s own `package.json` still has
  zero new dependencies — the MCP SDK lives only in that package. `ng lint` / `ng build` don't see
  it (not registered in `angular.json`); use `pnpm run mcp:build` / `mcp:test` / `mcp:pack:check`.
  Regenerate its embedded API data with `pnpm run mcp:snapshot` after any directive API change —
  it is not wired into `docs:check` yet (see Next up). Published independently via
  `.github/workflows/release-mcp.yml` on a `mcp-v*.*.*` tag (not `v*.*.*` — that's
  `angular-movement`'s own), reusing the same `NPM_TOKEN` secret; see `RELEASE_CHECKLIST.md`.
- **`pnpm --dir <path> publish` is broken in this repo's pnpm version (10.30.1)** — it mis-delegates
  to a raw `npm publish` and fails with `EUSAGE`, even though `pnpm --dir <path> pack` works fine.
  `mcp:publish` and `release-mcp.yml` both `cd` into `projects/movement-mcp` instead of using
  `--dir` for the `publish` step specifically. If a future script needs `pnpm publish` on a
  non-cwd package, use `cd`, not `--dir`.
- **`engines/active-player-registry.ts`'s preemption is deliberately one-directional.** It exists
  so `MoveDragDirective` can cancel an in-flight engine-driven animation on the same host at
  `pointerdown` — it does **not** make a new engine-driven animation cancel a previous one on the
  same element (e.g. a variant change does not cancel a running hover animation). Two WAAPI
  animations composing concurrently on different properties is normal, desired layering; only
  drag's bypass of WAAPI needed the fix. Do not "generalize" this into a general engine-vs-engine
  cancellation policy — that would be a new regression, not a fix (see spec 013 / ARCHITECTURE.md
  "Transform ownership and composition").
- **`moveTransform()`'s discretely-falls-back warning dedup (`warnedMismatchedPairs` in
  `move-values.ts`) is a module-level `Set`, not scoped per call or per test.** It persists for the
  lifetime of the process/test file. Tests asserting on it must use pair values unique to that
  test (see `move-values.spec.ts`) or the assertion can pass vacuously because an earlier test
  already warned for the same pair.
- **RAF-count assertions in library unit tests are contaminated by Angular's own zoneless
  change-detection scheduler**, which also calls the global `requestAnimationFrame` — confirmed
  while writing the spec 013 Motion Values benchmarks (`move-values.spec.ts`). A bare
  `expect(rafMock).toHaveBeenCalledTimes(N)` after `fixture.detectChanges()` is not reliable; use a
  delta against a same-test baseline plus a bounded allowance instead (see
  `FRAMEWORK_RAF_ALLOWANCE` in that file), not an exact count.
- **`.claude/scripts/api-surface.mjs`'s signal regex requires an explicit generic**
  (`signal<T>(...)`) and misses every current `signal(...)` call (e.g. `MoveScrollDirective.progress`)
  — so `signals` is `[]` everywhere in both that script's output and `movement-mcp`'s snapshot.
  Discovered while building spec 012, not fixed (out of scope there). A real gap, not a false
  positive — worth a small regex fix.

## Next up (priority order) — the road to 1.0

1. **Cut the spec 009 changes as a release** (or fold into the `1.0.0` cut directly — no more API
   decisions are pending) — follow `RELEASE_CHECKLIST.md`.
2. At least six e2e tests are now known to flake under parallel load (`animation demo plays enter
and exit through movePresence`, `drag demo moves the card…`, `smooth scroll demo exposes the
live service readout`, `scroll demo maps container scroll onto the element transform`, `animate
demo reflects slider changes…`, and `enter demo replays with the newly selected preset`) — each
   asserts a transient mid-animation/mid-scroll state from outside the page and passes reliably
   single-worker. Worth its own spec before 1.0 (increase timeouts, assert from inside
   `page.evaluate`, or reduce worker count for this file).
3. Toolchain upgrade: this repo builds on Angular 21 / TypeScript 5.9 while supporting consumers on
   Angular 22 / TypeScript 6. Needs its own spec.
4. Add Angular 22 to the CI matrix for the library's own unit tests, not just the consumer app.
5. SSR-render the built package in the consumer fixture (needs an `ssr.entry` server).
6. ~~Revisit a secondary `angular-movement/experimental` entry point~~ — **decided** in spec 009:
   no secondary entry point for 1.0 (Option A, see `ROADMAP.md`). Not open anymore.
7. **Publish `angular-movement-mcp` 0.1.0** — implemented and CI-wired (spec 012 +
   `.github/workflows/release-mcp.yml`), but no `mcp-v0.1.0` tag has been pushed yet, so nothing
   has actually reached the npm registry. Push the tag when ready (see `RELEASE_CHECKLIST.md`).
   Other follow-ups noted in the spec: fix `api-surface.mjs`'s signal regex, consider a Claude Code
   plugin/marketplace listing once a marketplace account exists.

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
