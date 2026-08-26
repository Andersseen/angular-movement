# Migration guide

Upgrade notes for `angular-movement`. Only releases that require a code change are listed — if a
version is missing, upgrading to it needs nothing from you.

Every entry states whether it is **breaking** (your build or behaviour changes without action) or
**advisory** (nothing breaks, but there is a better way now).

---

## 0.8.x → 0.9.0

0.9 is an API-convergence / hardening release — see
`docs/ai/specs/008-09-api-convergence-hardening.md` for the full audit. Two narrow, accidental
exports were removed; nothing else in the public surface changed shape.

### Two accidental exports removed — breaking, narrow

`MOVE_VARIANTS_PARENT` and `MoveVariantsProvider` (from `move-variants.directive.ts`) and
`CompositeAnimationControls` (the concrete engine class) are no longer exported from
`angular-movement`. Neither was documented in the "API stability" table or the DI-token reference,
and both were engine/DI-handshake internals that leaked by inconsistency — the equivalent
`MOVE_STAGGER_PARENT`/`MOVE_PRESENCE_PARENT` tokens, and `AnimationEngine` itself, were already
internal. If you were importing either directly, you were relying on an unsupported internal:

- `MOVE_VARIANTS_PARENT`/`MoveVariantsProvider`: there is no supported replacement — extend
  `[moveVariants]` at the template level instead of hooking its DI provider directly.
- `CompositeAnimationControls`: every return path that used to hand this back is typed as the
  still-public `AnimationControls` interface (`play`/`pause`/`cancel`/`currentTime`/`finished`),
  which covers the same usage without needing the concrete class.

### `moveSpringValue`'s `injector` is now optional — advisory

Called from a field initializer, constructor, or `runInInjectionContext`, `moveSpringValue` now
infers its injector automatically — the same convention `toSignal`/`toObservable` use. Passing
`{ injector }` explicitly still works identically, so no code needs to change.

```ts
// still works
readonly x = moveSpringValue(this.progress, { stiffness: 170, injector: inject(Injector) });

// now also works, when called from a field initializer/constructor
readonly x = moveSpringValue(this.progress, { stiffness: 170 });
```

`moveSpringValue` also now respects `prefers-reduced-motion` on its own — previously it was the
one motion primitive in the library that didn't. If you were manually resolving and passing
`disabled` to work around this, that still works; the automatic check is additive.

### `moveLayout`, `moveText`, `moveInView` now honour `MOVEMENT_CONFIG.disabled` — behavioural

All three resolved a `disabled` config correctly but then hardcoded `disabled: false` at the
engine call, silently ignoring the app-wide `provideMovement({ disabled: true })` kill switch —
the same bug class fixed for `moveScroll`/`moveParallax` in 0.7.0. If you rely on
`MOVEMENT_CONFIG.disabled` globally (rather than per-directive `moveDisabled`) to suppress
animation — for example in tests, or a reduced-experience mode — these three directives now
actually respect it.

---

## 0.7.x → 0.8.0

### Angular 22 is supported — advisory

The peer range widened from `^21.2.0` to `^21.2.0 || ^22.0.0`.

If you were on Angular 22 you could not install the library at all: `npm install` failed with an
`ERESOLVE` peer conflict. Nothing to change on your side beyond upgrading the package.

```bash
npm install angular-movement@latest
```

Both majors are now compiled against the packed package in CI, so this class of breakage is caught
before publish rather than by you.

### `[moveAnimation]` is now reactive to `animate` — behavioural

Previously the `animate` state was only read once, on init. Changing it later now replays the
animation from the last-applied state, compared by value (so an object literal bound straight in
the template doesn't replay on every change-detection pass).

**What changes for you:** if you were relying on `[moveAnimation]` ignoring later `animate`
changes — for example binding a signal that changes for unrelated reasons — it will now animate on
those changes too. Guard the binding if you need the old ignore-after-init behavior.

---

## 0.6.x → 0.7.0

### `moveScroll` and `moveParallax` now honour reduced motion — behavioural

Both directives previously animated regardless of the user's `prefers-reduced-motion` setting. They
now skip animating entirely when it is active.

**What changes for you:** if you relied on a scroll-linked animation to bring an element into its
final visible state, check how that element looks with motion suppressed. The element is left in its
natural CSS state, so a reveal like `{ opacity: [0, 1] }` ends up visible — but if you also set a
static starting style in CSS (for example `opacity: 0` on the element itself), it will now stay
invisible for those users.

```css
/* Don't hide the element in CSS and rely on the animation to reveal it. */
.card {
  opacity: 0;
} /* ✗ invisible under reduced motion */
```

```html
<!-- Let the directive own both ends of the animation. -->
<div [moveScroll]="{ opacity: [0, 1] }">…</div>
```

---

## 0.5.x → 0.6.0

### `moveVariants` active-variant input renamed — breaking

`MoveVariantsDirective` used to declare an input called `moveAnimate`, which collided with
`MoveAnimateDirective`'s selector. It is now `moveVariant`, with `moveActiveVariant` as an alias.

```html
<!-- before -->
<div [moveVariants]="variants" [moveAnimate]="state()">…</div>

<!-- after -->
<div [moveVariants]="variants" [moveVariant]="state()">…</div>
```

### `moveSpringValue` requires an injector — breaking

`moveSpringValue` creates an `effect`, which needs an injection context. The config now requires an
`injector`, and throws a clear error if it is missing.

```ts
// before
readonly x = moveSpringValue(this.progress, { stiffness: 170 });

// after
readonly #injector = inject(Injector);
readonly x = moveSpringValue(this.progress, { stiffness: 170, injector: this.#injector });
```

### Attribute inputs now coerce — advisory

Numeric and boolean inputs written as plain attributes used to be passed through as strings, so
`moveDuration="400"` silently misbehaved. They now coerce correctly.

```html
<div moveEnter="fade-up" moveDuration="400" moveInViewOnce="false">…</div>
```

If you worked around this by always binding (`[moveDuration]="400"`), that still works — no change
needed.

### `SmoothScrollService` opts out of reduced motion — behavioural

`init()` returns early when `prefers-reduced-motion` is active. Check `isActive` before assuming the
service is driving the page.

---

## Deprecations

`0.9.0` removed two accidentally-exported internals — `MOVE_VARIANTS_PARENT`/`MoveVariantsProvider`
and `CompositeAnimationControls` — see "0.8.x → 0.9.0" above. Before that, no public API had been
removed since `0.5.0`; the only rename is `moveAnimate` → `moveVariant` above, and the old name was
removed rather than deprecated because it collided with another directive's selector.

## API stability

Each declaration carries a `@stability` JSDoc tag (`stable` / `candidate` / `experimental`) that
your editor surfaces at the point of use. Experimental APIs — `moveLayout`, advanced `moveDrag`,
`moveSmoothScroll`, `moveTarget`, `moveTrigger` — can change between minor versions. See the
"API stability" table in [README.md](README.md).
