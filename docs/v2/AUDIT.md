# Current-state audit

Audited 2026-10-07 at repository `1464331` on `main`. This is source/test/CI inspection and
planning, not new browser, device, consumer or performance certification. References to past
passes are historical evidence. No sibling consumer checkout was rerun in this task.

## Baseline and historical decisions

| Claim                       | Evidence and qualification                                                                                                                                                                                                                                         |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Library 1.2.0               | [package](../../projects/movement/package.json), [changelog](../../CHANGELOG.md); local `v1.2.0` history. Registry publication not independently checked in this task.                                                                                             |
| Angular 21/22               | Core/common peers `^21.2.0                                                                                                                                                                                                                                         |     | ^22.0.0`; [consumer script](../../scripts/validate-consumer.mjs) derives majors from peers. Library/site toolchain remains Angular 21; this is not full runtime testing on both majors. |
| 1.0 stable freeze           | [009](../ai/specs/009-10-api-freeze-decision.md) promoted all candidates, froze one-shot/reactive distinctions, established experimental minor-break policy and API snapshot gate.                                                                                 |
| 1.1 hardening               | [013](../ai/specs/013-post-1.0-hardening.md): registry for drag preemption, interaction exit cancellation, numeric-unit interpolation warning, browser smoke/composition suites, separate stability aggregates.                                                    |
| 1.2 consumer DX             | [014](../ai/specs/014-consumer-dx-imperative-motion.md): pointer hover, explicit timing units, imperative set/clear/ElementRef/pseudo-element, external-cancel settlement, MCP guidance.                                                                           |
| Standalone/signals/zoneless | Source uses signal inputs/effects; [app config](../../src/app/app.config.ts) enables zoneless and hydration/event replay.                                                                                                                                          |
| Browser-native foundation   | Internal WAAPI/spring players; only runtime dependency is `tslib`; `sideEffects: false`. Spring player precomputes frames; signal springs and drag do use RAF.                                                                                                     |
| SSR-safe foundation         | Engine returns `null` on server; direct measurement/observer paths use platform guards; [SSR contract tests](../../projects/movement/src/lib/directives/ssr.spec.ts) cover 18 hosts. This does not certify packed-package hydration.                               |
| Existing v2 roadmap         | No dedicated v2 area or complete 1.3–1.9/v2 SDD existed. [ROADMAP](../../ROADMAP.md) contains history through 1.2 and a short Later ideas list.                                                                                                                    |
| MCP package                 | [package](../../projects/movement-mcp/package.json) is 0.2.0; [012](../ai/specs/012-mcp-server-and-skill.md) and 014 describe snapshot/tools/skill. STATE records last published 0.1.0 and pending tag. Do not conflate repository version with published version. |

## Public API map

[Single barrel](../../projects/movement/src/lib/movement.ts) and [committed declarations](../../projects/movement/api-report.txt)
contain **73 named exports: 39 runtime declarations, 34 types; 62 stable, 11 experimental, no
candidates**. The table inventories runtime exports; the subsequent type table completes the
surface. Inputs, outputs and public class methods are also part of their owner's contract. The
reference extractor is `.claude/scripts/api-surface.mjs`, not the missing `.Codex/` path in the
verification skill.

In the implementation column, paths are relative to `projects/movement/src/lib/`. Tests named
`same stem` mean the colocated `.spec.ts`, inspected along with source or test-case inventory.
External evidence below is the **historical static audit in spec 014**, often of 0.5–0.8 consumers,
not proof of 1.2 runtime correctness. Demo examples exist for all directive families.

