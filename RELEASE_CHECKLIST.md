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

## Publish

- [ ] Confirm npm auth with `npm whoami`.
- [ ] Run `pnpm run pack:check`.
- [ ] Publish with `pnpm run lib:publish`.
- [ ] Verify the published package page and install command.
