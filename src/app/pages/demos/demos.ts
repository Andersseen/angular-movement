import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demos',
  imports: [...MOVEMENT_DIRECTIVES, FormsModule],
  template: `
    <div
      class="mx-auto min-h-[calc(100vh-theme('spacing.64'))] max-w-7xl px-4 py-24 sm:px-6 lg:px-8"
    >
      <div class="mb-12">
        <h1 class="font-display text-text mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Interactive Playground
        </h1>
        <p class="text-text-muted max-w-2xl text-lg">
          Tweak the settings below to see how Angular Movement directs elements in and out of the
          DOM. The generated code updates in real-time.
        </p>
      </div>

      <div class="flex flex-col items-start gap-8 lg:flex-row lg:gap-12">
        <!-- Left Panel: Controls (40%) -->
        <div
          class="bg-surface border-border w-full shrink-0 rounded-2xl border p-6 shadow-sm md:p-8 lg:w-[40%]"
        >
          <div class="mb-8 flex items-center justify-between">
            <h3 class="font-display text-text text-xl font-semibold">Configuration</h3>
            <button
              class="text-accent hover:text-accent-light bg-accent/10 flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium transition-colors"
              (click)="replay()"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                ></path>
              </svg>
              Replay Animation
            </button>
          </div>

          <div class="space-y-8">
            <!-- Preset Selector -->
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
                  (ngModelChange)="setPreset($event)"
                  class="bg-bg border-border text-text focus:border-accent focus:ring-accent block w-full appearance-none rounded-xl border py-3 pr-10 pl-4 text-sm transition-shadow focus:ring-1 focus:outline-none"
                >
                  <optgroup label="Fade">
                    <option value="fade-up">fade-up</option>
                    <option value="fade-down">fade-down</option>
                    <option value="fade-left">fade-left</option>
                    <option value="fade-right">fade-right</option>
                  </optgroup>
                  <optgroup label="Slide">
                    <option value="slide-up">slide-up</option>
                    <option value="slide-down">slide-down</option>
                    <option value="slide-left">slide-left</option>
                    <option value="slide-right">slide-right</option>
                  </optgroup>
                  <optgroup label="Zoom">
                    <option value="zoom-in">zoom-in</option>
                    <option value="zoom-out">zoom-out</option>
                  </optgroup>
                  <optgroup label="Miscellaneous">
                    <option value="flip-x">flip-x</option>
                    <option value="flip-y">flip-y</option>
                    <option value="bounce-in">bounce-in</option>
                  </optgroup>
                </select>
                <div
                  class="text-text-subtle pointer-events-none absolute inset-y-0 right-0 flex items-center px-4"
                >
                  <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <!-- Duration Slider -->
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
                (ngModelChange)="duration.set($event); replay()"
                class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
              <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                <span>100ms</span>
                <span>2000ms</span>
              </div>
            </div>

            <!-- Delay Slider -->
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
                (ngModelChange)="delay.set($event); replay()"
                class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
              />
              <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                <span>0ms</span>
                <span>1000ms</span>
              </div>
            </div>

            <!-- Easing Selector -->
            <div>
              <div class="mb-2 flex items-end justify-between">
                <span class="text-text-muted block text-sm font-medium">Easing</span>
                <span class="text-text-subtle font-mono text-xs">{{ easing() }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                @for (ease of ['ease', 'ease-in', 'ease-out', 'ease-in-out']; track ease) {
                  <button
                    (click)="easing.set(ease); replay()"
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
          </div>
        </div>

        <!-- Right Panel: Preview & Code (60%) -->
        <div class="flex w-full flex-col gap-6 lg:w-[60%]">
          <!-- Live Preview Area -->
          <div
            class="border-border group relative flex h-[320px] items-center justify-center overflow-hidden rounded-2xl border bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAnv37v3PjE8RXxKYIsIymIagGgYKAAAACv0E/7zZ9k0AAAAASUVORK5CYII=')] bg-repeat"
          >
            <div class="bg-bg/80 absolute inset-0 z-0 backdrop-blur-[1px]"></div>

            <div class="relative z-10 flex h-full w-full items-center justify-center p-8">
              @if (showDemo()) {
                <div
                  [moveEnter]="preset()"
                  [moveDuration]="duration()"
                  [moveDelay]="delay()"
                  [moveEasing]="easing()"
                  class="bg-surface border-accent/40 flex min-w-[240px] flex-col items-center justify-center gap-4 rounded-xl border p-8 shadow-[0_0_30px_var(--color-accent-glow)]"
                >
                  <div class="bg-accent/20 flex h-16 w-16 items-center justify-center rounded-full">
                    <svg class="text-accent h-8 w-8" viewBox="0 0 100 100" fill="none">
                      <path
                        d="M 25 20 L 50 50 L 25 80 L 45 80 L 70 50 L 45 20 Z"
                        fill="currentColor"
                        fill-opacity="0.8"
                      />
                      <path
                        d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                  <div class="font-display text-text text-xl font-bold">Target Element</div>
                  <div class="bg-surface-raised h-2 w-24 rounded-full"></div>
                </div>
              }
            </div>

            <div class="absolute right-4 bottom-4 z-20">
              <span
                class="text-text-subtle bg-bg/80 border-border rounded border px-2 py-1 font-mono text-xs backdrop-blur"
                >Preview Area</span
              >
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
                Copy
              </button>
            </div>

            <div class="relative overflow-x-auto p-6 pt-14">
              <pre
                class="font-mono text-sm leading-relaxed"
              ><code class="text-text">&lt;<span class="code-keyword">div</span>
  <span class="code-attr">moveEnter</span>=<span class="code-string">"{{ preset() }}"</span><span [class.hidden]="duration() === 300">
  <span class="code-attr">moveDuration</span>=<span class="code-string">"{{ duration() }}"</span></span><span [class.hidden]="delay() === 0">
  <span class="code-attr">moveDelay</span>=<span class="code-string">"{{ delay() }}"</span></span><span [class.hidden]="easing() === 'ease'">
  <span class="code-attr">moveEasing</span>=<span class="code-string">"{{ easing() }}"</span></span>&gt;
  Target Element
&lt;/<span class="code-keyword">div</span>&gt;</code></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- Preset Gallery Footer -->
      <div class="border-border mt-24 border-t pt-16">
        <h3 class="font-display text-text mb-8 text-center text-2xl font-bold tracking-tight">
          Available Presets
        </h3>
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          @for (p of allPresets; track p) {
            <button
              (click)="setPreset(p)"
              [class]="
                preset() === p
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-surface hover:border-accent/40 hover:bg-surface-raised'
              "
              class="group rounded-xl border px-4 py-4 text-center transition-all"
            >
              <code
                class="font-mono text-sm transition-colors"
                [class]="preset() === p ? 'text-accent' : 'text-text-muted group-hover:text-text'"
                >{{ p }}</code
              >
            </button>
          }
        </div>
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class Demos {
  protected readonly allPresets: MovePreset[] = [
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
  ];

  protected readonly preset = signal<MovePreset>('fade-up');
  protected readonly duration = signal(300);
  protected readonly delay = signal(0);
  protected readonly easing = signal('ease');
  protected readonly showDemo = signal(true);

  protected setPreset(p: MovePreset): void {
    this.preset.set(p);
    this.replay();
  }

  protected replay(): void {
    this.showDemo.set(false);
    setTimeout(() => this.showDemo.set(true), 0);
  }

  protected copyCode(): void {
    const durOpt = this.duration() !== 300 ? `\n  moveDuration="${this.duration()}"` : '';
    const delOpt = this.delay() !== 0 ? `\n  moveDelay="${this.delay()}"` : '';
    const easOpt = this.easing() !== 'ease' ? `\n  moveEasing="${this.easing()}"` : '';

    const code = `<div\n  moveEnter="${this.preset()}"${durOpt}${delOpt}${easOpt}>\n  Target Element\n</div>`;
    navigator.clipboard.writeText(code);
  }
}
