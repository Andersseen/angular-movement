# Decision register

Status meanings: **recommended** is the planning position, not an approved implementation;
**open** requires evidence/maintainer choice; **existing contract** comes from shipped 1.x.
No future milestone is complete. Update decisions through new evidence, not by rewriting historical specs.

## Existing constraints

| ID  | Status            | Decision and evidence                                                                                                                                                |
| --- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| E01 | Existing contract | Stable API follows SemVer; experimental declarations can break in 1.x minors with distinct notes. [009](../ai/specs/009-10-api-freeze-decision.md)                   |
| E02 | Existing contract | One main entry point, no experimental split; 009/013 found no concrete dependency/size reason                                                                        |
| E03 | Existing contract | finished always resolves; no completion/cancel result, pseudo-elements are isolated from real host registry. [014](../ai/specs/014-consumer-dx-imperative-motion.md) |
| E04 | Existing contract | Numeric timing is ms; one-shot and reactive API differences stay intact; moveActiveVariant is a permanent supported alias                                            |
| E05 | Existing contract | Signals/computed, standalone, zoneless, browser guards, no new runtime dependency; narrow imports preferred                                                          |

## Strategic choices

| ID  | Status      | Recommendation / rationale                                                                             | Decision gate                                                               |
| --- | ----------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------- |
| D01 | Recommended | Retain 1.3–1.9 sequence; dependencies need extended consumer evidence, not a compressed feature launch | Maintainer accepts release outcomes, with no dates                          |
| D02 | Recommended | 2.0 conditional; do not remove aliases or invent type breaks just to create a major                    | 1.9 benefit/cost record; remain 1.x if additive suffices                    |
| D03 | Recommended | Adoption is next; source audit shows common primitives dominate use and legacy/native choices matter   | 1.3 migrated projects, native comparison and safe diagnostics               |
| D04 | Recommended | Cancellation/ownership groundwork in 1.4, geometry contract in 1.6                                     | Latest-player registry/layout cleanup evidence; benchmark opt-in prototypes |
| D05 | Recommended | Start consumer, SSR/hydration and performance baselines in 1.3, deepen throughout runway               | 1.8 profiling/1.9 candidate matrix; no demo-only certification              |
| D06 | Recommended | New composition APIs initially experimental; preserve old stable path until compatibility proof        | A separate implementation spec/API approval, two consumer workflows         |
| D07 | Recommended | Existing variants/stagger remain; task groups supply real completion barriers separately               | Heterogeneous duration/spring/nesting/cancellation fixtures in 1.4          |

## Open architecture and tooling decisions

| ID  | Status | Options and current preference                                                                                               | Evidence needed / milestone                                                                             |
| --- | ------ | ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| O01 | Open   | Channel ledger + native composition vs wrappers vs live mixer. Prefer ledger/native with wrapper fallback                    | Same-node five-way case, rotated/nested/scroll fixtures, bundle/frame cost; 1.4 prototype, 1.6 decision |
| O02 | Open   | New group result vs optional companion result on controls. Prefer separate task controls first                               | Consumer need, mock controls compatibility, no-op/error/child cancel semantics; 1.4                     |
| O03 | Open   | Persistent cancel preserves presentation vs restores baseline vs commits intended target. Never commit stale replaced target | Visual interruption comparisons, state/drag/exit consumer expectations; 1.4/1.6                         |
| O04 | Open   | Recipes only vs small Router adapter. Prefer recipes until repeated glue exists                                              | Two navigation apps, Router supported-major hooks, native/fallback/cancel tests; 1.5                    |
| O05 | Open   | Scoped layout identity/coordinator versus compatible restricted current layout                                               | Two layout consumers, creation/destruction order, cancellation, geometry, retained references; 1.6      |
| O06 | Open   | Drag state signal/reorder helper versus app recipes. Reorder optional                                                        | Touch + keyboard workflow, app owns array, 1.6 layout maturity; 1.7                                     |
| O07 | Open   | Independent springs vs shared scheduler; keep independent until measured otherwise                                           | p95/GC/hidden-tab on 1/10/50/100 and realistic hundreds, fair controls; 1.8                             |
| O08 | Open   | Velocity/color derivation helpers versus plain computed/application sampling                                                 | Two concrete uses and units/lifetime/error rules; 1.8                                                   |
| O09 | Open   | Dynamic reduced-motion preference coordinator implementation                                                                 | Every owner reacts/cleans safely, no replay/leak or production overhead; 1.4 prototype, 1.8 final       |
| O10 | Open   | Migration schematic versus separate CLI. No core AST tooling                                                                 | Fixture correctness, Angular compiler compatibility, dry-run UX and install weight; 1.3                 |
| O11 | Open   | Inspector in opt-in dev package/runtime vs playground/warnings only                                                          | Consumers diagnose actual conflicts; zero unimported prod cost; 1.9                                     |
| O12 | Open   | Optional Router/preset entry points; do not split prematurely                                                                | Real peer/bundle/collection boundary and migration/packaging proof; 1.5–1.9                             |
| O13 | Open   | Supported-major minimum/latest policy and physical reference devices/budgets                                                 | Current/previous policy review, pinned test environments, early baselines; 1.3, revisit each minor      |

