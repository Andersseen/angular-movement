# Changelog

## Unreleased

### Added

- Post-1.0 hardening pass (spec 013): `MOVEMENT_STABLE_DIRECTIVES` and
  `MOVEMENT_EXPERIMENTAL_DIRECTIVES` — new aggregates additively splitting `MOVEMENT_DIRECTIVES`
  (unchanged contents) by stability, for consumers who want a stability-pure `imports` spread.
- A small cross-browser e2e smoke suite (`e2e/cross-browser.spec.ts`) now runs on Chromium,
  Firefox, and WebKit in CI, alongside the existing Chromium-only comprehensive suite. New
  `e2e/composition.spec.ts` adds adversarial composition scenarios (drag+hover/tap, presence-for
  rapid mutations, presence destroy-mid-transition, scroll→transform→spring chains, rapid SVG
  icon/variant toggling).
- `docs/ai/ARCHITECTURE.md`: new sections documenting the transform ownership/composition model,
  the Motion Values runtime model, the `moveTransform()` interpolation contract, the smooth-scroll
  architectural status, the `MOVEMENT_DIRECTIVES` aggregate policy, and the browser
  support/testing strategy — see `docs/ai/specs/013-post-1.0-hardening.md` for the full audit.

### Changed (experimental)

- `SmoothScrollService`: fixed a real accessibility bug where native keyboard scrolling (arrows,
  Page Up/Down, Home/End, Tab-triggered focus-into-view) was fought and effectively broken while
  `[moveSmoothScroll]` was active — the RAF lerp loop now resyncs when it detects a `scrollTop`
  change it did not itself write, instead of snapping back toward a stale target. Internal only,
  no signature change.

### Fixed

- `MoveDragDirective` now cancels any in-flight engine-driven animation (`moveWhileHover`,
  `moveVariants`, `moveLayout`, ...) on the same element at `pointerdown`, instead of racing it — a
  genuine bug where a hover/variant/layout animation still mid-flight when a drag started could
  later overwrite the drag's movement when it committed its own final transform. Drag now owns the
  transform exclusively from `pointerdown` forward (see "Transform ownership and composition" in
  `ARCHITECTURE.md`).
- `MoveHoverDirective` / `MoveTapDirective` / `MoveFocusDirective` now cancel their own player once
  a `*movePresence` exit begins on their element, instead of potentially racing the real leave
  animation. Internal only, no signature change.
- `moveTransform()` now emits a dev-mode warning (once per distinct mismatched pair) when it falls
  back to a discrete midpoint switch for mismatched units, non-numeric strings, or embedded
  transform functions, instead of silently snapping with no indication why. Behavior for every
  previously-working case (matching numeric units) is unchanged.

### Investigated, no change made

- Secondary `angular-movement/experimental` entry point: re-audited, decision from spec 009
  reaffirmed — still no dependency stable consumers would need isolating from.
