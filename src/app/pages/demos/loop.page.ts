import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MoveKeyframes } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { keyframesToString } from '../../shared/utils/demo.utils';

@Component({
  selector: 'app-demo-loop',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveLoop"
      description="Create infinite looping animations for icons, loaders, and decorative elements. Supports custom keyframes including SVG properties like stroke-dashoffset."
      directive="moveLoop"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      [initialDuration]="1000"
      initialEasing="linear"
      (stateChange)="onStateChange($event)"
      (replay)="replay()"
      [customCode]="loopCode()"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        @if (showDemo()) {
          @switch (loopType()) {
            @case ('spin') {
              <div
                class="bg-surface border-accent/40 relative flex h-36 w-36 items-center justify-center rounded-2xl border shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                <div class="border-accent/20 absolute inset-5 rounded-full border"></div>
                <svg
                  [moveLoop]="'spin'"
                  [moveDuration]="duration()"
                  [moveEasing]="easing()"
                  class="text-accent h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              </div>
            }
            @case ('pulse') {
              <div
                class="bg-surface border-accent/40 relative flex h-36 w-36 items-center justify-center rounded-2xl border shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                <div
                  [moveLoop]="'pulse'"
                  [moveDuration]="duration()"
                  [moveEasing]="easing()"
                  class="bg-accent/10 absolute inset-8 rounded-full"
                ></div>
                <svg
                  class="text-accent h-12 w-12"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                  />
                </svg>
              </div>
            }
            @case ('draw') {
              <div
                class="bg-surface border-accent/40 flex h-36 w-36 items-center justify-center rounded-2xl border shadow-[0_0_30px_var(--color-accent-glow)]"
              >
                <svg
                  class="text-accent h-20 w-20"
                  viewBox="0 0 48 48"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    [moveLoop]="drawKeyframes()"
                    [moveDuration]="duration()"
                    [moveEasing]="easing()"
                    d="M14 25.5 21 32l14-17"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="4"
                  />
                </svg>
              </div>
            }
          }
        }
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoLoop {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
    easingOptions: ['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'],
    customControls: [
      {
        id: 'loopType',
        type: 'select' as const,
        label: 'Loop Type',
        value: 'spin',
        options: [
          { label: 'Spin', value: 'spin' },
          { label: 'Pulse', value: 'pulse' },
          { label: 'SVG Draw', value: 'draw' },
        ],
      },
    ],
  };

  protected loopType = signal<'spin' | 'pulse' | 'draw'>('spin');
  protected duration = signal(1000);
  protected easing = signal('linear');
  protected showDemo = signal(true);

  protected readonly loopCode = computed(() => {
    const type = this.loopType();
    if (type === 'spin') {
      return `&lt;<span class="code-keyword">svg</span>
  <span class="code-attr">moveLoop</span>=<span class="code-string">"spin"</span>
  <span class="code-attr">moveDuration</span>=<span class="code-string">"${this.duration()}"</span>
  <span class="code-attr">moveEasing</span>=<span class="code-string">"${this.easing()}"</span>
&gt;
  &lt;<span class="code-keyword">path</span> <span class="code-attr">d</span>=<span class="code-string">"..."</span> /&gt;
&lt;/<span class="code-keyword">svg</span>&gt;`;
    }
    if (type === 'pulse') {
      return `&lt;<span class="code-keyword">div</span>
  <span class="code-attr">moveLoop</span>=<span class="code-string">"pulse"</span>
  <span class="code-attr">moveDuration</span>=<span class="code-string">"${this.duration()}"</span>
  <span class="code-attr">moveEasing</span>=<span class="code-string">"${this.easing()}"</span>
&gt;
  Active state
&lt;/<span class="code-keyword">div</span>&gt;`;
    }
    return `&lt;<span class="code-keyword">path</span>
  <span class="code-attr">[moveLoop]</span>=<span class="code-string">"${keyframesToString(this.drawKeyframes())}"</span>
  <span class="code-attr">moveDuration</span>=<span class="code-string">"${this.duration()}"</span>
  <span class="code-attr">moveEasing</span>=<span class="code-string">"${this.easing()}"</span>
  <span class="code-attr">d</span>=<span class="code-string">"M14 25.5 21 32l14-17"</span>
/&gt;`;
  });

  protected readonly drawKeyframes = (): MoveKeyframes => ({
    pathLength: [0, 1, 1, 0],
    opacity: [0, 1, 1, 0],
  });

  protected onStateChange(state: DemoState): void {
    this.loopType.set((state['loopType'] as 'spin' | 'pulse' | 'draw') ?? 'spin');
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 50);
  }
}