### Experimental family disposition

| ID  | Family                                         | Initial recommendation                                     | Required final alternatives / decision deadline                                                                                                             |
| --- | ---------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| X01 | MoveLayoutDirective, moveLayoutId              | Redesign experimentally; no automatic promotion            | Compatible graduation / revised scoped contract / retained restriction / deprecation; 1.6 proposal, 1.9 final                                               |
| X02 | MoveDragDirective + four types                 | Keep experimental, mature bounded pointer ownership        | Promote proven bounded API / redesign event or constraint shape / remove only with migration; 1.7 proposal, 1.9 final                                       |
| X03 | MoveSmoothScrollDirective, SmoothScrollService | Keep experimental; prefer native scrolling by default      | Retain with explicit singleton/idle costs / scoped redesign if needed / deprecate if no compelling use; 1.8 proposal, 1.9 final                             |
| X04 | MoveTargetDirective                            | Keep experimental; promotion candidate only after evidence | Retain distinct boolean reverse contract / promote / deprecate to state/variants if redundant; 1.7 review, 1.9 final                                        |
| X05 | MoveTriggerDirective                           | Redesign experimentally                                    | Retain owner-bound imperative handle with unified set/reset / declarative-only with animator migration / remove if no need; 1.4 usage comparison, 1.9 final |
| X06 | MOVEMENT_EXPERIMENTAL_DIRECTIVES               | Keep experimental                                          | Membership follows X01–X05; not a separate subsystem promotion                                                                                              |

## Final public API ledger procedure (1.9)

Start from all 73 named exports in [AUDIT](AUDIT.md) and add every new 1.x export, selector,
input/output, method and behavior promise. Assign one of: stable unchanged; stable but deprecated;
experimental → promote; experimental → redesign; experimental → remove; internal. Each decision links
source/test/consumer evidence and migration burden, with maintainer review. Supporting type stability
follows actual uses, not a blanket experimental namespace.

Initial position: retain all 62 stable declarations; deprecation is advisory for moveActiveVariant and
hover touch methods, with no removal commitment. `MOVE_PRESETS` needs consistent source annotation in
future docs hardening, not a stability downgrade. No current candidate forces a breaking 2.0.

For a proposed break record: current signature/behavior; concrete failing use; proposed replacement;
why additive bridge/default cannot reasonably stay; benefit; affected consumers; compile/runtime
migration cost; compatibility maintenance cost; readiness evidence; approved release boundary. No
unchecked decision is resolved by marking a roadmap item done.

## Major boundary hypothesis

Most likely legitimate break: a validated default ownership/restoration model that changes observable
stable same-element composition and cannot economically keep both defaults. Experimental layout/drag
cleanup is itself allowed in 1.x; promotion is not inherently a major change. Optional package imports,
completion results and typed helpers can usually stay additive. Naming tidy-ups alone are weak benefits.
This hypothesis must survive real migration comparisons in 1.9 before a major is approved.