| Category / export(s)                                                                                          | Stability    | Implementation and ownership                                                                                                                                                        | Test evidence                                                                                     | Consumer evidence; overlap and v2 concern                                                                                      |
| ------------------------------------------------------------------------------------------------------------- | ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Declarative: `MoveAnimateDirective` (`move`, `moveAnimate`)                                                   | Stable       | `directives/move-animate.directive.ts`; own player, stagger/presence integration, state aliases; same-host variants take precedence                                                 | Same stem; utils, SSR, teardown                                                                   | Quartz/Wisp/Lumen usage; overlaps state-object API; preserve one-shot behavior and aliases                                     |
| Declarative: `MoveAnimationDirective` (`moveAnimation`)                                                       | Stable       | `directives/move-animation.directive.ts`; reactive animate value comparison, only initial/animate shared properties; own enter/leave player                                         | Same stem, adversarial cancelLeave in 009                                                         | No strong external audit signal; distinct reactive state purpose, do not collapse into one-shot API                            |
| Enter/leave: `MoveEnterDirective`, `MoveLeaveDirective`                                                       | Stable       | `directives/move-{enter,leave}.directive.ts`; own players; leave registers with presence                                                                                            | Same stems, reduced-motion/SSR, cross-browser presence                                            | Eight-app audit favors enter; leave cannot intercept destruction by ordinary `@if`                                             |
| Presence: `MovePresenceDirective`                                                                             | Stable       | `directives/move-presence.directive.ts`; embedded-view ownership, child set, generation token, await leaves                                                                         | Same stem; rapid toggle, composition/SSR                                                          | Sparse external exit evidence; nearest injection scope is not a complete nested-removal contract                               |
| Presence: `MovePresenceForDirective`                                                                          | Stable       | `directives/move-presence-for.directive.ts`; keyed per-row injector; sync/wait/popLayout; revival tokens and zoneless markForCheck                                                  | Same stem; nested teardown in 009; rapid remove/add/shuffle e2e                                   | Demo/fixture evidence; keyed identity and app styles must survive layout integration                                           |
| Variants: `MoveVariantsDirective`                                                                             | Stable       | `directives/move-variants.directive.ts`; inherited activeVariant, registered child elements, computed delays                                                                        | Same stem; nesting/rapid A→B→C; browser smoke                                                     | No strong external audit signal; demo/fixture evidence; `when` estimates durations, not actual child barriers                  |
| Orchestration: `MoveStaggerDirective`                                                                         | Stable       | `directives/move-stagger.directive.ts`; DOM-order context, interval/direction; no group lifecycle                                                                                   | Same stem includes context integration                                                            | Palette/Agentyx/DevFlare; overlaps variant staggering, not sequence controls                                                   |
| Interactions: `MoveHoverDirective`, `MoveTapDirective`, `MoveFocusDirective`                                  | Stable       | `directives/move-{hover,tap,focus}.directive.ts`; pointer/focus handlers, reverse/reset and presence cancellation                                                                   | Same stems; reduced-motion, teardown; touch/cross-browser/composition suites                      | Strongest static adoption: Volt/Palette/Lumen; disjoint lift/press channels work, arbitrary same-channel conflicts remain      |
| Visibility: `MoveInViewDirective`                                                                             | Stable       | `directives/move-in-view.directive.ts`; init-only observer setup, own player; preference rechecked on play                                                                          | Same stem; SSR/reduced-motion; browser IntersectionObserver smoke                                 | Agentyx/Lumen; observer semantics and first paint must survive hydration                                                       |
| Text: `MoveTextDirective`                                                                                     | Stable       | `directives/move-text.directive.ts`; owns split DOM/static host text, players/observer, microtask teardown guard                                                                    | Same stem; 008 destroy race; SSR                                                                  | Text stagger in Agentyx; dynamic Angular interpolation and DOM ownership are boundaries                                        |
| Loop: `MoveLoopDirective`                                                                                     | Stable       | `directives/move-loop.directive.ts`; reactive repeat player, cancellation required for Infinity                                                                                     | Same stem; 009 repeated cancellation                                                              | Volt usage; endless work cannot silently enter a finite sequence/presence barrier                                              |
| Scroll: `MoveScrollDirective`, `MoveParallaxDirective`                                                        | Stable       | `directives/move-{scroll,parallax}.directive.ts`; paused WAAPI scrubbing at 1000ms linear, progress signal; RAF smoothing/container measurements                                    | Same stems; reduced-motion/teardown; browser/custom-container composition                         | Mostly demo evidence; native scroll default, no timeline-duration reinterpretation                                             |
| Layout: `MoveLayoutDirective` (`moveLayout`, `moveLayoutId`)                                                  | Experimental | `directives/move-layout.directive.ts`; afterEveryRender earlyRead/write, inline transform clearing, own FLIP player, internal root shared registry                                  | Same stem tests delta/zero boxes/inline transform/server/shared TTL; registry spec; browser smoke | No external usage in 014; cancellation, ancestor transforms, measurement timing and identity scoping unresolved                |
| Drag: `MoveDragDirective` / four drag types                                                                   | Experimental | `directives/move-drag.directive.ts`; direct transform writer, pointer capture, own release player and gesture RAF; axis/constraints/elastic/projected momentum/snap                 | Same stem tests outputs/constraints/snap/momentum/gesture; mouse e2e; CDP touch scope limited     | No external usage in 014; no public drag-state signal; pointercancel uses release path; not a general gesture system           |
| Smooth scrolling: `MoveSmoothScrollDirective`, `SmoothScrollService`                                          | Experimental | `scroll/`; root singleton, intercept wheel/touch, idle RAF, writable scrollY; one owning element                                                                                    | Both colocated specs; keyboard/scrollIntoView cross-browser regression                            | No external usage in 014; changes input behavior/page scrolling, stronger accessibility cost than observing scroll             |
| Boolean state: `MoveTargetDirective`                                                                          | Experimental | `directives/move-target.directive.ts`; true forward, false reverse after first play; frames/preset/transition                                                                       | Same stem; teardown                                                                               | One Lumen use in 014; overlaps reactive state/variants but concise reversible boolean semantics                                |
| Trigger: `MoveTriggerDirective`                                                                               | Experimental | `directives/move-trigger.directive.ts`; false reset, reset modes, exportAs handle; play returns Promise<void>, set/reset direct styles                                              | Same stem; teardown; two-phase demo e2e                                                           | Palette handle use motivated MoveAnimator; imperative duplication and different set/reset composition need decision            |
| Imperative: `MoveAnimator`                                                                                    | Stable       | `engines/move-animator.service.ts`; animate/set through engine; clear directly removes selected/common inline channels; root service does not bind handles to component destruction | Same stem; engine/base players; imperative/pseudo e2e                                             | Volt and Palette motivation; explicit task owner needed for whole-chain cancellation; set/clear latest-registration limitation |
| Values: `moveValue`, `moveTransform`, `moveSpringValue`                                                       | Stable       | `values/move-values.ts`; signal, computed numeric/matching-unit mapping, injector-owned effect/one RAF per spring                                                                   | Same stem: interpolation/injection/reduction/destroy, deterministic 1/10/50/100 count tests       | No representative long-running external metrics; pure derivations must stay scheduler-free                                     |
| Presets: `MOVE_PRESETS`, `movePathDraw`, `moveIconPulse`, `moveIconBounce`, `moveIconShake`, `moveIconRotate` | Stable       | `presets/{presets,icon-helpers}.ts`; data/functions; SVG normalization in engine                                                                                                    | Both stems; SVG browser smoke                                                                     | Icon usage; keep existing helpers, optional recipes need not enlarge core                                                      |
| Utilities: `moveTimeToMs`                                                                                     | Stable       | `move-time.ts`; explicit units normalized at boundary, numeric ms                                                                                                                   | `move-time.spec.ts`, consumer timing types                                                        | Addresses historical seconds-as-ms mistakes; never reinterpret numbers                                                         |
| Configuration: `provideMovement`, `MOVEMENT_CONFIG`, `MOVEMENT_DEFAULTS`                                      | Stable       | `providers/provide-movement.ts`, `tokens/movement.tokens.ts`; resolved numeric config                                                                                               | Provider spec; engine/reduced-motion contracts                                                    | Broad provider adoption; disabled precedence must stay consistent across alternate paths                                       |
| Aggregates: `MOVEMENT_DIRECTIVES`, `MOVEMENT_STABLE_DIRECTIVES`                                               | Stable       | `movement.ts`; all 21 vs 16 stable directives                                                                                                                                       | `movement.spec.ts`, API snapshot                                                                  | Broad imports in eight-app audit; all-directive aggregate includes experimental members by contract                            |
| Aggregate: `MOVEMENT_EXPERIMENTAL_DIRECTIVES`                                                                 | Experimental | `movement.ts`; five experimental directives                                                                                                                                         | Same snapshot/spec                                                                                | Taxonomy convenience; changes follow experimental declarations                                                                 |

