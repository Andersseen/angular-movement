# SDD: a motion system for modern Angular

**Status: proposed design; no implementation authorized.** Baseline 1.2.0, audited 2026-10-07.
All new names, types and contracts below are design candidates. They require milestone specs,
consumer feedback and the [decision gates](DECISIONS.md), not immediate export changes.
[AUDIT](AUDIT.md) establishes current behavior; [VALIDATION](VALIDATION.md) defines required proof.

## 1. Executive summary

Retain the easy single-attribute adoption path. Add coherent lifecycle and composition behind it
through 1.3–1.9, proving orchestration, navigation, layout, gestures and reactive performance before
freezing them. Prefer browser execution and Angular signals/injection/render phases. The largest
potential major boundary is deterministic ownership and style restoration replacing accidental
same-element last-writer behavior. It is not established yet that this needs a stable breaking change.

2.0 delivers proven contracts and migration, not the first versions of these systems. Existing stable
contracts survive 1.x. Experimental APIs can evolve under the explicit minor-break policy, with
release notes and migration evidence. If remaining work is additive, continue 1.x.

## 2. Problem and why developers would choose Movement

Simple opacity entrance, CSS hover, pre-hydration hero motion and native navigation crossfades do
not need a new library. Complex Angular UI often needs coordinated exit lifetimes, signal-driven
state, interruptible layout/drag, imperative phases and consistent reduced-motion/SSR behavior.
Today's primitives exist, but composition depends on several local player handles and conditional
style channels. The same DOM node can have five competing writers without a complete owner model.

**Choose Angular Movement when the application needs Angular-aware motion lifetimes and composed
state, not just a visual tween.** Every roadmap addition must remove repeated application code or
make interruption/accessibility more predictable in a representative Angular application.

| Alternative              | Prefer it when                                                                   | Movement's defensible advantage to prove                                                                           |
| ------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| CSS                      | Static transitions/hover/keyframes, first paint, no-JS content                   | Dynamic state, shared lifecycle and interruption; avoid converting simple CSS unnecessarily                        |
| Native Angular           | Compiler enter/leave classes or JS callbacks and Router snapshots cover the case | Common motion vocabulary, keyed presence coordination, signal/gesture/layout composition across Angular components |
| WAAPI directly           | A small isolated imperative effect with explicit app-owned cleanup               | Declarative integration, config/accessibility resolution, scoped cancellation, transform collision diagnostics     |
| GSAP                     | Complex authored timelines and specialist visual sequencing are primary          | Small Angular-first primitives and lifecycle integration without timeline/editor ambitions                         |
| Motion / another library | Its existing runtime and application integration already meet needs              | Signals/computed/injection/DestroyRef semantics, no React lifecycle translation, focused package/runtime cost      |

