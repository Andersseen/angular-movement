# Spec 006 — 0.8: list presence, shared layout, imperative API, reactivity freeze

- **Status:** draft
- **Created:** 2026-08-17
- **Last updated:** 2026-08-17
- **Breaks public API:** no — additive only, plus one documentation correction. Requires approval
  because it adds three new public exports that 1.0 will freeze.
- **Related:** `ROADMAP.md` 0.6 (deferred reactivity item) and 1.0 (API freeze), spec 004

## Problem / motivation

0.7 closed the packaging and validation gaps. What is left before the surface can be frozen is a
mix of one genuine capability hole and three pieces of API debt that a major version cannot undo.

1. **Exit animations do not work for lists.** `*movePresence` takes a **boolean** and guards **one**
   template. The single most common motion pattern in real apps — items leaving a `@for` (toasts,
   filtered grids, todo rows, tab panels) — has no solution at all, because `@for` destroys the
   embedded view before any directive can react. This is the same class of problem as the
   `moveLeave` + `@if` gotcha in STATE.md, except that one has a documented workaround and this one
   does not. It is the largest functional gap against Framer Motion.

2. **`moveLayoutId` is a dead input.** Declared at `move-layout.directive.ts:35`, listed in
   `src/app/shared/api/directive-reference.ts:281`, exercised in `validation/consumer/src/app.ts:103`
   — and read by no code anywhere. Setting it is a silent no-op. Shipping 1.0 with a documented
   input that does nothing is the worst of the three possible outcomes.

3. **There is no supported imperative API.** `lib/movement.ts` exports `animation-controls` but not
   `animation-engine.service`, and the package `exports` map blocks deep imports. Anything that
   needs to animate outside a directive — sequencing, animating on an HTTP response, driving a
   third-party element — has no sanctioned path.

4. **The documented input-reactivity contract is partly false.** README claims `moveLoop` and
   `moveText` are init-only; both have a constructor `effect()` that reads every input
   (`move-loop.directive.ts:45`, `move-text.directive.ts:66`, the latter with a comment stating the
   intent). Separately `[moveAnimation]` **is** genuinely init-only, which contradicts the Framer
   contract it copies: `animate` is a state, and changing a state should animate to it. Freezing 1.0
   on a table that is both wrong and inconsistent bakes the problem in.

## Proposed solution

### 1. `*movePresenceFor` — presence for keyed lists

A structural directive that owns its `ViewContainerRef` and does its own keyed diffing, so it can
hold a removed item's view in the DOM until that item's leave animation resolves.

```html
<ul>
  <li
    *movePresenceFor="let toast of toasts(); trackBy: byId; mode: 'sync'"
    [moveAnimation]="{ initial: { opacity: 0, y: -20 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, x: 100 } }"
  >
    {{ toast.message }}
  </li>
</ul>
```

- Inputs (microsyntax): `movePresenceForOf`, `movePresenceForTrackBy`, `movePresenceForMode`.
- Context: `$implicit`, `index`, `count`, `first`, `last`, `even`, `odd` — matching `NgForOf` so the
  template idioms people already know keep working.
- `mode: 'sync'` (default) — entering and leaving items animate concurrently.
  `mode: 'wait'` — leaves resolve fully before new items are created.
- Each rendered item gets **its own** `MOVE_PRESENCE_PARENT` scope, so a child directive registers
  against its own row rather than the whole list. Existing presence children
  (`MoveAnimateDirective`, `MoveAnimationDirective`, `MoveLeaveDirective`, `MoveVariantsDirective`)
  work unchanged — they already implement `MovePresenceChild`.
- Re-adding a key while it is leaving cancels the leave and reuses the view, mirroring the existing
  `#removeToken` behaviour in `MovePresenceDirective`.

### 2. Shared layout transitions (`moveLayoutId`)

An internal root registry maps `layoutId` → `{ element, rect }`, refreshed for live elements on
every render pass. When a `[moveLayout]` element mounts with a `moveLayoutId` already held by a
**different** element, it FLIPs from that element's last known rect instead of from its own — the
"magic move" between two distinct DOM nodes.

