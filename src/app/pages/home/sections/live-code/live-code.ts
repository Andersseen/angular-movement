import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MovePreset } from 'movement';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';
import { EnterExample } from '../../../../motion-examples/enter/enter-example';

const PRESETS: readonly MovePreset[] = ['fade-up', 'slide-up', 'zoom-in', 'blur-in', 'bounce-in'];
const EASINGS = ['ease-out', 'ease-in-out', 'linear'] as const;

/**
 * Code-to-result: the controls drive the real `moveEnter` directive (through the same wrapper the
 * documentation playground uses) and the code beside it is built from the same signals, so what
 * you copy is what you see. `moveEnter` plays once per element, so each change recreates it.
 */
@Component({
  selector: 'app-live-code',
  imports: [CodeBlock, EnterExample],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="border-border mx-auto max-w-7xl border-t px-4 py-20 sm:px-6 lg:px-8">
      <div class="mb-10 max-w-2xl">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Change a setting, see the motion, copy the code
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          This is the real <code>moveEnter</code> directive, not a recording. The snippet is
          generated from the same values you are editing.
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-2">
        <div class="bg-surface border-border rounded-2xl border p-6">
          <form class="mb-6 grid gap-4 sm:grid-cols-3" (submit)="$event.preventDefault()">
            <label class="text-text-muted flex flex-col gap-1 text-sm font-medium">
              Preset
              <select
                class="bg-bg border-border text-text min-h-11 rounded-lg border px-3 text-sm"
                [value]="preset()"
                (change)="preset.set($any($event.target).value)"
              >
                @for (p of presets; track p) {
                  <option [value]="p">{{ p }}</option>
                }
              </select>
            </label>
            <label class="text-text-muted flex flex-col gap-1 text-sm font-medium">
              Easing
              <select
                class="bg-bg border-border text-text min-h-11 rounded-lg border px-3 text-sm"
                [value]="easing()"
                (change)="easing.set($any($event.target).value)"
              >
                @for (e of easings; track e) {
                  <option [value]="e">{{ e }}</option>
                }
              </select>
            </label>
            <label class="text-text-muted flex flex-col gap-1 text-sm font-medium">
              Duration: {{ duration() }}ms
              <input
                type="range"
                min="100"
                max="1500"
                step="50"
                class="accent-accent min-h-11"
                [value]="duration()"
                (input)="duration.set(+$any($event.target).value)"
              />
            </label>
          </form>
          <app-enter-example [preset]="preset()" [duration]="duration()" [easing]="easing()" />
        </div>

        <div class="min-w-0">
          <app-code-block title="card.html" language="html" [code]="code()" />
        </div>
      </div>
    </section>
  `,
})
export class LiveCode {
  protected readonly presets = PRESETS;
  protected readonly easings = EASINGS;
  protected readonly preset = signal<MovePreset>('fade-up');
  protected readonly duration = signal(500);
  protected readonly easing = signal<string>('ease-out');

  protected readonly code = computed(
    () =>
      `<div\n  moveEnter="${this.preset()}"\n  moveDuration="${this.duration()}ms"\n  moveEasing="${this.easing()}"\n>\n  Billing summary\n</div>`,
  );
}
