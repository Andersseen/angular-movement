# movement-migrate (assessment prototype)

A **read-only** assessment of legacy `@angular/animations` usage. It tells you which triggers could
move to Angular Movement, which need a decision, and which should stay CSS / native Angular. It
**never writes files** — suggestions are printed, not applied.

> Status: 1.3 prototype, `private`, **not published to npm**. There is no `npx` command; run it from
> a clone of this repository.

```bash
pnpm install
pnpm migrate:build
pnpm migrate:assess ../my-app/src            # text report
pnpm migrate:assess ../my-app/src --json     # JSON report
pnpm migrate:test                            # classifier tests
```

## How it decides

Analysis uses the TypeScript compiler API for `trigger(...)` metadata and Angular's own template
parser (`@angular/compiler`) for bindings — no regular expressions over source. Triggers exported
from other files (`export const fade = trigger(...)`) are resolved by name within the scanned folder.

| Class                   | Meaning                                                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **automatic candidate** | Static `:enter` tween (`style(from)` + `animate(literal timing, style(to))`) on `opacity`/`transform` with identical property sets, plain `translate/scale/rotate` in px/deg, no `params`, no callbacks, every binding static (`@name`). |
| **partial**             | Part maps cleanly: enter+leave (leave needs `*movePresence` / `*movePresenceFor` or native `animate.leave`), state-driven triggers (`moveVariants`), `[@name]="expr"` bindings, callbacks.                                               |
| **manual**              | `query`, `stagger`, `group`, `sequence`, `animateChild`, `keyframes`, `useAnimation`, `params`, non-literal values, unresolved or host-bound triggers, providers, `AnimationBuilder`.                                                    |
| **keep native / CSS**   | Triggers that only animate layout/paint properties (height, width, colour, …).                                                                                                                                                           |

`provideAnimations()` and friends are always reported as manual: keep them until no trigger binding
remains.

## Not implemented (on purpose)

No rewrite mode, no schematic, no provider removal. Automatic edits require fixture-proven, idempotent
transformations with compile and runtime tests; that bar is not met in 1.3.

## Dependencies

Peer dependencies only: `typescript` and `@angular/compiler`, resolved from the repository root.
Nothing is added to the `angular-movement` runtime package.