- Motion Values (`moveSpringValue`'s one-RAF-loop-per-call architecture): benchmarked at
  1/10/50/100 concurrent springs — linear registration growth, no leaks, no duplicate work found.
  No shared/batched scheduler introduced.

- New, independently-published package **`angular-movement-mcp`** (`projects/movement-mcp/`): a
  real MCP server (`list_directives`, `get_directive`, `list_presets`, `get_example`) plus an
  installable Claude Code skill (`movement-usage`), so an agent working in a consumer app can look
  up the library's real directive/preset API instead of guessing it. Installed via
  `npx angular-movement-mcp init`. Fully standalone — its own `package.json`, dependencies
  (`@modelcontextprotocol/sdk`, `zod`) and lockfile; `angular-movement` itself has zero new
  dependencies and zero code changes. Published independently via
  `.github/workflows/release-mcp.yml` (triggers on `mcp-v*.*.*` tags, reusing the existing
  `NPM_TOKEN` secret). See `docs/ai/specs/012-mcp-server-and-skill.md`.

## [1.0.0] - 2026-08-27

The 1.0 API freeze decision pass — see `docs/ai/specs/009-10-api-freeze-decision.md`. Decisions
only, no feature work: every 0.9 "stable candidate" reviewed and promoted, the experimental
compatibility policy for `1.x` made explicit, and a CI guard added against accidental public-API
drift.

### Changed

- **Every 0.9 "stable candidate" API promoted to stable**: `[moveAnimation]`, `*movePresenceFor`,
  `moveVariants`, `moveText`, `moveLoop`, `MoveAnimator`, `moveValue`, `moveTransform`,
  `moveSpringValue`. Also promoted, found via the same source audit (not in the original
  candidate list): the icon-helper presets `movePathDraw`, `moveIconPulse`, `moveIconBounce`,
  `moveIconShake`, `moveIconRotate`, and every supporting type in `presets.types.ts` that
  exclusively backs one of the above. None were renamed or redesigned — each held up against
  naming, lifecycle, reduced-motion, SSR, and test-confidence review as-is.
- `MoveVariantsDirective` now carries a `@stability` JSDoc tag (missing since it was introduced —
  a gap in the 0.9 audit, unrelated to the promotion decision).
- `MoveVariantsDirective.moveActiveVariant` is now `@deprecated` in favor of `moveVariant` — it
  remains a permanent, fully-supported alias for the same input; runtime behavior is unchanged.
- **Experimental compatibility policy decided for `1.x`**: no secondary
  `angular-movement/experimental` entry point (Option A). Experimental exports may change or be
  removed in any `1.x` minor, including breaking changes — documented in both READMEs and
  `docs/ai/ARCHITECTURE.md`. Every future experimental-only breaking change gets its own
  `### Changed (experimental)` heading in this file, distinct from normal `### Changed`.
- `ROADMAP.md`'s 1.0 section reflects the API-freeze and experimental-entry-point decisions as
  made, not open questions.

### Added

- **CI guard against accidental public-API drift**: `pnpm run api:check` diffs the library's
  freshly built type rollup (`dist/movement/types/angular-movement.d.ts`, generated by
  ng-packagr) against a committed snapshot (`projects/movement/api-report.txt`), wired into
  both `ci.yml` and `release.yml` right after the library build — a tag can point at a commit that
  never went through PR CI, so the freeze is verified again before an irreversible publish.
  `pnpm run api:snapshot` regenerates the snapshot for an intentional change, so the diff shows up
  for review in the PR. Manually verified to actually fail on a deliberate local change before
  being trusted as a real gate.
- **Consumer fixture extended to cover every newly-stable API.** `validation/consumer` is the only
  thing that type-checks the _shipped_ `.d.ts`, and it did not exercise several APIs this pass
  freezes: `moveTransform`'s string/unit overload (it must resolve to `Signal<string>`, which pins
  the overload order), the five icon helpers, `MOVE_PRESETS` indexing, `MoveTransitionConfig` with
  per-property timing, the `moveLoopType`/`moveLoopCount`/`moveLoopDelay` repeat inputs,
  `moveSpringValue`'s auto-inferred injector path, and `MoveAnimateOptions` /
  `MovePresenceForMode` / `MoveSpringValueConfig` as _nameable_ types rather than inferred
  literals. All now compile under AOT + `strictTemplates` on every supported Angular major.
- New tests for adversarial state-transition cases identified during the freeze review, added
  where a real coverage gap existed (none surfaced an actual bug): a destroyed `moveSpringValue`
  owner stops its RAF loop; a nested `[moveVariants]` child with no active-variant input of its
  own follows its parent; rapid `A → B → C` variant switching only lets `C` reach the engine; a
  nested `*movePresenceFor` tears down cleanly when its outer item leaves; repeated `moveLoop`
  preset switches cancel every prior player; `MoveAnimationDirective.cancelLeave()` (the hook
  `*movePresenceFor` uses on revive) stops an in-flight leave and still allows a fresh enter
  afterward. Also added a first spec file for `presets/icon-helpers.ts` (previously untested)
  covering its now-stable contract.
- `docs/ai/specs/009-10-api-freeze-decision.md` — the full audit and decision record.

## [0.9.0] - 2026-08-26

0.9 is an API-convergence / pre-1.0 hardening pass (spec 008) — auditing and fixing what 0.8
shipped rather than adding new features. See `docs/ai/specs/008-09-api-convergence-hardening.md`.

### Changed

