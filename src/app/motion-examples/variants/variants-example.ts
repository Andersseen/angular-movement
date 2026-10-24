import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MoveVariantsDirective } from 'movement';

/**
 * Playground target for `moveVariants`. Variants are reactive: bind the active name and the element
 * animates to that state whenever it changes. Nothing is re-created.
 */
@Component({
  selector: 'app-variants-example',
  imports: [MoveVariantsDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex min-h-40 items-center justify-center">
      <div
        class="bg-surface border-accent/40 w-56 rounded-xl border p-5 text-center shadow-[0_0_30px_var(--color-accent-glow)]"
        data-testid="variants-target"
        [moveVariants]="variants"
        [moveVariant]="variant()"
        [moveDuration]="duration()"
        [moveDisabled]="disabled()"
      >
        <p class="font-display text-text m-0 text-base font-semibold">{{ variant() }}</p>
        <p class="text-text-muted m-0 text-sm">Active variant</p>
      </div>
    </div>
  `,
})
export class VariantsExample {
  readonly variant = input<'idle' | 'active' | 'error'>('idle');
  readonly duration = input(300);
  readonly disabled = input(false);

  protected readonly variants = {
    idle: { scale: 1, rotate: 0, opacity: 1 },
    active: { scale: 1.1, rotate: 4, opacity: 1 },
    error: { scale: 0.94, rotate: -3, opacity: 0.55 },
  };
}
