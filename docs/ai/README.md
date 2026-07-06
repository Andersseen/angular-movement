# AI Agent Docs — Read This First

This folder contains everything an AI coding agent needs to work correctly on this repository.
It exists so that any model — regardless of capability — produces consistent, correct changes.

## Reading order (do this at the start of every session)

1. **[CONTEXT.md](CONTEXT.md)** — what this project is, why it exists, what it must achieve. Read always.
2. **[STATE.md](STATE.md)** — current status, what's done, what's in progress, what's next. Read always.
3. **[ARCHITECTURE.md](ARCHITECTURE.md)** — file map, data flow, directive reference. Read when touching code.
4. **[BEST-PRACTICES.md](BEST-PRACTICES.md)** — mandatory coding rules with examples. Read before writing code.
5. **[SDD-WORKFLOW.md](SDD-WORKFLOW.md)** — the spec-driven process every task must follow. Read before starting a task.
6. **[specs/](specs/)** — one spec file per feature/change. Check for an existing spec before starting; create one from [specs/\_TEMPLATE.md](specs/_TEMPLATE.md) for any non-trivial task.

## Active plan

**[PLAN-0.6.md](PLAN-0.6.md)** — the current improvement backlog: ship library `0.6.0` + demo site
refresh. If the user asks "what's next" or gives you free rein, work from that file top-down.

## Hard rules (summary — details in the files above)

- Package manager is **pnpm**. Never use npm or yarn.
- Follow the **spec-first workflow**: no implementation without a spec for non-trivial changes.
- **Never break the public API** (`projects/movement/src/public-api.ts`) without a spec that says so.
- Every code change must pass: `pnpm test:coverage`, `ng lint`, `pnpm build`.
- **Update [STATE.md](STATE.md) and `CHANGELOG.md` (Unreleased section)** when you finish a task.
- When unsure, prefer **reading more code** over guessing. All patterns you need already exist in the codebase.