- **`moveSpringValue`'s `injector` is now optional.** Called from a field initializer, constructor,
  or `runInInjectionContext`, it infers the injector automatically via `inject(Injector)` — the
  same convention `toSignal`/`toObservable` use. Passing `{ injector }` explicitly still works
  identically for calls outside an injection context.
- **`moveSpringValue` now respects `prefers-reduced-motion`** — previously the only motion
  primitive in the library that didn't check it automatically; a consumer had to resolve and pass
  `disabled` manually. It now jumps straight to the target value under reduced motion, same as
  `config.disabled`.
- `moveScroll` and `moveParallax` promoted from stable candidate to stable — both have zero open
  gotchas and strong test coverage since their 0.7.0 reduced-motion fix.
- Root README, package README, and `docs/ai/ARCHITECTURE.md` quick-start examples now recommend
  importing individual directives instead of spreading `MOVEMENT_DIRECTIVES`, which stays
  documented as a convenience option.
- Documented the intended hierarchy between primitives that look interchangeable but solve
  different problems: `[move]`/`moveAnimate` vs `[moveAnimation]`, `moveVariants` vs
  `moveTarget`/`moveTrigger`, and `moveStagger` vs a variant's `staggerChildren`.
- Every previously-unclassified public export (mostly `presets.types.ts`, icon helpers, motion
  value config types, drag/presence-for/stagger types) now carries a `@stability` JSDoc tag.

### Fixed

- **`MoveLayoutDirective`, `MoveTextDirective`, `MoveInViewDirective` now honour
  `MOVEMENT_CONFIG.disabled`.** All three resolved a `disabled` config correctly but then
  hardcoded `disabled: false` at the `AnimationEngine.play()` call, silently ignoring the app-wide
  kill switch from `provideMovement({ disabled: true })` — the same bug class that broke
  `moveScroll`/`moveParallax` reduced-motion handling in 0.7.0. `MoveInViewDirective` also now
  re-checks `prefers-reduced-motion` at play time (not just at `ngOnInit`), so a preference toggled
  between mount and the element intersecting is still honored.
- **`MoveTextDirective` could orphan an `IntersectionObserver` on destroy.** Its effect defers work
  via a microtask; destroying the directive in the same tick the effect fired let that microtask
  run after `ngOnDestroy` and create an observer nothing would ever disconnect. Guarded with a
  destroyed flag.
- **`SmoothScrollService` (root singleton) now warns in dev mode** when a second
  `[moveSmoothScroll]` element (or a manual `.init()` call) tries to activate while it is already
  driving a different element, instead of silently doing nothing. A directive's `ngOnDestroy` no
  longer tears down the service if it isn't the element the service is actually driving, so a
  misused second instance can't kill scrolling for the one that legitimately owns it. New
  `activeElement` getter exposes ownership.

### Removed

- **`MOVE_VARIANTS_PARENT` and `MoveVariantsProvider` are no longer exported.** They lived directly
  in the barrel-exported `move-variants.directive.ts`, unlike the identical
  `MOVE_STAGGER_PARENT`/`MOVE_PRESENCE_PARENT` pattern, which deliberately lives in un-exported
  `tokens/*.ts` files and was never documented as public. Moved to internal
  `tokens/variants.tokens.ts`. **Breaking, but nothing outside the library referenced either
  symbol** (verified across the demo site and both READMEs) — see MIGRATION.md.
- **`CompositeAnimationControls` (the concrete class) is no longer exported.** Every return path
  already types itself as the still-public `AnimationControls` interface; the class was an
  engine-internal detail parallel to `AnimationEngine`, which already stayed internal so 1.0 can
  freeze the barrel without freezing the engine. **Breaking, narrow** — see MIGRATION.md.

## [0.8.0] - 2026-08-17

### Added

- **Repeat controls: `repeatType`, `repeatDelay`, repeat count.** `WaapiPlayer` never set
  `direction`, so every loop restarted hard at frame 0 — `moveLoop` could spin but never breathe,
  pulse or yoyo, which is most of what looping is for. `repeatType: 'reverse'` now alternates
  direction, and `repeatDelay` pauses between cycles by baking a hold into the timeline (WAAPI has
  no per-iteration delay). Available as `moveLoopType` / `moveLoopDelay` / `moveLoopCount`, and as
  `repeat` / `repeatType` / `repeatDelay` on `MoveTransitionConfig` for variants, targets and
  triggers.
