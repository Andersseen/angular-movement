import {
  ChangeDetectorRef,
  Directive,
  EmbeddedViewRef,
  Injector,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  effect,
  inject,
  input,
} from '@angular/core';
import {
  MOVE_PRESENCE_PARENT,
  MovePresenceChild,
  MovePresenceProvider,
} from '../tokens/presence.tokens';

/**
 * `'sync'` — entering and leaving items animate at the same time.
 * `'wait'` — no new view is created until every pending leave has resolved.
 */
export type MovePresenceForMode = 'sync' | 'wait';

export type MovePresenceForTrackBy<T> = (index: number, item: T) => unknown;

export interface MovePresenceForContext<T> {
  $implicit: T;
  index: number;
  count: number;
  first: boolean;
  last: boolean;
  even: boolean;
  odd: boolean;
}

/**
 * One presence scope per rendered item.
 *
 * Handed to the item's embedded view through its own `Injector`, so a child animation directive
 * inside a row registers against *that row* rather than against the whole list. Without this,
 * removing one item would play the leave animation on every sibling.
 */
class MovePresenceItemScope implements MovePresenceProvider {
  readonly children = new Set<MovePresenceChild>();

  register(child: MovePresenceChild): void {
    this.children.add(child);
  }

  unregister(child: MovePresenceChild): void {
    this.children.delete(child);
  }
}

interface PresenceEntry<T> {
  key: unknown;
  view: EmbeddedViewRef<MovePresenceForContext<T>>;
  scope: MovePresenceItemScope;
  leaving: boolean;
  /** Bumped on every leave/revive so a resolved leave from a previous cycle cannot remove a revived view. */
  token: number;
}

function defaultTrackBy<T>(_index: number, item: T): unknown {
  return item;
}

/**
 * Keyed-list counterpart to `*movePresence`.
 *
 * `@for` destroys an embedded view the moment its item leaves the source array, which is why exit
 * animations are impossible inside it. This directive renders the list itself, so it can keep a
 * removed item's view in the DOM until that item's own leave animations resolve.
 *
 * Stable candidate — feature-complete, but naming or behaviour may still receive small adjustments before 1.0.
 *
 * @stability candidate
 */
@Directive({
  selector: '[movePresenceFor]',
})
export class MovePresenceForDirective<T> implements OnDestroy {
  readonly movePresenceForOf = input.required<readonly T[] | null | undefined>();
  readonly movePresenceForTrackBy = input<MovePresenceForTrackBy<T>>(defaultTrackBy);
  readonly movePresenceForMode = input<MovePresenceForMode>('sync');

  readonly #viewContainer = inject(ViewContainerRef);
  readonly #template = inject(TemplateRef<MovePresenceForContext<T>>);
  readonly #injector = inject(Injector);
  readonly #changeDetector = inject(ChangeDetectorRef);

  /** Mirrors the view container's order exactly, leaving entries included. */
  readonly #entries: PresenceEntry<T>[] = [];

  #destroyed = false;

  constructor() {
    effect(() => {
      const items = this.movePresenceForOf() ?? [];
      const trackBy = this.movePresenceForTrackBy();
      this.movePresenceForMode();

      this.#sync(items, trackBy);
    });
  }

  ngOnDestroy(): void {
    this.#destroyed = true;
    for (const entry of this.#entries) {
      entry.token += 1;
      for (const child of entry.scope.children) {
        child.cancelLeave?.();
      }
    }
    this.#entries.length = 0;
  }

  /** Lets a template use `$implicit` and friends under `strictTemplates`. */
  static ngTemplateContextGuard<T>(
    _directive: MovePresenceForDirective<T>,
    context: unknown,
  ): context is MovePresenceForContext<T> {
    return true;
  }

