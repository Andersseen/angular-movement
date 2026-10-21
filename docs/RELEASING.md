# Releasing `angular-movement`

Releases are automated. Contributors write Conventional Commits; a bot proposes the release; **one
maintainer click (merging the Release PR) publishes it**. Nobody bumps versions, edits tags or runs
`npm publish` by hand.

```text
PRs merge to main ─► Release PR is created/updated ─► maintainer merges it ─► tag + draft Release
                                                                    │
        npm (OIDC) ◄── publish ◄── all gates pass on that exact commit ◄┘
            │
            └─► npm state verified ─► GitHub Release published ─► report
```

Everything after the merge runs in one workflow run: [`release.yml`](../.github/workflows/release.yml).
The `angular-movement-mcp` package is released separately (see [MCP package](#the-mcp-package)).

## 1. How the version is chosen

[release-please](https://github.com/googleapis/release-please) reads the Conventional Commits that
touched `projects/movement/` since the last `vX.Y.Z` tag:

| Commit                                                                | Effect                    |
| --------------------------------------------------------------------- | ------------------------- |
| `feat: …`                                                             | minor (`1.3.0` → `1.4.0`) |
| `fix: …`, `perf: …`                                                   | patch (`1.3.0` → `1.3.1`) |
| `feat!: …`, or a `BREAKING CHANGE:` footer                            | major (`1.3.0` → `2.0.0`) |
| `docs:`, `test:`, `refactor:`, `chore:`, `build:`, `ci:`, `style:`    | no release on their own   |
| anything that touches **only** `src/`, `docs/`, `e2e/`, `scripts/`, … | never part of the library |

Rules that follow from the layout:

- Only commits that change files under `projects/movement/` can release the library. Website
  (`src/`), docs, CI, the MCP package and `movement-migrate` do not, whatever their commit type.
- Dependabot PRs (`chore(deps…)`) never release on their own. They ride along in the next release
  that has a `feat`/`fix`.
- **Squash-merge titles are commit messages.** `ci.yml` checks that every PR title is a valid
  Conventional Commit (`pr-title` job) because release-please reads it. Merge-commit and rebase
  merges also work: the individual commits are read.
- The project prefers deliberate, grouped minor releases over a stream of patches. The Release PR is
  the lever: leave it open while changes accumulate and merge it when the milestone is ready.
  SemVer still wins — a breaking change is always a major.

### Overriding the version

Add a footer to any commit that lands on `main` (usually an empty `chore:` commit made through a PR):

```text
chore: release 1.5.0

Release-As: 1.5.0
```

The next Release PR proposes exactly that version. There is deliberately no `release-as` in
`release-please-config.json`; a permanent override would pin every future release.

## 2. The Release PR

On every push to `main` the `prepare` job runs release-please. If there are releasable commits it
opens (or updates, never duplicates) a single PR titled **`chore(release): angular-movement vX.Y.Z`**
that:

- bumps `projects/movement/package.json` and `.release-please-manifest.json`;
- adds the `## [X.Y.Z] - date` section to the root `CHANGELOG.md`.

The changelog section is written by a small adapter (`scripts/release/changelog.mjs`), because
release-please cannot address the root `CHANGELOG.md` from the `projects/movement` package path
(it rejects `../../CHANGELOG.md`). The adapter folds hand-written notes in: anything under a
`## Unreleased` heading in `CHANGELOG.md` is moved to the top of the new section, followed by the
generated commit list under "Commits in this release", and the `Unreleased` heading is removed.
So you may keep curating highlights under `## Unreleased` — or write nothing and rely on the
generated list. Both are safe, and repeated runs never duplicate a section.

Review the PR like any other: check the proposed version and the notes, edit `CHANGELOG.md` on
the PR branch if wording needs polish (the adapter will not overwrite an existing section), then
merge it. **Use _Squash and merge_ (or a merge commit).**

> **Why no CI on the Release PR?** Events caused by `GITHUB_TOKEN` never start other workflows, so a
> bot-opened PR gets no `pull_request` runs. This is safe: every gate re-runs on the exact release
> commit before anything is published. If you want CI on the PR too, configure the optional GitHub
> App below.

## 3. What happens when you merge it

All in `release.yml`, in order:

1. **prepare** — release-please tags the merge commit `vX.Y.Z` and creates a **draft** GitHub Release.
2. **resolve** — verifies the tag points at a commit on `main`, that `package.json` and the manifest
   both say `X.Y.Z`, that the commit is a merged Release PR and that the changelog has the section.
3. **package** — builds the library once, `npm pack`s it and records the tarball's SHA-256.
4. **quality**, **consumer**, **consumer-runtime** (parallel, no secrets, read-only token) —
   lint, format, docs drift, unit/site/script/migrate tests with coverage, library + site builds,
   API snapshot, pack check, full Playwright e2e, and the packed-tarball validation on **Angular 21
   and 22** (install + AOT compile, then prerender + hydrate + run in Chromium). The consumer jobs
   first prove the build they test repacks to the recorded SHA-256 — what is validated is what is
   published.
5. **publish** — the only job with `id-token: write`. It re-verifies the tarball hash, name, version
   and `repository.url`, refuses to run with any stored npm token, checks npm (already published?
   version regression?) and runs `npm publish <tarball> --access public --provenance`
   with npm ≥ 11.5.1.
6. **finalize** — polls npm with bounded back-off until the version, the `latest` dist-tag and the
   provenance attestation are visible, then un-drafts the GitHub Release with notes from
   `CHANGELOG.md` and links to npm. A release is **complete only when both are verified**.
7. **report** — step summary naming the outcome (see [Failure stages](#failure-stages)).

Concurrency: one release run at a time, never cancelled; npm publication has its own
`npm-publish-angular-movement` group. A version already on npm with identical content is
a no-op; with different content it is an error — published versions are immutable.

## 4. One-time setup (maintainer-only)

The repository side is done in code. These need account ownership:

### GitHub

- [ ] **Settings → Actions → General → Workflow permissions:** tick _Allow GitHub Actions to create and
      approve pull requests_ (currently off — release-please cannot open the Release PR without it).
- [ ] **Settings → Environments → New environment** `npm-publish`: restrict deployment branches to
      `main`. Optional: required reviewers (an extra gate after the Release PR merge). Also create
      `npm-publish-mcp` if you will use OIDC for the MCP package.
- [ ] **Rulesets:** keep _Protect main_. Add a tag ruleset for `v*` and `mcp-v*` that blocks update and
      deletion. Do not block tag _creation_ unless release-please runs as a GitHub App listed as a
      bypass actor (the default `GITHUB_TOKEN` cannot be one).
- [ ] _(optional)_ **GitHub App for CI on Release PRs:** create an app with repository permissions
      Contents, Pull requests, Issues = read & write; install it on this repository only; add
      repository variable `RELEASE_APP_ID` and secret `RELEASE_APP_PRIVATE_KEY`. The workflow uses it
      automatically when the variable is set. Do not use a personal access token.

### npm (trusted publishing)

- [ ] <https://www.npmjs.com/package/angular-movement/access> → **Trusted Publisher → GitHub Actions**:

  | Field                | Value              |
  | -------------------- | ------------------ |
  | Organization or user | `Andersseen`       |
  | Repository           | `angular-movement` |
  | Workflow filename    | `release.yml`      |
  | Environment name     | `npm-publish`      |
  | Allowed actions      | `npm publish`      |

  Fields are case-sensitive. npm does not validate them on save — a typo only shows up at publish
  time as `ENEEDAUTH`/"Unable to authenticate", which the pipeline reports as _Authentication/setup
  blocked_. A new trusted-publisher config must complete its first publish within 2 days.

- [ ] After the first successful OIDC release: delete the **`NPM_TOKEN`** repository secret and revoke
      the automation token on npmjs.com (Access Tokens). `release-mcp.yml` still reads it until you
      switch MCP to OIDC — revoke after that.

**Status:** this repository has _not_ verified that the trusted publisher exists; only npm account
owners can see it. Until it does, `publish` fails with an actionable message and publishes nothing.

## 5. Failure stages

| Report says                                                      | What it means / what to do                                                                                                    |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| Release preparation failed                                       | Release PR/tag/target checks. Read the job log; fix and re-run (nothing was published).                                       |
| Release validation failed                                        | A gate failed on the release commit. Nothing was published. See below.                                                        |
| Authentication/setup blocked                                     | npm rejected OIDC. Fix the trusted publisher (table above), then re-run the failed jobs.                                      |
| npm publication failed                                           | npm error other than auth. Re-run the failed jobs.                                                                            |
| npm publication succeeded but GitHub Release finalization failed | The package is on npm. Re-run `finalize` (or dispatch the tag): it only repeats the verification and the GitHub Release step. |
| Release fully completed                                          | npm and GitHub are both verified.                                                                                             |

### Recovery

All recovery is idempotent and never needs a hand-made tag or version edit.

- **Transient failure / auth fixed:** _Actions → Release → the run → Re-run failed jobs_. Artifacts
  are kept 14 days.
- **Run is gone or the artifact expired** (also: _tag and draft Release exist but npm publish never
  ran_): dispatch the recovery from `main`:

  ```bash
  gh workflow run release.yml --ref main -f tag=v1.3.0
  ```

  The input is only a _name_. The pipeline accepts it only if the tag exists, points at a commit on
  `main` that is a merged Release PR, and its `package.json`/manifest/changelog agree. It then runs
  every gate again, skips npm if that exact tarball is already published, and finalizes.

- **A real defect in the release commit** (a gate keeps failing): nothing was published, so fix
  forward. Land the fix with a normal PR; the next Release PR proposes the next version. Never
  reuse or move a tag, and never `npm unpublish`; the unpublished `vX.Y.Z` draft Release can be left or
  deleted with `gh release delete vX.Y.Z`.
- **Published to npm, GitHub Release missing or still draft:** dispatch the tag as above.

### Urgent security fix

Merge the fix as a `fix:` commit (patch). The Release PR appears within a minute; merge it
immediately — the pipeline takes ~20–30 minutes and cannot be shortened by skipping gates. If the
fix is in a dependency the library does not ship, no release is needed.

## 6. Checking what is out there

```bash
npm view angular-movement version dist-tags --json        # published version + dist-tags
npm view angular-movement@1.3.0 dist.attestations         # provenance attestation present?
npm audit signatures                                       # in a project that installed it
curl -s https://registry.npmjs.org/-/npm/v1/attestations/angular-movement@1.3.0 | jq '.attestations[].predicateType'
gh release list --limit 5                                  # tags + draft/published state
gh release view v1.3.0 --json isDraft,tagName,targetCommitish,url
gh run list --workflow release.yml --limit 5
```

The provenance badge on npmjs.com links the package to this repository, the workflow run and the
commit.

## 7. Later: pre-releases

Not enabled. The pipeline rejects any tag that is not a stable `vX.Y.Z`. To introduce them, add a
release-please `prerelease` configuration (`versioning: prerelease`, `prerelease-type`), teach
`scripts/release/semver.mjs` and `publish.mjs` to publish under a non-`latest` dist-tag
(`npm publish --tag next`) and mark the GitHub Release as a pre-release, and add simulation tests
first. npm dist-tag management additionally needs npm ≥ 11.21.

## The MCP package

`angular-movement-mcp` (`projects/movement-mcp/`) has its own version, lockfile and `mcp-vX.Y.Z`
tags. It is **not** in `release-please-config.json`, and a library release never bumps or publishes
it.

Release it as before: bump `projects/movement-mcp/package.json`, merge to `main`, then tag the merged
commit `mcp-vX.Y.Z` and push the tag. `release-mcp.yml` verifies the tag is on `main` and matches
the package version, builds and tests, then publishes.

Authentication defaults to the `NPM_TOKEN` secret (unchanged). To move it to OIDC independently:

1. On npmjs.com → `angular-movement-mcp` → Trusted Publisher → GitHub Actions: user `Andersseen`,
   repository `angular-movement`, workflow `release-mcp.yml`, environment `npm-publish-mcp`.
2. Create the `npm-publish-mcp` GitHub environment.
3. Set repository variable `MCP_NPM_AUTH` = `oidc`. In that mode the token is neither read nor written
   and a failure never falls back to it.

Automatic (release-please) MCP releases are intentionally not enabled; they need their own
independent release contract and tests first.

## Emergency path

There is none that bypasses the pipeline. If GitHub Actions itself is unavailable, wait: publishing
outside it would skip provenance, the gates and the trusted-publisher identity. If the pipeline
code is the problem, fix it through a PR (`scripts/release/*` has its own tests, run by
`pnpm test:scripts`).

## Reference

| Piece                                                         | Purpose                                                       |
| ------------------------------------------------------------- | ------------------------------------------------------------- |
| `release-please-config.json`, `.release-please-manifest.json` | Package path, tag convention (`vX.Y.Z`), draft + tag creation |
| `.github/workflows/release.yml`                               | The whole pipeline, and the only library publisher            |
| `scripts/release/`                                            | Decision logic, tested without GitHub or npm                  |
| `scripts/release/simulation.test.mjs`                         | Runs the real release-please engine on fixture commits        |
| `scripts/release/workflow.test.mjs`                           | Guards permissions, pinning, triggers, gates                  |
| `pnpm test:scripts`                                           | Runs all of the above (also in CI)                            |

Pinned action SHAs are kept current by Dependabot (`github-actions` ecosystem). The `release-please`
devDependency is pinned to the version bundled by the pinned action so tests simulate what runs.
