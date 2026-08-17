import { Injectable } from '@angular/core';

/**
 * How long a published rect stays claimable, in milliseconds.
 *
 * A shared-layout handover normally happens within one change-detection pass: the incoming element
 * mounts while the outgoing one has just published its rect. The window only needs to be wide
 * enough to absorb that, and short enough that an element mounting much later — a route revisited
 * minutes on — never animates in from a position the user cannot remember seeing.
 */
export const SHARED_LAYOUT_MAX_AGE_MS = 300;

interface SharedLayoutEntry {
  element: Element;
  rect: DOMRect;
  at: number;
}

/**
 * Tracks the last known rect per `moveLayoutId` so a mounting element can animate in from the
 * position of the element it replaces — the "magic move" between two distinct DOM nodes.
 *
 * Internal: it is not part of the public API surface, only `[moveLayoutId]` is.
 */
@Injectable({ providedIn: 'root' })
export class SharedLayoutRegistry {
  readonly #entries = new Map<string, SharedLayoutEntry>();

  /** Records where `element` currently sits. Called on every render pass for live elements. */
  publish(id: string, element: Element, rect: DOMRect, now = Date.now()): void {
    this.#prune(now);
    this.#entries.set(id, { element, rect, at: now });
  }

  /**
   * Returns the rect last published for `id` by a *different* element, or `null` when there is
   * none, when it is this element's own entry, or when it has aged out.
   */
  claim(id: string, element: Element, now = Date.now()): DOMRect | null {
    this.#prune(now);

    const entry = this.#entries.get(id);
    if (!entry || entry.element === element) {
      return null;
    }

    return now - entry.at <= SHARED_LAYOUT_MAX_AGE_MS ? entry.rect : null;
  }

  /**
   * Deliberately no `release()` on destroy.
   *
   * A handover runs in the order "create the incoming element, destroy the outgoing one" — or the
   * reverse, Angular does not promise which. Dropping the entry when its element is destroyed
   * would therefore lose the rect exactly in the case the feature exists for. Entries instead
   * outlive their element and age out through {@link SHARED_LAYOUT_MAX_AGE_MS}, which also bounds
   * how long a since-removed position stays claimable.
   */
  #prune(now: number): void {
    for (const [id, entry] of this.#entries) {
      if (now - entry.at > SHARED_LAYOUT_MAX_AGE_MS) {
        this.#entries.delete(id);
      }
    }
  }
}
