# Migration guide

Upgrade notes for `angular-movement`. Only releases that require a code change are listed — if a
version is missing, upgrading to it needs nothing from you.

Every entry states whether it is **breaking** (your build or behaviour changes without action) or
**advisory** (nothing breaks, but there is a better way now).

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

None. No public API has been removed since `0.5.0`; the only rename is `moveAnimate` →
`moveVariant` above, and the old name was removed rather than deprecated because it collided with
another directive's selector.

## API stability

Each declaration carries a `@stability` JSDoc tag (`stable` / `candidate` / `experimental`) that
your editor surfaces at the point of use. Experimental APIs — `moveLayout`, advanced `moveDrag`,
`moveSmoothScroll`, `moveTarget`, `moveTrigger` — can change between minor versions. See the
"API stability" table in [README.md](README.md).
