import { Directive, forwardRef, input } from '@angular/core';
import { MoveSpring } from '../presets/presets.types';
import { MOVE_STAGGER_PARENT, MoveStaggerProvider } from '../tokens/stagger.tokens';

export type MoveStaggerDirection = 'first' | 'last' | 'center';

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
  readonly moveStagger = input.required<number | MoveSpring>();
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

    const list = Array.from(this.#children).sort((a, b) => {
      if (a === b) return 0;
      const pos = a.compareDocumentPosition(b);
      if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
      if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
      return 0;
    });

    const index = list.indexOf(el);
    if (index === -1) return 0;

    const staggerConfig = this.moveStagger();
    // If it's a spring config but used for stagger, default to 100ms or try to derive.
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
