# Spec 017 — Automated release pipeline

- **Status:** in-progress (setup PR; first release not yet cut)
- **Created:** 2026-10-21
- **Last updated:** 2026-10-21
- **Breaks public API:** no (no library source change; `api:check` unchanged)
- **Related:** `docs/RELEASING.md`, spec 016 (the 1.3 milestone this pipeline will release first)

## Problem / motivation

Releases were manual: bump `package.json`, roll `CHANGELOG.md`, tag locally (`pnpm release`), push the
tag, and let a tag-triggered workflow publish with a long-lived `NPM_TOKEN`. STATE.md records the
failure mode twice (tags created locally long before being pushed, leaving `package.json` and npm
disagreeing). The token is a standing credential, and the tag-triggered workflow only re-checked
lint/test/build/consumer validation — not e2e, docs drift, site tests or runtime validation.

## Proposed solution

Release PR → human merge → one workflow run that gates, publishes via npm trusted publishing (OIDC) and
finalizes the GitHub Release. See `docs/RELEASING.md` for the contract; decisions below.

**Decisions (source-backed, tested against release-please 17.6.0 — the version the pinned
`googleapis/release-please-action` v5.0.0 bundles):**

1. **Package path `projects/movement`, `release-type: node`.** Verified against this repo's real
   history: it finds `v1.2.0`, filters to the library's commits and proposes **1.3.0**, titled
   `chore(release): angular-movement v1.3.0`. A root package path (`.`) was rejected: `exclude-paths`
   only excludes directories, so any root-file commit (`package.json`, README, CHANGELOG) would count as
   a library change.
2. **`changelog-path: ../../CHANGELOG.md` does not work** — release-please throws `illegal pathing
characters in path`. So `skip-changelog: true`, and `scripts/release/changelog.mjs` writes the root
   `CHANGELOG.md` section on the Release PR branch from the PR body, folding hand-written
   `## Unreleased` notes in (nothing lost, no duplicate section, idempotent).
3. **Tags `vX.Y.Z`:** `include-component-in-tag: false`, `include-v-in-tag: true`. The MCP package and
   the private root `0.0.0` are not in the manifest.
4. **No dependency on suppressed events.** `draft: true` + `force-tag-creation: true`: release-please
   tags and opens a _draft_ release; the same workflow run then verifies, publishes to npm, verifies
   npm and un-drafts the release. No workflow triggers on `v*` tags. `workflow_dispatch` (tag input,
   `main` only, validated against git) is the recovery trigger.
5. **Trusted publishing, artifact identity.** One build, one `npm pack`, SHA-256 recorded; consumer
   jobs repack the downloaded `dist/movement` and must match; `publish` re-verifies hash, name,
   version and `repository.url`, rejects any stored token, and publishes the tarball. Only `publish`
   has `id-token: write`; publish has no checkout of PR code, no install, no secrets.
6. **Bootstrap:** none needed beyond the manifest (`1.2.0`): the `v1.2.0` tag/release exist. The Release
   PR for 1.3.0 appears on the first push to `main` after the setup PR merges.

## Out of scope

- Publishing anything. No tag, release or npm publication is created by the setup PR.
- Library source, public API, `angular-movement-mcp` versioning (only its workflow's security was
  hardened and an opt-in OIDC mode added), `movement-migrate` (stays private).
- npm account / GitHub settings (user-only; listed in `docs/RELEASING.md` §4).
- Pre-releases (rejected by the pipeline; documented as future work).

## Acceptance criteria

- [x] Dry-run against the real repo proposes `1.3.0` with tag convention `v1.3.0`.
- [x] Simulation tests: feat→minor, fix→patch, breaking→major, docs/chore/dependabot/site/MCP→none,
      accumulation, idempotency, bootstrap 1.2.0→1.3.0, tag/title round-trip, MCP untouched.
- [x] Changelog adapter keeps the real pending 1.3 notes verbatim; second run is a no-op.
- [x] Already-published version is not republished; failed gate cannot reach `publish`; missing OIDC
      fails with setup instructions and no fallback; publish and finalize failures recover; racing
      publishers cannot double-publish.
- [x] Workflow invariants (permissions, SHA pins, triggers, gates, MCP isolation) asserted in tests.
- [x] `actionlint` clean (also a CI job).
- [ ] npm trusted publisher configured (user-only, **not verified**).
- [ ] First Release PR (1.3.0) opened by automation after merge.

## Implementation plan

- [x] 1. `release-please-config.json`, `.release-please-manifest.json`
- [x] 2. `scripts/release/*` (decision modules + `cli.mjs`) and tests
- [x] 3. `.github/workflows/release.yml` replaces the tag-triggered one; `release-mcp.yml` hardened
- [x] 4. `ci.yml`: format check, `workflow-lint`, `pr-title`; actions pinned to SHAs
- [x] 5. Remove `scripts/release.mjs`, `pnpm release`, `pnpm lib:publish`
- [x] 6. Docs: `docs/RELEASING.md`, README, CONTRIBUTING, AGENTS/CLAUDE, RELEASE_CHECKLIST, BEST-PRACTICES,
      STATE, release skill

## Verification notes

See the PR description for commands and results.

## Follow-ups (out of scope, noted for later)

- Switch `release-mcp.yml` to OIDC (`MCP_NPM_AUTH=oidc`) after configuring its trusted publisher, then
  revoke `NPM_TOKEN`.
- Optional GitHub App so Release PRs get their own CI run.
- Pre-release channel (`next` dist-tag) if ever wanted.
- Delete the `fold` adapter if `skip-changelog` can be dropped (release-please supporting a changelog
  path outside the package directory).
