import {
  Directive,
  effect,
  EmbeddedViewRef,
  forwardRef,
  inject,
  input,
  TemplateRef,
  ViewContainerRef,
} from '@angular/core';
import {
  MOVE_PRESENCE_PARENT,
  MovePresenceChild,
  MovePresenceProvider,
} from '../tokens/presence.tokens';

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
  #removeToken = 0;

  readonly #children = new Set<MovePresenceChild>();

  constructor() {
    effect(() => {
      const show = !!this.movePresence();

      if (show) {
        if (!this.#view) {
          this.#view = this.#viewContainer.createEmbeddedView(this.#template);
          this.#isRemoving = false;
        } else if (this.#isRemoving) {
          this.#isRemoving = false;
          this.#removeToken += 1;
          this.#cancelLeaveAnimations();
        }
      } else if (!show && this.#view && !this.#isRemoving) {
        this.#isRemoving = true;
        this.#removeToken += 1;
        this.removeView(this.#removeToken);
      }
    });
  }

  register(child: MovePresenceChild): void {
    this.#children.add(child);
  }

  unregister(child: MovePresenceChild): void {
    this.#children.delete(child);
  }

  private async removeView(token: number): Promise<void> {
    const promises: (Promise<void> | void)[] = [];

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

    // Only clear the view if this removal is still the active one.
    // A quick toggle back to visible increments the token and cancels leaves.
    if (token === this.#removeToken && this.#isRemoving && this.#view) {
      this.#viewContainer.clear();
      this.#view = null;
      this.#isRemoving = false;
      this.#children.clear();
    }
  }

  #cancelLeaveAnimations(): void {
    for (const child of this.#children) {
      child.cancelLeave?.();
    }
  }
}