- **`[moveWhileDrag]`.** Hover, tap and focus each had a `while*` state; drag did not, so the
  near-universal "lift the card while dragging" could not be expressed. The gesture is composed into
  the drag's own transform write rather than handed to the engine, because the engine would become a
  second writer of `transform` and clobber the drag translate on every pointermove. On release it
  goes back through the engine in the same play as the snap-back, so scale and translate settle
  together.
- **`mode: 'popLayout'` for `*movePresenceFor`.** An exiting row held its space for the whole leave;
  it is now lifted out of flow so the remaining rows close the gap immediately.
- **Variant orchestration: `staggerChildren`, `delayChildren`, `when`.** Nested `[moveVariants]`
  children are staggered in document order on a variant change, which previously required the
  separate `moveStagger` directive that does not compose with variant switching.
  `when: 'beforeChildren' | 'afterChildren'` orders the parent against its children.
- **`transition.times`.** Keyframe arrays were always evenly spaced, so `{ x: [0, 100, 0] }` could
  never dwell. Offsets that cannot describe a timeline warn and fall back to even spacing.
- **`*movePresenceFor` — exit animations for keyed lists.** `@for` destroys an embedded view the
  moment its item leaves the source array, so animating list removals was impossible, and
  `*movePresence` only ever covered a single boolean-guarded template. Toast stacks, filtered grids
  and todo rows — the most common motion pattern there is — had no workaround at all. The new
  structural directive renders the list itself and keeps a removed item mounted until that item's
  leave animations resolve. Each row gets its own presence scope, so removing one row never animates
  its siblings, and every existing presence child (`[move]`, `[moveAnimation]`, `moveLeave`,
  `moveVariants`) works inside it unchanged. `mode: 'sync'` (default) overlaps enters and leaves;
  `mode: 'wait'` holds new rows until pending leaves finish.
- **`MoveAnimator` — a supported imperative API.** Nothing outside a directive could animate: the
  barrel exported `AnimationControls` but not the engine, and the package `exports` map blocks deep
  imports. `MoveAnimator.animate(el, keyframes, options)` resolves partial options against
  `MOVEMENT_CONFIG` and the reduced-motion preference in exactly the order the directives use, so
  imperative calls cannot quietly get different semantics. `AnimationEngine` stays internal on
  purpose — 1.0 freezes the barrel, and keeping the engine out of that contract is what leaves it
  free to change afterwards.
- **Angular 22 support.** The peer range widens from `^21.2.0` to `^21.2.0 || ^22.0.0`. Angular 22
  has been stable and npm `latest` for a while, so `npm install angular-movement` in a new project
  failed outright with an `ERESOLVE` peer conflict — the library was effectively uninstallable for
  anyone starting today.
