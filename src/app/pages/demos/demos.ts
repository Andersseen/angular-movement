import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-demos',
  imports: [...MOVEMENT_DIRECTIVES, FormsModule],
  template: `
    <div
      class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 min-h-[calc(100vh-theme('spacing.64'))]"
    >
      <div class="mb-12">
        <h1 class="font-display text-4xl md:text-5xl font-bold tracking-tight text-text mb-4">
          Interactive Playground
        </h1>
        <p class="text-lg text-text-muted max-w-2xl">
          Tweak the settings below to see how Angular Movement directs elements in and out of the
          DOM. The generated code updates in real-time.
        </p>
      </div>

      <div class="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
        <!-- Left Panel: Controls (40%) -->
        <div
          class="w-full lg:w-[40%] bg-surface border border-border rounded-2xl p-6 md:p-8 shrink-0 shadow-sm"
        >
          <div class="flex items-center justify-between mb-8">
            <h3 class="font-display text-xl font-semibold text-text">Configuration</h3>
            <button
              class="text-sm font-medium text-accent hover:text-accent-light transition-colors flex items-center gap-1 bg-accent/10 px-3 py-1.5 rounded-full"
              (click)="replay()"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <div class="flex justify-between items-end mb-2">
                <label class="block text-sm font-medium text-text-muted">Preset</label>
                <span class="text-xs text-text-subtle font-mono">{{ preset() }}</span>
              </div>
              <div class="relative">
                <select
                  [ngModel]="preset()"
                  (ngModelChange)="setPreset($event)"
                  class="block w-full appearance-none bg-bg border border-border text-text rounded-xl pl-4 pr-10 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-shadow"
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
                  class="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-text-subtle"
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
              <div class="flex justify-between items-end mb-2">
                <label class="block text-sm font-medium text-text-muted">Duration</label>
                <span class="text-xs text-text-subtle font-mono">{{ duration() }}ms</span>
              </div>
              <input
                type="range"
                min="100"
                max="2000"
                step="50"
                [ngModel]="duration()"
                (ngModelChange)="duration.set($event); replay()"
                class="w-full h-2 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div class="flex justify-between text-xs text-text-subtle mt-1 px-1">
                <span>100ms</span>
                <span>2000ms</span>
              </div>
            </div>

            <!-- Delay Slider -->
            <div>
              <div class="flex justify-between items-end mb-2">
                <label class="block text-sm font-medium text-text-muted">Delay</label>
                <span class="text-xs text-text-subtle font-mono">{{ delay() }}ms</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                step="50"
                [ngModel]="delay()"
                (ngModelChange)="delay.set($event); replay()"
                class="w-full h-2 bg-surface-raised rounded-lg appearance-none cursor-pointer accent-accent"
              />
              <div class="flex justify-between text-xs text-text-subtle mt-1 px-1">
                <span>0ms</span>
                <span>1000ms</span>
              </div>
            </div>

            <!-- Easing Selector -->
            <div>
              <div class="flex justify-between items-end mb-2">
                <label class="block text-sm font-medium text-text-muted">Easing</label>
                <span class="text-xs text-text-subtle font-mono">{{ easing() }}</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                @for (ease of ['ease', 'ease-in', 'ease-out', 'ease-in-out']; track ease) {
                  <button
                    (click)="easing.set(ease); replay()"
                    [class]="
                      easing() === ease
                        ? 'bg-accent text-white border-accent'
                        : 'bg-bg text-text-muted border-border hover:border-accent/50'
                    "
                    class="py-2 text-sm rounded-lg border transition-all text-center"
                  >
                    {{ ease }}
                  </button>
                }
              </div>
            </div>
          </div>
        </div>

        <!-- Right Panel: Preview & Code (60%) -->
        <div class="w-full lg:w-[60%] flex flex-col gap-6">
          <!-- Live Preview Area -->
          <div
            class="bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAnv37v3PjE8RXxKYIsIymIagGgYKAAAACv0E/7zZ9k0AAAAASUVORK5CYII=')] bg-repeat border border-border rounded-2xl h-[320px] flex items-center justify-center relative overflow-hidden group"
          >
            <div class="absolute inset-0 bg-bg/80 backdrop-blur-[1px] z-0"></div>

            <div class="relative z-10 w-full h-full flex items-center justify-center p-8">
              @if (showDemo()) {
                <div
                  [moveEnter]="preset()"
                  [moveDuration]="duration()"
                  [moveDelay]="delay()"
                  [moveEasing]="easing()"
                  class="bg-surface border border-accent/40 shadow-[0_0_30px_var(--color-accent-glow)] rounded-xl p-8 flex flex-col items-center justify-center min-w-[240px] gap-4"
                >
                  <div class="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center">
                    <svg class="h-8 w-8 text-accent" viewBox="0 0 100 100" fill="none">
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
                  <div class="text-xl font-display font-bold text-text">Target Element</div>
                  <div class="h-2 w-24 bg-surface-raised rounded-full"></div>
                </div>
              }
            </div>

            <div class="absolute bottom-4 right-4 z-20">
              <span
                class="text-xs font-mono text-text-subtle bg-bg/80 backdrop-blur px-2 py-1 rounded border border-border"
                >Preview Area</span
              >
            </div>
          </div>

          <!-- Generated Code Snippet -->
          <div class="relative bg-code-bg rounded-2xl border border-border overflow-hidden">
            <div
              class="absolute top-0 left-0 right-0 h-10 border-b border-border bg-surface flex items-center px-4 justify-between z-20"
            >
              <div class="text-xs font-mono text-text-subtle">HTML Output</div>
              <button
                type="button"
                class="text-xs font-medium text-text-muted hover:text-text transition-colors flex items-center gap-1"
                (click)="copyCode()"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <div class="pt-14 p-6 overflow-x-auto relative">
              <pre
                class="text-sm font-mono leading-relaxed"
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
      <div class="mt-24 border-t border-border pt-16">
        <h3 class="font-display text-2xl font-bold tracking-tight text-text mb-8 text-center">
          Available Presets
        </h3>
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          @for (p of allPresets; track p) {
            <button
              (click)="setPreset(p)"
              [class]="
                preset() === p
                  ? 'border-accent bg-accent/5'
                  : 'border-border bg-surface hover:border-accent/40 hover:bg-surface-raised'
              "
              class="px-4 py-4 rounded-xl border transition-all text-center group"
            >
              <code
                class="text-sm font-mono transition-colors"
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
