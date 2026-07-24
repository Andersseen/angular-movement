# Release Checklist

Use this checklist before publishing `angular-movement`.

## Verification

- [ ] `pnpm test:coverage`
- [ ] `pnpm lint`
- [ ] `E2E_PORT=5174 pnpm exec playwright test`
- [ ] `pnpm build`
- [ ] `pnpm run pack:check`

## Runtime Smoke

- [ ] Home page renders.
- [ ] `/docs/api`, `/docs/reference`, and `/docs/presets` render.
- [ ] `/demos/icons` shows visible SVG path drawing.
- [ ] `/demos/variants` switches states without template errors.
- [ ] `/demos/drag` respects constraints, momentum, and snap points.
- [ ] `/demos/layout` switches grid/list and reorders without clipping.
- [ ] `/demos/leave` uses `movePresence` for exit animation before DOM removal.

## Package Review

- [ ] `projects/movement/package.json` version is correct.
- [ ] `projects/movement/README.md` matches the root README positioning.
- [ ] `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, and `ROADMAP.md` are current.
- [ ] `CHANGELOG.md` includes the release notes.
- [ ] Public exports are reachable from `projects/movement/src/public-api.ts`.
- [ ] The packed output does not include demo-site-only files.

## Community Review

- [ ] GitHub issue templates still match the current API surface.
- [ ] Pull request checklist matches the checks maintainers expect.
- [ ] CI and deploy workflows do not require secrets for normal pull request validation.

## Publish via CI (recommended)

The [`Release` workflow](.github/workflows/release.yml) publishes to npm and creates the GitHub
Release automatically when a version tag is pushed.

- [ ] One-time setup: add an npm **Automation** token as the `NPM_TOKEN` repository secret.
- [ ] Make sure the `CHANGELOG.md` **Unreleased** section lists everything in this release.
- [ ] Run the release script — it bumps `projects/movement/package.json`, rolls the changelog
      (`Unreleased` → `[X.Y.Z] - <date>`), commits `chore(release): vX.Y.Z`, and tags:

  ```bash
  pnpm release minor              # or: patch | major | an explicit 0.6.0
  pnpm release minor --dry-run    # preview first, writes nothing
  pnpm release minor --push       # also pushes the commit + tag (triggers CI)
  ```

- [ ] If you didn't pass `--push`, trigger CI with `git push --follow-tags`.
- [ ] Watch the run: it verifies the tag/version match, lints, tests, builds, validates the package,
      publishes to npm with provenance, and creates the GitHub Release.
- [ ] Verify the published package page and install command.

## Publish manually (fallback)

- [ ] Confirm npm auth with `npm whoami`.
- [ ] Run `pnpm run pack:check`.
- [ ] Publish with `pnpm run lib:publish`.
- [ ] Verify the published package page and install command.
