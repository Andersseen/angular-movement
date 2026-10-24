import { VoltNativeButton } from '@voltui/components';
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
  imports: [MoveHoverDirective, MoveTapDirective, VoltNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex min-h-32 flex-col items-center justify-center gap-3">
      <button
        voltButton
        size="lg"
        type="button"
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
