# Spec 005 — `moveScrollContainer` / `moveParallaxContainer` broken while smooth scroll is active

- **Status:** done
- **Created:** 2026-08-07
- **Last updated:** 2026-08-07
- **Breaks public API:** no
- **Related:** spec 004, `MoveScrollDirective`, `MoveParallaxDirective`, `SmoothScrollService`

## Problem

Chasing an "intermittently flaky" e2e test turned up a real library defect.

`MoveScrollDirective` and `MoveParallaxDirective` both decided whether to attach a native scroll
listener like this:

```ts
if (!this.#smoothScroll?.isActive) {
  this.#scrollTarget!.addEventListener('scroll', this.#scrollListener, { passive: true });
}
```

`SmoothScrollService` only drives the **root/page** scroll. A custom container passed via
`moveScrollContainer` / `moveParallaxContainer` keeps scrolling natively regardless. So whenever an
app enabled smooth scroll — as the demo site does, calling `init()` in `App` — the directive skipped
the listener and had **no scroll source at all** for that container. Its fallback effect only fires
on the page's smooth-scroll position, which is meaningless for an inner container.

`MoveParallaxDirective` was worse: `#updateProgress` and `#initAnimation` preferred
`smoothScroll.scrollY()` (a **page** offset) over the container's own `scrollTop`, feeding a
page-relative number into a container-relative calculation.

Net effect: `moveScrollContainer` — added in 0.6.0 specifically for custom containers — was broken
for every app using smooth scroll, including the documentation site's own scroll demo.

## Why the test suite did not catch it

The e2e test looked correct and passed ~80% of the time, **for the wrong reason**. It sampled its
baseline immediately after the player appeared, while the initial lerp was still in flight, then
asserted the value had changed. The change came from the settling lerp, not from the scroll. Waiting
600 ms before sampling made the failure reproducible 3 times out of 3.

The unit tests missed it for two reasons: no test combined a custom container with an active
`SmoothScrollService`, and the container spec mocked `getBoundingClientRect()` as a constant, which
made the directive's `elTop` track `scrollTop` and cancel it out, so progress could never change.

## Evidence

Instrumented in a real browser: the container scrolled 427 → 794 and the element visibly moved
(`rectTop` 479 → 112), while the animation's `currentTime` stayed frozen at 463 even 1.3 s later.

|                                          | before fix            | after fix             |
| ---------------------------------------- | --------------------- | --------------------- |
| `currentTime` after scrolling to the end | 463 (frozen)          | 897 → 999             |
| translate / rotate                       | `23.14px` (unchanged) | `44.86px` → `49.95px` |

## Solution

Defer to `SmoothScrollService` only when it is genuinely the scroll source — that is, when the
directive tracks the page and no custom container is configured.

- Attach the native listener when `!isActive || hasCustomContainer`.
- Read the position from the container's `scrollTop` whenever a custom container exists, in both
  `#updateProgress` and `#initAnimation` (parallax).
- Gate the smooth-scroll effect on there being no custom container.

## Acceptance criteria

- [x] With smooth scroll active and a custom container, both directives attach the container listener.
- [x] Container scrolling changes progress with smooth scroll active.
- [x] Parallax reads the container's `scrollTop`, never the page offset, when a container is set.
- [x] Every new test was verified to fail against the unfixed code.
- [x] The e2e test can no longer pass on a settling lerp (it settles the baseline first and asserts
      the container actually moved).
- [x] Full gate green; `api-surface` identical to `v0.7.0`.

## Verification

Fault injection, both directions:

- Reintroducing the listener condition makes the hardened e2e fail 3/3 and the parallax unit test fail.
- Restoring the fix makes them pass 5/5.

e2e stability, whole suite: **5 consecutive runs, 43 passed, zero flaky** (previously ~1 hard
failure in 4).

| Command              | Result                                 |
| -------------------- | -------------------------------------- |
| `pnpm test:coverage` | 381 tests, 93.85% stmts, 86.55% branch |
| `ng lint`            | both projects pass                     |
| `pnpm build`         | site builds and prerenders             |
| `pnpm e2e`           | 43 passed × 5 runs                     |
| `pnpm docs:check`    | 20/20 directives match                 |
| `api-surface` diff   | identical to `v0.7.0`                  |

## Follow-ups

- A second `smooth scroll demo` e2e assertion was also wrong: it expected a bare `400` from
  `scrollTo(400)`, which clamps to the page's scrollable range. Fixed here by computing the expected
  clamp in the browser.
- Consider a dev-mode warning when `moveScrollContainer` is combined with an active
  `SmoothScrollService`, since the two are easy to reason about incorrectly.
