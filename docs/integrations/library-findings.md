# Library findings from the website (not fixed here — site-only scope)

## `moveEnter` / `moveVariants` on a hidden host: unhandled `InvalidStateError` from `commitStyles`

- **Version:** `angular-movement` 1.2.0 (source at `4e71e2f`), Chromium 145.
- **Reproduction:** render a directive that plays on init inside a container that is `display: none` when it initialises
  (for example every panel of a tabs component that keeps inactive panels in the DOM, hidden):
  `<div hidden><div moveEnter="fade-up">…</div></div>`. When the animation finishes the engine calls
  `animation.commitStyles()`.
- **Expected:** the final styles are applied, or the commit is skipped quietly (an element that is not rendered has nothing to commit).
- **Actual:** `InvalidStateError: Failed to execute 'commitStyles' on 'Animation': Target element is not rendered.` surfaces as an
  unhandled error (one per hidden host) on page load; the landing page logged two before the workaround.
- **Impact:** console noise and, under strict error monitoring, failed tests. No visual defect.
- **Site workaround:** the landing "See it move" tabs create only the active tab's example.
- **Suggested fix (library, separate PR):** guard `commitStyles()` in the WAAPI player with `try/catch` (or skip when
  `!element.isConnected || getComputedStyle(element).display === 'none'`) and add a regression spec in `waapi-player`.