### Exported types: complete inventory

All are stable except the final row. Their implementation/tests and consumers follow the owning
runtime families above, with type-level coverage in [consumer fixture](../../validation/consumer/src/).
The stable `AnimationControls` is returned by internal players too; supporting types do not become
experimental merely because an experimental directive consumes them.

| Category             | Named types                                                                                                                                 |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Declarative/state    | `MoveAnimationConfig`, `MoveKeyframeState`, `MoveKeyframeProperties`, `MoveKeyframes`, `MoveValue`, `MoveValuePair`, `MoveStateValue`       |
| Presence             | `MovePresenceForContext`, `MovePresenceForMode`, `MovePresenceForTrackBy`                                                                   |
| Variants/stagger     | `MoveVariant`, `MoveVariantState`, `MoveVariantOrchestration`, `MoveStaggerDirection`                                                       |
| Transition/presets   | `MovePreset`, `MovePresetDefinition`, `MoveSpring`, `MovePropertyTransition`, `MoveTransitionConfig`, `MoveRepeatOptions`, `MoveRepeatType` |
| Imperative           | `AnimationControls`, `MoveAnimateOptions`, `MoveAnimationTarget`                                                                            |
| Reactive             | `MoveTransformValue`, `MoveTransformOptions`, `MoveSpringValueConfig`                                                                       |
| Configuration/timing | `MovementConfig`, `MovementConfigInput`, `MoveTime`                                                                                         |
| Experimental drag    | `MoveDragAxis`, `MoveDragConstraints`, `MoveDragEvent`, `MoveDragSnapPoint`                                                                 |

