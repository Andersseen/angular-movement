# Spec 011 — Light/dark theme, vertex-editor-lite code display, release sync

- **Status:** done (demo-focused scope, per owner's choice — see Follow-ups for the deferred rest)
- **Created:** 2026-08-27
- **Last updated:** 2026-08-27
- **Breaks public API:** no (demo site only)
- **Related:** follow-on from spec 010, same session. Owner also asked to sync the site's displayed
  version after publishing `1.0.0` to npm separately from this session.

## Problem / motivation

Three asks from the owner, done together because the second two compose (the editor's `theme`
input needs a theme system to bind to, and both needed the site rebuilt/verified together):

1. The site's nav badge still read `v0.9.0` even though `angular-movement@1.0.0` was already
   published to npm and tagged that same morning — the release commit existed only as a pushed git
   tag, never merged into `main`.
2. The site was dark-only, no light theme.
3. Every demo's "HTML Output" panel (and the docs' inline code blocks, out of scope this pass) was
   HTML hand-highlighted with manually authored `<span class="code-keyword">` etc. markup baked
   into each page's TypeScript source — not real syntax highlighting, and a maintenance burden any
   time a snippet changed. The owner asked to use their own `vertex-editor-lite` web component
   (read-only CodeMirror display, https://github.com/Andersseen/vertex) instead, scoped to the demo
   code panels first (not the Docs prose code blocks — see Follow-ups).

## Proposed solution

**Release sync.** Found `main` was one commit behind its own `v1.0.0` tag (release commit
`9d5883a` existed, was tagged and pushed, `angular-movement@1.0.0` was live on npm — but the commit
was never merged into `main`). Fast-forwarded local `main` to include it, then rebased the spec 010
branch on top. No new release action taken — 1.0.0 was already published; this only fixed `main`
disagreeing with its own tag.

**Theme system.** `ThemeService` (`src/app/shared/theme.service.ts`, signal-based) reads
`data-theme` off `<html>` on construction (SSR-safe: defaults to `'dark'` on the server). A
blocking inline script in `index.html` resolves the theme (stored preference →
`prefers-color-scheme` → dark) and sets `data-theme="light"` on `<html>` before first paint when
needed — this runs before Angular hydrates and touches only `<html>`, outside anything hydration
reconciles, so it cannot cause a hydration mismatch. Dark stays the bare `:root` default (no
attribute needed) so SSR output and no-JS clients look exactly as they did before this spec; a new
`:root[data-theme='light']` block in `styles.css` mirrors every existing dark OKLCH token at the
same hue angles, shifted lightness/chroma only. Toggle button (lumen-icons `sun`/`moon`) added to
both desktop and mobile nav in `src/app/layout/navbar/navbar.ts`.

**vertex-editor-lite.** Downloaded `web-editor-lite.min.js` (+ its sourcemap) directly from the
GitHub Release (`web-editor-latest` tag) into `public/` — the project's own installer script exists
but runs arbitrary code from a pipe, which this session's sandbox correctly refused; a direct `curl`
to the named asset is the same result without that risk. Registered via a plain `<script defer>` in
`index.html` (framework-agnostic custom element, no build-time package). Every place that displayed
one of these hand-highlighted code panels now uses `<vertex-editor-lite [value] language="html"
[theme]="theme()">` instead:

- `DemoContainer` (covers 18 of 22 demo routes) — its `highlightedCode` computed now returns plain
  HTML text (no spans, no HTML-entity escaping) since the editor does its own highlighting.
- `demos/animate.page.ts` and `demos/animation.page.ts` — the two demos with their own separate,
  hand-rolled code panel (they don't use `DemoContainer`) — same treatment.
- The 9 demo pages that pass a full `customCode`/`directiveBinding` string into `DemoContainer`
  (`drag`, `icons`, `leave`, `loop`, `parallax`, `scroll`, `target`, `variants`, plus
  `DemoContainer` itself) had their generator strings de-spanned to plain text. `hover.page.ts` /
  `tap.page.ts` needed no change — they already built their string via the shared
  `keyframesToString()` util in `demo.utils.ts`, which was already plain text.
- Each component using the custom element gets `schemas: [CUSTOM_ELEMENTS_SCHEMA]` (Angular doesn't
  know the tag natively) and injects `ThemeService` to bind `[theme]`.

## Out of scope (this pass — see Follow-ups)

- Docs prose code blocks (`CodeBlock` component, used in `docs/api`, `docs/reference`,
  `docs/presets`, `docs/get-started`, `docs/introduction`) — owner explicitly chose to start with
  the demo panels only.
- `InfoCard`, `CodeBlock` copy-button, `animate.page.ts` → `DemoContainer` rework — already
  deferred from spec 010, still deferred.
- Any change to `projects/movement` or a real npm publish — 1.0.0 was already live; nothing here
  touches the package.

## Acceptance criteria

- [x] `main` includes the `v1.0.0` release commit; nav badge reads `v1.0.0` (verified live).
- [x] Light and dark themes both render correctly across a demo page, docs page, and templates
      page; toggle persists across reload (localStorage) and navigation; no FOUC; no hydration
      mismatch introduced (verified: 0 new console errors on any route).
- [x] Every demo route's code panel renders through `<vertex-editor-lite>` with real syntax
      highlighting and line numbers, reactively following the site's theme.
- [x] `pnpm test:coverage` (491), `pnpm test:site` (11), `ng lint`, `pnpm build`, `pnpm format`,
      and the full e2e suite (47 passed) all pass.
- [x] `docs/ai/STATE.md` updated. CHANGELOG.md not touched (demo-site-only, same reasoning as
      spec 010).

## Verification notes

- Fixed two real bugs surfaced by this change, both caught before commit:
  - A blind global find/replace while de-spanning `demo-container.ts` and 11 other files initially
    corrupted their real Angular templates too (it doesn't distinguish the `template:` string from
    the class-body code-generator strings) — reverted and redid it scoped to only the text after
    `export (default )?class`, which is always after the template in every one of these files.
  - `animate.page.ts` and `animation.page.ts`'s own `copyCode()` had a leftover
    `.replace(/<[^>]+>/g, '')` from when the source string still had real `<span>` tags to strip —
    once de-spanned, that regex started stripping the genuine `<div>`/`</div>` tags out of the
    _copied_ text instead. Simplified both to copy `highlightedCode()` directly, matching
    `DemoContainer`'s already-fixed `copyCode()`.
- e2e regressions found and fixed: the "animate demo reflects slider changes" test read
  `page.locator('code')`, which no longer exists (replaced by the custom element) — switched to
  reading the element's `.value` JS property. Separately, "text demo splits text into animated
  character spans" (unrelated to this spec's file changes) started flaking under parallel load —
  root cause was a pre-existing gap in the test itself (no wait for `moveText`'s microtask-deferred
  span split, called out generically in STATE.md's gotchas before this spec), just exposed now that
  every page pays a small extra parse cost for the always-loaded editor script. Fixed with
  `expect.poll`; verified solid 5/5 repeats single-worker.
- Full e2e suite: 47 passed. Only the two pre-existing parallel-load-flaky tests
  (`animate`/`enter`, tracked since spec 010) flagged flaky — confirmed 3/3 solid single-worker.
- Manually verified live via Playwright MCP: `/demos/drag` in both themes (screenshots), theme
  toggle button, `/demos/animate` (separate code-panel implementation) after toggling to dark —
  editor followed the site theme change without a reload.

## Follow-ups (out of scope, noted for later)

- Extend `vertex-editor-lite` to the Docs prose code blocks (replace `CodeBlock`) — deferred by
  the owner's explicit choice this pass.
- `web-editor-lite.min.js` is a manually-downloaded, unversioned static asset in `public/` — no
  update mechanism. Worth deciding whether to script a periodic re-fetch, pin/record the release
  commit it was built from, or wait for an actual npm-published package.
- The custom element renders its content with an accessibility role of `textbox` despite being
  read-only per its own docs — not verified whether it actually blocks edits or only intends to.
  Worth a quick check before leaning on it for anything accessibility-sensitive.
- `DemoContainer`'s code panel wrapper padding (`pt-10`, no horizontal padding) was chosen to roughly
  match the old panel's visual footprint but not pixel-verified against a design — worth a look if
  it ever looks cramped against the editor's own internal padding.
