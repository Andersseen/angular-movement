import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MoveInViewDirective } from 'movement';
import type { MovePreset } from 'movement';
import {
  VoltCard,
  VoltCardContent,
  VoltNativeSelect,
  VoltSlider,
  VoltToggleGroup,
  VoltToggleGroupItem,
} from '@voltui/components';
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
  imports: [
    MoveInViewDirective,
    CodeBlock,
    EnterExample,
    VoltCard,
    VoltCardContent,
    VoltNativeSelect,
    VoltSlider,
    VoltToggleGroup,
    VoltToggleGroupItem,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
      <div class="mb-10 max-w-2xl" moveInView="fade-up">
        <h2 class="font-display text-text mb-4 text-3xl font-bold tracking-tight md:text-4xl">
          Change a setting, see the motion, copy the code
        </h2>
        <p class="text-text-muted text-lg leading-relaxed">
          This is the real <code>moveEnter</code> directive, not a recording. The snippet is
          generated from the same values you are editing.
        </p>
      </div>

      <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <volt-card moveInView="fade-up" class="landing-card min-w-0">
          <volt-card-content class="space-y-5 p-6">
            <label class="grid gap-2">
              <span class="text-text-muted text-sm font-medium">Preset</span>
              <select
                voltNativeSelect
                [value]="preset()"
                (change)="preset.set($any($event.target).value)"
              >
                @for (p of presets; track p) {
                  <option [value]="p">{{ p }}</option>
                }
              </select>
            </label>

            <div class="grid gap-2">
              <span id="live-easing" class="text-text-muted text-sm font-medium">Easing</span>
              <volt-toggle-group
                type="single"
                class="flex-wrap"
                aria-labelledby="live-easing"
                [value]="[easing()]"
                (valueChange)="setEasing($event)"
              >
                @for (e of easings; track e) {
                  <volt-toggle-group-item [value]="e">{{ e }}</volt-toggle-group-item>
                }
              </volt-toggle-group>
            </div>

            <div class="grid gap-2">
              <span class="text-text-muted text-sm font-medium">Duration: {{ duration() }}ms</span>
              <volt-slider
                ariaLabel="Duration"
                [min]="100"
                [max]="1500"
                [step]="50"
                [value]="duration()"
                (valueChange)="duration.set($event)"
              />
            </div>

            <app-enter-example [preset]="preset()" [duration]="duration()" [easing]="easing()" />
          </volt-card-content>
        </volt-card>

        <!-- Stretches to the controls' height so the two panels read as one editor, not two
             boxes of unrelated size. -->
        <div class="flex min-w-0 flex-col" moveInView="fade-up">
          <app-code-block
            class="min-h-0 flex-1"
            title="card.html"
            language="html"
            [code]="code()"
          />
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

  protected setEasing(value: string[]): void {
    // A single-choice group may be emptied by clicking the pressed item; keep the last choice.
    if (value[0]) this.easing.set(value[0]);
  }
}
