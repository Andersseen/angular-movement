# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a monorepo containing two projects:

- **`movement`** — an Angular animation library (`projects/movement/`) built for npm publishing
- **`angular-movement`** — a documentation/demo site (`src/`) built with [AnalogJS](https://analogjs.org/) (Angular meta-framework using Vite + SSR)

The demo site imports the library directly via a Vite path alias (`movement` → `projects/movement/src/public-api.ts`), so library changes are reflected immediately without a build step.

## Commands

```bash
# Dev server (demo site)
pnpm dev              # or: ng serve

# Build
pnpm build            # demo site (production)
ng build movement     # library only (outputs to dist/movement)

# Tests (library unit tests via Vitest)
pnpm test             # watch mode
pnpm test:coverage    # coverage report, no watch

# Lint & format
ng lint               # ESLint
pnpm format           # Prettier (writes)

# E2E
pnpm e2e              # Playwright

# Deploy
pnpm deploy           # build + Cloudflare Pages deploy
```

Run a single spec file: `ng test movement --include='**/move-hover.directive.spec.ts'`

## Architecture

### Library (`projects/movement/src/lib/`)

The library exposes all directives via the `MOVEMENT_DIRECTIVES` array in `movement.ts`. Structure:

- **`engines/`** — two animation backends:
  - `WaapiPlayer` — wraps the browser Web Animations API (`element.animate()`). Commits styles on finish, then cancels to avoid WAAPI "fill" memory leaks.
  - `SpringPlayer` — runs a Euler-integration spring physics simulation at 60 fps and generates the keyframe array before calling WAAPI with `easing: 'linear'`.
  - `AnimationEngine` — service that picks WAAPI vs Spring based on config, handles SSR (no-op on server), and applies final styles when animations are disabled.
  - `AnimationControls` — interface (`play`, `pause`, `cancel`, `currentTime`, `finished`) implemented by both players.

- **`directives/`** — all directives follow the same pattern: inject `AnimationEngine`, `MOVEMENT_CONFIG`, and optional context tokens (`MOVE_STAGGER_PARENT`, `MOVE_PRESENCE_PARENT`), then delegate to `AnimationEngine.play()`.
  - `MoveAnimateDirective` (`[move]`, `[moveAnimate]`) — entrance + leave animation, integrates with `MovePresenceDirective`.
  - `MoveEnterDirective` / `MoveLeaveDirective` — one-shot enter/leave triggers.
  - `MoveHoverDirective` / `MoveTapDirective` / `MoveFocusDirective` — interaction-driven animations.
  - `MoveInViewDirective` — IntersectionObserver-based trigger.
  - `MoveScrollDirective` — maps scroll progress to `AnimationControls.currentTime` (uses RAF lerp for smoothing). Duration is always `1000ms linear` so `currentTime ∈ [0,1000]` maps 1:1 to scroll progress `[0,1]`.
  - `MoveParallaxDirective` — similar to scroll but auto-calculates translate range from `speed × (windowHeight + elHeight)`.
  - `MovePresenceDirective` — structural directive (`*movePresence`) that awaits all registered children's `playLeave()` before removing the view.
  - `MoveStaggerDirective` — context provider that computes per-child delay based on DOM order, direction (`first`/`last`/`center`), and step interval.
  - `MoveAnimationDirective` (`[moveAnimation]`) — Framer Motion-style API: accepts `{ initial, animate, exit }` as plain state objects (single values, not arrays). Internally converts to `MoveKeyframes`. `exit` integrates with `movePresence`. Only properties present in **both** `initial` and `animate` are animated.
  - `MoveLayoutDirective`, `MoveTextDirective`, `MoveVariantsDirective`, `MoveDragDirective` — additional interaction directives.

- **`presets/`** — named animation presets (`MovePreset` type) resolved by `resolveMoveFrames()` in `move-animation.utils.ts`.

- **`tokens/`** — three `InjectionToken`s:
  - `MOVEMENT_CONFIG` — global defaults (`duration`, `easing`, `delay`, `disabled`). Override via `provideMovement(config)`.
  - `MOVE_STAGGER_PARENT` — provided by `MoveStaggerDirective` and consumed by child directives.
  - `MOVE_PRESENCE_PARENT` — provided by `MovePresenceDirective` and consumed by `MoveAnimateDirective`.

- **`scroll/`** — `SmoothScrollService` and `MoveSmoothScrollDirective` for custom scroll containers.

### Demo Site (`src/`)

Built with AnalogJS (file-based routing + SSR). App config uses `provideZonelessChangeDetection()` — **no Zone.js**.

- `src/app/pages/` — file-based routes. Nested folders use layout components (e.g. `demos-layout.ts`).
- `src/server/routes/api/` — Nitro API routes (`.get.ts`, `.post.ts`).
- `src/app/shared/` — shared `CodeBlock`, `DemoContainer` components and demo utilities.

## Key Conventions

- **Package manager**: `pnpm` exclusively.
- **Commit format**: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.) — enforced by commitlint + husky.
- **Formatting**: Prettier (printWidth 100, single quotes, trailing commas). Tailwind class order enforced by `prettier-plugin-tailwindcss`.
- **Private class fields**: Use `#field` syntax for encapsulation in library directives/services.
- **Angular signals API**: Use `input()`, `signal()`, `effect()` — no `@Input()` decorators in new code.
- **SSR safety**: All DOM/browser APIs must be guarded with `isPlatformBrowser(PLATFORM_ID)`.
- **Library prefix**: Directives use the `move` attribute selector prefix (e.g. `[moveEnter]`, `[moveScroll]`). App components use `app-` prefix.