  #sync(items: readonly T[], trackBy: MovePresenceForTrackBy<T>): void {
    if (this.#destroyed) return;

    const keys = items.map((item, index) => trackBy(index, item));
    const liveKeys = new Set(keys);

    // 1. A key that came back cancels its leave *before* placement runs, so the loop below only
    //    ever has to step over entries that are genuinely on their way out. Reviving inside the
    //    placement loop instead would make it skip the very entry it is about to place, and the
    //    resulting index could run past the end of the container.
    for (const entry of this.#entries) {
      if (entry.leaving && liveKeys.has(entry.key)) {
        this.#reviveEntry(entry);
      }
    }

    // 2. Anything no longer in the source array starts leaving. Its view stays in the container.
    for (const entry of [...this.#entries]) {
      if (!entry.leaving && !liveKeys.has(entry.key)) {
        this.#startLeave(entry);
      }
    }

    // 3. `wait` holds new views back until the container has no leaving entry left.
    const holdNewViews =
      this.movePresenceForMode() === 'wait' && this.#entries.some((entry) => entry.leaving);

    // 4. Place live items in source order, stepping over leaving entries so a row that is on its
    //    way out keeps the slot it already occupies instead of being shoved to the end.
    let cursor = 0;

    for (let i = 0; i < items.length; i += 1) {
      while (this.#entries[cursor]?.leaving) {
        cursor += 1;
      }

      const key = keys[i];
      const existing = this.#entries.findIndex((entry) => entry.key === key);

      if (existing === -1) {
        if (holdNewViews) continue;
        this.#createEntry(items[i], key, cursor);
      } else {
        const entry = this.#entries[existing];
        if (existing !== cursor) {
          this.#moveEntry(existing, cursor);
        }
        entry.view.context.$implicit = items[i];
      }

      cursor += 1;
    }

    this.#refreshContexts();
  }

  #createEntry(item: T, key: unknown, index: number): void {
    const scope = new MovePresenceItemScope();
    const context: MovePresenceForContext<T> = {
      $implicit: item,
      index: 0,
      count: 0,
      first: false,
      last: false,
      even: false,
      odd: false,
    };

    const view = this.#viewContainer.createEmbeddedView(this.#template, context, {
      index,
      injector: Injector.create({
        providers: [{ provide: MOVE_PRESENCE_PARENT, useValue: scope }],
        parent: this.#injector,
      }),
    });

    this.#entries.splice(index, 0, { key, view, scope, leaving: false, token: 0 });
  }

  #moveEntry(from: number, to: number): void {
    const [entry] = this.#entries.splice(from, 1);
    this.#entries.splice(to, 0, entry);
    this.#viewContainer.move(entry.view, to);
  }

  #startLeave(entry: PresenceEntry<T>): void {
    entry.leaving = true;
    entry.token += 1;
    const token = entry.token;

    const pending = [...entry.scope.children].map((child) => child.playLeave());

    Promise.all(pending)
      .catch(() => undefined)
      .then(() => {
        // A revive (or another leave) bumped the token — this resolution is stale.
        if (this.#destroyed || entry.token !== token || !entry.leaving) return;

        this.#destroyEntry(entry);

        if (this.movePresenceForMode() === 'wait') {
          this.#sync(this.movePresenceForOf() ?? [], this.movePresenceForTrackBy());
        }

        // This runs from a settled promise, outside any change detection pass. Without this the
        // views created or removed here would never be checked in a zoneless app.
        this.#changeDetector.markForCheck();
      });
  }

  #reviveEntry(entry: PresenceEntry<T>): void {
    entry.leaving = false;
    entry.token += 1;
    for (const child of entry.scope.children) {
      child.cancelLeave?.();
    }
  }

  #destroyEntry(entry: PresenceEntry<T>): void {
    const position = this.#entries.indexOf(entry);
    if (position !== -1) {
      this.#entries.splice(position, 1);
    }

    const viewIndex = this.#viewContainer.indexOf(entry.view);
    if (viewIndex !== -1) {
      this.#viewContainer.remove(viewIndex);
    }

    this.#refreshContexts();
  }

  /**
   * `index`/`count`/`first`/`last` describe the *live* list, so a row that is leaving is not
   * counted — otherwise every sibling's index would shift twice per removal.
   */
  #refreshContexts(): void {
    const live = this.#entries.filter((entry) => !entry.leaving);

    live.forEach((entry, index) => {
      const context = entry.view.context;
      context.index = index;
      context.count = live.length;
      context.first = index === 0;
      context.last = index === live.length - 1;
      context.even = index % 2 === 0;
      context.odd = index % 2 === 1;
    });
  }
}
