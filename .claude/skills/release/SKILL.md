---
name: release
description: Runs the pre-release audit and cuts a version of the movement library — verification gate, API surface check, docs drift check, changelog roll, and the tag push that triggers the npm publish workflow. Use when preparing or publishing any library version.
disable-model-invocation: true
---

# Release

Publishing is irreversible: pushing a `v*.*.*` tag triggers `.github/workflows/release.yml`, which
publishes to npm with provenance and creates the GitHub Release. **Never push a tag without explicit
user confirmation.**

The full manual list lives in `RELEASE_CHECKLIST.md`. This skill is the order to work it in.

## 1. Audit before touching versions

```bash
node .claude/scripts/api-surface.mjs
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
- `CHANGELOG.md` Unreleased lists everything in this release, matching the agent's classification.
- Packed output excludes demo-site files (`pnpm pack:check` output).

## 5. Cut it

The script does the bump, the changelog roll, the commit and the tag — do not do these by hand:

```bash
pnpm release minor --dry-run    # preview first, writes nothing
pnpm release minor              # or: patch | major | an explicit 0.7.0
```

Bump choice follows the audit: BREAKING → major (or minor while `0.x`, but say so explicitly),
ADDITIVE → minor, fixes only → patch.

## 6. Publish — confirm first

```bash
git push origin main
git push origin vX.Y.Z          # ← this publishes to npm. Confirm with the user first.
```

Then watch the workflow: `gh run watch`. The tag-vs-package-version guard in the workflow fails the
run if they disagree.

## 7. Record

Update `docs/ai/STATE.md` — library version, branch state, roadmap phase — and mark the release in
`ROADMAP.md` if it closes a phase.
