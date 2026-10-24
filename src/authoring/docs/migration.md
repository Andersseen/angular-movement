---
title: Migrate from legacy animations
description: Assess an existing app, then migrate trigger by trigger. Some triggers convert cleanly, some need design decisions, and some should stay in CSS.
group: Adopt
order: 30
---

`@angular/animations` is deprecated in favour of native CSS with `animate.enter` / `animate.leave`. Migrating does not have to mean moving to Movement: for many triggers the right answer is plain CSS. This page helps you decide per trigger, and shows reviewed recipes for the ones that benefit from Movement. [Choose the right tool](/docs/choose-a-tool) is the decision guide.

## 1. Assess first (read-only)

The repository includes an assessment tool, `movement-migrate`. It parses your TypeScript with the compiler API and your templates with Angular's template parser — no regular expressions over source — and classifies every trigger. It **never writes files**. It lives in the [repository](https://github.com/Andersseen/angular-movement/tree/main/projects/movement-migrate) and is not published to npm yet.

```bash title=terminal.sh
# from a clone of the angular-movement repository
pnpm install
pnpm migrate:build
pnpm migrate:assess ../my-app/src          # human-readable report
pnpm migrate:assess ../my-app/src --json   # machine-readable
```

| Class               | Meaning                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Automatic candidate | Matches a strict literal shape; a suggested replacement is printed. Review before applying.       |
| Partial             | Part of the trigger maps cleanly; the rest (leave ownership, callbacks, states) needs a decision. |
| Manual              | Dynamic, parameterised, query-based or unresolved. Port by hand.                                  |
| Keep native / CSS   | Animates layout or paint properties that CSS or `animate.enter` / `animate.leave` handle better.  |

**Automatic candidate** means "eligible for a mechanical conversion", not "converted": the tool only prints a suggested template. A trigger is a candidate only when it is a static `:enter` tween on `opacity` / `transform` with literal timing, no parameters, no callbacks, and the same properties on both sides. Anything else is reported with the reason it was not. Providers (`provideAnimations`…) are always reported as manual: keep them until no trigger binding remains.

## 2. Recipes

### Simple enter

```ts title=before.ts
// legacy
@Component({
  template: '<li @fadeUp>…</li>',
  animations: [
    trigger('fadeUp', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class Row {}
```

```html title=after.html
<!-- Movement: import MoveEnterDirective in the component -->
<li moveEnter="fade-up" moveDuration="300ms" moveEasing="ease-out">…</li>

<!-- or, to match the legacy values exactly -->
<li [moveEnter]="{ opacity: [0, 1], y: [20, 0] }" moveDuration="300ms" moveEasing="ease-out">…</li>
```

Native alternative: a CSS class with `@starting-style` or `animate.enter`. Pick Movement if you also want the shared timing config, automatic reduced-motion handling or later state changes on the same element.

### Leave animations and `@if` ownership

The legacy `:leave` worked because Angular delayed removal. A directive cannot do that: `@if` destroys the view first. Use presence to own the lifetime.

::source{file="src/docs-snippets/presence.ts" region="presence-view" title="panel.ts"}

### Keyed lists and `@for` track identity

Exit animations on lists depend on stable identity. Track by a stable id (never by index) and use `*movePresenceFor` when removed rows must finish leaving, or when a row can come back while it is leaving.

::source{file="src/docs-snippets/presence.ts" region="presence-list" title="rows.ts"}

Plain `@for (row of rows(); track row.id) { <li>{{ row.name }}</li> }` is still right when rows never need an exit animation.

### State-driven transitions

`state()` plus `transition('a <=> b')` maps to named variants. Map each state by hand and bind `moveVariant`.

::source{file="src/docs-snippets/variants.ts" region="variants-named" title="selectable.ts"}

### Interaction feedback

Hover and press effects implemented with triggers and `(mouseenter)` handlers become `moveWhileHover` / `moveWhileTap`; if it is only a colour or shadow change, CSS `:hover` is simpler.

### Reduced motion

Movement honours `prefers-reduced-motion` automatically and resolves final styles immediately. Legacy triggers did not, so migrating usually _improves_ accessibility; verify the end state is still correct with motion off.

### SSR and first paint

Server-rendered HTML is shown before any animation starts. Do not hide above-the-fold content until hydration. For critical first-paint effects use CSS; use Movement for animations that begin after the app is interactive.

### Keep these in CSS or native Angular

- Height, width and colour tweens (use CSS transitions, `interpolate-size` or grid-row tricks).
- Route transitions with `query()`: consider the Router's View Transitions support first.
- Any trigger relying on `params`, `animateChild` or callbacks you cannot drop.

## What cannot be converted safely

- `(@trigger.done)` / `.start` callbacks: `moveEnter` has no equivalent output.
- `query()` / `stagger()` / `group()` / `sequence()` timelines.
- Parameterised triggers and values computed at runtime.
- `AnimationBuilder` code (port to [[api:MoveAnimator]] manually).

Not sure which API to use afterwards? See [Choose an API](/docs/api-selection).
