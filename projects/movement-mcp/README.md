# angular-movement-mcp

A real [MCP](https://modelcontextprotocol.io) server for [`angular-movement`](https://www.npmjs.com/package/angular-movement),
plus an installable Claude Code skill — so a coding agent working in your Angular app can look up
the library's real directives, inputs and presets instead of guessing them.

## Install

```bash
npx angular-movement-mcp init
```

This, in the repo you run it from:

- Adds a `movement` entry to `.mcp.json` (creating the file if it doesn't exist yet, merging into
  it — and never overwriting an existing `movement` entry — if it does).
- Copies the `movement-usage` skill to `.claude/skills/movement-usage/`.

Resulting `.mcp.json` entry:

```jsonc
{
  "mcpServers": {
    "movement": { "command": "npx", "args": ["-y", "angular-movement-mcp"] },
  },
}
```

## Tools exposed

| Tool              | What it returns                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `list_directives` | Every directive wired into `MOVEMENT_DIRECTIVES` (selector, inputs, outputs, signals), optionally filtered by a substring |
| `get_directive`   | Full detail for one directive, by class name or selector                                                                  |
| `list_presets`    | Every valid `MovePreset` string                                                                                           |
| `get_example`     | A minimal template-binding skeleton for a directive, generated from its own selector + inputs                             |

All four are backed by a committed JSON snapshot regenerated from the library's actual source
(see `scripts/generate-snapshot.mjs` in this package) — not documentation that can silently drift.

## Development (this monorepo only)

```bash
pnpm install        # standalone install, own node_modules/lockfile
pnpm run snapshot   # regenerate src/data/api-snapshot.json from the library source
pnpm run build      # tsc -> dist/
pnpm test           # vitest
```

This package is published independently of `angular-movement` — installing the animation library
never pulls in the MCP SDK, and vice versa.
