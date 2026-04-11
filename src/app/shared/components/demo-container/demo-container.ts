import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MovePreset, MOVEMENT_DIRECTIVES } from 'movement';

export interface DemoControlConfig {
  showPreset?: boolean;
  showDuration?: boolean;
  showDelay?: boolean;
  showEasing?: boolean;
  showSpring?: boolean;
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
  imports: [FormsModule, ...MOVEMENT_DIRECTIVES],
  template: `
    <div class="space-y-8">
      <!-- Header -->
      <div>
        <h1
          class="font-display text-text relative mb-4 inline-block text-3xl font-bold tracking-tight md:text-4xl"
        >
          {{ title() }}
          <div class="bg-accent absolute -bottom-2 left-0 h-1 w-1/3 rounded-full"></div>
        </h1>
        <p class="text-text-muted mt-6 max-w-2xl text-lg">
          {{ description() }}
        </p>
      </div>

      <div class="flex flex-col items-start gap-8 lg:flex-row lg:gap-12">
        <!-- Left Panel: Controls (40%) -->
        <div
          class="bg-surface border-border w-full shrink-0 rounded-2xl border p-6 shadow-sm md:p-8 lg:w-[40%]"
        >
          <div class="mb-8 flex items-center justify-between">
            <h3 class="font-display text-text text-xl font-semibold">Configuration</h3>
            @if (showReplay()) {
              <button
                class="text-accent hover:text-accent-light bg-accent/10 flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
                (click)="replay.emit()"
              >
                <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  ></path>
                </svg>
                Replay
              </button>
            }
          </div>

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
              <div>
                <div class="mb-2 flex items-end justify-between">
                  <label for="duration-range" class="text-text-muted block text-sm font-medium"
                    >Duration</label
                  >
                  <span class="text-text-subtle font-mono text-xs">{{ duration() }}ms</span>
                </div>
                <input
                  id="duration-range"
                  type="range"
                  min="100"
                  max="2000"
                  step="50"
                  [ngModel]="duration()"
                  (ngModelChange)="updateDuration($event)"
                  class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                />
                <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                  <span>100ms</span>
                  <span>2000ms</span>
                </div>
              </div>
            }

            <!-- Delay Slider -->
            @if (controls().showDelay !== false) {
              <div>
                <div class="mb-2 flex items-end justify-between">
                  <label for="delay-range" class="text-text-muted block text-sm font-medium"
                    >Delay</label
                  >
                  <span class="text-text-subtle font-mono text-xs">{{ delay() }}ms</span>
                </div>
                <input
                  id="delay-range"
                  type="range"
                  min="0"
                  max="1000"
                  step="50"
                  [ngModel]="delay()"
                  (ngModelChange)="updateDelay($event)"
                  class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                />
                <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                  <span>0ms</span>
                  <span>1000ms</span>
                </div>
              </div>
            }

            <!-- Easing Selector -->
            @if (controls().showEasing !== false) {
              <div>
                <div class="mb-2 flex items-end justify-between">
                  <span class="text-text-muted block text-sm font-medium">Easing</span>
                  <span class="text-text-subtle font-mono text-xs">{{ easing() }}</span>
                </div>
                <div class="grid grid-cols-2 gap-2">
                  @for (ease of easings; track ease) {
                    <button
                      (click)="updateEasing(ease)"
                      [class]="
                        easing() === ease
                          ? 'bg-accent border-accent text-white'
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
                        >{{ customValues()[control.id]
                        }}{{ control.id.includes('stagger') ? 'ms' : '' }}</span
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
                        <span
                          >{{ control.min ?? 0
                          }}{{ control.id.includes('stagger') ? 'ms' : '' }}</span
                        >
                        <span
                          >{{ control.max ?? 100
                          }}{{ control.id.includes('stagger') ? 'ms' : '' }}</span
                        >
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
                        (click)="updateCustomValue(control.id, !customValues()[control.id])"
                        [class]="
                          customValues()[control.id]
                            ? 'bg-accent border-accent'
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

        <!-- Right Panel: Preview & Code (60%) -->
        <div class="flex w-full flex-col gap-6 lg:w-[60%]">
          <!-- Live Preview Area -->
          <div
            class="border-border group relative flex h-[300px] items-center justify-center overflow-hidden rounded-2xl border bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAnv37v3PjE8RXxKYIsIymIagGgYKAAAACv0E/7zZ9k0AAAAASUVORK5CYII=')] bg-repeat sm:h-[340px]"
          >
            <div class="bg-bg/80 absolute inset-0 z-0 backdrop-blur-[1px]"></div>

            <div class="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6">
              <ng-content select="[preview]" />
            </div>

            <div class="absolute right-4 bottom-4 z-20">
              <span
                class="text-text-subtle bg-bg/80 border-border rounded border px-2 py-1 font-mono text-xs backdrop-blur"
              >
                Preview Area
              </span>
            </div>
          </div>

          <!-- Generated Code Snippet -->
          <div class="bg-code-bg border-border relative overflow-hidden rounded-2xl border">
            <div
              class="border-border bg-surface absolute top-0 right-0 left-0 z-20 flex h-10 items-center justify-between border-b px-4"
            >
              <div class="text-text-subtle font-mono text-xs">HTML Output</div>
              <button
                type="button"
                class="text-text-muted hover:text-text flex items-center gap-1 text-xs font-medium transition-colors"
                (click)="copyCode()"
              >
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  ></path>
                </svg>
                {{ copied() ? 'Copied!' : 'Copy' }}
              </button>
            </div>

            <div class="relative overflow-x-auto p-6 pt-14">
              <pre
                class="font-mono text-sm leading-relaxed"
              ><code class="text-text" [innerHTML]="highlightedCode()"></code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Additional Content Slot -->
      <ng-content />
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DemoContainer {
  // Inputs
  readonly title = input.required<string>();
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
  ]);
  readonly directive = input<string>('');
  readonly showReplay = input<boolean>(true);

  // Outputs
  readonly stateChange = output<DemoState>();
  readonly replay = output<void>();

  // State
  readonly preset = signal<MovePreset>('fade-up');
  readonly duration = signal(300);
  readonly delay = signal(0);
  readonly easing = signal('ease');
  readonly copied = signal(false);
  readonly customValues = signal<Record<string, unknown>>({});

  protected readonly easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out'];

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
    const directive = this.directive();
    const preset = this.preset();
    const duration = this.duration();
    const delay = this.delay();
    const easing = this.easing();

    let code = `&lt;<span class="code-keyword">div</span>`;

    if (preset && this.controls().showPreset !== false) {
      code += `\n  <span class="code-attr">${directive}</span>=<span class="code-string">"${preset}"</span>`;
    }

    if (duration !== 300 && this.controls().showDuration !== false) {
      code += `\n  <span class="code-attr">moveDuration</span>=<span class="code-string">"${duration}"</span>`;
    }
    if (delay !== 0 && this.controls().showDelay !== false) {
      code += `\n  <span class="code-attr">moveDelay</span>=<span class="code-string">"${delay}"</span>`;
    }
    if (easing !== 'ease' && this.controls().showEasing !== false) {
      code += `\n  <span class="code-attr">moveEasing</span>=<span class="code-string">"${easing}"</span>`;
    }

    // Add custom controls to code if they exist
    const custom = this.customValues();
    Object.entries(custom).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== false) {
        const attrName = `move${key.charAt(0).toUpperCase() + key.slice(1)}`;
        code += `\n  <span class="code-attr">${attrName}</span>=<span class="code-string">"${value}"</span>`;
      }
    });

    code += `&gt;\n  Target Element\n&lt;/<span class="code-keyword">div</span>&gt;`;

    return code;
  });

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

  private emitStateChange(): void {
    this.stateChange.emit({
      preset: this.preset(),
      duration: this.duration(),
      delay: this.delay(),
      easing: this.easing(),
      ...this.customValues(),
    });
  }

  protected copyCode(): void {
    const cleanCode = this.highlightedCode()
      .replace(/<span class="[^"]+">/g, '')
      .replace(/<\/span>/g, '');

    navigator.clipboard.writeText(cleanCode);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
