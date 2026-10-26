import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { DemoWorkbench } from '../demo-workbench/demo-workbench';
import { FormsModule } from '@angular/forms';
import { MovePreset } from 'movement';
import { RangeSlider } from '../range-slider/range-slider';
import { DemoCodeTabs } from '../demo-workbench/demo-code-tabs';
import { DEMO_GROUPS } from '../demo-workbench/demo-navigation';
import { DEMO_LINKS } from '../../../motion-examples/demo-links';

export interface DemoControlConfig {
  showPreset?: boolean;
  showDuration?: boolean;
  showDelay?: boolean;
  showEasing?: boolean;
  showSpring?: boolean;
  easingOptions?: string[];
  includeCustomControlsInCode?: boolean;
  customControls?: CustomControl[];
}

export interface CustomControl {
  id: string;
  type: 'select' | 'range' | 'text' | 'toggle';
  label: string;
  value: unknown;
  options?: { label: string; value: unknown }[];
  min?: number;
  max?: number;
  step?: number;
}

export interface DemoState {
  preset: MovePreset;
  duration: number;
  delay: number;
  easing: string;
  [key: string]: unknown;
}

@Component({
  selector: 'app-demo-container',
  imports: [FormsModule, RangeSlider, DemoCodeTabs, DemoWorkbench],
  template: `
    <app-demo-workbench
      [title]="title()"
      [description]="description()"
      [experimental]="experimental()"
      [canReplay]="showReplay()"
      [canReset]="true"
      (replay)="replay.emit()"
      (resetRequested)="resetDefaults()"
    >
      <div stage class="workbench-preview-content"><ng-content select="[preview]" /></div>
      <div controls>
        <div class="space-y-8">
          <!-- Preset Selector -->
          @if (controls().showPreset !== false && availablePresets().length > 0) {
            <div>
              <div class="mb-2 flex items-end justify-between">
                <label for="preset-select" class="text-text-muted block text-sm font-medium"
                  >Preset</label
                >
                <span class="text-text-subtle font-mono text-xs">{{ preset() }}</span>
              </div>
              <div class="relative">
                <select
                  id="preset-select"
                  [ngModel]="preset()"
                  (ngModelChange)="updatePreset($event)"
                  class="bg-bg border-border text-text focus:border-accent focus:ring-accent block w-full appearance-none rounded-xl border py-3 pr-10 pl-4 text-sm transition-shadow focus:ring-1 focus:outline-none"
                >
                  @for (group of presetGroups(); track group.label) {
                    <optgroup [label]="group.label">
                      @for (p of group.presets; track p) {
                        <option [value]="p">{{ p }}</option>
                      }
                    </optgroup>
                  }
                </select>
                <div
                  class="text-text-subtle pointer-events-none absolute inset-y-0 right-0 flex items-center px-4"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linecap="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>
          }

          <!-- Duration Slider -->
          @if (controls().showDuration !== false) {
            <app-range-slider
              controlId="duration-range"
              label="Duration"
              unit="ms"
              [value]="duration()"
              [min]="100"
              [max]="2000"
              [step]="50"
              (valueChange)="updateDuration($event)"
            />
          }

          <!-- Delay Slider -->
          @if (controls().showDelay !== false) {
            <app-range-slider
              controlId="delay-range"
              label="Delay"
              unit="ms"
              [value]="delay()"
              [min]="0"
              [max]="1000"
              [step]="50"
              (valueChange)="updateDelay($event)"
            />
          }

          <!-- Easing Selector -->
          @if (controls().showEasing !== false) {
            <div>
              <div class="mb-2 flex items-end justify-between">
                <span class="text-text-muted block text-sm font-medium">Easing</span>
                <span class="text-text-subtle font-mono text-xs">{{ easing() }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                @for (ease of easings(); track ease) {
                  <button
                    (click)="updateEasing(ease)"
                    [attr.aria-pressed]="easing() === ease"
                    [class]="
                      easing() === ease
                        ? 'bg-accent-solid border-accent-solid text-white'
                        : 'bg-bg text-text-muted border-border hover:border-accent/50'
                    "
                    class="rounded-lg border py-2 text-center text-sm transition-all"
                  >
                    {{ ease }}
                  </button>
                }
              </div>
            </div>
          }

          <!-- Custom Controls -->
          @if (controls().customControls) {
            @for (control of controls().customControls; track control.id) {
              <div>
                <div class="mb-2 flex items-end justify-between">
                  <label [for]="control.id" class="text-text-muted block text-sm font-medium">
                    {{ control.label }}
                  </label>
                  @if (control.type === 'range') {
                    <span class="text-text-subtle font-mono text-xs"
                      >{{ customValues()[control.id] }}{{ customControlUnit(control.id) }}</span
                    >
                  }
                </div>

                @switch (control.type) {
                  @case ('select') {
                    <select
                      [id]="control.id"
                      [ngModel]="customValues()[control.id]"
                      (ngModelChange)="updateCustomValue(control.id, $event)"
                      class="bg-bg border-border text-text focus:border-accent focus:ring-accent block w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
                    >
                      @for (opt of control.options; track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  }
                  @case ('range') {
                    <input
                      [id]="control.id"
                      type="range"
                      [min]="control.min ?? 0"
                      [max]="control.max ?? 100"
                      [step]="control.step ?? 1"
                      [ngModel]="customValues()[control.id]"
                      (ngModelChange)="updateCustomValue(control.id, $event)"
                      class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                    />
                    <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                      <span>{{ control.min ?? 0 }}{{ customControlUnit(control.id) }}</span>
                      <span>{{ control.max ?? 100 }}{{ customControlUnit(control.id) }}</span>
                    </div>
                  }
                  @case ('text') {
                    <input
                      [id]="control.id"
                      type="text"
                      [ngModel]="customValues()[control.id]"
                      (ngModelChange)="updateCustomValue(control.id, $event)"
                      class="bg-bg border-border text-text focus:border-accent focus:ring-accent block w-full rounded-xl border px-4 py-3 text-sm focus:outline-none"
                    />
                  }
                  @case ('toggle') {
                    <button
                      [id]="control.id"
                      (click)="updateCustomValue(control.id, !customValues()[control.id])"
                      [attr.aria-label]="control.label"
                      [attr.aria-pressed]="!!customValues()[control.id]"
                      [class]="
                        customValues()[control.id]
                          ? 'bg-accent-solid border-accent'
                          : 'bg-bg border-border'
                      "
                      class="w-full rounded-lg border py-2 text-sm transition-all"
                      [class.text-white]="customValues()[control.id]"
                      [class.text-text-muted]="!customValues()[control.id]"
                    >
                      {{ customValues()[control.id] ? 'On' : 'Off' }}
                    </button>
                  }
                }
              </div>
            }
          }
        </div>
      </div>
      <app-demo-code-tabs code [files]="sourceFiles()" />
    </app-demo-workbench>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoContainer implements OnInit {
  // Inputs
  readonly title = input.required<string>();
  readonly experimental = input(false);
  readonly description = input.required<string>();
  readonly controls = input<DemoControlConfig>({});
  readonly availablePresets = input<MovePreset[]>([
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
    'shake',
    'swing',
    'wobble',
    'rubber-band',
    'heart-beat',
    'tada',
    'jello',
    'light-speed',
    'roll-in',
  ]);
  readonly directive = input<string>('');
  readonly showReplay = input<boolean>(true);
  readonly initialPreset = input<MovePreset>('fade-up');
  readonly initialDuration = input<number>(300);
  readonly initialDelay = input<number>(0);
  readonly initialEasing = input<string>('ease');

  /**
   * When showPreset is false, pass the directive binding value here
   * so the generated code includes `[directive]="value"`.
   * Pass empty string "" to render the directive as a boolean attribute.
   */
  readonly directiveBinding = input<string | undefined>(undefined);

  /** Override the entire generated code block. Useful for multi-element demos. */
  readonly customCode = input<string | undefined>(undefined);
  /** Component-local state required by the generated HTML; owned by the demo. */
  readonly supportCode = input('');
  readonly sourceImports = input<readonly string[] | undefined>(undefined);
  readonly sourceFiles = computed(() => {
    const slug = DEMO_GROUPS.flatMap((group) => group.items).find(
      (item) => item.label === this.title(),
    )?.path;
    const imports =
      (slug ? DEMO_LINKS[slug]?.api : [])
        ?.map((api) => api.label)
        .filter((label) => /^[A-Z]/.test(label)) ?? [];
    const names = (
      this.sourceImports() ?? imports.filter((name) => name.endsWith('Directive'))
    ).join(', ');
    return [
      { title: 'demo.html', code: this.highlightedCode() },
      {
        title: 'demo.component.ts',
        code: `import { Component, signal } from '@angular/core';
import { ${names} } from 'angular-movement';

@Component({
  selector: 'app-demo',
  imports: [${names
    .split(', ')
    .filter((name) => name.endsWith('Directive'))
    .join(', ')}],
  templateUrl: './demo.html',
})
export class Demo {
${this.supportCode()}
}`,
      },
    ];
  });

  // Outputs
  readonly stateChange = output<DemoState>();
  readonly replay = output<void>();
  readonly resetDemo = output<void>();

  // State
  readonly preset = signal<MovePreset>('fade-up');
  readonly duration = signal(300);
  readonly delay = signal(0);
  readonly easing = signal('ease');
  readonly customValues = signal<Record<string, unknown>>({});

  readonly #defaultEasings = ['ease', 'ease-in', 'ease-out', 'ease-in-out'];

  protected readonly easings = computed(
    () => this.controls().easingOptions ?? this.#defaultEasings,
  );

  protected readonly presetGroups = computed(() => {
    const presets = this.availablePresets();
    const groups: { label: string; presets: MovePreset[] }[] = [];

    const fadePresets = presets.filter((p) => p.startsWith('fade'));
    if (fadePresets.length) {
      groups.push({ label: 'Fade', presets: fadePresets });
    }

    const slidePresets = presets.filter((p) => p.startsWith('slide'));
    if (slidePresets.length) {
      groups.push({ label: 'Slide', presets: slidePresets });
    }

    const zoomPresets = presets.filter((p) => p.startsWith('zoom'));
    if (zoomPresets.length) {
      groups.push({ label: 'Zoom', presets: zoomPresets });
    }

    const miscPresets = presets.filter(
      (p) => !p.startsWith('fade') && !p.startsWith('slide') && !p.startsWith('zoom'),
    );
    if (miscPresets.length) {
      groups.push({ label: 'Miscellaneous', presets: miscPresets });
    }

    return groups;
  });

  protected readonly highlightedCode = computed(() => {
    const custom = this.customCode();
    if (custom) return custom;

    const directive = this.directive();
    const preset = this.preset();
    const duration = this.duration();
    const delay = this.delay();
    const easing = this.easing();

    let code = `<div`;

    if (preset && this.controls().showPreset !== false) {
      code += `\n  ${directive}="${preset}"`;
    } else if (directive) {
      const binding = this.directiveBinding();
      if (binding !== undefined) {
        if (binding === '') {
          code += `\n  ${directive}`;
        } else {
          code += `\n  [${directive}]="${binding}"`;
        }
      } else {
        code += `\n  ${directive}`;
      }
    }

    if (duration !== 300 && this.controls().showDuration !== false) {
      code += `\n  moveDuration="${duration}ms"`;
    }
    if (delay !== 0 && this.controls().showDelay !== false) {
      code += `\n  moveDelay="${delay}ms"`;
    }
    if (easing !== 'ease' && this.controls().showEasing !== false) {
      code += `\n  moveEasing="${easing}"`;
    }

    if (this.controls().includeCustomControlsInCode) {
      const customValues = this.customValues();
      Object.entries(customValues).forEach(([key, value]) => {
        if (value !== undefined && value !== '' && value !== false) {
          const attrName = `move${key.charAt(0).toUpperCase() + key.slice(1)}`;
          code += `\n  ${attrName}="${value}"`;
        }
      });
    }

    code += `>\n  Target Element\n</div>`;

    return code;
  });

  ngOnInit(): void {
    this.preset.set(this.initialPreset());
    this.duration.set(this.initialDuration());
    this.delay.set(this.initialDelay());
    this.easing.set(this.initialEasing());

    const initialCustomValues = Object.fromEntries(
      (this.controls().customControls ?? []).map((control) => [control.id, control.value]),
    );
    this.customValues.set(initialCustomValues);
  }

  protected resetDefaults(): void {
    this.ngOnInit();
    this.emitStateChange();
    this.resetDemo.emit();
  }

  protected updatePreset(value: MovePreset): void {
    this.preset.set(value);
    this.emitStateChange();
  }

  protected updateDuration(value: number): void {
    this.duration.set(value);
    this.emitStateChange();
  }

  protected updateDelay(value: number): void {
    this.delay.set(value);
    this.emitStateChange();
  }

  protected updateEasing(value: string): void {
    this.easing.set(value);
    this.emitStateChange();
  }

  protected updateCustomValue(id: string, value: unknown): void {
    this.customValues.update((v) => ({ ...v, [id]: value }));
    this.emitStateChange();
  }

  protected customControlUnit(id: string): string {
    return id.toLowerCase().includes('duration') || id.toLowerCase().includes('stagger')
      ? 'ms'
      : '';
  }

  private emitStateChange(): void {
    this.stateChange.emit({
      preset: this.preset(),
      duration: this.duration(),
      delay: this.delay(),
      easing: this.easing(),
      ...this.customValues(),
    });
  }
}
