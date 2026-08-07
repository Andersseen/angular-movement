# Roadmap

This roadmap is intentionally focused on making angular-movement stable and useful in real Angular
projects. New features are welcome, but the main priority before `1.0` is predictability.

## 0.6 - API hardening — released 2026-08-07

- [x] Define which APIs are stable and which are experimental.
- [x] Tighten transform composition so layout, drag, and keyframe animations do not fight over
      inline styles.
- [x] Add more tests for interrupted animations, reduced motion, SSR guards, and nested directives.
- [ ] Clarify dynamic input behavior for directives that currently run once on init — documented in
      the README, but the reactive-vs-init-only decision is deferred to 1.0.

## 0.7 - Real app validation — complete

- [x] Add richer e2e coverage for drag, scroll, presence, and variants.
- [x] Test the library in at least two non-demo Angular apps. `pnpm validate:consumer` compiles the
      packed package inside a real Angular app per supported major, in CI and before every publish.
      It immediately found the library uninstallable on Angular 22.
- [x] Improve docs around common Angular patterns such as `@if`, `@for`, SSR, and standalone imports
      (`/docs/patterns`).
- [x] Add migration notes for any renamed or deprecated APIs (`MIGRATION.md`).

## 1.0 - Stable release

- Freeze the public API surface.
- Publish stable docs for each directive.
- Confirm Angular peer dependency policy. **Decided:** support the current and previous majors
  (`^21.2.0 || ^22.0.0` today), each verified by `validate:consumer` in CI.
- Keep package output minimal and verified with `pack:check`.
- Provide clear upgrade notes from the latest `0.x` release.

## Later ideas

- Visual regression tests for selected demos.
- More preset packs for product UI, icons, and route transitions.
- Better imperative controls for advanced orchestration.
- Additional examples for dashboards, SaaS apps, marketing pages, and mobile UI.