- **Real-app validation** (`pnpm validate:consumer`, ROADMAP 0.7's headline item). Packs the library
  and compiles the tarball inside a throwaway Angular app per supported major, with a plain
  `npm install` so peer conflicts surface the way a user sees them. Until now nothing compiled the
  published package: the demo site imports it through a Vite source alias, so packaging breakage was
  structurally invisible. This is what found the Angular 22 defect above, on its first run. It runs
  in CI and as the last gate before publish.
- `/docs/patterns` — the Angular features people trip over: `@if` destroying a view before a leave
  animation can play, `@for` + `moveStagger` and why `track` matters, SSR, standalone imports, and
  reduced motion.
- `MIGRATION.md` — upgrade notes for 0.5→0.6 and 0.7→0.8, each marked breaking or advisory.

### Changed

- **Per-property easing is implemented instead of warned about.** `transition-composer` used to warn
  that it was "not supported yet" and fall back to the global easing, so specifying one easing for
  `opacity` and another for `x` silently got neither. A WAAPI keyframe's easing applies to every
  property in that segment, so differing easings now run as separate animations behind
  `CompositeAnimationControls` — one handle, so `cancel()` still stops all of them. Transform
  channels remain a single group by design, since they compose into one `transform` string and two
  animations writing it would clobber each other; that is now the only case the warning covers.
- **`[moveAnimation]` now reacts to `animate` state changes.** `animate` is a state, so changing it
  should animate to it — the contract this directive copies from Framer Motion. It was init-only,
  ignoring every later change. It now animates from the state it last settled on, falling back to
  `initial` on the first render. The state is compared **by value**, because a template binding an
  object literal hands the input a new reference on every change detection pass and a reference
  comparison would replay the animation continuously.
- **The input-reactivity contract is now correct and frozen for 1.0.** The documented table was
  wrong: `moveLoop` and `moveText` were listed as init-only while both have had a constructor
  `effect()` reading every input. The remaining one-shot directives (`[move]` / `moveAnimate`,
  `moveEnter`, `moveLeave`, `moveInView`, `moveSmoothScroll`) are documented as one-shot **by
  design** rather than as an unresolved roadmap item.
- Dropped the unused `zone.js` runtime dependency from the demo app. The app has been zoneless
  since it adopted `provideZonelessChangeDetection()`, nothing imported zone.js, and it was
  never in the client bundle — Angular declares it as an _optional_ peer, so it was pure
  install weight. Library unit tests, build, e2e and the consumer validation all pass without it.
- GitHub Actions bumped to `checkout@v5` / `setup-node@v5`, clearing the Node 20 deprecation warning.
- README, package README and the docs site state both supported Angular majors.

### Fixed

- **`moveLayoutId` did nothing.** It was declared, listed in the docs site's directive reference and
  exercised in the consumer validation app, yet no code ever read it — setting it was a silent
  no-op. Shared layout transitions are now implemented: a registry tracks the last known rect per
  id, and an element mounting with an id another element already holds animates in from that
  element's rect, giving the magic-move between two distinct DOM nodes. Entries outlive their
  element (a handover destroys the outgoing node and creates the incoming one in the same pass, in
  no guaranteed order) and age out after 300ms, which bounds how long a removed position stays
  claimable.
- **Reduced motion never reached the end state for SVG path properties on a transformed host.** The
  disabled/reduced-motion path had an `if`/`else` whose two branches were identical, and both
  applied styles with `style.setProperty(camelCaseName, …)` — a silent no-op, verified: it leaves
  the property empty where a direct assignment lands the value. An `icon-draw` preset on an element
  that already had a transform therefore stayed at its initial dash offset. Both branches now go
  through the same helper the non-composed path already used.
- **`moveScrollContainer` and `moveParallaxContainer` did nothing while smooth scroll was active.**
  Both directives skipped attaching their native scroll listener whenever `SmoothScrollService` was
  running, but that service only drives the root/page scroll — a custom container keeps scrolling
  natively, so it was left with no scroll source at all and the animation froze. `moveParallax` also
  preferred the service's page offset over the container's own `scrollTop`, feeding a page-relative
  number into a container-relative calculation. Any app calling `SmoothScrollService.init()` — the
  documentation site included — had a completely inert `moveScrollContainer`, an input added in
  0.6.0 precisely for this case. Both now defer to the service only when they actually track the
  page.

## [0.7.0] - 2026-08-07

### Fixed

- **`moveScroll` and `moveParallax` ignored `prefers-reduced-motion`.** Both hardcoded
  `disabled: false` in the config handed to the engine and never consulted the user's preference, so
  scroll-linked and parallax motion — precisely the kind WCAG 2.3.3 asks to suppress, and the kind
  most likely to affect users with vestibular disorders — kept running with "Reduce motion" enabled.
  Both now skip animating entirely, leaving the element in its natural CSS state so scroll-driven
  reveals stay readable rather than stuck at an invisible initial keyframe. Covered by unit tests
  and by browser-level e2e that emulates the media query.
- The demo site advertised **v0.5.0** in the navbar while npm was on 0.6.0. The version is now
  injected from `projects/movement/package.json` at build time, so it cannot go stale again.
- `moveLayout` no longer double-counts the host's own CSS transform. FLIP snapshots are now measured
  in untransformed layout space, so a committed `moveWhileHover` scale, a `moveDrag` offset, or the
  tail of a previous FLIP can no longer leak into the delta — a plain hover scale on a
  `[moveLayout]` element used to trigger a spurious layout animation. Closes the last open item of
  spec 001.
- Documentation drift found by the new `docs:check` gate: six directive inputs were documented as
  required when they are optional in the source (`moveEnter`, `moveLeave`, `moveInView`, `moveText`,
  `moveScroll`, `moveLoop`), `moveParallaxContainer` (shipped in 0.6.0) was never documented, and a
  `moveSmoothScroll` input was documented that has never existed.

### Added

- Test hardening for 1.0 (spec 003). The suite went from 241 to **372** unit tests and 25 to **39**
  e2e tests; statement coverage 86.66% → **93.49%**, branch 80.65% → **86.36%**. No library file is
  below 87.5% statements, and `base-player.ts` / `waapi-player.ts` are at 100%.
  - Three cross-cutting contract specs replace what would have been ~50 near-identical per-directive
    tests, asserting at the `Element.animate()` boundary rather than on internal config:
    `reduced-motion.spec.ts` (12 directives, each with a control case proving the assertion can
    fail), `teardown.spec.ts` (no animation survives destroy; re-triggering cancels the previous
    one), and `ssr.spec.ts` (18 directives render on the server without touching `Element.animate`,
    `IntersectionObserver` or `requestAnimationFrame`).
  - `base-player.ts` had no spec at all; it now has one covering the finish/commit/cancel sequence,
    `once` listener registration, missing `commitStyles`, and the idle-cancel branch.
  - `waapi-player.ts` covers the infinite-iteration path used by `moveLoop`, which must never fire
    `onDone`.
  - e2e interaction tests for drag, presence, variants, stagger, in-view and scroll — the coverage
    ROADMAP 0.7 asks for.
  - `moveStagger` gained integration coverage: its previous tests registered plain elements by hand,
    so a broken `MOVE_STAGGER_PARENT` wiring would not have been caught.
- `data-testid` anchors on the presence, variants, stagger, in-view and scroll demo pages so e2e has
  stable selectors.
- `@stability` JSDoc tag (`stable` / `candidate` / `experimental`) on every public declaration, so
  the guarantee is visible in the IDE instead of only in the README table. Experimental declarations
  also carry the standard `@experimental` tag.
- `pnpm docs:check` (`scripts/check-docs-drift.mjs`) — validates documented selectors, input names
  and required flags against the parsed library source, and checks that both docs pages only mention
  identifiers that still exist. Runs in CI.
- `src/app/shared/api/directive-reference.ts` — single definition of the structured directive
  reference, now consumed by the `/api/directives` route.
- Live demo pages for `moveSmoothScroll` / `SmoothScrollService` and for the signal helpers
  `moveValue` / `moveTransform` / `moveSpringValue`, both registered in the demos nav and covered by
  Playwright.
- Test coverage for the two weakest files: `MoveScrollDirective` (66.7% → 87.8% statements; custom
  container mode, malformed offsets, RAF lerp settle, teardown) and `SmoothScrollService`
  (66.7% → 96.5%; touch drag, momentum decay, nested scrollables, clamping).

### Changed

- `moveText` and `moveLoop` are now classified as stable candidates in the API-stability table; they
  were previously unlisted.

## [0.6.0] - 2026-08-04

### Added

- Open source community files: contributing guide, code of conduct, support policy, security
  policy, and roadmap.
- GitHub issue forms, pull request template, and Dependabot configuration.
- `engines/transform-state.ts` and `composeElementKeyframes()` for unified transform composition.
- `Release` GitHub Actions workflow that publishes the library to npm (with provenance) and creates
  a GitHub Release when a `v*.*.*` tag is pushed (requires the `NPM_TOKEN` secret).
- `pnpm release <patch|minor|major|X.Y.Z>` script that bumps the library version, rolls the
  `CHANGELOG.md` Unreleased section, commits, and tags (supports `--dry-run` and `--push`).
- Redesigned, more visual root README with a screenshot hero, badge row, feature grid, and
  collapsible recipes.
- Live demo pages for `[moveAnimation]` and `[moveWhileFocus]`.
- Playwright interaction tests for the new animation and focus demos.
- API stability and input-reactivity tables/sections in the README, package README, API Guide,
  Reference page, and `docs/ai/ARCHITECTURE.md`.
- `moveParallaxContainer` input on `MoveParallaxDirective` for custom scrollable containers.

### Changed

- CI now has explicit permissions, concurrency, manual dispatch, and shared Node version config.
- Cloudflare deploy now runs on `main` pushes and manual dispatch instead of all pull requests, so
  external contributions are not blocked by missing deployment secrets.
- README files now expose CI, npm, license, contribution, security, and roadmap entry points.
- `moveSpringValue` now requires `injector` in its config.
- `SmoothScrollService` skips initialization when `prefers-reduced-motion` is active.
- `moveText` is now reactive to input changes.
- Demo pages and the demo container now import only the specific directives they use instead of
  pulling in the full `MOVEMENT_DIRECTIVES` array, improving route-level tree-shaking.
- `MoveVariantsDirective`'s active-variant input renamed from `moveAnimate` to `moveVariant` (with
  `moveActiveVariant` as an alias), removing the selector collision with `MoveAnimateDirective`.
