import { InjectionToken } from '@angular/core';

export interface MoveVariantsProvider {
  activeVariant: () => string | undefined;
  /** Optional so an existing implementation of this interface keeps compiling. */
  registerChild?(element: HTMLElement): void;
  unregisterChild?(element: HTMLElement): void;
  /** Orchestration delay this parent assigns to the given child, in milliseconds. */
  childDelay?(element: HTMLElement): number;
}

/**
 * Internal: not part of the public API surface, only `[moveVariants]` is.
 *
 * Mirrors `MOVE_STAGGER_PARENT`/`MOVE_PRESENCE_PARENT` — a parent/child DI handshake between
 * directives, not a documented extension point.
 */
export const MOVE_VARIANTS_PARENT = new InjectionToken<MoveVariantsProvider>(
  'MOVE_VARIANTS_PARENT',
);
