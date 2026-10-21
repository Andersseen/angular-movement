# Release Checklist

Use this checklist when reviewing a release of `angular-movement` (the Release PR) or the MCP package.

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

- [ ] `projects/movement/package.json` version is the one the Release PR proposes (never edit it by hand).
- [ ] `projects/movement/README.md` matches the root README positioning.
- [ ] `LICENSE`, `SECURITY.md`, `CONTRIBUTING.md`, and `ROADMAP.md` are current.
- [ ] `CHANGELOG.md` includes the release notes (the Release PR writes the section).
- [ ] Public exports are reachable from `projects/movement/src/public-api.ts`.
- [ ] The packed output does not include demo-site-only files.

## Community Review

- [ ] GitHub issue templates still match the current API surface.
- [ ] Pull request checklist matches the checks maintainers expect.
- [ ] CI and deploy workflows do not require secrets for normal pull request validation.

## Publish the library (automated)

Releases are driven by [release-please](docs/RELEASING.md); there is **no manual version bump, tag or
`npm publish`**. The full guide is [docs/RELEASING.md](docs/RELEASING.md).

One-time setup (maintainer): see _One-time setup_ in the guide — allow Actions to create PRs, create
the `npm-publish` environment, and register the npm trusted publisher (`Andersseen/angular-movement`,
workflow `release.yml`, environment `npm-publish`).

Per release:

- [ ] Open the **`chore(release): angular-movement vX.Y.Z`** PR that the `Release` workflow keeps up to
      date. If there is none, there is nothing releasable (only `feat`/`fix`/breaking commits under
      `projects/movement/` count).
- [ ] The proposed version is what you expect (override with a `Release-As:` commit footer if not).
- [ ] The `CHANGELOG.md` section reads well (hand-written `## Unreleased` notes are folded in
      automatically; edit the section on the PR branch to polish it).
- [ ] The checks above that need a human eye (runtime smoke, package review) are done.
- [ ] **Squash and merge** the Release PR. That is the approval.
- [ ] Watch the `Release` run. Every gate runs on the release commit; npm publishes through OIDC with
      provenance; the GitHub Release goes public only after npm is verified.
- [ ] The run summary says **Release fully completed**. If not, follow _Recovery_ in the guide.
- [ ] Spot-check the npm page (provenance badge) and `npm view angular-movement version`.

## Publish `angular-movement-mcp` (independent package)

Separate package, separate version line (`projects/movement-mcp/package.json`), separate CI
workflow (`.github/workflows/release-mcp.yml`) — see `docs/ai/specs/012-mcp-server-and-skill.md`.
It is not managed by release-please: bump the version by hand and tag it (below).

- [ ] Bump `projects/movement-mcp/package.json` version, update `CHANGELOG.md` if relevant.
- [ ] Regenerate the API snapshot if any directive changed since the last publish:
      `pnpm run mcp:snapshot` (from repo root).
- [ ] Commit, then tag with the `mcp-v` prefix (not `v` — that prefix is reserved for
      `angular-movement` itself): `git tag mcp-v0.1.0 && git push origin mcp-v0.1.0`.
- [ ] CI verifies the tag is on `main` and matches the version, builds, tests, validates the package, and
      publishes with provenance. Authentication is the `NPM_TOKEN` secret until you set the repository
      variable `MCP_NPM_AUTH=oidc` (see docs/RELEASING.md).
- [ ] Verify the published package page and `npx angular-movement-mcp init` in a scratch repo.
