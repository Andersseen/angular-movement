# Spec 012 — MCP server + installable skill for agentic development

- **Status:** done
- **Created:** 2026-08-27
- **Last updated:** 2026-08-27
- **Breaks public API:** no (the `angular-movement` library package is not touched at all)
- **Related:** none (new initiative, not on the existing roadmap)

## Problem / motivation

Very few public repos use `angular-movement` yet, so an AI coding agent working in a consumer
project has almost no grounding for this library's API and will hallucinate selectors/inputs
(e.g. guessing `[moveFadeIn]` or an `easing` input that doesn't exist) instead of using the real
`move*` surface. The maintainer wants a real MCP server — not a REST-API-as-MCP wrapper — that
exposes the library's ground-truth directive/input/preset metadata as MCP tools, plus an
installable Claude Code skill that teaches an agent to use that server. Together these make
"agentic driven development" against this library actually reliable, and are a plausible adoption
lever precisely because reference material is scarce today.

Explicitly requested by the user and out of scope for this spec: a Claude Code **plugin**
(`.claude-plugin/marketplace.json`) is not being built now — that requires a Claude plugin
marketplace account, which the user does not want to set up yet.

## Proposed solution

A new, independently-published npm package, **`angular-movement-mcp`** (name confirmed available
on the registry), living at `projects/movement-mcp/` alongside the existing `projects/movement/`
library project. It ships:

1. **A real MCP server** (`@modelcontextprotocol/sdk`, stdio transport) exposing the library's
   public surface as MCP tools, backed by a committed JSON snapshot (not live source parsing at
   runtime):
   - `list_directives` — every directive: selector, `exportAs`, inputs (name/type/required/default),
     outputs, public signals, one-shot vs. reactive.
   - `get_directive` — full detail + short usage description for one directive by class name or
     selector.
   - `list_presets` — every `MovePreset` name.
   - `get_example` — a minimal template-binding skeleton for a given directive, mechanically
     generated from its own selector + input snapshot data (not a curated real-world snippet —
     `directive-reference.ts` turned out to carry no example field, so a generated skeleton that
     can never drift from the snapshot is the more honest choice than hand-copied demo code).
2. **An installable skill** (`skill/movement-usage/SKILL.md`, bundled inside the same package)
   that tells an agent: prefer these MCP tools over guessing the API, gives the `move*` selector
   convention, and points at `list_directives`/`get_example` before writing any `[move...]` binding.
3. **A CLI init command** (`npx angular-movement-mcp init`, run from a consumer repo) that:
   - Adds a `movement` entry to the consumer's `.mcp.json` (creating the file if absent).
   - Copies `skill/movement-usage/` into the consumer's `.claude/skills/movement-usage/`.

Resulting consumer-side usage:

```bash
npx angular-movement-mcp init
# writes/merges .mcp.json:
#   "movement": { "command": "npx", "args": ["-y", "angular-movement-mcp"] }
# copies .claude/skills/movement-usage/SKILL.md into the consumer repo
```

```jsonc
// consumer's .mcp.json after init
{
  "mcpServers": {
    "movement": { "command": "npx", "args": ["-y", "angular-movement-mcp"] },
  },
}
```

## Out of scope

- **`projects/movement/package.json` is not modified.** No new dependency, no version bump, no
  code change to the animation library itself. This spec touches only new files under
  `projects/movement-mcp/` plus root tooling (`package.json` scripts, `pnpm-workspace.yaml` if
  needed) required to build/publish that new package.
- No Claude Code **plugin** / `.claude-plugin/marketplace.json` / marketplace listing.
- No changes to `.claude/scripts/api-surface.mjs`, `scripts/update-api-snapshot.mjs`, or the
  existing `api:snapshot` / `api:check` flow — this spec adds a **new** snapshot generator script
  for the MCP package, it does not touch the library's own `api-report.txt` snapshot.
- No changes to `src/app/shared/api/directive-reference.ts` beyond reading it (it stays owned by
  `docs:check`).
- No auto-detection of which directives a consumer is actually using, no telemetry, no network
  calls from the MCP server at runtime — everything it serves is static/embedded.
- Real `npm publish` of `angular-movement-mcp` is **not** run as part of this spec's automated
  steps — see Acceptance criteria. Publishing to the public registry needs an explicit go-ahead in
  the moment, not blanket pre-approval.

## Acceptance criteria

- [x] `pnpm --dir projects/movement-mcp build` compiles the server with no errors (plain `tsc`,
      no new build-tool dependency). ✅
- [x] The compiled server (`dist/cli.js`, the actual bin — `dist/index.js` only exports
      `createServer`/`startServer` now, see Implementation plan #4/#5) starts an MCP stdio server
      that responds to `tools/list` with `list_directives`, `get_directive`, `list_presets`,
      `get_example`. ✅ — verified with a scripted JSON-RPC session (see Verification notes).
- [x] `list_directives` output matches the real current directive surface (spot-checked against
      `node .claude/scripts/api-surface.mjs --json`) for `MoveDragDirective` (outputs) and others.
      ✅ — with one caveat, not a defect: no directive in the current source trips
      `api-surface.mjs`'s signal regex (it requires an explicit generic, e.g. `signal<number>(0)`,
      and every real `signal(...)` call omits one), so `signals` is `[]` everywhere today. Filed as
      a Follow-up, not fixed here (that script is out of scope).
- [x] `node dist/cli.js init` run against a scratch directory: creates `.mcp.json` with the
      `movement` entry when absent, merges it (without clobbering existing entries) when present,
      and copies `.claude/skills/movement-usage/SKILL.md`. ✅ — verified manually against a scratch
      dir and covered by `init.spec.ts` (3 tests: create, merge, don't-clobber).
- [x] `pnpm --dir projects/movement-mcp pack --dry-run` succeeds and the tarball contains `dist/`,
      `skill/`, `package.json`, `README.md` — not `src/`. ✅
- [x] Unit tests cover the pure tool logic and the `.mcp.json` merge/init logic
      (`tools.spec.ts`, `mcp-config.spec.ts`, `init.spec.ts`). ✅ — 15/15 passing. The snapshot
      generator itself (`scripts/generate-snapshot.mjs`) is a dev-only script that shells out to
      already-tested tooling (`api-surface.mjs`) plus two repo file reads — verified by running it
      and inspecting the output (21 directives, 29 presets, all with descriptions), not a separate
      unit test.
- [x] `projects/movement/package.json` has zero diff. ✅ (`git diff --stat` confirmed empty)
- [x] `pnpm build` (demo site) and `ng lint` still pass unaffected. ✅ — also ran
      `pnpm test:coverage`: 491/491 library tests pass.
- [x] `CHANGELOG.md` (Unreleased) and `docs/ai/STATE.md` updated. ✅

## Implementation plan

- [x] 1. `projects/movement-mcp/` is a **fully standalone** pnpm package: its own `package.json`,
     its own `pnpm install` (own `node_modules` + lockfile, committed), not a pnpm workspace
     member. No `pnpm-workspace.yaml` added — `pnpm --dir projects/movement-mcp <script>` works
     without one, keeping the root install/lockfile for the existing two projects untouched.
- [x] 2. Scaffolded `projects/movement-mcp/`: `package.json` (name `angular-movement-mcp`,
     `type: module`, single `bin: { "movement-mcp": "dist/cli.js" }` — both the server and the
     `init` subcommand dispatch through this one file, not `dist/index.js` as originally sketched
     — `files: ["dist", "skill", "README.md"]`, `dependencies: {"@modelcontextprotocol/sdk":
"^1.26.0", "zod": "^4.3.0"}`), `tsconfig.json`, own `vitest.config.ts`.
- [x] 3. `projects/movement-mcp/scripts/generate-snapshot.mjs` (plain `.mjs`, matching this repo's
     existing dependency-free tooling convention rather than a TS script — see the file's own
     header comment): shells out to `.claude/scripts/api-surface.mjs --json` for
     selector/exportAs/inputs/outputs/signals, reads `directive-reference.ts`'s
     `DIRECTIVE_REFERENCE` (type-stripped and dynamically imported — it turned out to have no
     `example` field, see Proposed solution's `get_example` note) for descriptions, reads
     `presets.types.ts`'s `MovePreset` union, and writes
     `projects/movement-mcp/src/data/api-snapshot.json` (21 directives, 29 presets as of this
     run). The one-shot/reactive flag is a small hardcoded allowlist sourced from this file's own
     "one-shot by design" gotcha, with a comment pointing back here.
- [x] 4. `projects/movement-mcp/src/index.ts` — exports `createServer()`/`startServer()`,
     registering the four tools over stdio transport, reading the snapshot via `src/snapshot.ts`.
- [x] 5. `projects/movement-mcp/src/cli.ts` — the actual bin entry: dispatches `init` (via
     `src/init.ts` + `src/mcp-config.ts`) vs. default (`startServer()`).
- [x] 6. `projects/movement-mcp/skill/movement-usage/SKILL.md` — written, and corrected mid-review:
     the first draft's own example guessed `[moveHover]` as the hover directive's selector — the
     real one is `[moveWhileHover]`. Left the mistake in as a worked example of exactly the
     failure mode `get_directive` exists to catch, instead of just quietly fixing it.
- [x] 7. `projects/movement-mcp/README.md` — written.
- [x] 8. Root `package.json` scripts added: `mcp:install`, `mcp:snapshot`, `mcp:build`, `mcp:test`,
     `mcp:pack:check`, `mcp:publish` (defined but never invoked here).
- [x] 9. Tests: `tools.spec.ts` (11 tests, fixture-based), `mcp-config.spec.ts` (3 tests),
     `init.spec.ts` (3 tests, real temp-dir I/O) — 15/15 passing.
- [x] 10. Phase 6 bookkeeping done: `CHANGELOG.md` Unreleased, `docs/ai/STATE.md` (new gotcha +
      "Next up" item #7).

Also required and not in the original plan: `.gitignore` needed two new entries
(`/projects/movement-mcp/node_modules`, `/projects/movement-mcp/dist`) — the existing `/dist` and
`/node_modules` patterns are root-anchored and don't reach a nested standalone package. Caught
before staging anything by dry-running `git add -A -n`.

## Verification notes

Commands actually run, in order, from repo root unless noted:

- `node projects/movement-mcp/scripts/generate-snapshot.mjs` → `Wrote 21 directives and 29 presets`.
  Spot-checked the JSON: every directive has a `description` (all 21 matched `DIRECTIVE_REFERENCE`
  by class name, no fallback-branch entries), `MoveDragDirective` has 3 outputs and 8 inputs.
- `pnpm --dir projects/movement-mcp install` → standalone install, 140 packages, own lockfile.
- `pnpm --dir projects/movement-mcp run build` → clean `tsc` compile, no errors.
- `pnpm --dir projects/movement-mcp run test` → `Test Files 3 passed (3)`, `Tests 15 passed (15)`.
- Manual stdio smoke test: piped a scripted `initialize` → `notifications/initialized` →
  `tools/list` → `tools/call` JSON-RPC session into `node dist/cli.js`. `tools/list` returned all
  4 tools with schemas; `get_directive("MoveDragDirective")` returned the full real record;
  `get_example("moveWhileHover")` returned
  `{"className":"MoveHoverDirective","selector":"[moveWhileHover]","template":"<div [moveWhileHover]=\"'fade-up'\">...</div>"}`;
  `list_presets` returned all 29 real preset names. An earlier attempt with the guessed selector
  `"moveHover"` correctly returned an `isError` "No directive matches" result instead of silently
  matching the wrong thing.
- CLI `init`: ran `node dist/cli.js init` against a scratch dir — created `.mcp.json` with the
  `movement` entry and copied `.claude/skills/movement-usage/SKILL.md`; then pre-seeded `.mcp.json`
  with an unrelated `other` server and re-ran — `other` was preserved and `movement` was added
  alongside it, matching `init.spec.ts`'s assertions. (One early run accidentally executed against
  `projects/movement-mcp/` itself instead of the scratch dir, due to a shell `cd` ordering mistake
  in a single compound command — caught immediately via `git status`-style inspection and cleaned
  up before anything was staged; no artifact from that run was committed.)
- `pnpm --dir projects/movement-mcp pack --dry-run` → tarball contains exactly `dist/**`,
  `package.json`, `README.md`, `skill/movement-usage/SKILL.md` — confirmed no `src/` leak.
- `git diff --stat -- projects/movement/package.json` → empty.
- `pnpm run lint` (`ng lint`) → both projects (`angular-movement`, `movement`) pass; `movement-mcp`
  isn't an Angular CLI project so it isn't linted by this command (not a gap — it has its own
  `tsc --strict` compile as its type-checking gate).
- `pnpm run build` (demo site, also type-checks the library via the Vite alias) → succeeded.
- `pnpm run test:coverage` (library) → `Test Files 40 passed (40)`, `Tests 491 passed (491)`.
- `git add -A -n .` (dry run) → confirmed the exact file set that would be staged: `.gitignore`,
  root `package.json`, the new spec file, and everything under `projects/movement-mcp/` except its
  gitignored `node_modules`/`dist`. No stray `.mcp.json`/`.claude/` test artifacts.
- **Not run**: the real `pnpm run mcp:publish` (`npm publish`) — deliberately, per Out of Scope.

## Follow-ups (out of scope, noted for later)

- Claude Code plugin / marketplace listing bundling this MCP server + skill (needs a marketplace
  account — explicitly deferred by the user).
- Regenerating `api-snapshot.json` automatically as a release-checklist step (today: manual re-run
  before publish; wire into `RELEASE_CHECKLIST.md` once this ships once and the process is proven).
- Consider a `search_directives` fuzzy-match tool if `list_directives` proves too coarse in
  practice.
- `.claude/scripts/api-surface.mjs`'s signal regex requires an explicit generic
  (`signal<T>(...)`) and misses every current `signal(...)` call site (e.g.
  `MoveScrollDirective.progress`), so `signals` is `[]` for every directive in today's snapshot.
  Not fixed here (out of scope: that script isn't touched by this spec) — worth its own small fix
  since it silently under-reports a real part of the public API surface.
