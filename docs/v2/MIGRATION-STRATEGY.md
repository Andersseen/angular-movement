# Migration strategy

**Proposed; no CLI/schematic shipped by this task.** Correctness and reversible review come before
conversion coverage. A migration report is a deliverable even when no safe edit can be made.

## A. Legacy Angular animations → Angular Movement

Angular now recommends native CSS/enter/leave for many cases; migration should offer the least
complex suitable destination. Movement is compelling when signals, interruption, coordinated exits
or imperative composition remove application glue.
[Official migration guidance](https://angular.dev/guide/animations/migration).

### Delivery choice

Begin 1.3 with recipes and an assessment prototype on fixture projects. Prefer an optional schematic
or separate development CLI with Angular compiler-aware TS/template parsing if installation/AST needs
justify it. Do not add a bin and AST tooling to the core runtime just to enable the conceptual
`npx angular-movement migrate` command. `ng generate angular-movement:migrate` also requires an
actual schematics collection that does not exist today. Choose packaging after proving the report;
maintain pnpm for repository commands regardless of user-facing invocation syntax.

Analyzer resolves imports/aliases, component metadata, external/inline templates, trigger bindings,
state literals and removal ownership. Regex-only rewriting is unsafe. Dynamic factories, unresolved
symbols and ambiguous bindings lower confidence; never execute application code to resolve them.

| Pattern                                                   | Classification / destination                             | Eligibility and limitations                                                                                                               |
| --------------------------------------------------------- | -------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Literal opacity `:enter`                                  | Automatically migratable to moveEnter or native CSS      | Known static keyframes/timing, single target, no query/callback semantics, modern supported Angular; verify resting CSS                   |
| Literal transform `:enter`                                | Automatic only for exact understood mapping              | Numeric translate/scale/rotate units and order preserved; unknown matrices/functions remain manual or CSS passthrough recipe              |
| Simple `:leave`                                           | Partially migratable by default                          | Identify `@if`/list/view owner; ordinary moveLeave cannot delay Angular destruction. Reviewed presence/native leave transformation needed |
| Constant trigger/state transitions                        | Partial to moveAnimation/variants or native CSS          | Enumerate states and transition selection; wildcard/order/params/callbacks can require manual behavior                                    |
| Static staggered entrance                                 | Partial to moveStagger                                   | Preserve DOM order, registration, timing units and scope; queries may span components/dynamic targets                                     |
| enter/leave with stable tracked list                      | Partial to movePresenceFor                               | Preserve track identity, context variables, list order and removal semantics; do not rewrite arbitrary @for automatically                 |
| Group/sequence/query/animateChild                         | Manual until explicit fixture-proven subset exists       | Current variant delay estimates are not legacy completion barriers; 1.4 may supply a later recipe                                         |
| `height: '*'`, auto measurement, dynamic params/functions | Manual                                                   | Layout/measurement and runtime expression semantics cannot be inferred safely                                                             |
| Router-trigger timelines                                  | Manual native Router recipe in 1.3; deeper recipe in 1.5 | Snapshots are not retained live outgoing route components                                                                                 |
| Animation start/done callbacks                            | Manual/partial                                           | Legacy event payload and cancellation differ; never silently remove business logic                                                        |

“Automatically migratable” means the analyzer proved **all** eligibility constraints. Component
lifetime/provider removal is not implied by one safe leaf conversion. Default run is no-write;
explicit apply writes deterministic minimal edits after showing diffs. Report ✓ automatic, △ partial,
⚠ manual per construct with file/span, evidence, unsupported reason and recipe. No unsupported source
is removed. Backups/version-control diff, conflict detection, dry-run determinism and idempotence are
required. Removing legacy animation providers/imports requires proving no remaining uses, including
lazy components. Mixed native/legacy compiler animation constraints need their own fixture rather
than unconditional new native syntax inside a legacy component.
[Native compatibility guidance](https://angular.dev/guide/animations).

### Validation and rollout

Golden input/output reports; AOT compile changed templates; runtime assert enter final style, delayed
leave, interruption, reduced motion and no-JS/SSR content; negative cases must remain byte-identical.
Migrate two distinct actual codebases (one SSR), record pinned revision and manual effort, and obtain
maintainer review of proposed diffs. An app on unsupported older Angular first needs an Angular
upgrade; migration tooling does not make the runtime support legacy majors. Retain an explicit manual
path and bounded known limitations.

## B. Angular Movement 1.x → 2.0

Stable 1.x behavior stays compatible. Experimental revisions can happen in minors under the existing
policy, with a distinct Changed (experimental) entry and manual/automatic recipe. Prefer a warning or
bridge for at least one minor where practical; label exceptions and affected consumers explicitly.

| Stage   | Deliverable                                                                                                  |
| ------- | ------------------------------------------------------------------------------------------------------------ |
| 1.3     | Analyzer/report framework and migration recipes; no speculative v2 rewrite rules                             |
| 1.4–1.8 | Versioned rules for actually shipped experimental changes; opt-in new contracts; consumer comparison reports |
| 1.9     | Final export/member ledger, confirmed breaks, dry-run preview and migration rehearsal from latest 1.x        |
| 2.0     | Published guide/tool for decided breaks, tests of upgraded tarball, retained 1.x docs and support policy     |

Classify each export/member: stable unchanged, stable but deprecated, experimental → promote,
experimental → redesign, experimental → remove, internal. Promotion can be source-compatible.
Do not equate @deprecated with planned removal: moveActiveVariant is a permanent supported alias;
retain it unless benefit/cost analysis changes that decision. Hover touch methods need a usage audit
before any removal. No alias cleanup is presumed necessary for 2.0.

A future dry-run reports the baseline and target API versions, exact patches, ownership/timing behavior
changes, remaining manual conflicts, and summary suitable for code review. Rules never target APIs
not yet decided. Mechanical rename/import rewrites can be automated after semantic resolution;
transform ownership, wrapper geometry, exit lifetimes and pointer behavior often require manual
application review. Preserve custom keyframes, signals and supported timing units. Every breaking rule
needs before/after executable examples and fresh real consumer rehearsal, including compile plus
runtime/SSR tests. Tool errors leave the original app intact; rerunning produces no extra changes.

## C. Internal architecture migration

| Safe in 1.x with behavior proof                                         | Must wait for an approved major if non-additive                                        |
| ----------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Fix cancellation cleanup/restore bugs without changing stable semantics | Change default same-channel arbitration/restoration of stable combinations             |
| Track all players internally while preserving independent layering      | Cancel previously legal independent work as a new whole-element default                |
| Add optional task scope/result/group APIs experimentally                | Require new fields on stable controls or reject valid current calls                    |
| Prototype layout/drag revisions under experimental policy               | Remove stable aliases/aggregate members/imports                                        |
| Add metrics/dev diagnostics that production tree shaking removes        | Force Router/devtools dependencies through existing core imports                       |
| Batch measured work with equivalent scheduling/lifecycle                | Change stable first-render or one-shot input behavior                                  |
| Add precise transition helpers/explicit barriers                        | Change stable repeat counts, numeric units, variant when timing or finished resolution |

Sequence the rollout: add settlement instrumentation and equivalence fixtures; introduce opt-in task
scope/ownership contracts; adapt layout experiments; adapt drag/presence/Router boundaries; profile
reactive workloads; rehearse migrations; decide any new default only in 1.9. Avoid parallel permanent
engines: use adapters/normalization at boundaries and retire experimental bridges once migrations are
proved. Keep legacy stable path if coexistence is cheaper than a breaking change. Each implementation
uses its own spec/API review and verification gate. This planning task authorizes no runtime change.
