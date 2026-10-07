# Angular Movement: the 1.3–2.0 runway

**Status: proposed strategy, implementation not started.** Baseline audited on 2026-10-07:
repository `1464331`, library `1.2.0`. No release dates or implementation authorization are implied.

Evolve “Animate Angular with a single attribute” into **the motion system for modern Angular
applications** through predictable composition and Angular integration. Quality, migration and
consumer evidence determine readiness. The seven remaining 1.x milestones are deliberate;
2.0 is conditional on valuable breaking changes, not on completing a version-number schedule.

Start with [the audit](AUDIT.md), then [the SDD](SDD.md). Use [migration](MIGRATION-STRATEGY.md),
[validation](VALIDATION.md) and [decisions](DECISIONS.md) as release contracts. Historical
[ROADMAP](../../ROADMAP.md) and [specs](../ai/specs/) remain records of earlier work.

## Release outcomes and architecture

All additions below are hypotheses. No illustrated CLI, group API, Router provider, reorder
attribute or velocity helper exists merely because it appears in these plans.

| Release                                                                | User-visible outcome                                                            | Architectural purpose                                                | Dependencies                                           | Likely public additions                                                           | Experimental APIs affected                                    |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------ | --------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| [1.3 Adoption & Migration](plans/1.3-adoption-migration.md)            | Choose CSS/native Angular/Movement correctly; migrate small legacy cases safely | Adoption boundaries, reproducible consumer and packed SSR baseline   | 1.2 contracts; legacy fixtures                         | Opt-in migration assessment tool/recipe collection; runtime additions unnecessary | Target/trigger guidance only; no promotion                    |
| [1.4 Orchestration](plans/1.4-orchestration.md)                        | Cancel a whole multistep interaction without stale later work                   | Settlement results, task scope, channel-aware ownership groundwork   | 1.3 use cases and baseline                             | Experimental group/task controls, sequence/parallel/stagger only if justified     | Trigger overlap; groundwork for layout/drag                   |
| [1.5 Router & View Transitions](plans/1.5-router-view-transitions.md)  | Navigation motion with correct failures and fallback                            | Adapt native Router lifecycle and snapshot identity                  | 1.4 settlement/scope; supported Router-major fixtures  | Recipes first; tiny optional adapter only if needed                               | Shared-layout boundaries; no shared-layout promotion          |
| [1.6 Layout](plans/1.6-layout.md)                                      | Reliable list/card reflow and handover                                          | Coordinate spaces, measurement phases, scoped identity, interruption | 1.4 ownership; 1.5 snapshot lessons                    | Experimental layout revision/scoping if evidence requires                         | Layout/id redesign; presence composition                      |
| [1.7 Gestures](plans/1.7-gestures.md)                                  | Drag remains usable on touch and alongside layout                               | Pointer lease, constraints, release/cancel distinction               | 1.6 layout and ownership contract                      | Drag state or reorder experiment only for concrete applications                   | Drag family; target/trigger disposition review                |
| [1.8 Reactive Motion & Performance](plans/1.8-reactive-performance.md) | Responsive, leak-free long-running motion                                       | Measure frame cost, hidden tabs, derivation and teardown             | 1.4–1.7 representative workloads                       | Velocity/derivation only if needed; scheduler can remain unchanged                | Smooth-scroll redesign/retention decision; layout/drag stress |
| [1.9 Tooling & 2.0 Readiness](plans/1.9-tooling-readiness.md)          | Inspect conflicts and preview migration before upgrading                        | Freeze architecture; prove contracts and every export's disposition  | Evidence from all prior milestones                     | Optional development inspector; migration preview                                 | Final decision for every experimental declaration             |
| [2.0 Motion System](plans/2.0-motion-system.md)                        | Long-term-stable contracts, with documented migration                           | Remove only justified incompatibilities already previewed in 1.x     | All readiness gates and actual breaking-change benefit | Converged proven APIs; no first appearance of major subsystems                    | Promote/redesign/remove exactly as decided in 1.9             |

## Release boundaries and evidence

| Release | Explicit non-goals                                            | Exit criteria                                                                               | Real-world validation required                                          |
| ------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| 1.3     | Universal converter; core redesign; 1.4 implementation        | Honest classifier, reviewed fixture diffs, native comparison, packed SSR/hydration baseline | Two distinct migrated codebases, at least one SSR; failures recorded    |
| 1.4     | GSAP-style editor/timeline; changing stable `finished`        | Nested cancellation/error/no-op/teardown contracts; no stale step                           | Dashboard workflow and interactive multistep flow                       |
| 1.5     | Second router; delaying route activation for decorative exits | Redirect/cancel/error/back-forward/nested-outlet suite; unsupported fallback                | Router application plus SSR direct-load/first-navigation flow           |
| 1.6     | Promotion on demo success; universal matrix decomposition     | Layout space and restore guarantees; interruptible reflow; scoped handover                  | Dashboard list and interactive card/detail application                  |
| 1.7     | General gesture framework; reorder without keyboard semantics | Pointer cancel/lost-capture behavior; physical touch evidence; layout integration           | Interactive app on actual iOS/Android devices plus keyboard alternative |
| 1.8     | Scheduler rewrite by intuition; broad CSS interpolation       | Measured 1/10/50/100 values, stress, memory and hidden-tab reports                          | Long-lived dashboard and low-end interactive device                     |
| 1.9     | New major subsystem; extension-first tooling                  | Export ledger, migration rehearsal, full [gate](VALIDATION.md), unresolved items visible    | Four representative consumer profiles on pinned candidate               |
| 2.0     | New capabilities to justify a major; automatic alias removal  | Signed readiness record, benefit/cost case for each break, install/runtime migration passes | Those same consumers upgraded from 1.9                                  |

## Responsibility changes from the initial hypothesis

Keep all seven minors and their order. Begin ownership and cancellation experiments in **1.4**,
then use **1.6** to validate the transform model under actual layout. Begin performance, accessibility,
SSR and consumer evidence in **1.3**, maintain it each minor, and deepen it in **1.8/1.9**. Begin
migration diagnostics in **1.3** and preview confirmed v2 changes incrementally; do not discover them
only in 1.9. Smooth-scroll's disposition belongs to 1.8, with pointer/accessibility evidence gathered
in 1.7. Optional tooling discovery can start earlier, but 1.9 delivers only tooling over existing
contracts. These shifts follow the registry, layout lifecycle and validation gaps in [AUDIT](AUDIT.md).

## How to execute

The **single next implementation milestone is 1.3**. Open a separate implementation spec using its
plan and explicit scope; this document does not approve future public API changes. Release each minor
when its evidence is sufficient, use patch releases for regressions, and keep unresolved experiments
experimental. Deferring an unneeded optional capability is an explicit decision, not a failed release.

By 1.9, classify every export as stable unchanged, stable but deprecated, experimental → promote,
experimental → redesign, experimental → remove, or internal. If the benefits of remaining breaks do
not outweigh migration cost, continue 1.x. Do not manufacture 2.0.
