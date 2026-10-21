# Contributing to angular-movement

Thanks for helping improve angular-movement. This project aims to provide Angular-native motion
primitives that feel predictable in production apps, not just impressive in demos.

## Project shape

- `projects/movement` is the npm library.
- `src` is the AnalogJS documentation and demo site.
- The demo app imports the library source through the local `movement` path alias, so library
  changes show up immediately in demos.

## Local setup

```bash
pnpm install
pnpm dev
```

Useful checks:

```bash
pnpm test:coverage
pnpm lint
pnpm run pack:check
pnpm build
pnpm e2e
```

For focused library tests:

```bash
pnpm exec ng test movement --include='**/move-hover.directive.spec.ts' --watch=false
```

## What makes a good contribution

- Keep changes small and focused.
- Prefer Angular signals APIs such as `input()`, `signal()`, and `effect()`.
- Keep DOM and browser APIs SSR-safe.
- Add or update tests for library behavior changes.
- Update the docs or demos when public API behavior changes.
- Avoid adding dependencies unless they clearly improve the library surface.

## Commit style

This repo uses Conventional Commits:

```text
feat: add moveStaggerStep alias
fix: cancel interrupted presence leave animations
docs: clarify drag constraints
test: cover nested variants
```

Allowed types are configured in `.commitlintrc.json`.

## Pull request checklist

Before opening a PR, try to run:

```bash
pnpm test:coverage
pnpm lint
pnpm run pack:check
```

For UI or docs changes, also run:

```bash
pnpm build
pnpm e2e
```

If you cannot run a check locally, mention it in the PR description.

## Release notes

Public API changes should update `CHANGELOG.md`. Keep unreleased changes under `## Unreleased`; when
the maintainer merges the Release PR those notes are folded into the new version section
automatically.

Releases are automated — do not bump `projects/movement/package.json`, push tags or publish. Your
commit type decides the next version: `feat:` → minor, `fix:` → patch, `feat!:`/`BREAKING CHANGE:` →
major; `docs:`/`test:`/`refactor:`/`chore:` and changes outside `projects/movement/` do not release.
Squash merges use the **PR title** as the commit message, so it must be a Conventional Commit (CI
checks it). See [docs/RELEASING.md](docs/RELEASING.md).
