---
title: Get started
description: Install Angular Movement, optionally configure it once, and animate your first element.
group: Start here
order: 2
---

Angular Movement supports Angular `^21.2.0 || ^22.0.0` and works with standalone components, zoneless change detection and server rendering.

## 1. Install the package

:::tabs Package manager

:::tab pnpm

```bash
pnpm add angular-movement
```

:::tab npm

```bash
npm install angular-movement
```

:::tab yarn

```bash
yarn add angular-movement
```

:::

## 2. Optionally register the provider

The defaults are fine for most apps. Use [[api:provideMovement]] to override durations or easings once, for the whole application. Numbers are milliseconds.

::source{file="src/docs-snippets/get-started.ts" region="get-started-config" title="app.config.ts"}

## 3. Import the directive each component uses

Every directive is standalone, so there is nothing else to register. [[api:MoveEnterDirective]] is the one used here. Everything is imported from `angular-movement`:

::source{file="src/docs-snippets/get-started.ts" region="get-started-imports" title="imports"}

::source{file="src/docs-snippets/get-started.ts" region="get-started-component" title="welcome.ts"}

> [!NOTE]
> That is the whole setup: no triggers to declare and no state to manage. The element animates when Angular creates it.

## Try it

Change the settings of the real `moveEnter` directive. Because `moveEnter` plays once when its element is created, each change recreates the element so you can watch the new settings play.

::playground[enter]

## Next steps

- [Animate on enter and leave](/docs/guides/enter) explains lifecycle, timing and presence for exits.
- [Choose an API](/docs/api-selection) separates the one-shot directives from the reactive ones.
- [Accessibility and troubleshooting](/docs/accessibility) covers reduced motion, SSR and the usual surprises.
- Prefer a hands-on tour? Open the [full `moveEnter` playground](/demos/enter).
