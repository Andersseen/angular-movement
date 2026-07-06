# STATE — Current Project Status

> **Living document.** Whoever finishes a task MUST update this file (see "How to update" at the bottom).
> Paste-friendly: this file is designed to be loaded at the start of every AI session.

**Last updated:** 2026-07-06
**Library version:** `0.5.0` (published to npm as `angular-movement`, released 2026-06-15)
**Angular peer range:** `^21.2.0` (`@angular/core`, `@angular/common`)
**Branch state:** `main` is the default and deploy branch; working tree clean at last update.
**Roadmap phase:** post-0.5 → working toward **0.6 "API hardening"** (see `ROADMAP.md`)

## What is DONE and stable

- 20 directives exported via `MOVEMENT_DIRECTIVES` (see `docs/ai/ARCHITECTURE.md` for the full table).
- Two animation engines: `WaapiPlayer` (WAAPI wrapper) and `SpringPlayer` (pre-computed spring keyframes).
- 29 named presets (`MovePreset` type in `presets/presets.types.ts`), including icon/SVG presets.
- Signals-native motion helpers: `moveValue`, `moveTransform`, `moveSpringValue` (added in 0.5.0).
- Drag snap points (`moveDragSnapPoints`), stagger step alias (`moveStaggerStep`), `progress` signal on scroll & parallax.
- Demo site with a page per directive under `src/app/pages/demos/`, docs pages (API Reference, Presets), templates page.
- Unit tests (Vitest) colocated with every library source file; Playwright e2e for demo routes.
- CI (GitHub Actions) with explicit permissions/concurrency; Cloudflare Pages deploy on `main` pushes.
- OSS community files: CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, SUPPORT, ROADMAP, RELEASE_CHECKLIST, issue forms, PR template, Dependabot.

## In progress / recently merged (CHANGELOG "Unreleased")

- Community/CI hardening work is in `CHANGELOG.md → Unreleased` but not yet in an npm release.
- Recent commits on `main`: template additions, best-practice docs, library updates (`git log` for detail).

## Next up (priority order — from ROADMAP 0.6)

1. Define which APIs are **stable vs experimental** and document it.
2. Tighten **transform composition** so `moveLayout`, `moveDrag`, and keyframe animations don't fight over inline styles.
3. Clarify **dynamic input behavior** for directives that currently read inputs once on init.
4. More tests: interrupted animations, reduced motion, SSR guards, nested directives.

## Known gotchas / open issues (do not "fix" these blindly — they are known)

- `moveLeave` on its own cannot animate elements removed by `@if` — removal happens before the
  directive can run. Correct usage pairs it with `*movePresence`. Demo pages already reflect this.
- Transform composition between `moveLayout` / `moveDrag` / keyframes is a known weak point (roadmap 0.6 item).
- Some directives read their inputs once at init; making them reactive is a roadmap item, not a bug to hotfix.

## Release process (when asked to release)

Follow `RELEASE_CHECKLIST.md`. Key commands: `pnpm test:coverage` → `ng build movement` →
`pnpm pack:check` → `pnpm lib:publish`. Version bumps in `projects/movement/package.json`,
changelog entry moves from Unreleased to a versioned section.

---

## How to update this file (mandatory after finishing a task)

1. Update **Last updated** date and any changed version numbers.
2. Move completed items into "What is DONE"; add new work to "In progress".
3. If you discovered a new gotcha, add it to "Known gotchas".
4. Keep this file under ~80 lines — it must stay cheap to load into every session. Summarize; don't append forever.
