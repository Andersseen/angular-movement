import { VoltNativeButton } from '@voltui/components';
import { ChangeDetectionStrategy, Component, input, linkedSignal } from '@angular/core';
import {
  MoveEnterDirective,
  MoveLeaveDirective,
  MovePresenceDirective,
  MovePreset,
} from 'movement';

/**
 * Playground target for `*movePresence`. Presence keeps the view mounted until every leave
 * animation inside it finishes, so `moveLeave` can actually play. `shown` follows the `open`
 * control, and the in-preview button toggles it locally.
 */
@Component({
  selector: 'app-presence-example',
  imports: [MovePresenceDirective, MoveEnterDirective, MoveLeaveDirective, VoltNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    <div class="flex flex-col items-center gap-4">
      <div class="flex min-h-28 w-full items-center justify-center overflow-hidden">
        <ng-container *movePresence="shown()">
          <div
            class="bg-surface border-accent/40 rounded-xl border px-6 py-5 text-center"
            data-testid="presence-target"
            [moveEnter]="enter()"
            [moveLeave]="leave()"
            [moveDuration]="duration()"
            [moveDisabled]="disabled()"
          >
            <p class="font-display text-text m-0 text-base font-semibold">Panel</p>
            <p class="text-text-muted m-0 text-sm">enter {{ enter() }} · leave {{ leave() }}</p>
          </div>
        </ng-container>
      </div>
      <button
        voltButton
        variant="outline"
        type="button"
        [attr.aria-pressed]="shown()"
        (click)="shown.set(!shown())"
      >
        {{ shown() ? 'Hide panel' : 'Show panel' }}
      </button>
    </div>
  `,
})
export class PresenceExample {
  readonly open = input(true);
  readonly enter = input<MovePreset>('fade-up');
  readonly leave = input<MovePreset>('fade-down');
  readonly duration = input(300);
  readonly disabled = input(false);

  protected readonly shown = linkedSignal(() => this.open());
}
