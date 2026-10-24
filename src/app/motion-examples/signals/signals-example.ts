import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { moveSpringValue, moveTransform } from 'movement';

/**
 * Playground target for `moveTransform` / `moveSpringValue`: motion values are plain signals, so the
 * progress input drives a derived position directly (no animation object, no replay) and a spring
 * follows it. Both honour reduced motion, where the spring jumps straight to the target.
 */
@Component({
  selector: 'app-signals-example',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex min-h-32 flex-col justify-center gap-4 px-2">
      <div class="bg-surface-raised relative h-12 w-full rounded-full" aria-hidden="true">
        <div
          class="bg-accent-solid absolute top-1 left-1 h-10 w-10 rounded-full shadow-[0_0_20px_var(--color-accent-glow)]"
          data-testid="signals-target"
          [style.transform]="transform()"
        ></div>
      </div>
      <p class="text-text-muted m-0 text-center font-mono text-sm" data-testid="signals-readout">
        progress {{ progress() }} → x {{ x() }}px · spring scale {{ scale() }}
      </p>
    </div>
  `,
})
export class SignalsExample {
  /** 0 to 1. */
  readonly progress = input(0.5);

  protected readonly x = computed(() => Math.round(this.#x()));
  readonly #x = moveTransform(this.progress, [0, 1], [0, 220]);
  readonly #scale = moveSpringValue(moveTransform(this.progress, [0, 1], [0.8, 1.3]));
  protected readonly scale = computed(() => this.#scale().toFixed(2));
  protected readonly transform = computed(
    () => `translateX(${this.#x()}px) scale(${this.#scale()})`,
  );
}