```html
@if (selected() === null) {
<div moveLayout [moveLayoutId]="'card'" class="thumb">…</div>
} @else {
<div moveLayout [moveLayoutId]="'card'" class="expanded">…</div>
}
```

Entries carry a timestamp and are ignored past a max age so a node mounting minutes later never
animates from a stale position. The registry stays **internal**; only the input is public.

### 3. `MoveAnimator` — the supported imperative API

An `@Injectable({ providedIn: 'root' })` facade over `AnimationEngine` that resolves partial options
against `MOVEMENT_CONFIG` and reduced motion, so callers get the same semantics as directives.

```ts
readonly #animator = inject(MoveAnimator);

async flash(el: HTMLElement) {
  const controls = this.#animator.animate(el, { opacity: [0, 1], y: [20, 0] }, { duration: 400 });
  await controls?.finished;
}
```

`AnimationEngine` itself stays **unexported**. Exposing only the facade keeps the engine free to
change after 1.0, which is the whole point of freezing a surface.

### 4. Reactivity: correct the contract, then freeze it

- Fix the README/ARCHITECTURE tables: `moveLoop` and `moveText` are **reactive**, not init-only.
- Make `[moveAnimation]` reactive: changing `animate` animates from the current state to the new
  one. `initial` stays first-render-only, and `exit` stays leave-only.
- Keep `moveEnter`, `moveInView`, `[move]`/`[moveAnimate]`, `moveLeave` and `moveSmoothScroll`
  one-shot **by design**, and say so explicitly in the docs as a semantic guarantee rather than an
  unresolved roadmap item.

## Out of scope

- `mode: 'popLayout'` (absolute-positioning exiting items so siblings reflow immediately) — noted as
  a follow-up. `sync` + `wait` only.
- `repeat` / `repeatType: reverse | mirror` / `repeatDelay` — real gap, deliberately deferred.
- `whileDrag`, keyframe `times`/offsets, per-property easing, variant orchestration
  (`staggerChildren` / `delayChildren` / `when`) — all deferred.
- No change to `MovePresenceDirective`'s existing boolean behaviour or selector. `*movePresenceFor`
  is a sibling, not a replacement.
- No change to any existing selector, input name, output name, or export removal —
  `api-surface --json` diff must show additions only.
- No new runtime dependency.

## Acceptance criteria

- [ ] `*movePresenceFor` renders a keyed list, animates entering items, and holds a removed item's
      view in the DOM until its `playLeave()` resolves, then removes it.
- [ ] Removing an item from the source array while another is still leaving does not drop or
      duplicate views; re-adding a leaving key cancels its leave and reuses the view.
- [ ] `mode: 'wait'` defers creation of new views until all pending leaves resolve.
- [ ] Each item's presence children register against that item only — leaving item A does not
      trigger a leave animation on item B (asserted with two items and a spy per host).
- [ ] Reordering the source array moves existing views instead of recreating them (identity of the
      root node is preserved across a reorder).
- [ ] `[moveLayoutId]` on two different elements sharing an id produces a FLIP from the outgoing
      element's rect; a stale registry entry past max age does not animate.
- [ ] `MoveAnimator.animate()` is exported, resolves defaults from `MOVEMENT_CONFIG`, honours
      reduced motion, returns `AnimationControls | null`, and no-ops on the server.
- [ ] `AnimationEngine` remains **absent** from the public API surface.
- [ ] `[moveAnimation]` re-animates when its `animate` state changes; `initial` does not re-apply.
- [ ] README + `docs/ai/ARCHITECTURE.md` reactivity tables match the code for all 20 directives
      (`moveLoop` and `moveText` corrected).
- [ ] Unit tests: `move-presence-for.directive.spec.ts`, `move-layout.directive.spec.ts` (shared-id
      cases), `move-animator.spec.ts`, `move-animation.directive.spec.ts` (reactivity), plus
      `ssr.spec.ts` and `teardown.spec.ts` extended to cover the new directive.
