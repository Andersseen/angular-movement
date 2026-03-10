import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MoveKeyframes, MovePreset, MOVEMENT_DIRECTIVES } from 'movement';

@Component({
  selector: 'app-root',
  imports: [...MOVEMENT_DIRECTIVES],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  protected readonly presets: readonly MovePreset[] = [
    'fade-up',
    'fade-down',
    'fade-left',
    'fade-right',
    'slide-up',
    'slide-down',
    'slide-left',
    'slide-right',
    'zoom-in',
    'zoom-out',
    'flip-x',
    'flip-y',
    'bounce-in',
    'none',
  ];

  protected readonly showDemo = signal(true);
  protected readonly enterPreset = signal<MovePreset>('fade-up');
  protected readonly leavePreset = signal<MovePreset>('fade-down');
  protected readonly duration = signal(320);
  protected readonly delay = signal(0);
  protected readonly easing = signal('cubic-bezier(0.16, 1, 0.3, 1)');
  protected readonly disabled = signal(false);

  protected readonly customEnter: MoveKeyframes = {
    opacity: [0, 1],
    y: [18, 0],
    scale: [0.94, 1],
    rotate: [-4, 0],
  };

  protected readonly customLeave: MoveKeyframes = {
    opacity: [1, 0],
    y: [0, -10],
    scale: [1, 0.98],
  };

  protected readonly presetSnippet = computed(
    () =>
      `<div\n  [moveEnter]="'${this.enterPreset()}'"\n  [moveLeave]="'${this.leavePreset()}'"\n  [moveDuration]="${this.duration()}"\n  [moveEasing]="'${this.easing()}'"\n  [moveDelay]="${this.delay()}"\n  [moveDisabled]="${this.disabled()}"\n>\n  Demo\n</div>`,
  );

  protected readonly shorthandSnippet = computed(
    () =>
      `<div\n  [move]="'${this.enterPreset()}'"\n  [moveAnimateLeave]="'${this.leavePreset()}'"\n  [moveDuration]="${this.duration()}"\n  [moveEasing]="'${this.easing()}'"\n>\n  Demo\n</div>`,
  );

  protected readonly customSnippet = `<div\n  [moveEnter]="{ opacity: [0,1], y: [18,0], scale: [0.94,1], rotate: [-4,0] }"\n  [moveLeave]="{ opacity: [1,0], y: [0,-10], scale: [1,0.98] }"\n>\n  Demo\n</div>`;

  protected toggleVisibility(): void {
    this.showDemo.update((visible) => !visible);
  }

  protected replayEnter(): void {
    if (!this.showDemo()) {
      this.showDemo.set(true);
      return;
    }

    this.showDemo.set(false);
    queueMicrotask(() => this.showDemo.set(true));
  }

  protected setEnterPreset(value: string): void {
    if (this.isPreset(value)) {
      this.enterPreset.set(value);
    }
  }

  protected setLeavePreset(value: string): void {
    if (this.isPreset(value)) {
      this.leavePreset.set(value);
    }
  }

  protected setDuration(value: string): void {
    const next = Number(value);
    if (!Number.isNaN(next)) {
      this.duration.set(Math.max(0, next));
    }
  }

  protected setDelay(value: string): void {
    const next = Number(value);
    if (!Number.isNaN(next)) {
      this.delay.set(Math.max(0, next));
    }
  }

  protected setEasing(value: string): void {
    this.easing.set(value.trim() || 'linear');
  }

  protected setDisabled(value: boolean): void {
    this.disabled.set(value);
  }

  private isPreset(value: string): value is MovePreset {
    return this.presets.includes(value as MovePreset);
  }
}