- Numeric and boolean directive inputs now coerce attribute values, so bare/string attributes like
  `moveDuration="400"` and `moveInViewOnce="false"` behave as expected.
- Root and package README examples now use the correct active-variant input (`moveVariant` /
  `moveActiveVariant`), focus selector (`moveWhileFocus`), and `moveSpringValue` config with
  `{ injector: inject(Injector) }`.
- `move-animation.utils.spec.ts` now covers `optionalNumberAttribute`, `numberAttribute`,
  `optionalBooleanAttribute`, and `booleanAttribute` coercion.
- `move-parallax.directive.spec.ts` now includes tests for `moveParallaxContainer` behavior.

### Fixed

- Transform composition between `moveLayout`, `moveDrag`, and keyframe animations now uses a single
  composed `transform` channel, avoiding fights over inline styles.
- `moveDrag` guards against detached elements during pointer events and release animations.
- `movePresence` no longer removes a recreated view if a stale leave promise resolves after a quick
  toggle back to visible.
- `MoveSmoothScrollDirective` no longer fails to compile — `moveSmoothScrollLerp` coerces to a
  required number instead of an incompatible `number | undefined`.
- `MoveAnimationDirective` test suite expanded to cover keyframe conversion, ignored properties,
  timing/spring/disabled inputs, reduced motion, exit/presence behavior, cancellation, and SSR
  safety.
