import { ChangeDetectionStrategy, Component, input, output, signal } from '@angular/core';
import { DemoLinksStrip } from '../../../motion-examples/demo-links.component';

/** Layout only: each demo retains its own animation state and lifecycle. */
@Component({
  selector: 'app-demo-workbench',
  imports: [DemoLinksStrip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-workbench" data-testid="demo-workbench">
      <header class="workbench-header">
        <div class="min-w-0">
          <div class="workbench-eyebrow">
            MOTION LAB <span> / {{ experimental() ? 'Experimental' : 'Stable API' }}</span>
          </div>
          <h1 tabindex="-1">{{ title() }}</h1>
        </div>
        <div class="workbench-actions">
          @if (canReplay()) {
            <button type="button" (click)="onReplay()">↻ Replay</button>
          }
          @if (canReset()) {
            <button type="button" (click)="onReset()">Reset</button>
          }
          <details class="workbench-learn">
            <summary>Learn more</summary>
            <div class="workbench-learn-content">
              <p>{{ description() }}</p>
              <app-demo-links />
            </div>
          </details>
        </div>
      </header>
      <section
        class="workbench-stage"
        [class.workbench-stage-scroll]="scrollStage()"
        aria-label="Live animation"
        tabindex="0"
        data-testid="demo-stage"
      >
        <ng-content select="[stage]" />
      </section>
      <section
        class="workbench-controls"
        aria-label="Demo controls"
        tabindex="0"
        data-testid="demo-controls"
      >
        <h2>Controls <span>Make it yours</span></h2>
        <div class="workbench-control-content"><ng-content select="[controls]" /></div>
      </section>
      <section class="workbench-code" aria-label="Demo source" data-testid="demo-code">
        <ng-content select="[code]" />
      </section>
      <span role="status" class="sr-only">{{ announcement() }}</span>
    </div>
  `,
})
export class DemoWorkbench {
  readonly title = input.required<string>();
  readonly description = input('');
  readonly experimental = input(false);
  readonly scrollStage = input(false);
  readonly canReplay = input(false);
  readonly canReset = input(false);
  readonly replay = output<void>();
  readonly resetRequested = output<void>();
  protected readonly announcement = signal('');
  #actionCount = 0;
  protected onReplay(): void {
    this.replay.emit();
    this.announcement.set(`Animation replayed (${++this.#actionCount})`);
  }
  protected onReset(): void {
    this.resetRequested.emit();
    this.announcement.set(`Defaults restored (${++this.#actionCount})`);
  }
}