- [ ] `node .claude/scripts/api-surface.mjs --json` diff vs `v0.7.0` shows additions only.
- [ ] `pnpm test:coverage`, `ng lint`, `pnpm build`, `pnpm e2e`, `pnpm pack:check` all pass.
- [ ] CHANGELOG.md (Unreleased) and docs/ai/STATE.md updated.

## Implementation plan

- [ ] 1. `projects/movement/src/lib/tokens/presence.tokens.ts` — no signature change; confirm
     `MovePresenceProvider` is sufficient for a per-item scope.
- [ ] 2. `projects/movement/src/lib/directives/move-presence-for.directive.ts` — new structural
     directive. Per-item `Injector.create({ providers: [MOVE_PRESENCE_PARENT …] })` passed to
     `createEmbeddedView(tpl, ctx, { injector })`.
     **Validated before writing the spec** — see Verification notes. The fallback (attributing
     registrations by matching the child's host element against `view.rootNodes`) is not needed.
- [ ] 3. Colocated `move-presence-for.directive.spec.ts`.
- [ ] 4. `projects/movement/src/lib/directives/shared-layout.registry.ts` — internal root service.
- [ ] 5. `projects/movement/src/lib/directives/move-layout.directive.ts` — consume the registry;
     publish the live rect each render; read the peer rect on mount.
- [ ] 6. Extend `move-layout.directive.spec.ts` with shared-id and stale-entry cases.
- [ ] 7. `projects/movement/src/lib/engines/move-animator.service.ts` + colocated spec.
- [ ] 8. `projects/movement/src/lib/directives/move-animation.directive.ts` — move the play into an
     `effect()` keyed on the `animate` state; keep `initial` first-render-only.
- [ ] 9. `projects/movement/src/lib/engines/animation-engine.service.ts` — collapse the dead
     `if`/`else` at lines 111-115 (both branches call the same `setProperty`).
- [ ] 10. `projects/movement/src/lib/movement.ts` — add `MovePresenceForDirective` to
      `MOVEMENT_DIRECTIVES` + `export *` lines for the directive and `MoveAnimator`.
- [ ] 11. `src/app/pages/demos/presence-list/` demo page + demos navigation entry.
- [ ] 12. `src/app/shared/api/directive-reference.ts` — new directive entry (`docs:check` gate).
- [ ] 13. Docs: README (both), `docs/ai/ARCHITECTURE.md` directive table + reactivity table,
      stability table (`*movePresenceFor` and `MoveAnimator` start as **candidate**;
      `moveLayout` stays experimental).
- [ ] 14. `e2e/demos.spec.ts` — list add/remove/reorder coverage. Settle before asserting; read
      every transform channel via `motionState()`.
- [ ] 15. Phase 6 bookkeeping: CHANGELOG Unreleased + STATE.md.

## Verification notes

**Baseline (2026-08-17, before any change):** `pnpm test:coverage` green, ~95% statements across
`lib/`. Any regression below that is caused by this spec.

**Per-view injector — validated 2026-08-17, throwaway probe, since deleted.** Two embedded views
created via `vcr.createEmbeddedView(tpl, {}, { injector })`, each injector providing a distinct
`MOVE_PRESENCE_PARENT` value. A child directive inside each view resolved **its own** scope
(`["A","B"]`), not the declaration site's. So per-item presence scoping needs no change to
`MovePresenceChild` / `MovePresenceProvider` and no element-matching fallback.

<Remaining sections filled in during implementation.>

## Follow-ups (out of scope, noted for later)

- `mode: 'popLayout'` for `*movePresenceFor`.
- `repeat` / `repeatType: reverse | mirror` / `repeatDelay` — `moveLoop` currently restarts hard at
  frame 0 each cycle because `WaapiPlayer` never sets `direction`.
- `whileDrag` — drag is the only gesture without a `while*` state.
- Keyframe `times`/offsets and per-property easing (`transition-composer.ts:79` warns it is
  unsupported).
- Variant orchestration inside variants: `staggerChildren`, `delayChildren`, `when`.
- `SmoothScrollService` scoped-instance API — the `moveSmoothScroll` no-op gotcha in STATE.md still
  blocks that directive leaving experimental.
