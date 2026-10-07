# Spec 015 — 1.3–2.0 roadmap and design

- **Status:** done
- **Created:** 2026-10-07
- **Last updated:** 2026-10-07
- **Breaks public API:** no; documentation only. Future API examples are proposals, not contracts.
- **Related:** maintainer planning request; specs 006–009, 012–014; `ROADMAP.md`.

## Problem / motivation

The library is 1.2.0, while its historical roadmap stops at general later ideas. A long
stabilization runway needs an implementation-backed audit, subsystem contracts, migration paths,
and measurable release gates. Historical docs contain stale release wording and stronger
validation claims than the fixtures prove.

## Proposed solution

Create `docs/v2/` with an audit, serious SDD, migration strategy, validation plan, decision log,
and separate future plans for 1.3 through 1.9 and conditional 2.0. Preserve Angular-native
primitives, the stable 1.x contract, and explicit experimental policy. Separate source findings,
historical evidence, proposed contracts, and uncollected validation.

## Out of scope

No changes to `projects/**`, `src/**`, `validation/**`, `e2e/**`, scripts, dependencies, exports,
package versions, tags, publishing, or runtime behavior. No implementation of 1.3 or v2. No
rewriting historical specs or changelog entries. Existing staged agent files are user-owned.
No consumer/browser/device/performance certification in this planning task.

## Acceptance criteria

- [x] `docs/v2/` contains all six overview documents and eight release plans requested.
- [x] Audit maps every exported declaration and experimental family to source/test evidence.
- [x] SDD answers all 28 requested topics, including selection rationale and concrete ownership,
      cancellation, migration, hydration, and accessibility contracts.
- [x] Every release plan contains the requested planning sections and unticked future criteria.
- [x] Validation distinguishes existing fixtures from real consumer/runtime evidence and defines
      measurable gates; 2.0 is conditional on meaningful breaking changes.
- [x] Local links and Markdown formatting checked; diff contains documentation only.
- [x] `CHANGELOG.md` Unreleased and `docs/ai/STATE.md` updated; historical records preserved.

## Implementation plan

- [x] 1. Audit public surface, runtime, tests, CI, consumers recorded in specs, and official
     Angular/browser/competitor documentation.
- [x] 2. Create `docs/v2/{README,AUDIT,SDD,MIGRATION-STRATEGY,VALIDATION,DECISIONS}.md`.
- [x] 3. Create `docs/v2/plans/` release plans for 1.3–1.9 and conditional 2.0.
- [x] 4. Link the future planning area from `ROADMAP.md`; add Unreleased changelog entry and
     session record to `docs/ai/STATE.md`.
- [x] 5. Apply docs-only verify skill gate, check links/scope, and record actual results here.

## Verification notes

Verified on 2026-10-07:

- `pnpm format`: passed; no unrelated or historical files changed.
- Targeted `pnpm exec prettier --check`: passed for all 14 future documents, this spec and the
  three modified documentation files.
- Local-link/content check: all planning local links resolve; SDD contains all 28 numbered
  sections; eight plans have all 17 required sections and no future completion marks.
- `git diff --check`: passed. Source/package scope check: no changes in projects, src, validation,
  e2e, scripts, root package or lockfile. Existing staged agent files preserved byte-for-byte.
- Read-only public-api-guard audit: 73 named declarations, stable/experimental inventory checked;
  no source API change. Docs-drift-checker reviewed source/docs and new planning documents; two
  wording issues (variant consumer evidence and animator clear path) were corrected.
- Fresh `pnpm docs:check` run by the read-only audit agent: passed (21 directives); this is a
  narrow metadata check, not validation of all behavioral prose/examples.

The verify skill's docs-only gate applies: library tests, builds, package checks and e2e were not
rerun. Browser/device/consumer/performance validation remains future work; historical results are
attributed to their original specs. Files remain uncommitted; no release/publish action occurred.

## Follow-ups (out of scope, noted for later)

- Execute 1.3 only after this planning task; approve any future public API changes separately.
- Collect real consumer and physical-device evidence; do not infer it from source grep or AOT.