Internal, not named exports: `AnimationEngine`, `PlayAnimationOptions`, players,
`CompositeAnimationControls`, transform/transition/keyframe composers, active-player registry,
`SharedLayoutRegistry`/TTL constant and presence/stagger/variants parent tokens/providers.
Do not graduate internals merely because generated declarations mention a supporting type.

### Stability details to retain

`moveActiveVariant` is documented as a **permanent supported alias**, deprecated to guide naming.
Removal is not assumed for v2. Hover's deprecated `onTouchStart`/`onTouchEnd` methods remain in the
class shape, unbound from native events. `MOVE_PRESETS` lacks the source stability tag but the
READMEs/freeze classify it stable. `MovePreset` contains **31 choices: 30 animations and `none`**,
not STATE's older 29 count. Numeric timings remain milliseconds. One-shot input contracts and
`moveAnimation`'s value comparison/shared-property rule are established APIs.

## Implementation findings and relevant technical debt

These are code-backed risks; adversarial cases below have **not been reproduced in a browser in
this task**. They warrant focused tests before a fix or API decision.

1. **Latest player is not ownership.** [Registry](../../projects/movement/src/lib/engines/active-player-registry.ts)
   overwrites one WeakMap entry, explicitly retaining earlier concurrent players; its test asserts
   the first is not cancelled. Drag and animator set/clear can therefore preempt only the latest
   registered player, potentially leaving another transform writer alive. Pseudo-element players
   are deliberately outside this registry. New engine plays do not globally replace other plays.
