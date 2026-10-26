# Doqs feedback from the Angular Movement adoption

Angular Movement is a production consumer of **`@doqs/analog` 0.11.0** (published 2026-10-24) on **Angular 22.2.3**,
**Analog 2.9.1** (`@analogjs/content`, `@analogjs/router`, `@analogjs/platform`), Vite 8.3.5, TypeScript 6.0.3,
zoneless, Cloudflare Pages (static output). Nothing in Doqs or `node_modules` was patched; every workaround below is
host code. Items are marked **reproduced** only when the reproduction below was run in this repository.

## Verified, no issue

- `@doqs/analog/config` **is** in the published 0.11.0 tarball (`exports["./config"]`, `fesm2022/doqs-analog-config.mjs`,
  `types/doqs-analog-config.d.ts`). The source-package manifest inspected earlier was not what ships. `vite.config.ts` imports
  `doqPrerenderRoutes` from it, `doq.config.ts` could too.
- `doq doctor` (30 checks), `doq content generate|check`, `doq-api generate|check` and `doq-search index` all work against the
  real repository; `doq-api check` exits 1 on a one-line change to a public default (negative control run).
- `landmark: 'host'` + the shell's `<main>` → exactly one `main` on all 118 prerendered pages (asserted in `e2e-static`).

## Findings

### 1. Dev server cannot load Markdown routes under pnpm — `front-matter` has no default export (reproduced)

- **Doqs/Analog/Vite:** 0.11.0 / 2.9.1 / 8.3.5, pnpm 10.30.
- **Reproduction:** `pnpm add @doqs/analog @analogjs/content …`, wire Doqs as documented, `pnpm exec vite`, open any `/docs/*` URL.
- **Expected:** the page hydrates.
- **Actual:** console error `The requested module '/node_modules/.pnpm/front-matter@4.0.2/…/index.js' does not provide an export named 'default'`; the page stays server-rendered and nothing is interactive. The production build is unaffected.
- **Blocks integration?** No (build and static output are fine); it blocks `vite` dev and the dev-server e2e suite.
- **Files:** `vite.config.ts`.
- **Workaround (host config, documented Vite option):** `optimizeDeps: { include: ['@analogjs/content > front-matter'] }`.
- **Suggestion:** add the line to `doq init`'s output and a `doq doctor` check ("`front-matter` is pre-bundled for dev"). The root cause is probably Analog's, not Doqs's.

### 2. A click that arrives before hydration is not replayed on Doqs controls (reproduced; cause not isolated)

- **Reproduction:** build, serve `dist/analog/public` (`wrangler pages dev`), delay every `/assets/*.js` by 400 ms, `page.goto(url, { waitUntil: 'commit' })`, click immediately, wait 4 s. Script: `e2e-static/site.static.spec.ts` ("host components replay a click…") covers the host half; the Doqs half is the search button on `/docs/guides/enter` and the playground **Replay** button.
- **Expected:** `provideClientHydration(withEventReplay())` replays the click once the component hydrates.
- **Actual:** host controls (the navbar theme button) replay and the theme changes; the Doqs search button does not open its dialog and the playground wrapper's Replay button does not replay. Same result whether Doqs is provided globally or in a lazily loaded route.
- **Blocks?** No. It affects only impatient users on slow connections.
- **Workaround:** none needed; the static suite waits for `networkidle` before touching Doqs controls and says why.
- **Suggestion:** check whether Doqs listeners are attached in a way the event dispatcher does not record (`jsaction` is present on the buttons in the prerendered HTML).

### 3. `doq-api` renders input transforms as `unknown` (reproduced)

- **Reproduction:** `pnpm run docs:api`, open `src/content/docs/reference/move-enter-directive.md`.
- **Expected:** the **Type** column of `moveDuration` shows what a template may bind (`MoveTime`).
- **Actual:** `Type` is `unknown`, and the Description column says ``Transform `optionalTimeAttribute('moveDuration')`; reads as `number | undefined`.`` This is the case for every input declared with `input<T, unknown>(…, { transform })` (most inputs of this library).
- **Blocks?** No; the information is present, in the wrong column.
- **Suggestion:** when a transform's accepted type is `unknown` or not resolvable, show the _read_ type in **Type** and keep the transform note in Description. Directive summaries also fall back to the stability sentence when the class has no description; a `--summary-fallback` of "first sentence of the class JSDoc, else empty" would read better in the generated index.

### 4. Unknown URLs below the base path render a "not found" view with status 200 under SSR (reproduced in dev, by design in static output)

- **Reproduction:** `pnpm exec vite`, `curl -i http://127.0.0.1:5173/docs/nope`.
- **Expected/actual:** the Doqs not-found view (`<h1>Documentation page not found</h1>`) with HTTP **200**; Doqs cannot influence the status. On the static host this is irrelevant because the build emits `404.html` and Cloudflare Pages answers 404 for any URL without a file (asserted by `e2e-static`), but a Node/SSR deployment would serve soft 404s.
- **Blocks?** No.
- **Suggestion:** set the response status through Angular's `RESPONSE_INIT` token in the not-found view when rendering on the server.

### 5. `doq doctor` reads `app.config.ts` as text (reproduced)

- Doqs's own README supports scoping `provideDoq()` to a lazy route. Angular Movement does (the home page and demo gallery must not download the documentation stack: entry chunk 20 kB → 133 kB gzipped when global, 24 kB when lazy), and `doctor` only passes because the identifiers `doqRoutes(`, `provideDoq(` and `provideContent(` appear literally in `app.config.ts`'s `loadChildren`. A config split into a separate file would fail the check.
- **Suggestion:** resolve imports from `app.config.ts` one level deep, or add a documented `// doq-doctor: lazy` marker.

### 6. `formatDoqUsage` cannot omit defaults (minor)

`formatDoqUsage('div', { moveDelay: 0 })` prints `[moveDelay]="0"`. The host removes `false` booleans before calling it, but a `default` per control (do not print when equal) would keep copied snippets minimal.

### 7. Expanded preview and overlays — not exercised

None of Angular Movement's playgrounds append overlays to `<body>`, so the documented top-layer limitation does not apply. The presets gallery and every playground were opened in the inline preview only.

### 8. Sidebar page links inherit the group title's eyebrow style (reproduced, 0.11.0)

- **Reproduction:** open any `/docs/*` page with grouped navigation.
- **Expected:** the group title (`.doq-nav-group`) is a small-caps eyebrow; the page links inside it use the host's normal type.
- **Actual:** `.doq-nav-group` sets `text-transform: uppercase`, `letter-spacing: .1em`, `font-weight: 750` and `font-size: .68rem` on the container, so every `.doq-nav-link` inside inherits them and the sidebar reads as a different typeface from the rest of the site.
- **Workaround:** the host resets `.doq-nav-group .doq-nav-link` in `src/styles.css`.
- **Suggestion:** move the eyebrow declarations to the group's title element only.

### 9. The sticky TOC fix is on `main` but not published (blocking a visible bug)

`0aeda62` (sticky documentation TOC) is unreleased; npm `latest` is still 0.11.0, where `.doq-toc` is absolutely positioned inside the article and scrolls away with it (and below 1450px is static). The host cannot fix this without re-implementing the layout, so it waits for the next release.

## What worked well

Source-backed `::source` regions plus a compiled snippets folder (`ngc` strict templates) caught a real documentation bug on day one (the old patterns page showed a `viewChild` on an ES-private field). `::playground` with a host wrapper per directive, deterministic Markdown, Pagefind (91 pages, API symbols searchable), `doq-api check` as a CI gate and per-page `title`/`description` metadata needed no workaround.
