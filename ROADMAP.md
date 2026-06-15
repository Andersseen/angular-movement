# Roadmap

This roadmap is intentionally focused on making angular-movement stable and useful in real Angular
projects. New features are welcome, but the main priority before `1.0` is predictability.

## 0.6 - API hardening

- Define which APIs are stable and which are experimental.
- Tighten transform composition so layout, drag, and keyframe animations do not fight over inline
  styles.
- Clarify dynamic input behavior for directives that currently run once on init.
- Add more tests for interrupted animations, reduced motion, SSR guards, and nested directives.

## 0.7 - Real app validation

- Test the library in at least two non-demo Angular apps.
- Add richer e2e coverage for drag, scroll, presence, and variants.
- Improve docs around common Angular patterns such as `@if`, `@for`, SSR, and standalone imports.
- Add migration notes for any renamed or deprecated APIs.

## 1.0 - Stable release

- Freeze the public API surface.
- Publish stable docs for each directive.
- Confirm Angular peer dependency policy.
- Keep package output minimal and verified with `pack:check`.
- Provide clear upgrade notes from the latest `0.x` release.

## Later ideas

- Visual regression tests for selected demos.
- More preset packs for product UI, icons, and route transitions.
- Better imperative controls for advanced orchestration.
- Additional examples for dashboards, SaaS apps, marketing pages, and mobile UI.
