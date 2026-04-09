import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';
import { DemoContainer } from '../../../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-scroll',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveScroll"
      description="Link animations to scroll position. Elements animate based on their position in the viewport as you scroll."
      directive="moveScroll"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      [showReplay]="false"
    >
      <!-- Preview - Uses window scroll -->
      <div preview class="relative h-full w-full overflow-y-auto">
        <div class="flex min-h-[600px] flex-col items-center py-8">
          <div class="text-text-subtle mb-8 text-sm">Scroll this area ↓</div>

          <div class="relative flex h-[350px] w-full items-center justify-center">
            <!-- Background layer - slower scroll -->
            <div
              [moveScroll]="{ y: [0, -30] }"
              class="bg-accent/10 border-accent/20 absolute flex h-48 w-48 items-center justify-center rounded-2xl border"
            >
              <span class="text-accent/50 font-display text-4xl font-bold">BG</span>
            </div>

            <!-- Middle layer -->
            <div
              [moveScroll]="{ scale: [0.9, 1.1] }"
              class="bg-surface/90 border-accent/40 absolute z-10 flex h-32 w-32 items-center justify-center rounded-xl border backdrop-blur"
            >
              <span class="text-text-muted font-display text-2xl font-bold">MID</span>
            </div>

            <!-- Foreground layer -->
            <div
              [moveScroll]="{ y: [0, 20], rotate: [0, 15] }"
              class="bg-accent border-accent absolute z-20 flex h-20 w-20 items-center justify-center rounded-lg shadow-lg"
            >
              <span class="font-display text-lg font-bold text-white">FG</span>
            </div>
          </div>

          <div class="text-text-subtle mt-4 max-w-xs text-center text-sm">
            The layers animate at different rates as you scroll
          </div>

          <!-- Extra space for scrolling -->
          <div class="h-32"></div>
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoScroll {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: false,
    showDelay: false,
    showEasing: false,
  };
}
