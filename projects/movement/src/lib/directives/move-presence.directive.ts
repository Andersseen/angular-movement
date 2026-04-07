import { Directive, effect, EmbeddedViewRef, forwardRef, inject, input, TemplateRef, ViewContainerRef } from '@angular/core';
import { MOVE_PRESENCE_PARENT, MovePresenceChild, MovePresenceProvider } from '../tokens/presence.tokens';

@Directive({
  selector: '[movePresence]',
  providers: [
    {
      provide: MOVE_PRESENCE_PARENT,
      useExisting: forwardRef(() => MovePresenceDirective),
    },
  ],
})
export class MovePresenceDirective implements MovePresenceProvider {
  readonly movePresence = input<unknown>();

  readonly #viewContainer = inject(ViewContainerRef);
  readonly #template = inject(TemplateRef);

  #view: EmbeddedViewRef<unknown> | null = null;
  #isRemoving = false;

  readonly #children = new Set<MovePresenceChild>();

  constructor() {
    effect(() => {
      const show = !!this.movePresence();

      if (show) {
        if (!this.#view) {
          this.#view = this.#viewContainer.createEmbeddedView(this.#template);
          this.#isRemoving = false;
        } else if (this.#isRemoving) {
          // If we were removing, cancel the removal
          this.#isRemoving = false;
        }
      } else if (!show && this.#view && !this.#isRemoving) {
        this.#isRemoving = true;
        this.removeView();
      }
    });
  }

  register(child: MovePresenceChild): void {
    this.#children.add(child);
  }

  unregister(child: MovePresenceChild): void {
    this.#children.delete(child);
  }

  private async removeView(): Promise<void> {
    const promises: Array<Promise<void> | void> = [];

    // Trigger leave on all registered children
    for (const child of this.#children) {
      promises.push(child.playLeave());
    }

    try {
      if (promises.length > 0) {
        await Promise.all(promises);
      }
    } catch {
      // Ignore errors in animations
    }

    if (this.#isRemoving && this.#view) {
      this.#viewContainer.clear();
      this.#view = null;
      this.#isRemoving = false;
      this.#children.clear();
    }
  }
}
