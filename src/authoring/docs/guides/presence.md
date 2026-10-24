---
title: 'Presence: animate things leaving'
description: Keep a view or a keyed list row mounted until its leave animation finishes, including nested children and rows that return mid-exit.
group: Guides
order: 13
---

A leave animation needs an element to still exist. `@if` and `@for` remove nodes synchronously, so by the time `moveLeave` could run, the node is gone — the directive is not broken, there is simply nothing left. Presence directives own the lifetime instead: they hold the view, wait for every registered leave animation, and only then let Angular remove it.

## A single view: `*movePresence`

::source{file="src/docs-snippets/presence.ts" region="presence-view" title="panel.ts"}

[[api:MovePresenceDirective]] waits for **all** descendants that registered a leave animation, including nested ones.

::playground[presence]

Toggle the panel with the control or the button in the preview. [Open the full presence playground](/demos/presence).

## A keyed list: `*movePresenceFor`

[[api:MovePresenceForDirective]] is the list counterpart: each row stays mounted while it leaves, and a row that returns mid-exit is revived instead of duplicated.

::source{file="src/docs-snippets/presence.ts" region="presence-list" title="rows.ts"}

> [!IMPORTANT]
> Track by a **stable identity**, never by index. With `track $index` Angular reuses DOM nodes, so reordering does not replay enter animations and exit animations attach to the wrong row.

Plain `@for (row of rows(); track row.id)` is still right when rows never need an exit animation.

## Exit variants

With `moveVariants`, `moveExitVariant` names the variant that plays inside `*movePresence` before removal. With `[moveAnimation]`, use its `exit` state.

**Related:** [`movePresence` playground](/demos/presence) · [`movePresenceFor` playground](/demos/presence-list) · [`moveLeave` playground](/demos/leave)
