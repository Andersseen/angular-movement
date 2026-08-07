# Spec 004 — Complete the 0.7 milestone: real-app validation, Angular 22, docs

- **Status:** done
- **Created:** 2026-08-07
- **Last updated:** 2026-08-07
- **Breaks public API:** no (peer range widens — strictly additive)
- **Related:** `ROADMAP.md` 0.7, specs 002 and 003

## Problem / motivation

`0.7.0` shipped with three ROADMAP items still open, and the first of them was hiding a shipping
defect:

1. **Real-app validation had never happened.** The demo site imports the library through a Vite
   source alias (`movement` → `projects/movement/src/public-api.ts`), so **nothing in the repo ever
   compiled the published package**. Packaging-level breakage was structurally invisible.
2. **Angular 22.1.0 is stable and is npm `latest`**, while the library's peer range was `^21.2.0`
   only. A user running `ng new` today and then `npm install angular-movement` got an `ERESOLVE`
   peer conflict — the library was effectively uninstallable for new projects.
3. No docs for the Angular patterns people actually trip over (`@if` + leave, `@for` + stagger,
   SSR, standalone imports), and no migration notes.

Point 2 is a direct consequence of point 1: with no consumer validation, nothing could catch it.

## Proposed solution

1. `scripts/validate-consumer.mjs` + a committed `validation/consumer/` fixture: pack the library,
   install the **tarball** into a throwaway Angular app outside the workspace with a plain
   `npm install` (strict peers), and compile it AOT with `strictTemplates` — once per supported
   major, with the major list derived from the library's own peer range.
2. Widen peers to `^21.2.0 || ^22.0.0` and prove both work.
3. Wire the validation into CI **and** into `release.yml` before the publish step.
4. A `/docs/patterns` page and a root `MIGRATION.md`.

## Out of scope

- No directive behaviour change.
- No selector, input, output or export change (`api-surface` diff must stay empty).
- SSR of the built package: attempted via the application builder's prerender, abandoned because it
  needs an `ssr.entry` Express server. Already covered by `ssr.spec.ts` (18 directives on
  `PLATFORM_ID: 'server'`) and the demo site's own AnalogJS prerender. Recorded as a follow-up.
- Dependency upgrades beyond the GitHub Actions bump: 37 packages are outdated, including a
  TypeScript 6 / Angular 22 toolchain move for this repo. That is its own spec.

## Acceptance criteria

- [x] `pnpm validate:consumer` packs the library and compiles it inside a real Angular app.
- [x] The supported-major list is derived from the peer range, so it cannot drift from what the
      package claims.
- [x] Angular 21 and 22 both install with strict peers and build AOT.
- [x] The validation runs in CI and as the last gate before publish in `release.yml`.
- [x] `/docs/patterns` covers `@if` + leave, `@for` + stagger + `track`, SSR, standalone imports and
      reduced motion; it is in the docs nav and has an e2e smoke test.
- [x] `MIGRATION.md` documents 0.5→0.6 and 0.7→0.8, marking each entry breaking or advisory.
- [x] README, package README, docs and the Angular badge state both supported majors.
- [x] GitHub Actions no longer emit the Node 20 deprecation warning.
- [x] Full gate green; `api-surface` identical.

## Results

The harness found the Angular 22 defect on its first real run — the exact failure a user would hit:

```
npm error Could not resolve dependency:
npm error peer @angular/common@"^21.2.0" from angular-movement@0.7.0
```

After widening the range, both majors pass install + AOT build.

| Check                          | Angular 21 | Angular 22 |
| ------------------------------ | ---------- | ---------- |
| `npm install` (strict peers)   | pass       | pass       |
| `ng build` (AOT, strict types) | pass       | pass       |

## What the fixture exercises

`validation/consumer/src/app.ts` mounts every directive and signal helper in one AOT-compiled
template, so the shipped `.d.ts` is type-checked against real bindings: presets and keyframes, both
binding shapes, attribute-style coercion (`moveDuration="400"`), `exportAs` refs
(`#scroll="moveScroll"`), outputs (`(moveDragEnd)`), `*movePresence`, `@for` + `moveStagger`, and
`moveValue` / `moveTransform` / `moveSpringValue`.

## Verification notes

| Command                  | Result                                    |
| ------------------------ | ----------------------------------------- |
| `pnpm validate:consumer` | Angular 21 and 22 both pass install + AOT |
| `pnpm test:coverage`     | 378 tests, 93.56% stmts, 86.49% branch    |
| `ng lint`                | both projects pass                        |
| `pnpm build`             | site builds and prerenders                |
| `pnpm e2e`               | 43 passed                                 |
| `pnpm docs:check`        | 20/20 directives match                    |
| `api-surface` diff       | identical                                 |

Dead ends worth not repeating: the application builder's `prerender` is ignored when `outputMode`
is set, and `outputMode: 'server'` requires an `ssr.entry`. Route extraction also fails with a
minified `NG0401` unless the app provides a Router. Getting SSR-of-the-built-package needs a fuller
fixture than this spec justified.

## Follow-ups (out of scope, noted for later)

- SSR-render the built package in the consumer fixture (needs an `ssr.entry` server).
- Toolchain upgrade: 37 outdated packages, and this repo still builds on Angular 21 / TypeScript 5.9
  while supporting consumers on Angular 22 / TypeScript 6. Worth its own spec.
- Add Angular 22 to the CI test matrix for the library's own unit tests, not just the consumer app.
- Enable Dependabot alerts (currently disabled for the repository).