2. **Transform representation is conditional.** [Composer](../../projects/movement/src/lib/engines/keyframe-composer.ts)
   normally emits CSS translate/scale/rotate atomics; inline transform or mixed 3D promotes to a
   transform string. [Parser](../../projects/movement/src/lib/engines/transform-state.ts) handles a
   small function subset, not computed matrices, skew or arbitrary order/units. Clearing inline
   transform is not a universal untransformed-layout measurement (stylesheet/ancestor transforms
   and WAAPI effects can remain). A conceptual single transform channel does not prove live merging.
3. **Layout cancellation does not finish cleanup.** `#isAnimating` and transformOrigin restore
   through natural `onDone` or null-player return; `cancel()` only settles `finished`. A drag or
   external cancellation can leave render measurement suppressed while the host remains mounted.
   Existing layout tests predominantly mock the engine; no cancellation-restoration case covers this.
4. **Shared-layout lifetime is logical, not eagerly released.** Registry stores Element/rect in a
   Map and prunes on publish/claim, not with a timer. The 300ms window prevents stale claims but does
   not mean references disappear at 300ms while idle. Removing on destroy would break unordered
   handover; prefer scoped snapshot-only retention and explicit generation/lifetime evidence.
5. **Variants approximate barriers.** `childDelay`/`#childrenSpan` derive spans from parent/default
   duration rather than actual child completion, ignoring heterogeneous/spring duration. Changing
   stable `when` semantics is not a harmless internal refactor; introduce explicit group barriers first.
6. **Drag release/cancel and styling need separation.** Pointercancel calls pointerup (can trigger
   momentum/snap); touchAction is set after pointerdown; previous touchAction/userSelect strings are
   cleared rather than restored. Release uses hardcoded animation config and OS preference, unlike
   normal config merging; global disabled does not clearly govern gesture RAF/release. Multi-pointer,
   lost capture and repeated drag baseline accumulation need adversarial real-browser tests.
7. **Presence is a view lifetime system already.** Revival tokens protect stale removals. Nested
   nearest-parent scopes need explicit propagation policy; route snapshots must not create another
   retention system. `popLayout` clears inline layout properties on revival rather than restoring
   original values. Key lookup uses repeated findIndex; measure large-list costs before rewriting.
8. **Result/owner gap.** Stable `finished` resolves for finish/cancel; `onDone` identifies natural
   finish but SSR/disabled/no-animation paths also invoke callbacks. The root animator holds no
   component DestroyRef. Awaiting it alone cannot prevent subsequent application mutations after
   cancellation/destruction. Composite finished waits all members, while onDone is assigned to the
   first easing group; a slower group may still run. Define structured settlement additively.
9. **Reactive evidence is structural.** One-RAF-per-spring tests verify linear callback registrations
   and cleanup, not CPU/frame-time/GC performance. Hidden tabs, invalid physics, large derived graphs
   and dynamic reduced-motion changes remain evidence gaps. Signal springs infer browser availability
   from RAF existence, unlike explicit engine PLATFORM_ID. Browser-backed server harnesses merit tests.
10. **Spring paths differ.** Precomputed SpringPlayer clamps progress during interpolation and has
    bounded simulation; live numeric springs integrate value/velocity with dt cap. Per-property timing,
    offsets and repeatDelay are not universally applied to spring or pseudo targets. Freeze no broader
    promise until the capability matrix is explicit and measured.
11. **Smooth scroll has different costs.** Singleton ownership, continuous idle RAF, separately scheduled
    momentum callbacks and touch interception deserve lifecycle/accessibility profiling. Native scrolling
    is already adequate for most consumers; optional isolation is a decision, not an automatic package split.

## Evidence quality, tests and documentation

[014 verification](../ai/specs/014-consumer-dx-imperative-motion.md) records 580 unit tests,
121 e2e passes, one retry flake, two intentional skips, Angular 21/22 tarball AOT and MCP tests.
[013](../ai/specs/013-post-1.0-hardening.md) records deterministic spring-count benchmarks.
These were not rerun here. Current [Playwright configuration](../../playwright.config.ts) runs the
full suite on Chromium and cross-browser/touch subsets on Firefox/WebKit. Touch scrolling uses
Chromium CDP; Linux WebKit's missing release event can omit a press assertion. These are valuable
checks, not full physical touch or every-subsystem browser certification. Hydration readiness helpers
were added after 1.2 because pre-hydration clicks produced unreliable assertions.

