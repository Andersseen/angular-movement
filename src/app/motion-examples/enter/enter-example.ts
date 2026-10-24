import { VoltNativeButton } from '@voltui/components';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { MoveEnterDirective, MovePreset } from 'movement';

/**
 * Playground target for `moveEnter`.
 *
 * `moveEnter` plays once, when the element is created, and ignores later input changes (it is an
 * init-only directive). So this wrapper does not pretend to be reactive: every change to a setting —
 * and the Replay button — creates a *new* element, which plays the animation again with the new
 * settings. Angular Movement has no outputs; `played` belongs to this wrapper.
 */
@Component({
  selector: 'app-enter-example',
  imports: [MoveEnterDirective, VoltNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center gap-4">
      <div class="flex min-h-32 w-full items-center justify-center overflow-hidden">
        @for (run of runs(); track run) {
          <div
            class="bg-surface border-accent/40 rounded-xl border px-6 py-5 text-center shadow-[0_0_30px_var(--color-accent-glow)]"
            data-testid="enter-target"
            [moveEnter]="preset()"
            [moveDuration]="duration()"
            [moveDelay]="delay()"
            [moveEasing]="easing()"
            [moveDisabled]="disabled()"
          >
            <p class="font-display text-text m-0 text-base font-semibold">{{ preset() }}</p>
            <p class="text-text-muted m-0 text-sm">entered {{ plays() }}×</p>
          </div>
        }
      </div>
      <button voltButton variant="outline" type="button" (click)="replay()">Replay</button>
    </div>
  `,
})
export class EnterExample {
  readonly preset = input<MovePreset>('fade-up');
  readonly duration = input(500);
  readonly delay = input(0);
  readonly easing = input('ease-out');
  readonly disabled = input(false);
  readonly played = output<{ preset: string; duration: number; delay: number }>();

  protected readonly plays = signal(1);
  readonly #replays = signal(0);
  /** One key per input combination and per replay: a new key is a new element. */
  protected readonly runs = computed(() => [
    [
      this.#replays(),
      this.preset(),
      this.duration(),
      this.delay(),
      this.easing(),
      this.disabled(),
    ].join('|'),
  ]);

  #started = false;

  constructor() {
    effect(() => {
      this.runs();
      untracked(() => {
        if (this.#started) {
          this.plays.update((n) => n + 1);
          this.played.emit({
            preset: this.preset(),
            duration: this.duration(),
            delay: this.delay(),
          });
        }
        this.#started = true;
      });
    });
  }

  protected replay(): void {
    this.#replays.update((n) => n + 1);
  }
}
