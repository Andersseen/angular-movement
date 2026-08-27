import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-range-slider',
  imports: [FormsModule],
  template: `
    <div>
      <div class="mb-2 flex items-end justify-between">
        <label [for]="controlId()" class="text-text-muted block text-sm font-medium">{{
          label()
        }}</label>
        <span class="text-text-subtle font-mono text-xs">{{ value() }}{{ unit() }}</span>
      </div>
      <input
        [id]="controlId()"
        type="range"
        [min]="min()"
        [max]="max()"
        [step]="step()"
        [ngModel]="value()"
        (ngModelChange)="valueChange.emit(+$event)"
        class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
      />
      <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
        <span>{{ min() }}{{ unit() }}</span
        ><span>{{ max() }}{{ unit() }}</span>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RangeSlider {
  readonly controlId = input.required<string>();
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  readonly min = input(0);
  readonly max = input(100);
  readonly step = input(1);
  readonly unit = input('');
  readonly valueChange = output<number>();
}
