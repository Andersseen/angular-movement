import { Injectable } from '@angular/core';
import type { LayoutBox } from '../engines/layout-geometry';

/**
 * How long a published box stays claimable, in milliseconds.
 *
 * A shared-layout handover normally happens within one change-detection pass: the incoming element
 * mounts while the outgoing one has just published its box. The window only needs to be wide
 * enough to absorb that, and short enough that an element mounting much later — a route revisited
 * minutes on — never animates in from a position the user cannot remember seeing.
 */
export const SHARED_LAYOUT_MAX_AGE_MS = 300;

/** Hard bound on retained entries, so an app that mints ids forever cannot grow the registry. */
export const SHARED_LAYOUT_MAX_ENTRIES = 128;

/**
 * The window size a published box is only meaningful under. Boxes are scroll-adjusted (see
 * `layout-geometry`), so scrolling never invalidates one; a resize reflows the page and does.
 */
export interface LayoutViewport {
  width: number;
  height: number;
}

/** Reads the window state, or `null` where there is no window (never the case in a browser). */
export function readLayoutViewport(view: Window | null | undefined): LayoutViewport | null {
  return view ? { width: view.innerWidth ?? 0, height: view.innerHeight ?? 0 } : null;
}

interface SharedLayoutEntry {
  /** Identifies the publishing directive. Deliberately not the DOM element: see `claim`. */
  owner: object;
  box: LayoutBox;
  at: number;
  viewport: LayoutViewport | null;
}

/**
 * Tracks the last known natural box per `(scope, moveLayoutId)` so a mounting element can animate
 * in from the position of the element it replaces — the "magic move" between two distinct DOM
 * nodes.
 *
 * Identity rules (spec 021):
 * - The key is `scope + id`. Two regions that reuse a local id stay apart by giving their elements
 *   different `moveLayoutScope` values; without a scope, ids share one app-wide namespace.
 * - An entry is replaced by the latest publisher. There is no ownership arbitration between live
 *   elements — scope them.
 * - Entries hold a plain box and an opaque owner token, never an `Element`, so a destroyed host
 *   is not kept alive.
 * - Entries age out after {@link SHARED_LAYOUT_MAX_AGE_MS}, are dropped when the viewport was
 *   resized, are scroll-adjusted at the source, and are capped at
 *   {@link SHARED_LAYOUT_MAX_ENTRIES}.
 *
 * Internal: it is not part of the public API surface, only `[moveLayoutId]` is.
 */
@Injectable({ providedIn: 'root' })
export class SharedLayoutRegistry {
  readonly #entries = new Map<string, SharedLayoutEntry>();

  /** Number of retained entries; exposed for resource-bound tests. */
  get size(): number {
    return this.#entries.size;
  }

  /** Records where `owner` currently sits. Called on every render pass for live elements. */
  publish(
    id: string,
    owner: object,
    box: LayoutBox,
    viewport: LayoutViewport | null = null,
    now = Date.now(),
    scope = '',
  ): void {
    this.#prune(now);
    const key = keyOf(scope, id);
    // Re-insert so Map order is recency order: the cap below evicts the stalest first.
    this.#entries.delete(key);
    this.#entries.set(key, { owner, box: boxOf(box), at: now, viewport });

    while (this.#entries.size > SHARED_LAYOUT_MAX_ENTRIES) {
      const oldest = this.#entries.keys().next();
      if (oldest.done) break;
      this.#entries.delete(oldest.value);
    }
  }

  /**
   * Returns the box last published for `id` by a *different* owner, or `null` when there is none, when it is this owner's own entry, when it
   * has aged out, or when the viewport was resized since (every box is then stale).
   */
  claim(
    id: string,
    owner: object,
    viewport: LayoutViewport | null = null,
    now = Date.now(),
    scope = '',
  ): LayoutBox | null {
    this.#prune(now);

    const entry = this.#entries.get(keyOf(scope, id));
    if (!entry || entry.owner === owner) return null;

    const was = entry.viewport;
    if (was && viewport && (was.width !== viewport.width || was.height !== viewport.height)) {
      return null;
    }

    return entry.box;
  }

  /**
   * Deliberately no `release()` on destroy.
   *
   * A handover runs in the order "create the incoming element, destroy the outgoing one" — or the
   * reverse, Angular does not promise which. Dropping the entry when its element is destroyed
   * would therefore lose the box exactly in the case the feature exists for. Entries instead
   * outlive their element and age out through {@link SHARED_LAYOUT_MAX_AGE_MS}, which also bounds
   * how long a since-removed position stays claimable. They hold no DOM reference, so what
   * lingers is four numbers.
   */
  #prune(now: number): void {
    // Map order is recency order (see `publish`), so the first live entry ends the scan: a render
    // pass over N elements is O(N), not O(N²).
    for (const [key, entry] of this.#entries) {
      if (now - entry.at <= SHARED_LAYOUT_MAX_AGE_MS) break;
      this.#entries.delete(key);
    }
  }
}

function keyOf(scope: string, id: string): string {
  return `${scope}\u0000${id}`;
}

/** Copies the four numbers, so a live `DOMRect` is never retained. */
function boxOf(box: LayoutBox): LayoutBox {
  return { left: box.left, top: box.top, width: box.width, height: box.height };
}
