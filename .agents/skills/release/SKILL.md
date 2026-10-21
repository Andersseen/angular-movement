---
name: release
description: Runs the pre-release audit for the movement library and reviews the automated Release PR — API surface check, docs drift check, verification gate, changelog review. Releases are cut by merging the Release PR, never by hand. Use when preparing or reviewing a library release.
disable-model-invocation: true
---

# Release

Releases are automated (see `docs/RELEASING.md`): release-please keeps one **`chore(release):
angular-movement vX.Y.Z`** PR open; merging it tags the commit, runs every gate and publishes to npm
through OIDC. **There is no version bump, tag push or `npm publish` to run. Never merge the Release PR
without explicit user confirmation — merging it publishes.**

The full list lives in `RELEASE_CHECKLIST.md`. This skill is the order to work it in.

## 1. Audit before touching versions

```bash
node .Codex/scripts/api-surface.mjs
```

Run both read-only agents and wait for their findings:

- `public-api-guard` — classifies changes as BREAKING / ADDITIVE / INTERNAL against the last tag.
  This determines the version bump; do not guess it.
- `docs-drift-checker` — no release ships docs that name inputs that do not exist.

## 2. Full verification gate

Run `/verify`, forcing every conditional — a release touches the package output and the demo site:

```bash
pnpm test:coverage && pnpm run lint && pnpm build && pnpm run build:prod && pnpm run pack:check
E2E_PORT=5174 pnpm exec playwright test
```

All must pass. A release with a failing check is not a release.

## 3. Runtime smoke

`RELEASE_CHECKLIST.md` lists the routes to check by hand. They cover behavior unit tests cannot see:
`/demos/icons` (SVG path drawing), `/demos/variants` (state switching), `/demos/drag` (constraints,
momentum, snap points), `/demos/layout` (grid↔list reorder without clipping), `/demos/leave`
(`movePresence` exit before DOM removal). If the Playwright MCP server is configured, drive these
directly; otherwise ask the user to confirm them.

## 4. Package review

- `projects/movement/package.json` version and `peerDependencies` range are correct.
- `projects/movement/README.md` matches the root README's positioning.
- The Release PR's `CHANGELOG.md` section lists everything in this release, matching the agent's classification.
- Packed output excludes demo-site files (`pnpm pack:check` output).

## 5. Review the Release PR

```bash
gh pr list --label "autorelease: pending"       # the open Release PR, if any
gh pr view <n>                                   # proposed version + notes
```

The proposed version must match the audit: BREAKING → major, ADDITIVE → minor, fixes only → patch.
If it does not, do not edit versions — add a `Release-As: X.Y.Z` footer to a commit via PR, or fix the
commit types. Check the `CHANGELOG.md` section on the PR branch.

## 6. Publish — confirm first

Merging the Release PR (**Squash and merge**) is the publish action. Confirm with the user first, then
watch `gh run watch` on the `Release` workflow. It is done when the run summary says
"Release fully completed". Failures and recovery: `docs/RELEASING.md` (re-run failed jobs, or
`gh workflow run release.yml --ref main -f tag=vX.Y.Z`).

## 7. Record

Update `docs/ai/STATE.md` — library version, branch state, roadmap phase — and mark the release in
`ROADMAP.md` if it closes a phase.
