import { Directive, forwardRef, input } from '@angular/core';
import { MoveSpring } from '../presets/presets.types';
import { compareDocumentOrder, optionalNumberAttribute } from './move-animation.utils';
import { MOVE_STAGGER_PARENT, MoveStaggerProvider } from '../tokens/stagger.tokens';

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
  readonly moveStagger = input<number | MoveSpring | '', unknown>(100, {
    transform: (value) => {
      if (value === '' || typeof value === 'number' || typeof value === 'object')
        return value as number | MoveSpring | '';
      return Number(value);
    },
  });
  readonly moveStaggerStep = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
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
