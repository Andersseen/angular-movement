import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MoveDragDirective, type MoveDragAxis, type MoveDragSnapPoint } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

const SNAP_POINTS: readonly MoveDragSnapPoint[] = [
  { x: -80, y: -56 },
  { x: 0, y: 0 },
  { x: 80, y: 56 },
];

@Component({
  selector: 'app-demo-drag',
  imports: [DemoContainer, MoveDragDirective],
  template: `
    <app-demo-container
      title="moveDrag"
      description="Make elements draggable with smooth physics. Supports constraints, momentum, and snap points."
      directive="moveDrag"
      [availablePresets]="[]"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      [showReplay]="false"
      [customCode]="dragCode()"
    >
      <!-- Preview -->
      <div preview class="relative flex h-full w-full items-center justify-center overflow-hidden">
        @if (constrained()) {
          <div
            class="border-accent/35 bg-accent/5 pointer-events-none absolute h-48 w-64 rounded-2xl border border-dashed"
            data-testid="drag-constraint-area"
          ></div>
        }

        @if (snapPointsEnabled()) {
          @for (point of snapPoints; track point.x + ':' + point.y) {
            <span
              class="bg-accent ring-background pointer-events-none absolute top-1/2 left-1/2 h-3 w-3 rounded-full ring-4"
              [style.translate]="point.x + 'px ' + point.y + 'px'"
              aria-hidden="true"
            ></span>
          }
        }

        <div
          [moveDrag]="dragAxis()"
          [moveDragConstraints]="
            constrained() ? { left: -100, right: 100, top: -80, bottom: 80 } : undefined
          "
          [moveDragMomentum]="momentum()"
          [moveDragSnapToOrigin]="snapToOrigin()"
          [moveDragSnapPoints]="snapPointsEnabled() ? snapPoints : undefined"
          class="bg-surface border-accent/40 relative z-10 flex cursor-grab flex-col items-center gap-3 rounded-xl border p-6 shadow-[0_0_30px_var(--color-accent-glow)] active:cursor-grabbing"
          data-testid="drag-card"
        >
          <div class="bg-accent/20 flex h-12 w-12 items-center justify-center rounded-full">
            <svg class="text-accent h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
              />
            </svg>
          </div>
          <div class="font-display text-text font-semibold">Drag Me</div>
          <div class="text-text-muted text-xs">
            {{ statusLabel() }}
          </div>
        </div>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoDrag {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: false,
    showDelay: false,
    showEasing: false,
    customControls: [
      {
        id: 'axis',
        type: 'select' as const,
        label: 'Axis',
        value: 'free',
        options: [
          { label: 'Free', value: 'free' },
          { label: 'X only', value: 'x' },
          { label: 'Y only', value: 'y' },
        ],
      },
      {
        id: 'constrained',
        type: 'toggle' as const,
        label: 'Constrain to Area',
        value: false,
      },
      {
        id: 'momentum',
        type: 'toggle' as const,
        label: 'Momentum',
        value: false,
      },
      {
        id: 'snapToOrigin',
        type: 'toggle' as const,
        label: 'Snap to Origin',
        value: false,
      },
      {
        id: 'snapPoints',
        type: 'toggle' as const,
        label: 'Snap Points',
        value: false,
      },
    ],
  };

  protected readonly snapPoints = SNAP_POINTS;
  protected axis = signal<'free' | 'x' | 'y'>('free');
  protected constrained = signal(false);
  protected momentum = signal(false);
  protected snapToOrigin = signal(false);
  protected snapPointsEnabled = signal(false);

  protected readonly dragAxis = computed<MoveDragAxis>(() => {
    const axis = this.axis();
    return axis === 'free' ? true : axis;
  });

  protected readonly statusLabel = computed(() => {
    const parts = [
      this.axis() === 'free' ? 'Free' : `${this.axis().toUpperCase()} axis`,
      this.constrained() ? 'constrained' : '',
      this.momentum() ? 'momentum' : '',
      this.snapToOrigin() ? 'snap origin' : '',
      this.snapPointsEnabled() ? 'snap points' : '',
    ].filter(Boolean);

    return parts.join(' - ');
  });

  protected readonly dragCode = computed(() => {
    const axis = this.axis() === 'free' ? '' : `=<span class="code-string">"${this.axis()}"</span>`;
    const c = this.constrained();
    const constraints = c
      ? ' [moveDragConstraints]="{ left: -100, right: 100, top: -80, bottom: 80 }"'
      : '';
    const momentum = this.momentum() ? ' [moveDragMomentum]="true"' : '';
    const snap = this.snapToOrigin() ? ' [moveDragSnapToOrigin]="true"' : '';
    const snapPoints = this.snapPointsEnabled()
      ? ' [moveDragSnapPoints]="[{ x: -80, y: -56 }, { x: 0, y: 0 }, { x: 80, y: 56 }]"'
      : '';
    return `&lt;<span class="code-keyword">div</span> <span class="code-attr">moveDrag</span>${axis}${constraints}${momentum}${snap}${snapPoints}&gt;\n  Drag Me\n&lt;/<span class="code-keyword">div</span>&gt;`;
  });

  protected onStateChange(state: DemoState): void {
    this.axis.set((state['axis'] as 'free' | 'x' | 'y') ?? 'free');
    this.constrained.set((state['constrained'] as boolean) ?? false);
    this.momentum.set((state['momentum'] as boolean) ?? false);
    this.snapToOrigin.set((state['snapToOrigin'] as boolean) ?? false);
    this.snapPointsEnabled.set((state['snapPoints'] as boolean) ?? false);
  }
}
