# CONTEXT — What This Project Is and Why It Exists

## One-line summary

**angular-movement** is an open-source Angular animation library (npm package `angular-movement`)
that brings a Framer-Motion-style, declarative animation API to Angular — powered by the native
Web Animations API (WAAPI), with zero runtime dependencies.

## The problem it solves

Angular's built-in `@angular/animations` is verbose, trigger-based, and increasingly de-emphasized.
React developers have Framer Motion; Angular developers have nothing comparable that is:

- **Declarative** — animations described in the template as attribute directives, not in component metadata.
- **Signals-native** — built on Angular's modern `input()` / `signal()` APIs, zoneless-compatible.
- **Lightweight** — wraps the browser's own WAAPI instead of shipping an animation runtime (`sideEffects: false`, tree-shakeable, only `tslib` as dependency).
- **Complete** — presets, custom keyframes, spring physics, scroll-linked animations, parallax, drag, presence (exit) animations, stagger orchestration.

## What the project wants to achieve (goals)

1. **Become the go-to animation library for modern Angular** (v21+, standalone, signals, zoneless, SSR).
2. **Reach a stable 1.0** — the current priority is **predictability over new features** (see `ROADMAP.md`):
   - 0.6: API hardening (stable vs experimental APIs, transform composition, dynamic inputs, more tests).
   - 0.7: validation in real apps, richer e2e coverage, better docs.
   - 1.0: frozen public API, stable per-directive docs.
3. **Match Framer Motion ergonomics** where it makes sense: `[moveAnimation]="{ initial, animate, exit }"`, `moveWhileHover`, `moveWhileTap`, variants, presence.
4. **Ship excellent documentation** via the demo site (deployed on Cloudflare Pages) with a live demo page per directive.

## Non-goals

- No support for legacy Angular (modules-first, Zone.js-dependent patterns, `@Input()` decorators).
- No JS-driven per-frame animation runtime — WAAPI does the work; the spring engine only _pre-computes_ keyframes.
- No new runtime dependencies in the library. Ever.
- The demo site is not a product; it exists to document and validate the library.

## Repository shape (two projects, one repo)

| Project                              | Path                 | Purpose                                                  | Published?                   |
| ------------------------------------ | -------------------- | -------------------------------------------------------- | ---------------------------- |
| `movement` (npm: `angular-movement`) | `projects/movement/` | The animation library                                    | Yes — npm, currently 0.5.x   |
| Demo/docs site                       | `src/`               | AnalogJS (Vite + SSR) documentation site with live demos | Deployed to Cloudflare Pages |

The demo site imports the library **source directly** via a Vite alias
(`movement` → `projects/movement/src/public-api.ts`), so library changes appear in the demo
instantly with no build step. This also means: **breaking the library breaks the demo site build.**

## Who works on this

Solo maintainer (**Andersseen**) plus AI coding agents. The project accepts external contributions
(see `CONTRIBUTING.md`), uses Conventional Commits enforced by commitlint + husky, and has CI on
GitHub Actions with deploys to Cloudflare Pages from `main`.

## Key quality bars

- **SSR-safe**: every browser API behind `isPlatformBrowser` guards — the demo site is SSR and will crash otherwise.
- **Reduced motion**: `prefers-reduced-motion` is respected by all directives.
- **Tested**: Vitest unit tests colocated with each source file (`*.spec.ts`), Playwright e2e for the demo site.
- **Zero-config**: works with default `provideMovement()`, everything overridable per-directive.
