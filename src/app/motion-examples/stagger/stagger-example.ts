import { VoltNativeButton } from '@voltui/components';
import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { MoveEnterDirective, MoveStaggerDirective } from 'movement';

type StaggerDirection = 'first' | 'last' | 'center';

/**
 * Playground target for `moveStagger`. The delay of each child comes from its DOM order; the
 * children's own `moveEnter` is init-only, so a changed setting (or Replay) re-creates the list.
 */
@Component({
  selector: 'app-stagger-example',
  imports: [MoveStaggerDirective, MoveEnterDirective, VoltNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center gap-4">
      <div class="flex min-h-32 w-full items-center justify-center overflow-hidden">
        @for (run of runs(); track run) {
          <ul
            class="m-0 grid list-none grid-cols-3 gap-2 p-0 sm:grid-cols-6"
            data-testid="stagger-list"
            moveStagger
            [moveStaggerStep]="step()"
            [moveStaggerDirection]="direction()"
          >
            @for (item of items(); track item) {
              <li
                class="bg-surface border-accent/40 text-text flex h-12 w-12 items-center justify-center rounded-lg border font-mono text-sm"
                moveEnter="fade-up"
              >
                {{ item }}
              </li>
            }
          </ul>
        }
      </div>
      <button voltButton variant="outline" type="button" (click)="replays.set(replays() + 1)">
        Replay
      </button>
    </div>
  `,
})
export class StaggerExample {
  readonly step = input(80);
  readonly direction = input<StaggerDirection>('first');
  readonly count = input(6);

  protected readonly replays = signal(0);
  protected readonly items = computed(() =>
    Array.from({ length: Math.max(1, Math.min(12, this.count())) }, (_, i) => i + 1),
  );
  protected readonly runs = computed(() => [
    [this.replays(), this.step(), this.direction(), this.count()].join('|'),
  ]);
}
