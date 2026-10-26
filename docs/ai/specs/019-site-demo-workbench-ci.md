# Spec 019 — Website quality, demo workbench and release preparation

- **Status:** in-progress
- **Created:** 2026-10-25
- **Last updated:** 2026-10-26
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

## Scope addition — organic hero field (user request, 2026-10-25; reworked 2026-10-26)

The user supplied their own portfolio and React/Three.js source and explicitly asked for its
chaotic particle-background character in Angular Movement's hero, preserving this site's titles
and brand. This supersedes the original preference against particle backgrounds for this hero.

Reference evolution: the first pass targeted `github.com/Andersseen/hr-portfolio` (FBO curl
simulation). On 2026-10-26 the user clarified the real target look is
https://hr.andriipap.dev/en/ — a Three.js Journey-style DoF particle scene (simplex curl-noise
flow rendered as depth-of-field points: in-focus dust, out-of-focus bokeh orbs, additive glow on
near-black). The shipped renderer is a faithful single-draw-call port of that scene.

Implementation: hero-local lazy Angular component with a native WebGL point renderer, no new
dependency, no video, no FBO/render-target simulation (the flow is a pure function of seed+time,
so positions are computed per vertex). Fractal curl flow (4 octaves), two populations in one
draw (fine dust ~93%, soft bokeh orbs ~7%), manual perspective camera with a focal plane,
silver/indigo/violet palette (additive in dark theme, faint premultiplied ink in light).
Counts capped at 22,000 desktop / 7,500 compact, backing buffer ≤1600×1000, DPR ≤1.5, ≤24
draws/s. The field glides toward the pointer (lerped parallax; near particles drift more).
Angular signals own theme/lifecycle state; frame work runs outside Angular and does not update
signals. Reduced motion is static, offscreen/hidden cancels the RAF, route destruction frees GPU
resources, observers and listeners. Unsupported/software WebGL keeps a static CSS fallback.

User decisions 2026-10-26: the accessible motion toggle from the first pass is removed (it only
annoyed); the hero keeps relying on the OS reduced-motion preference. Mouse interaction stays —
subtle parallax, explicitly requested as optional and non-intrusive.

Acceptance additions:

- [x] Hero motion resembles the supplied organic field (curl flow + DoF bokeh) without copying
      portfolio text/layout.
- [x] No new dependency, video, FBO simulation or library runtime/API changes.
- [x] Browser tests prove live drawing, pointer parallax, theme switching (uGain), reduced-motion
      offscreen/hidden/route cleanup and context loss; 8/8 pass.
- [x] Record draw count, renderer CPU submission time, production bytes and Lighthouse comparison.
- [x] Main thread submission median <2ms/frame on this test machine; capped desktop/mobile counts,
      DPR ≤1.5 and no redraw loop while inactive; report GPU/field-INP limits honestly.
