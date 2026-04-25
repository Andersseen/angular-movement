import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MoveAnimationConfig, MoveKeyframeState, MOVEMENT_DIRECTIVES } from 'movement';

const NATURAL: Record<string, number> = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
  blur: 0,
};

@Component({
  selector: 'app-demo-animate',
  imports: [FormsModule, ...MOVEMENT_DIRECTIVES],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="space-y-8">
      <div>
        <h1
          class="font-display text-text relative mb-4 inline-block text-3xl font-bold tracking-tight md:text-4xl"
        >
          moveAnimation
          <div class="bg-accent absolute -bottom-2 left-0 h-1 w-1/3 rounded-full"></div>
        </h1>
        <p class="text-text-muted mt-6 max-w-2xl text-lg">
          Define <span class="text-text font-medium">initial</span>,
          <span class="text-text font-medium">animate</span>, and
          <span class="text-text font-medium">exit</span> as plain state objects — no preset names,
          full per-property control.
        </p>
      </div>

      <div class="flex flex-col items-start gap-8 lg:flex-row lg:gap-12">
        <!-- Left: Controls -->
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
                />
              </svg>
              Replay
            </button>
          </div>

          <div class="space-y-8">
            <!-- Initial State -->
            <div>
              <h4 class="text-text-muted mb-5 text-xs font-semibold tracking-widest uppercase">
                Initial State — starts as
              </h4>
              <div class="space-y-6">
                <div>
                  <div class="mb-2 flex items-end justify-between">
                    <label for="opacity" class="text-text-muted text-sm font-medium">Opacity</label>
                    <span class="text-text-subtle font-mono text-xs">{{ opacity() }}</span>
                  </div>
                  <input
                    id="opacity"
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    [ngModel]="opacity()"
                    (ngModelChange)="opacity.set(+$event)"
                    class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                    <span>0</span><span>1</span>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-end justify-between">
                    <label for="y-offset" class="text-text-muted text-sm font-medium"
                      >Y offset</label
                    >
                    <span class="text-text-subtle font-mono text-xs">{{ y() }}px</span>
                  </div>
                  <input
                    id="y-offset"
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    [ngModel]="y()"
                    (ngModelChange)="y.set(+$event)"
                    class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                    <span>-100px</span><span>100px</span>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-end justify-between">
                    <label for="x-offset" class="text-text-muted text-sm font-medium"
                      >X offset</label
                    >
                    <span class="text-text-subtle font-mono text-xs">{{ x() }}px</span>
                  </div>
                  <input
                    id="x-offset"
                    type="range"
                    min="-100"
                    max="100"
                    step="5"
                    [ngModel]="x()"
                    (ngModelChange)="x.set(+$event)"
                    class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                    <span>-100px</span><span>100px</span>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-end justify-between">
                    <label for="scale" class="text-text-muted text-sm font-medium">Scale</label>
                    <span class="text-text-subtle font-mono text-xs">{{ scale() }}</span>
                  </div>
                  <input
                    id="scale"
                    type="range"
                    min="0"
                    max="2"
                    step="0.05"
                    [ngModel]="scale()"
                    (ngModelChange)="scale.set(+$event)"
                    class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                    <span>0</span><span>2</span>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-end justify-between">
                    <label for="rotate" class="text-text-muted text-sm font-medium">Rotate</label>
                    <span class="text-text-subtle font-mono text-xs">{{ rotate() }}°</span>
                  </div>
                  <input
                    id="rotate"
                    type="range"
                    min="-180"
                    max="180"
                    step="15"
                    [ngModel]="rotate()"
                    (ngModelChange)="rotate.set(+$event)"
                    class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                    <span>-180°</span><span>180°</span>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-end justify-between">
                    <label for="blur" class="text-text-muted text-sm font-medium">Blur</label>
                    <span class="text-text-subtle font-mono text-xs">{{ blur() }}px</span>
                  </div>
                  <input
                    id="blur"
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    [ngModel]="blur()"
                    (ngModelChange)="blur.set(+$event)"
                    class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                    <span>0px</span><span>20px</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Timing -->
            <div class="border-border border-t pt-8">
              <h4 class="text-text-muted mb-5 text-xs font-semibold tracking-widest uppercase">
                Timing
              </h4>
              <div class="space-y-6">
                <div>
                  <div class="mb-2 flex items-end justify-between">
                    <label for="duration" class="text-text-muted text-sm font-medium"
                      >Duration</label
                    >
                    <span class="text-text-subtle font-mono text-xs">{{ duration() }}ms</span>
                  </div>
                  <input
                    id="duration"
                    type="range"
                    min="100"
                    max="2000"
                    step="50"
                    [ngModel]="duration()"
                    (ngModelChange)="duration.set(+$event)"
                    class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                    <span>100ms</span><span>2000ms</span>
                  </div>
                </div>

                <div>
                  <div class="mb-2 flex items-end justify-between">
                    <label for="delay" class="text-text-muted text-sm font-medium">Delay</label>
                    <span class="text-text-subtle font-mono text-xs">{{ delay() }}ms</span>
                  </div>
                  <input
                    id="delay"
                    type="range"
                    min="0"
                    max="1000"
                    step="50"
                    [ngModel]="delay()"
                    (ngModelChange)="delay.set(+$event)"
                    class="bg-surface-raised accent-accent h-2 w-full cursor-pointer appearance-none rounded-lg"
                  />
                  <div class="text-text-subtle mt-1 flex justify-between px-1 text-xs">
                    <span>0ms</span><span>1000ms</span>
                  </div>
                </div>

                <div>
                  <div class="mb-3 flex items-end justify-between">
                    <span class="text-text-muted text-sm font-medium">Easing</span>
                    <span class="text-text-subtle font-mono text-xs">{{ easing() }}</span>
                  </div>
                  <div class="grid grid-cols-2 gap-2">
                    @for (e of easings; track e) {
                      <button
                        (click)="easing.set(e)"
                        [class]="
                          easing() === e
                            ? 'bg-accent border-accent text-white'
                            : 'bg-bg text-text-muted border-border hover:border-accent/50'
                        "
                        class="rounded-lg border py-2 text-center text-sm transition-all"
                      >
                        {{ e }}
                      </button>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Right: Preview + Code -->
        <div class="flex w-full flex-col gap-6 lg:w-[60%]">
          <div
            class="border-border relative flex h-[300px] items-center justify-center overflow-hidden rounded-2xl border bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAAXNSR0IArs4c6QAAACVJREFUKFNjZCASMDKgAnv37v3PjE8RXxKYIsIymIagGgYKAAAACv0E/7zZ9k0AAAAASUVORK5CYII=')] bg-repeat sm:h-[340px]"
          >
            <div class="bg-bg/80 absolute inset-0 z-0 backdrop-blur-[1px]"></div>
            <div class="relative z-10 flex h-full w-full items-center justify-center p-4 sm:p-6">
              @if (showElement()) {
                <div
                  [moveAnimation]="animationConfig()"
                  class="bg-surface border-accent/40 flex w-full max-w-[280px] flex-col items-center justify-center gap-4 rounded-xl border p-6 shadow-[0_0_30px_var(--color-accent-glow)] sm:p-8"
                >
                  <div class="bg-accent/20 flex h-16 w-16 items-center justify-center rounded-full">
                    <svg
                      class="text-accent h-8 w-8"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"
                      />
                      <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="1.5"
                        d="M18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
                      />
                    </svg>
                  </div>
                  <div class="font-display text-text text-xl font-bold">Custom Animation</div>
                  <div class="text-text-muted text-sm">initial → animate</div>
                </div>
              }
            </div>
            <div class="absolute right-4 bottom-4 z-20">
              <span
                class="text-text-subtle bg-bg/80 border-border rounded border px-2 py-1 font-mono text-xs backdrop-blur"
              >
                Preview Area
              </span>
            </div>
          </div>

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
                  />
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
    </div>
  `,
})
export default class DemoAnimate {
  protected readonly opacity = signal(0);
  protected readonly y = signal(30);
  protected readonly x = signal(0);
  protected readonly scale = signal(0.85);
  protected readonly rotate = signal(0);
  protected readonly blur = signal(0);
  protected readonly duration = signal(400);
  protected readonly delay = signal(0);
  protected readonly easing = signal('ease');
  protected readonly showElement = signal(true);
  protected readonly copied = signal(false);
  protected readonly easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out'];

  protected readonly animationConfig = computed((): MoveAnimationConfig => {
    const initial: MoveKeyframeState = {};
    const animate: MoveKeyframeState = {};

    const add = (key: keyof MoveKeyframeState, val: number) => {
      if (val !== NATURAL[key]) {
        initial[key] = val;
        animate[key] = NATURAL[key];
      }
    };

    add('opacity', this.opacity());
    add('y', this.y());
    add('x', this.x());
    add('scale', this.scale());
    add('rotate', this.rotate());
    add('blur', this.blur());

    return {
      initial,
      animate,
      duration: this.duration(),
      easing: this.easing(),
      ...(this.delay() ? { delay: this.delay() } : {}),
    };
  });

  protected readonly highlightedCode = computed(() => {
    const cfg = this.animationConfig();
    const init = cfg.initial as Record<string, number>;
    const keys = Object.keys(init);

    if (keys.length === 0) {
      return `<span class="code-comment">// move sliders away from their natural value to compose an animation</span>`;
    }

    const anim = cfg.animate as Record<string, number>;
    const attr = (s: string) => `<span class="code-attr">${s}</span>`;
    const str = (s: string | number) => `<span class="code-string">${s}</span>`;
    const kw = (s: string) => `<span class="code-keyword">${s}</span>`;
    const fmtState = (obj: Record<string, number>) =>
      Object.entries(obj)
        .map(([k, v]) => `${attr(k)}: ${str(v)}`)
        .join(', ');

    let code = `&lt;${kw('div')}\n`;
    code += `  [${attr('moveAnimation')}]="{\n`;
    code += `    ${attr('initial')}: { ${fmtState(init)} },\n`;
    code += `    ${attr('animate')}: { ${fmtState(anim)} }`;

    if (cfg.duration !== undefined && cfg.duration !== 300) {
      code += `,\n    ${attr('duration')}: ${str(cfg.duration)}`;
    }
    if (cfg.delay) {
      code += `,\n    ${attr('delay')}: ${str(cfg.delay)}`;
    }
    if (cfg.easing !== 'ease') {
      code += `,\n    ${attr('easing')}: ${str("'" + cfg.easing + "'")}`;
    }

    code += `\n  }"&gt;\n  Target Element\n&lt;/${kw('div')}&gt;`;
    return code;
  });

  protected replay(): void {
    this.showElement.set(false);
    setTimeout(() => this.showElement.set(true), 50);
  }

  protected copyCode(): void {
    const clean = this.highlightedCode()
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>');
    navigator.clipboard.writeText(clean);
    this.copied.set(true);
    setTimeout(() => this.copied.set(false), 2000);
  }
}
