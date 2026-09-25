import { Directive, forwardRef, input } from '@angular/core';
import { MoveSpring } from '../presets/presets.types';
import { compareDocumentOrder } from './move-animation.utils';
import { normalizeTime, optionalTimeAttribute } from '../move-time';
import { MOVE_STAGGER_PARENT, MoveStaggerProvider } from '../tokens/stagger.tokens';

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export type MoveStaggerDirection = 'first' | 'last' | 'center';

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Directive({
  selector: '[moveStagger]',
  providers: [
    {
      provide: MOVE_STAGGER_PARENT,
      useExisting: forwardRef(() => MoveStaggerDirective),
    },
  ],
})
export class MoveStaggerDirective implements MoveStaggerProvider {
  /**
   * Delay between consecutive children — a `MoveTime`: a number is milliseconds, or
   * `"80ms"` / `"0.08s"`. A bare `moveStagger` attribute uses the 100ms default.
   */
  readonly moveStagger = input<number | MoveSpring | '', unknown>(100, {
    transform: (value) => {
      if (value === '' || (typeof value === 'object' && value !== null)) {
        return value as MoveSpring | '';
      }
      return normalizeTime('moveStagger', value) ?? '';
    },
  });
  /** Overrides `moveStagger`'s step — same `MoveTime` units. */
  readonly moveStaggerStep = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveStaggerStep'),
  });
  readonly moveStaggerDirection = input<MoveStaggerDirection>('first');

  #children = new Set<HTMLElement>();

  register(el: HTMLElement): void {
    this.#children.add(el);
  }

  unregister(el: HTMLElement): void {
    this.#children.delete(el);
  }

  getDelay(el: HTMLElement): number {
    if (!this.#children.has(el)) return 0;

    const list = Array.from(this.#children).sort(compareDocumentOrder);

    const index = list.indexOf(el);
    if (index === -1) return 0;

    const staggerConfig = this.moveStaggerStep() ?? this.moveStagger();
    const staggerTime = typeof staggerConfig === 'number' ? staggerConfig : 100;

    const direction = this.moveStaggerDirection();
    const total = list.length;

    let staggerIndex = index;
    if (direction === 'last') {
      staggerIndex = total - 1 - index;
    } else if (direction === 'center') {
      const center = (total - 1) / 2;
      staggerIndex = Math.abs(index - center);
    }

    return staggerIndex * staggerTime;
  }
}
