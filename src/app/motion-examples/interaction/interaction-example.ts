import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { MoveHoverDirective, MovePreset, MoveTapDirective } from 'movement';

/**
 * Playground target for `moveWhileHover` + `moveWhileTap`.
 *
 * Both directives follow their inputs after init, so the controls bind straight through — nothing
 * is re-created. Hover only responds to a mouse or pen (a finger has no hover state); the tap
 * effect is the touch feedback.
 */
@Component({
  selector: 'app-interaction-example',
  imports: [MoveHoverDirective, MoveTapDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex min-h-32 flex-col items-center justify-center gap-3">
      <button
        type="button"
        class="bg-accent-solid focus-visible:outline-accent min-h-12 rounded-xl px-8 text-base font-semibold text-white shadow-[0_0_24px_var(--color-accent-glow)] focus-visible:outline-2 focus-visible:outline-offset-2"
        data-testid="interaction-target"
        [moveWhileHover]="hover()"
        [moveWhileTap]="tap()"
        [moveDuration]="duration()"
        [moveDisabled]="disabled()"
        (click)="pressed.emit({ count: presses() + 1 }); presses.set(presses() + 1)"
      >
        Hover or press me
      </button>
      <p class="text-text-muted m-0 text-sm" aria-live="polite">Pressed {{ presses() }}×</p>
    </div>
  `,
})
export class InteractionExample {
  readonly hover = input<MovePreset>('lift');
  readonly tap = input<MovePreset>('press');
  readonly duration = input(200);
  readonly disabled = input(false);
  readonly pressed = output<{ count: number }>();

  protected readonly presses = signal(0);
}