- `optionalBooleanAttribute` now treats an empty string attribute as `true`, matching standard HTML
  boolean attribute behavior and the helper's documented contract.
- Parallax demo now uses `[moveParallax]` with `moveParallaxContainer` instead of `[moveScroll]`.

### Removed

- Unused constants from the internal `constants.ts` (kept only `DEFAULT_PERSPECTIVE` and the spring
  simulation constants that are actually referenced by the engines).

## [0.5.0] - 2026-06-15

### Added

- `moveStaggerStep` as an explicit stagger interval alias, while keeping `[moveStagger]="80"`.
- `moveDragSnapPoints` for snap-target drag interactions with axis-lock and constraint support.
- Signals-native motion helpers: `moveValue`, `moveTransform`, and `moveSpringValue`.
- `moveParallax` now exposes a `progress` signal, matching `moveScroll`.
- Docs pages for API Reference and Presets, plus e2e coverage for docs routes.
- Shared npm/pnpm/yarn install command selector across home and docs.
- Release checklist for test, build, e2e, package, and publish checks.

### Changed

- Documentation now positions the package as an Angular-native API powered by the Web Animations
  API.
- Demo pages for layout, loop, target, SVG icons, and leave now better match production usage.
- `moveLeave` examples now use `movePresence`, because direct `@if` / `*ngIf` removal happens
  before an attribute directive can animate.

### Fixed

- Child `[move]` animations no longer get disabled by an ancestor `moveVariants`; only a same-host
  `moveVariants` owns `moveAnimate`.
- `movePresence` now cancels in-flight leave players when removal is interrupted by a quick toggle
  back to visible.
- The packaged npm artifact now includes the MIT license file.
- Per-property transition composition now preserves string values such as `strokeDasharray`.
- Transform and SVG properties such as `x`, `y`, `scale`, `rotate`, `blur`, and `pathLength` use
  the same keyframe composition path as normal animations.
- Layout animation handles browser guards, zero-size rects, disabled refresh, and no-player cleanup.
- Removed unused `/api/generate` server endpoint.

## [0.4.0] - 2026-06-07

### Added

