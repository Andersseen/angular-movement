import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';
import { ALL_PRESETS, DEFAULT_CONTROLS } from '../../shared/utils/demo.utils';

@Component({
  selector: 'app-demo-text',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="moveText"
      description="Animate text by splitting it into characters or words. Perfect for headlines and impactful messaging."
      directive="moveText"
      [availablePresets]="availablePresets"
      [controls]="controlsConfig"
      (stateChange)="onStateChange($event)"
      (replay)="replay()"
    >
      <!-- Preview -->
      <div preview class="flex h-full w-full items-center justify-center">
        @if (showDemo()) {
          <h2
            [moveText]="preset()"
            [moveTextSplit]="split()"
            [moveTextStagger]="stagger()"
            [moveDuration]="duration()"
            [moveEasing]="easing()"
            class="font-display text-text max-w-md text-center text-4xl leading-tight font-bold"
          >
            {{ text() }}
          </h2>
        }
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoText {
  protected readonly availablePresets = ALL_PRESETS;
  protected readonly controlsConfig = {
    ...DEFAULT_CONTROLS.standard,
    customControls: [
      {
        id: 'split',
        type: 'select' as const,
        label: 'Split By',
        value: 'chars',
        options: [
          { label: 'Characters', value: 'chars' },
          { label: 'Words', value: 'words' },
        ],
      },
      {
        id: 'stagger',
        type: 'range' as const,
        label: 'Stagger Delay',
        value: 30,
        min: 10,
        max: 200,
        step: 5,
      },
      {
        id: 'text',
        type: 'text' as const,
        label: 'Text Content',
        value: 'Animate Text',
      },
    ],
  };

  protected preset = signal<MovePreset>('fade-up');
  protected duration = signal(300);
  protected easing = signal('ease');
  protected split = signal<'chars' | 'words'>('chars');
  protected stagger = signal(30);
  protected text = signal('Animate Text');
  protected showDemo = signal(true);

  protected onStateChange(state: DemoState): void {
    this.preset.set(state.preset);
    this.duration.set(state.duration);
    this.easing.set(state.easing);
    this.split.set((state['split'] as 'chars' | 'words') ?? 'chars');
    this.stagger.set((state['stagger'] as number) ?? 30);
    this.text.set((state['text'] as string) || 'Animate Text');
    this.replay();
  }

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 50);
  }
}