[Consumer validation](../../scripts/validate-consumer.mjs) compiles one fixture against two majors,
not two independent production applications. It does not execute the browser app or render/hydrate
the tarball on a server. The site imports source via Vite; its prerender cannot close that package gap.
014 lists eight sibling apps with static usage and ForgeCMS with none. That audit motivates adoption;
it does not graduate layout/drag/smooth scroll, which had no audited external usage.

Fresh `pnpm docs:check` passed during this read-only audit; it checks reference metadata/identifier
existence, not contextual examples or behavioral prose. Confirmed drift to address in 1.3:

- Package README variants example binds `moveAnimate` instead of `moveVariant`.
- Package README and site API guide incorrectly describe independent per-property easing as a
  global fallback; only conflicting transform channels share the limitation.
- CONTEXT still says 0.5.x/goal 1.0; ROADMAP says 1.2 unreleased; STATE has historical stale headings/count.
- Site stability summary omits stable aggregates/timing helpers and experimental aggregate.

Historical docs are not rewritten in this planning task. The future index clarifies the actual
baseline. [MCP snapshot/tool tests](../../projects/movement-mcp/src/tools.spec.ts) are useful DX;
source drift and versioned guidance must stay synchronized as APIs evolve.

## Strengths v2 must preserve

Small tree-shakeable core, no new runtime dependency, narrow standalone imports, browser-native
playback, signal/computed return types, zoneless cleanup, readable no-JS/SSR content, automatic OS
reduced motion, explicit units, presets/custom CSS passthrough, stable imperative access without
exporting the engine, keyed presence and reliable revival, local tests plus API/package/doc gates.
The basic button/card/list path should not need ownership objects or an orchestration DSL.

## Concept overlap and experimental recommendations

| Family                                     | Initial treatment                                                              | Reason, evidence threshold and decision milestone                                                                                                                                                                                          |
| ------------------------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `moveLayout` / `moveLayoutId`              | **Redesign experimentally**, retain old usage through a bridge where practical | 1.6 must resolve measurement/interrupt/scoping contracts; promote only after two real layout consumers and matrix evidence; never promote unchanged by assumption                                                                          |
| `moveDrag` and four types                  | **Keep experimental**, evolve semantics                                        | 1.7 pointer cancel/touch/style restore/ownership; promote a bounded drag contract after physical devices and accessible app validation; reorder is optional                                                                                |
| `moveSmoothScroll` / `SmoothScrollService` | **Keep experimental** pending 1.8 retention/redesign decision                  | Sparse demand, singleton/page ownership and accessibility costs. Deprecate only if native scrolling meets consumer needs; scoped redesign only with real multiple-container demand                                                         |
| `moveTarget`                               | **Keep experimental**, promotion candidate                                     | Boolean reversible target is distinct from reset trigger; one historical use, insufficient promotion evidence. In 1.7–1.9 compare against state/variants in consumers before retain/deprecate decision                                     |
| `moveTrigger`                              | **Redesign experimentally** toward a coherent trigger/reset contract           | MoveAnimator covers imperative motion; set uses different style path and play exposes no controls. Compare declarative-only plus animator migration against retaining owner-bound handle. No removal until usage inventory/migration proof |
| `MOVEMENT_EXPERIMENTAL_DIRECTIVES`         | **Keep experimental**                                                          | Mirrors family decisions; not an independent feature to promote                                                                                                                                                                            |

No experimental family is recommended for unconditional removal now. Promote/remove/redesign
are decisions to earn in 1.x, recorded per symbol in 1.9. Stable overlaps are preserved; conceptual
consolidation alone is not enough benefit to break consumers.
