# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Session Bootstrap (do this first)

Start with `.claude/scripts/context.sh` — it prints repo state, the live parts of `STATE.md`, open
specs and the Unreleased changelog in one call. That answers "where am I"; the docs below answer
"how do I", so read the relevant one **in full** before touching the area it covers.

Extended agent documentation lives in `docs/ai/`:

1. `docs/ai/CONTEXT.md` — why the project exists and its goals
2. `docs/ai/STATE.md` — current status, in-progress work, known gotchas (**update it when you finish a task**)
3. `docs/ai/ARCHITECTURE.md` — file map, animation pipeline, directive/selector reference
4. `docs/ai/BEST-PRACTICES.md` — mandatory coding rules with examples
5. `docs/ai/SDD-WORKFLOW.md` — spec-driven workflow; non-trivial tasks need a spec in `docs/ai/specs/`

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

## Claude Code Automation (`.claude/`)

Checked in and shared with the team. Prefer these over re-deriving the same information by hand.

**Scripts** — call these instead of reading many files:

| Script                                 | Use                                                                                                                             |
| -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| `.claude/scripts/context.sh`           | Session bootstrap: repo state, STATE.md highlights, open specs                                                                  |
| `node .claude/scripts/api-surface.mjs` | Every directive's selector, inputs, outputs and barrel registration. Add `--json` to diff, `--ref <ref>` to read a past version |

**Skills** (`/name`): `/spec` (start or resume a spec), `/new-directive` (6-step scaffold with
templates), `/verify` (Phase 5 gate), `/release` (audit + cut a version).

**Agents**: `public-api-guard` (classifies API changes BREAKING/ADDITIVE/INTERNAL against a base
ref), `docs-drift-checker` (documented selectors vs real source). Both read-only.

**Hooks** (`.claude/settings.json`):

- `PostToolUse` on Edit/Write → `ssr-guard.sh` blocks library edits that use browser globals with no
  `isPlatformBrowser` / `DOCUMENT` guard. Deliberate exceptions need an `// ssr-safe: <reason>` comment.
- `Stop` → `record-check.sh` warns when library source changed without the Phase 6 bookkeeping
  (`CHANGELOG.md`, `docs/ai/STATE.md`).

**MCP** (`.mcp.json`):

- `playwright` — drives demo routes. Animation bugs are visual; unit tests cannot see them.
- `context7` — live Angular 21 / AnalogJS docs, both too recent to recall reliably.
- `memory` — knowledge graph persisted at `~/.claude/memory/angular-movement-kg.json`. Record
  decisions, dead ends and gotchas that are **not** derivable from the code, so the next session does
  not re-derive them. Anything the code already states belongs in the code, not here.

GitHub work goes through the authenticated `gh` CLI, not an MCP server.

## Key Conventions

- **Package manager**: `pnpm` exclusively.
- **Commit format**: Conventional Commits (`feat:`, `fix:`, `refactor:`, etc.) — enforced by commitlint + husky.
- **Formatting**: Prettier (printWidth 100, single quotes, trailing commas). Tailwind class order enforced by `prettier-plugin-tailwindcss`.
- **Private class fields**: Use `#field` syntax for encapsulation in library directives/services.
- **Angular signals API**: Use `input()`, `signal()`, `effect()` — no `@Input()` decorators in new code.
- **SSR safety**: All DOM/browser APIs must be guarded with `isPlatformBrowser(PLATFORM_ID)`.
- **Library prefix**: Directives use the `move` attribute selector prefix (e.g. `[moveEnter]`, `[moveScroll]`). App components use `app-` prefix.

<!-- rtk-instructions v2 -->

# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:

```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)

```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)

```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)

```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)

```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)

```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)

```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)

```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)

```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)

```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands

```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category         | Commands                       | Typical Savings |
| ---------------- | ------------------------------ | --------------- |
| Tests            | vitest, playwright, cargo test | 90-99%          |
| Build            | next, tsc, lint, prettier      | 70-87%          |
| Git              | status, log, diff, add, commit | 59-80%          |
| GitHub           | gh pr, gh run, gh issue        | 26-87%          |
| Package Managers | pnpm, npm, npx                 | 70-90%          |
| Files            | ls, read, grep, find           | 60-75%          |
| Infrastructure   | docker, kubectl                | 85%             |
| Network          | curl, wget                     | 65-70%          |

Overall average: **60-90% token reduction** on common development operations.

<!-- /rtk-instructions -->