- **Motion-style bindings** — `MoveAnimateDirective` now supports `[moveInitial]`,
  `[moveAnimate]`, and `[moveExit]` state objects for a Framer Motion-like authoring flow.
- **Target presets** — `MoveTargetDirective` can now resolve named presets via `movePreset`,
  so boolean target animations work with either `[moveFrames]` or preset names.
- **Demo smoke coverage** — Playwright now validates every demo route so regressions in the docs
  app surface before publishing.

### Changed

- `moveAnimate` now accepts string variant names when used together with `moveVariants`, removing
  the need for `$any()` casts in Angular templates.
- Updated demos to use the new binding API and corrected install/import examples to the published
  `angular-movement` package name.

### Fixed

- Fixed SSR/template type issues in the drag, variants, and icon demos.
- Fixed icon target demos that used `movePreset` without custom `moveFrames`.

## [0.3.0] - 2026-05-23

### Added

- **Demo app: SVG Icons page** — New interactive demo at `/demos/icons` showcasing:
  - `moveTrigger` with `pathLength` / `pathOffset` drawing
  - `moveVariants` with per-property `transition` overrides
  - `movePathDraw()` helper function
  - `icon-bounce` preset on multi-part SVGs
- **Version bump** to `0.3.0` across library package and demo UI.

## [0.2.0] - 2026-05-23

### Added

- **SVG path drawing** — Official support for `pathLength`, `pathOffset`, and `pathSpacing` on SVG geometry elements (`<path>`, `<circle>`, `<line>`, `<polyline>`, etc.). These are automatically converted to `strokeDasharray` / `strokeDashoffset` under the hood.
- **Per-property transitions** — `MoveTransitionConfig` allows different `duration`, `delay`, and `easing` per animated property when using WAAPI. Useful for icon animations where opacity and path drawing should run on different timings.
- **`MoveTriggerDirective`** — New directive (`[moveTrigger]`, `exportAs: 'moveTrigger'`) for one-shot boolean triggers. Unlike `moveTarget`, `false` does not reverse the animation; it resets to `initial`, `final`, or `clear` state. Supports imperative `play()`, `reset()`, and `set(state)` methods.
- **Motion-style variants with transitions** — `MoveVariant` now accepts an optional `transition` field with per-property overrides. Works seamlessly in `MoveVariantsDirective`.
- **Icon helpers** — New preset functions for common icon micro-animations:
  - `movePathDraw(overrides?)`
  - `moveIconPulse(overrides?)`
  - `moveIconBounce(overrides?)`
  - `moveIconShake(overrides?)`
  - `moveIconRotate(overrides?)`
- **New string presets** — `icon-draw`, `icon-pulse`, `icon-bounce` added to `MOVE_PRESETS`.
- **`moveReverseDuration="0"` stable reset** — `MoveHoverDirective` and `MoveTapDirective` now clear inline styles immediately when reverse duration is `0`, preventing residual transforms on interrupted interactions.
- **Improved `MoveKeyframes` typing** — Added explicit SVG properties: `pathLength`, `pathOffset`, `pathSpacing`, `strokeDashoffset`, `strokeDasharray`, `fillOpacity`, `strokeOpacity`. `MoveValuePair` now accepts `string` values (e.g. for `strokeDasharray`).

### Changed

- `AnimationEngine.play()` now normalizes `pathLength` / `pathOffset` into `strokeDasharray` + `strokeDashoffset` before creating the player.
- `MoveTargetDirective` accepts an optional `[moveTransition]` input for per-property timing overrides.
- `MoveVariantsDirective` forwards variant-level `transition` config to the engine.
- `WaapiPlayer` constructor now accepts pre-computed `Keyframe[]` arrays (used by the transition composer).

### Fixed

- Residual inline styles on rapid hover/tap interruptions are now cleaned reliably via `clearComposedStyle(el, Object.keys(frames))`.
- `MoveTriggerDirective` ensures no broken transforms or stroke dash styles remain after cancellation when `moveResetState` is set to `'clear'`.

## [0.1.0] - 2026-05-22

### Added

- `MoveTargetDirective` - animate any element with a boolean trigger, including smooth reverse.
- `AnimationEngine` now auto-sets `strokeDasharray` when animating `strokeDashoffset` on SVGGeometryElements.
