---
name: spec
description: Creates or resumes a spec in docs/ai/specs/ following the SDD-WORKFLOW Phase 2 contract. Use at the start of any non-trivial task — anything beyond a typo, a doc tweak, or a one-line bug fix with an obvious cause.
disable-model-invocation: true
---

# Spec

Per `docs/ai/SDD-WORKFLOW.md`, non-trivial work gets a spec **before** any code. The spec doubles as
the resume point when a session dies mid-task, which is the main reason it exists.

## First: is there already one?

```bash
ls docs/ai/specs/
grep -l "Status:.*\(draft\|approved\|in-progress\)" docs/ai/specs/*.md
```

If a spec covers this task, **resume it** — read it, find the first unticked step, continue there.
Do not start a new one. Restarting is the expensive failure mode this workflow exists to prevent.

## Creating a new spec

1. Next number = highest existing `NNN` + 1, zero-padded to three digits.
2. Copy the template, do not retype it:
   ```bash
   cp docs/ai/specs/_TEMPLATE.md docs/ai/specs/NNN-short-name.md
   ```
3. Fill in **every** section. Set `Created` and `Last updated` to today's real date.

## The sections that actually catch errors

- **Out of scope** — name specific files, APIs, and behaviors you will not touch. A vague "no
  refactors" is not out-of-scope; `engines/waapi-player.ts` is.
- **Acceptance criteria** — each one checkable by a command or a named manual step. "Works
  correctly" is not a criterion. "`pnpm e2e` passes and `/demos/drag` respects snap points" is.
- **Breaks public API** — if yes, you must get explicit user approval before implementing
  (SDD-WORKFLOW Phase 2.3). Run the `public-api-guard` agent if you are unsure whether it breaks.

## Scope check before writing

`docs/ai/CONTEXT.md` lists non-goals and `docs/ai/STATE.md` lists known gotchas. If the task
contradicts either, stop and ask the user — do not spec around it.

Read the code you will touch before proposing anything: the target files, their colocated
`.spec.ts`, and one similar existing implementation. For a new interaction directive that means
reading `move-hover.directive.ts` end to end — it is the canonical pattern.

## While implementing

Tick the checkboxes as you go, in spec order. When done, set `Status: done`, mark acceptance
criteria ✅/❌, and fill in **Verification notes** with the commands you actually ran and their real
results. Anything you deliberately skipped goes in **Follow-ups**, not silently omitted.