Angular's documented native enter/leave hooks support CSS and third-party JS, and legacy animations
are deprecated. Movement should integrate with that direction, including completing native leave
callbacks exactly once when used, rather than promise to replace all native capabilities.
[Angular enter/leave](https://angular.dev/guide/animations),
[Angular migration guidance](https://angular.dev/guide/animations/migration).

## 3. Current architecture

Directives resolve config and presets, inject optional stagger/variants/presence scopes, then create
players through internal AnimationEngine. WAAPI receives computed keyframes, commits inline styles
on natural completion and cancels the filled effect. SpringPlayer precomputes a bounded simulation.
Per-property easings can create several players behind internal CompositeAnimationControls.
MoveAnimator is the public imperative boundary. SSR returns null, disabled element motion commits
final styles, pseudo-element motion skips without changing the host. See [source map](AUDIT.md).

There is no shared live transform mixer. Base-transform parsing handles a subset; atomic CSS
transforms become a string on some paths. The latest-player registry exists for preemption, not
universal ownership. Presence retains Angular views. Layout measures after render. Drag writes
styles directly. Signal values are actual Angular signals/computed; signal springs use owned RAF.
There is no Router adapter or migration CLI currently shipped.

## 4. Product vision

A coherent motion system designed for Angular's current architecture: easy defaults, deliberate
advanced composition, explicit ownership and accessible interruption. A developer should understand
which primitive to choose and what happens when state changes mid-animation without inspecting the
engine. “Motion system” describes interoperable contracts, not a feature-parity inventory.

## 5. Goals

Preserve adoption simplicity; make cancellation observable without rejecting `finished`; compose
layout/gestures/state predictably; complement native Router transitions; keep Angular signal return
values; establish packed SSR/hydration and real consumer validation; diagnose conflicts in development;
freeze only APIs whose lifetime, costs and migration have been demonstrated.

## 6. Non-goals

A router, general gesture recognizer, UI toolkit, state store, animation editor, exhaustive preset
pack or arbitrary CSS interpolation engine. No scheduler replacement without measured benefit, no
secondary packages just for taxonomy, no universal legacy converter, no new runtime dependencies.
No pre-hydration JS animation guarantee or automatic preservation of every third-party CSS transform.

## 7. Design principles

Browser-native execution; Angular-native ownership; small public vocabulary; semantic distinction
between final application state and transient visual state; explicit finite work; idempotent cleanup;
progressive enhancement; accessible outcomes under no motion; evidence before stability. Runtime
mechanisms may be internal; applications should not have to acquire a lease to animate a button.

## 8. Ownership model

### Target identity and leases (proposed internal model)

Track work by `(element, pseudo-selector-or-real-element, logical channel, owner, generation)`.
A target record contains **all** active players, captured application style baselines, current
persistent state and transient contributions. Use WeakMap for live elements; do not introduce a
root registry retaining every element. A task scope supplies a cancellation parent; directives use
DestroyRef. Application state remains in Angular signals, not an internal store.

Logical channels are opacity, filter, other named CSS properties, and a transform group containing
translation/rotation/scale subcomponents. Aliases (`x` vs translate, scale vs scaleX/Y) normalize before
conflict detection. Raw transform and matrix/3D effects acquire the whole transform group unless a
validated compositor supports them; do not pretend they are disjoint from `x`/`scale`.

Disjoint properties can animate concurrently. Two owners of the same channel are either a declared
composition or an interruption. Identity includes pseudo-selector so host set/drag cannot cancel a
View Transition snapshot. Before cancellation all relevant writers must be known, including multiple
easing groups, direct gesture updates and an opt-in reactive style binding.

### Priority and lifetime

Use fixed roles internally, not a public numeric-priority system:

| Role                                                                  | Claim/behavior                                                                                         | Release/restoration                                                                               |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- |
| Application baseline / CSS                                            | Underlying state, never inferred from previously committed transient motion                            | Restore exact captured inline value only if still owned; leave newer app writes untouched         |
| Persistent state (`moveAnimation`, variants, explicit animator state) | Normal state transition; same-role newer request interrupts overlapping channel                        | Commit current intended persistent target on natural completion; cancellation has explicit policy |
| Layout projection                                                     | Transient geometry correction, composed in agreed coordinate space                                     | Remove projection on any terminal outcome; retain current application layout                      |
| Interaction (hover/focus/tap)                                         | Transient contribution; tap wins overlapping hover, focus remains accessible; disjoint effects layer   | Remove its own contribution, recompute current persistent state and still-active interactions     |
| Drag                                                                  | Pointer lease on translation/geometry; whileDrag owns its scale/rotate contribution                    | Release lease before settling; cancellation has no fling; restore authored input styles           |
| Exit / destruction                                                    | Exit dominates element channels, ends pointer/interaction work; destruction terminates all scoped work | Remove only after finite leaves settle; no stale commits or resurrection                          |

Explicit imperative animation is a state-role request by default, not universal highest priority.
`set()` intentionally replaces overlapping persistent state; `clear()` clears owned channels, not
unrelated authored styles. An explicit application override during drag must cancel the pointer lease
first; ordinary incoming state updates store latest intent while drag owns translation. Exits cancel
rather than queue. Layout measurement can proceed during drag, but rebase/project only when the
layout contract proves coordinate correctness; otherwise defer to release with a diagnostic.

### Required five-way example

For `moveWhileHover + moveDrag + moveLayout + moveAnimation + MoveAnimator`: state/animator compete
only on overlapping persistent channels; hover supplies a transient contribution; pointerdown cancels
conflicting running contributions, takes translation and holds whileDrag state; layout contributes
projection on top of measured layout without consuming drag offset twice. State changes during drag
update desired baseline; release reconciles it, then the remaining active hover resumes from current
state. Exit cancels them all. Destruction removes every scope/player/RAF and prevents future commits.
If full transform composition is unsupported, use a documented outer layout shell/inner gesture node
instead of unpredictable merging. This wrapper fallback must be viable before promising same-node support.

This is **proposed behavior**, not today's contract. In 1.4 prototype tracking/diagnostics and opt-in
scopes; in 1.6 settle transform math; in 1.7 validate touch. Changing existing stable arbitration by
default requires a separately justified major or additive opt-in contract.

## 9. Composition model

A transient contribution must not become the next animation's captured baseline. Canonicalize aliases
and capture author baseline separately. Candidate visual transform is `layout projection × persistent
transform × drag translation × interaction transform`, with each delta defined in a named coordinate
space and identical order on initial/intermediate/final frames. Matrix multiplication is noncommutative;
unit tests plus nested/rotated browser fixtures decide whether this order is viable in 1.6.

Prefer WAAPI for independent/finite transitions. Evaluate CSS individual transforms, WAAPI additive
composition and wrappers before a live JS mixer. A single combined-property animation cannot
independently ease each subcomponent without synthesis; keep that limitation explicit. Use JS only
for measured layout/gesture/reactive work already requiring it, and release the writer at rest.
[WAAPI effect composition](https://www.w3.org/TR/web-animations-1/#combining-effects).

Unsupported computed matrices/skew/foreign animation are observable conflicts. Preserve untouched
raw baseline when possible; do not parse it into zeros. If the app or a third-party writer changes a
property while leased, stop managing that property or require explicit ownership opt-in. Property
clearing must reflect the actual emitted channel: an `x` written as transform must not just clear
translate. Wrapper composition is an acceptable documented constraint, not a reason to recreate CSS.

## 10. Orchestration model

Start from actual MoveAnimator use, which already supports `await animate()?.finished`. A group is
justified when an entire chain must cancel, when parallel work has one scope, or when child completion
must replace guessed delays. Proposed tasks form a finite tree: animation leaf, sequence, parallel,
stagger-expanded parallel, and explicit effect leaf with documented application cleanup.

| Operation       | Proposed semantics                                                                                                            |
| --------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Sequence        | Start next child only after prior success/skip; cancellation/error stops later children                                       |
| Parallel        | Start children together; complete when all settle; error cancels siblings; aggregate result                                   |
| Stagger         | Snapshot explicit target order at start; own delay timers; cancelled scope starts no pending child                            |
| Nesting         | Parent cancellation propagates; child natural completion does not cancel siblings                                             |
| Replacement     | New generation invalidates old continuation before cancellation settles promises                                              |
| Disabled/server | Skip visual leaves synchronously; finite control flow continues, without touching DOM on server                               |
| Element removal | Directive/explicit scope destruction cancels; foreign detached targets skip/stop at boundaries; no global observer by default |

Do not return AnimationControls for a dynamically assembled task tree: pause/scrub/currentTime are
not meaningful for arbitrary callbacks, unknown spring spans or DOM mutations. Initial experimental
group controls expose cancel, result and finished, with owning scope. Seek/pause becomes a separate
finite precompiled-timeline proposal only if use cases earn it. Reject implicit infinite leaf barriers;
loops need separate scope ownership. Effects that change application state are explicitly provided,
never invoked after cancellation; SSR effects must be safe or browser-only and skipped by definition.

Keep stable variants' duration-based `when` contract in 1.x. Add explicit completion-based group
composition rather than silently changing delay estimates. Shared execution/settlement machinery can
be internal after behavior equivalence tests prove it.

## 11. Router / View Transition architecture

Angular Router already wraps route activation/deactivation in native View Transitions and offers
`onViewTransitionCreated` with transition/from/to data. The feature is documented as developer
preview at research time. Ordinary navigation proceeds when the browser lacks it. Movement should
add motion recipes and scoped pseudo-element playback, not start another document transition.
[Router lifecycle and transitions](https://angular.dev/guide/animations/route-animations),
[`withViewTransitions`](https://angular.dev/api/router/withViewTransitions).

Recipes come first. Only if two applications repeat lifecycle/cleanup glue should 1.5 introduce a
tiny opt-in adapter compatible with supported Router majors. Its target is the Router-created
transition. Wait for ready before animating snapshot pseudo-elements; handle ready rejection/skip;
DOM update completion and visual finish are distinct. Scope by navigation generation and selector.
Navigation supersession cancels prior visual work; redirects/guard rejection/failure must leave the
last successful route usable. Never block Router commit on arbitrary exit duration or spring loops.

Route data may reference app-owned motion definitions, but the adapter does not own route matching,
resolvers, state or URL. Nested outlets use one document transition with namespaced shared-element
names; duplicate simultaneous names yield a diagnostic and safe skip. Stable naming is app identity,
not `moveLayoutId`: browser snapshot identity and live layout identity are different lifetimes.

Without native support, perform normal navigation; optional enter motion applies after render.
Do not fake an outgoing route snapshot or retain Router-owned views via a second presence system.
Reduced motion skips the native visual transition and custom players while the DOM update completes.
SSR renders routes normally; initial hydration creates no transition. Restore focus/scroll using the
Router/application contract; no motion adapter should fight scroll restoration. Browser skip/ready/
finished behavior must be handled explicitly.
[View Transition lifecycle](https://www.w3.org/TR/css-view-transitions-1/#viewtransition).

## 12. Presence architecture

Keep the existing structural directives as view lifetime owners. Extend the internal provider protocol
only when needed for nested scope barriers/settlement; internal tokens stay internal. Each item/view
has stable generation, finite participating leaves, and revival cancellation. Restored items keep
identity and receive current state instead of stale exit completion. Layout observes before pop-out
writes and after final removal; popLayout saves/restores exact owned properties on revival.

Exit claims outrank hover/drag; stop gesture capture and animation before leave starts. Parent removal
must collect nested participating exits or specify a bounded no-wait policy, never assume nearest DI
scopes automatically propagate. Native Angular `animate.leave` interop must choose **one** removal
owner; a callback adapter signals completion once on all terminal paths. It must not simultaneously
retain the same view in Movement and compiler-managed leave.

Shared-layout handover stores snapshots, not retained outgoing Angular views. Route View Transitions
use browser snapshots; presence does not delay Router activation. Reorder changes array order in app
state; presence handles additions/removals, not business data ownership. Infinite exits are invalid;
errors/cancellation still release the view unless it was revived. Do not hang because a player never
reported natural onDone.

## 13. Layout architecture

Define layout space explicitly before promotion: container-relative boxes adjusted for scroll,
viewport changes and ancestor projection, separated from host visual transforms. Candidate scoped
coordinator batches snapshot reads, computes deltas, then writes projections in Angular render phases.
The current inline-transform mutation in earlyRead can cause forced layout and does not remove all
visual transforms. Compare wrapper measurement, offset geometry and projection inversion in nested
fixtures; support bounds are a deliberate contract.

Snapshots record dimensions, coordinate-root/scroll offset, generation and logical id, without
long-lived detached Element references. Shared identity is unique within a scope, can hand over once,
and expires/clears predictably. Duplicate live ids, zero boxes, detached nodes, changed ids and
incompatible coordinate roots skip with diagnostics. Preserve unordered outgoing/incoming creation.

On interruption measure/sample the current projected visual box once, cancel old projection, establish
new target and animate from the sampled view. Always release projection/isAnimating/transformOrigin
on cancel, error, natural finish, disable or destroy. Nested parent projection must not double-apply
child correction. Resize/scroll invalidation uses observers only for opted-in layouts, batched and
cleaned up; viewport-only change should not create perpetual reflow animations.

Default SSR/initial hydration behavior is snapshot only, no entrance FLIP. First stable client render
establishes baseline; later state change can animate. Use conservative unsupported-transform wrapper
recipes before widening support. Graduation depends on 1.6 acceptance and consumers, not preservation
of today's experimental shape. A scoped id option or layout mode may be additive/experimental; exact
names are unresolved. No global layout registry is exported.

## 14. Gesture architecture

Keep bounded drag. Pointer Events supply pointer identity/capture and cancellation; the browser
resolves touch panning using declared touch-action. Set policy before gesture start, respecting axis
and app scrolling, and restore exact authored styles when ownership ends.
[Pointer/touch-action model](https://www.w3.org/TR/pointerevents3/#the-touch-action-css-property).

Only one primary pointer lease per draggable. Pointercancel, lost capture, removal, exit and new
explicit override end the lease without momentum. Pointerup may project velocity into constraints
and optional snap; current projection is not a general physically integrated inertia engine. Retain
axis locking, constraints and elasticity only with defined container space/resize behavior. Constraint
reads occur at start/invalidations; pointermove writes batch at most once per frame if profiling shows
benefit, while outputs and final input state remain correctly ordered.

Drag data belongs to the app. Optional state signals expose input/settling state without storing item
order. Reduced motion keeps direct manipulation (functional feedback) and commits release/snap with
no decorative spring/inertia. All cancel paths stop gesture RAF and release players/capture.

Reorder is a conditional experiment atop proven layout: app owns array, stable keys, accessible
move-up/down or keyboard interactions, announcements and focus. No automatic drag-only reordering
widget, pinch/zoom recognizer, swipe router, multi-touch engine or application drop/business policy.
A wrapper remains the fallback for layout/drag composition beyond supported geometry.

## 15. Motion values architecture

Retain WritableSignal from moveValue and pure computed from moveTransform. No custom subscription
object or React-style lifecycle. Injector-owned effects/DestroyRef own active spring work. Introduce
shared scheduling only if browser metrics show meaningful gains without destroying independent cleanup.

Maintain numeric/same-unit interpolation and discrete warning fallback; new color/velocity helpers
must answer a consumer need, units and finite-value rules. A velocity experiment needs monotonic sample
time, zero/reset policy when idle, hidden-tab resumption and owner cleanup; it cannot rely on how often
an arbitrary computed is read. Prefer deriving existing scroll progress directly when sufficient.

Live springs clamp elapsed time and stop at rest; define invalid mass/stiffness/input handling to avoid
NaN or never-ending RAF. Browser-only scheduling must be platform-guarded even in server tests exposing
RAF. A proposed owner-aware DOM binding must claim channels if it competes with directives; arbitrary
`[style.transform]` app binding remains an external writer and requires separation/explicit policy.
No automatic scan or interception of all Angular styles.

## 16. Transition model

Preserve small shared vocabulary and boundary normalization. Separate **when tasks run** from **how
a leaf interpolates**; group orchestration fields must not become arbitrary CSS properties.

| Existing option               | Proposed direction                                                                                                |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| duration/delay (`MoveTime`)   | Retain explicit units/numeric ms; resolved config numeric                                                         |
| easing                        | Retain CSS easing; distinguish spring physics from duration easing                                                |
| spring                        | Retain physical fields; publish supported combinations and validation, no fake duration guarantee                 |
| per-property transitions      | Preserve independent non-transform easing; document grouped transform constraint                                  |
| repeat/repeatType/repeatDelay | Repeat is cycle count, not “extra repeats”; finite group validates loops; preserve current delay semantics in 1.x |
| times                         | 0..1 offsets; validate count/order; retain documented fallback; no hidden group meaning                           |
| variant child timings         | Preserve stable delay estimates; explicit barriers are separate                                                   |
| pseudo-element                | Duration/delay/easing/repeat; no commit/spring/per-property promise                                               |

An internal normalized leaf representation can remove duplicated resolution. Do not publish it or
change existing loose Record-based config in 1.x. A stricter discriminated transition union is only a
candidate if it prevents demonstrated misuse; its rejection of valid current objects would be a type
break, so provide additive typed helpers before considering a major.

## 17. Cancellation and errors

One internal settlement model across leaves/groups/projection/gesture/route/presence, preserving the
stable promise externally. Proposed terminal outcomes: `completed`, `skipped`, `cancelled`, `failed`,
with reason (`replaced`, `owner-destroyed`, `navigation-superseded`, `pointer-cancelled`, unsupported,
reduced motion) and error for failure. Completed/skipped count as successful finite barriers.
Cancellation never commits a leaf's stale final target; release transient contribution or preserve
current presentation until replacement per policy. Persistent cancellation default needs consumer
validation; keep today's behavior outside opt-in scopes.

State machine: pending → running ↔ paused (leaf only) → exactly one terminal outcome. Invalidate
generation first, cancel children/timers/RAF, restore/release owned state, then settle result/finished.
Cleanup is idempotent. External WAAPI cancel and natural finish race safely; detach/commit failures
still settle. Group errors cancel siblings and suppress future sequence effects. Failures are visible
in result/dev diagnostics, not silently interpreted as success or hung promises. Unsupported features
are skipped rather than errors; invalid task definitions can throw synchronously before starting work.

Keep `AnimationControls.finished: Promise<void>` always resolving; do not switch to raw WAAPI reject
semantics. Add richer task result or optional companion API experimentally, not a required member on
an interface consumers implement. `onDone` legacy behavior needs explicit docs for no-player paths;
new result distinguishes them. Presence releases on all terminal results, guarded by revival generation.
Application business callbacks should branch on outcome, not assume every await means success.

## 18. SSR and hydration

| Subsystem         | Server / no-JS                                                              | Hydration / first measurement                                                                 |
| ----------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Declarative/state | Render meaningful CSS/application state; engine performs no browser work    | Existing entrance is client enhancement; content must not be hidden until JS arrives          |
| Orchestration     | Skip browser leaves; no DOM lookup/measurement; safe application steps only | Start within explicit owner after elements are available, no serialized pending player        |
| Router            | Render successful route normally                                            | Skip initial transition; subsequent Router-created snapshots only                             |
| Presence          | Render current views/keys; no delayed visual removal                        | Reconcile stable keys and one removal owner; avoid moving split DOM before hydration finishes |
| Layout            | No rects, registry browser scope only                                       | Establish snapshot after hydrated stable render; no server-to-client guessed FLIP             |
| Drag              | No capture/listeners invoking browser writes                                | Establish touch-action/constraints only on mounted opted-in hosts                             |
| Values            | Signals/computed work; spring emits target with no RAF                      | Start owned spring scheduling after browser activation; initial state consistent              |
| Scroll/text       | Natural readable flow/static text                                           | Observer/split DOM only after safe client phase; preserve static-text contract                |

Do not SSR-write invisible initial state by default: it breaks no-JS content and flash/focus behavior.
CSS is appropriate for pre-hydration motion. Test throttled/delayed hydration, event replay and
incremental/deferred hydration where the supported Angular version exposes them. Directives operating
on SSR DOM before hydration need targeted fixtures, not a claim that platform guards guarantee
hydration. Retain browser object realm checks and DOCUMENT injection for iframe/test support.

## 19. Reduced motion and accessibility

A shared internal motion preference policy should be observable for long-lived new work. Today some
paths sample preferences once and others recheck. New scopes must react to preference changes,
settle safely and avoid replay when preference toggles back. App disabled combines with OS policy;
local false cannot defeat the OS preference.

| Work                          | Proposed reduced-motion behavior                                                          |
| ----------------------------- | ----------------------------------------------------------------------------------------- |
| Leaf/state                    | Commit final application state without interpolation                                      |
| Sequence/parallel/stagger     | Skip visual duration/delays, keep ordered functional outcomes; stop decorative repeats    |
| Router/View Transition        | Skip native and custom visual effects; commit route, focus and scroll as normal           |
| Layout/shared layout          | Use natural final geometry, release projection; no layout tween                           |
| Drag                          | Keep pointer-following feedback; clamp/snap release instantly, no momentum/gesture spring |
| Spring values                 | Emit source target; no RAF; pure transform derivation still works                         |
| Scroll/parallax/smooth scroll | Natural document flow/native scroll; no animation or interception                         |
| Presence                      | Complete removal/revival immediately according to state, no indefinite barrier            |

Motion cannot be the sole indicator of state. Preserve focus rings/activation, leave links tappable,
provide keyboard alternatives for reorder, avoid trapping focus in exiting DOM, coordinate modal focus
with app responsibilities, preserve reading order. Text splitting needs one accessible text equivalent,
not duplicated screen-reader content. Reduced motion alone does not prove input accessibility.

## 20. Performance model

WAAPI owns finite playback; do not convert every leaf into signal-per-frame JS. Layout batches reads
and writes, gesture writes have one owner, values derive synchronously. Stop JS work at rest or scope
destruction. On hidden document cancel decorative work or suspend bounded simulations; on resume reset
sample time and reconcile target without integrating an unbounded hidden interval. Exact resume policy
is a 1.8 decision with behavior tests.

Measure raw/minified/gzip core and narrow import bundles, task setup, spring keyframe generation,
per-frame scripting/layout, missed frames, GC and retained detached DOM. Mocked RAF counts are useful
structural checks, not evidence of low-end smoothness. [Validation budgets](VALIDATION.md) define
provisional thresholds to ratify against recorded hardware/baselines. Several hundred values are
stress characterization, not a promise all devices render them smoothly.

## 21. Package architecture

Retain the main package and public barrel while tree shaking works and no new dependency requires
isolation. Router integration can first be recipes; an optional secondary entry makes sense only for
an actual @angular/router peer boundary, independently avoidable bytes and clear compatibility tests.
Devtools can be separate opt-in tooling if production artifacts demonstrate no inspector retention.
Presets/recipe registry becomes external only for a substantial authored collection; keep existing
stable presets/exports available. Marketing/icons/product recipes do not justify core growth by default.

Illustrative `angular-movement/router`, `/devtools`, `/presets` names are not approved exports.
No experimental entry point purely to categorize existing APIs; 009/013 already rejected that split.
[MCP](../../projects/movement-mcp/README.md) remains a separate development tool/version with generated
snapshot and versioned guidance, not a runtime dependency. ng-packagr packaging and consumer install
checks must prove any future boundary.

## 22. DevTools strategy

First use existing dev warnings/MCP guidance and a website inspector prototype. Capture target, owner,
channel, preset, normalized timing, outcome/reason, reduced motion and layout scope; bound history and
release detached references. Never log arbitrary app data or attach a permanent production DOM observer.

| Option                            | Decision hypothesis                                                                                       |
| --------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Development-only opt-in inspector | Preferred if consumers use conflict diagnostics; minimal internal event hook, dead-code-elimination proof |
| Separate devtools package         | Justified when UI/runtime dependencies and release cadence warrant isolation                              |
| Website playground                | Cheapest early usability probe, not sufficient live-app inspection by itself                              |
| Browser extension                 | Defer until demand/maintenance budget justifies cross-browser support                                     |
| Angular DevTools integration      | Investigate supported extension points; do not depend on undocumented hooks                               |
| No inspector product              | Valid if warnings, recipes and MCP solve measured problems                                                |

Do not make an inspector a blocker if it provides no consumer benefit; production weight and correct
lifetime contracts are blockers. 1.9 cannot introduce a new ownership architecture just for tooling.

## 23. Migration strategy

[Migration strategy](MIGRATION-STRATEGY.md) defines legacy, 1.x upgrade and internal rollout. Classify
legacy constructs conservatively, prefer native CSS for simple first-paint behavior, require reviewed
presence/lifetime transformations for leave. Report unsupported/dynamic cases without deleting source.
No migration command currently exists. A dry-run reports exact source spans, confidence, chosen
alternative and manual steps. Idempotence and executable behavioral fixtures matter more than coverage.

Stable APIs stay compatible throughout 1.x. Experimental revisions are documented distinctly, with
bridge/warning at least one minor where practical. 1.9 previews only changes decided from evidence;
2.0 docs include cost/benefit per breaking change and rerun consumer migrations.

## 24. Compatibility strategy and candidate changes

Current peers are 21.2/22, not a timeless statement of the latest ecosystem majors. Maintain current
and previous supported Angular majors according to an explicit maintainer policy, rechecking official
support schedules each release; peer expansion needs package/AOT/runtime/SSR proof.
[Angular release policy](https://angular.dev/reference/releases).

| Current API                                    | Concrete concern                                                                    | Candidate / benefit                                          | Migration cost                                                                        | Why a major might be necessary; additive path first                                                                |
| ---------------------------------------------- | ----------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Same-element stable directives/animator        | Accidental conflicts/committed transient base; latest-player preemption misses work | Scoped channel ownership/restore; deterministic interruption | Visual behavior audit, wrappers or explicit role configuration in conflicting cases   | Default arbitration/restoration changes observable behavior; validate opt-in in 1.x before considering new default |
| Stable `AnimationControls.finished`            | Completion/cancel indistinguishable                                                 | Companion settlement result                                  | Optional result branching; no mandatory migration                                     | **No major needed**; keep resolving promise, additive API                                                          |
| Experimental layout/id                         | Global handover scope, transformed measurement and cancel cleanup                   | Scoped snapshots/projection and robust terminal cleanup      | Local id/scope options, potential wrapper/manual geometry recipes                     | May revise in 1.x; a major is not required merely because layout is experimental                                   |
| Experimental drag                              | Cancel/fling ambiguity, pointer/style ownership                                     | Bounded pointer lease/release contract                       | App pointercancel assumptions and touch-action choices; possible event detail changes | May revise in 1.x; promotion itself not a breaking justification                                                   |
| Experimental trigger                           | Duplicate imperative handle and inconsistent state application                      | Unified composition or declarative reset plus MoveAnimator   | Replace template handle calls with injected animator and explicit scope               | Can evolve experimentally in 1.x; assess actual handle users before removal                                        |
| Stable `moveActiveVariant` alias               | Naming overlap only                                                                 | Prefer moveVariant in docs                                   | Easy rename but no behavioral benefit                                                 | Permanent alias has low cost; retain by default, **no major justification**                                        |
| Stable aggregate/presets entry                 | Consumers may import experiments/all recipes                                        | Narrow imports/optional new entry                            | Existing imports must remain available                                                | Add optional entries first; only proven unavoidable peer/bundle restructuring could justify removal                |
| Stable transition Record type / variant `when` | Loose options/estimated durations                                                   | Add typed helper and explicit group barriers                 | Type and visual timing changes if replacement required                                | Rejecting formerly-valid objects or changing `when` is breaking; additive APIs likely sufficient                   |

No current established API is approved for removal. Potential major value is ownership default/lifecycle
convergence that cannot coexist indefinitely with old behavior, demonstrated by migration reports.
If opt-in/additive fixes suffice, do not remove compatibility merely for elegance.

## 25. Alternatives considered

CSS/native-only recipes are sufficient for simple adoption; use them in 1.3 and Router before adding
adapters. Exclusive whole-element ownership is easy but breaks valid independent opacity/transform
layering. Per-channel arbitration is more work but matches real conflicts; test wrappers as the
fallback. Universal JS transform mixer offers flexibility but increases frame/bundle cost; native
composition plus bounded special cases comes first. Shared frame scheduler may reduce callbacks,
but existing deterministic tests show linear growth and no leak; browser profiling decides.

Motion's native-focused mini versus broader hybrid and sequence model demonstrate the value of
bounded capability surfaces; learn vocabulary clarity, not its object/React lifecycle API.
[Motion animate](https://motion.dev/docs/animate). GSAP shows explicit timeline ownership and kill
behavior; learn scoped disposal without importing editor-grade seek/labels into Angular groups.
[GSAP timeline](https://gsap.com/docs/v3/GSAP/Timeline/),
[GSAP kill](<https://gsap.com/docs/v3/GSAP/Timeline/kill()/>).

## 26. Rejected ideas

Inventing breaks for 2.0; a huge 1.9→2.0 implementation leap; feature parity checklists; a second
presence system/router; mandatory inspector/extension; automatic conversion of arbitrary dynamic
legacy animations; immediate experimental promotion; compulsory custom motion-value objects; broad
preset dependencies; global MutationObserver cleanup by default; claiming browser APIs are uniformly
supported without feature tests; changing numeric timing units.

## 27. Risks and mitigations

| Risk                                                    | Mitigation and decision owner/milestone                                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Ownership mixer becomes a second runtime                | Maintainer 1.4/1.6: compare native/wrapper prototype costs; bound transform support                           |
| Layout geometry complexity delays gesture maturity      | 1.6: unsupported-case recipes and limited contract; no premature promotion                                    |
| Migration inference changes lifetime/business callbacks | 1.3: no-write diagnostic default, strict eligibility, runtime behavior fixtures                               |
| Router preview/API/browser changes                      | 1.5: supported-major adapters, feature detection, fallback and recorded upstream versions                     |
| Touch automation hides missing input                    | 1.7: physical iOS/Android sessions plus cancel/lost-capture evidence                                          |
| Sparse real consumers                                   | Every minor: recruit explicit projects/workflows; report missing evidence, do not equate demo with production |
| Scope exceeds solo-maintainer budget                    | Reuse existing contracts; reject optional systems with no measured demand; no dates                           |
| Compatibility mode persists forever                     | 1.9: record precise cost/benefit and migration feasibility before default change                              |
| SSR/hydration races mistaken for success                | 1.3 onward: tarball rendering/hydration, readiness assertions and delayed/no-JS checks                        |

## 28. 2.0 readiness gate

Every retained major capability exists and has consumer-tested semantics in 1.x; no major subsystem
is introduced in 2.0. All [validation gates](VALIDATION.md) have pinned versions, artifacts and
maintainer review. Every public symbol/member and experiment has final disposition/migration;
ownership, cancellation, coordinate spaces, route lifecycle, accessibility and scheduling policy have
no unresolved blocking decision. Accepted unsupported cases are documented boundaries, not bugs hidden
by skips. Migrations run on representative projects and physical touch evidence exists for gestures.

Finally require a **breaking-change benefit/cost record**: why additive options cannot reasonably
provide the benefit, which users change, tested migration cost, and compatibility retention cost.
If no significant breaking change remains, 2.0 is unnecessary. Preserve the 1.x release line and its
quality gains instead of inventing a boundary.
