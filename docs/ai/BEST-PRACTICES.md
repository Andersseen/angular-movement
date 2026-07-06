# BEST PRACTICES — Mandatory Coding Rules

These rules are **not suggestions**. Code that violates them will be rejected in review.
When in doubt, open `projects/movement/src/lib/directives/move-hover.directive.ts` — it is the
canonical example of every library pattern.

## 1. Angular API surface (library and demo site)

✅ **DO** — modern signals-based Angular:

```ts
readonly moveDuration = input<number | undefined, unknown>(undefined, {
  transform: optionalNumberAttribute,
});
readonly #engine = inject(AnimationEngine);
readonly #host = inject(ElementRef<HTMLElement>);
```

❌ **DON'T** — legacy patterns are banned in new code:

```ts
@Input() moveDuration: number;            // no decorator inputs
constructor(private engine: AnimationEngine) {}  // no constructor injection
private engine;                            // no TS `private` for true internals — use #fields
```

- Inputs: `input()` / `input.required()`. Outputs: `output()`. State: `signal()` / `computed()` / `effect()`.
- Encapsulation: **`#field` native private syntax** for all internals in the library.
- Event listeners: declare in the `@Directive({ host: { '(mouseenter)': '...' } })` metadata —
  **never** `@HostListener` and never manual `addEventListener` unless you clean it up in `ngOnDestroy`.
- The demo app is **zoneless** (`provideZonelessChangeDetection()`): never rely on Zone.js for
  change detection; signals drive updates.

## 2. SSR safety (breaks production if ignored)

Every browser-only API (`window`, `document` measurement, `IntersectionObserver`,
`requestAnimationFrame`, `element.animate`) must be unreachable on the server.

✅ Preferred: route all animation work through `AnimationEngine` — it already no-ops on the server.
✅ Otherwise: guard with `isPlatformBrowser(inject(PLATFORM_ID))` before touching browser APIs.
✅ Inject `DOCUMENT` from `@angular/common` instead of using the global `document`.
❌ Never access `window` at module top level or in field initializers.

## 3. Animation lifecycle hygiene

- Keep a handle to the running player: `#currentPlayer: AnimationControls | null`.
- **Cancel before replay**: `this.#currentPlayer?.cancel()` at the start of every new play.
- **Cancel in `ngOnDestroy`** — always. Leaked WAAPI animations are memory leaks.
- Respect reduced motion: use `prefersReducedMotion(this.#documentRef)` and pass the result to
  `resolveMovementConfig(...)`. Never skip this.
- Config resolution order is always: `MOVEMENT_CONFIG` defaults → per-directive inputs → reduced-motion override.
  Use the existing `resolveMovementConfig()` helper; do not hand-roll merging.

## 4. Library boundaries

- **Zero new runtime dependencies.** The library depends on `tslib` only. If you think you need a
  package, you don't — write the ~20 lines yourself or stop and flag it.
- **Never edit `public-api.ts`** except to keep the single `export * from './lib/movement'` line.
  All exports go through `lib/movement.ts`.
- New public API = new export in `lib/movement.ts` + entry in the directive table in
  `docs/ai/ARCHITECTURE.md` + CHANGELOG entry.
- Selector prefix: `move` for the library (`[moveEnter]`), `app-` for demo components.
- Interaction directives use `moveWhile*` naming (`moveWhileHover`, `moveWhileTap`, `moveWhileFocus`).

## 5. Testing (Vitest for the library)

Every library source file has a colocated `.spec.ts`. The standard pattern:

```ts
@Component({
  template: `<div [moveWhileHover]="{ scale: [1, 1.1] }">Hover Me</div>`,
  imports: [MoveHoverDirective],
})
class TestHostComponent {}

beforeEach(() => {
  TestBed.configureTestingModule({
    imports: [TestHostComponent],
    providers: [provideMovement()],
  });
  fixture = TestBed.createComponent(TestHostComponent);
  fixture.detectChanges();
});
```

- Spy on the engine, don't run real animations:
  `vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue(null as unknown as AnimationControls)`.
- Trigger host bindings with `debugElement.triggerEventHandler('mouseenter', null)`.
- Use `vi` (Vitest), not `jasmine`/`jest`.
- Run one spec: `ng test movement --include='**/move-hover.directive.spec.ts'`.
- New behavior without a test = incomplete task.

## 6. Formatting, commits, tooling

- **pnpm only.** `pnpm dev`, `pnpm test`, `pnpm build`. Never npm/yarn (there is no package-lock.json; don't create one).
- Prettier: printWidth 100, single quotes, trailing commas. Tailwind class order is enforced by
  `prettier-plugin-tailwindcss`. Run `pnpm format` before finishing.
- Commits: **Conventional Commits** (`feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`) —
  commitlint + husky will reject anything else.
- Don't edit generated dirs: `dist/`, `coverage/`, `playwright-report/`, `test-results/`, `node_modules/`.

## 7. Common mistakes that WILL happen if you're not careful

| Mistake                                                       | Reality                                                                                    |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Using `[moveHover]` in templates/docs                         | The selector is `[moveWhileHover]` (same for tap/focus)                                    |
| Animating removal with `@if` + `[moveLeave]` alone            | `@if` destroys the view first. Wrap with `*movePresence`                                   |
| Passing single values as keyframes: `{ opacity: 1 }`          | Keyframes are pairs: `{ opacity: [0, 1] }` (except `moveAnimation` states)                 |
| Expecting `moveAnimation` to animate a prop only in `animate` | Only props present in **both** `initial` and `animate` animate                             |
| Changing `moveScroll` duration                                | It is intentionally fixed at 1000ms linear (progress mapping) — not a bug                  |
| "Fixing" inputs that don't react to changes                   | Some are init-only by design; making them reactive is a roadmap 0.6 decision, needs a spec |
| Importing from deep paths in the demo (`movement/lib/...`)    | Always import from the `movement` alias (public API only)                                  |
| Adding Zone.js-dependent code to the demo                     | The app is zoneless                                                                        |
