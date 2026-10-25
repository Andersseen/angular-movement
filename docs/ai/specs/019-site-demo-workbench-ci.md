# Spec 019 — Website quality, demo workbench and release preparation

- **Status:** in-progress
- **Created:** 2026-10-25
- **Last updated:** 2026-10-25
- **Breaks public API:** no
- **Related:** specs 017, 018; CI run 40195592991

## Problem / motivation

Release Please wrote compact JSON that fails the repository's Prettier gate. The custom preparation
stage only folds the changelog, leaving the generated manifest unnormalized. Production demos also
split between a controls-first two-column container and independent long pages. The 300px stage,
large descriptions and link strip push source below the fold. This milestone gives real animation
examples a consistent, preview-first workspace while preserving Doqs and the runtime API.

## Proposed solution

Normalize the manifest with trusted tooling alongside changelog preparation, commit both only when
changed, and simulate future updates. Build a shared viewport-height desktop workbench with a compact
scrolling navigation, dominant stage and independent controls/source panels. Use natural document
scrolling and a native demo selector on compact screens. Retain each route's real animation state
and explicit special stage requirements. Refine existing home composition and shared surfaces.

## Out of scope

No changes to projects/movement runtime, public exports, versions, peer ranges, tags, npm publishing,
MCP release, Doqs internals or manual production deployment. The manifest receives whitespace only.

## Acceptance criteria

- [x] Current manifest passes format:check without semantic changes.
- [x] Future manifest normalization is tested, trusted and idempotent; release security tests pass.
- [x] All 23 demo URLs plus /demos use a consistent stage/controls/source structure.
- [x] Desktop panels fit below navbar and scroll independently; compact screens have no page overflow.
- [x] Drag, presence, layout, scroll, signal and imperative interactions retain real behavior.
- [x] Controls, replay/reset and code updates are tested; copy feedback and focus remain accessible.
- [ ] Production docs, deep links, SSR/hydration and static output pass verification.
- [ ] Full applicable CI commands and actionlint run, with evidence recorded.
- [ ] Baseline/after screenshots and performance results recorded with limitations.
- [ ] CHANGELOG.md and STATE.md updated; one coherent implementation PR opened.

## Implementation plan

- [x] 1. Audit release workflow and registry; normalize manifest in scripts/release and release.yml.
- [x] 2. Run the blocked verification chain and diagnose further failures.
- [x] 3. Capture production route/reference baselines and record design findings.
- [x] 4. Add shared workbench composition and navigation metadata in src/app/shared and demos.page.ts.
- [x] 5. Migrate DemoContainer and independent demo pages; preserve scoped scroll/lifecycle behavior.
- [x] 6. Refine controls, code, responsive styles and existing homepage composition.
- [ ] 7. Add behavioral E2E coverage and run all applicable checks.
- [ ] 8. Record audit evidence, update project records, commit and open PR.

## Verification notes

Bootstrap: clean main ad1d3ef, fetched and matched origin/main; feature branch created.
GitHub reports v1.3.0 as draft, publishedAt null. npm latest is 1.2.0; publication is not complete.
No release mutation performed. `scripts/release/normalize-manifest.test.mjs` passes against the real
Release Please updater, including cross-tool idempotence. The workbench suite passed twice in
succession (74 checks), including all route geometry, eight widths, source compilation, reset/replay,
keyboard scrolling and axe in both themes. Detailed evidence: `docs/ai/evidence/019/README.md`.
Final complete CI and final Lighthouse medians are still running.

## Follow-ups (out of scope, noted for later)

- Existing v1.3.0 release recovery belongs to the maintainer; do not dispatch publication from this task.
