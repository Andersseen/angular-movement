import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MoveAnimationDirective, MoveAnimationConfig, MovePresenceDirective } from 'movement';

@Component({
  selector: 'app-demo-animation',
  imports: [FormsModule, MoveAnimationDirective, MovePresenceDirective],
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
          Framer Motion-style object API. Pass a single
          <span class="text-text font-medium">initial</span>,
          <span class="text-text font-medium">animate</span>, and
          <span class="text-text font-medium">exit</span> object to <code>[moveAnimation]</code>.
        </p>
        <p class="text-text-muted mt-4 max-w-2xl text-lg">
          <span class="text-accent font-medium">Important:</span> only properties present in
          <strong>both</strong> <code>initial</code> and <code>animate</code> are animated.
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
              (click)="toggleShow()"
            >
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {{ show() ? 'Hide' : 'Show' }}
            </button>
          </div>

          <div class="space-y-8">
            <div>
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
              <ng-container *movePresence="show()">
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
                  <div class="font-display text-text text-xl font-bold">Object Animation</div>
                  <div class="text-text-muted text-sm">initial → animate → exit</div>
                </div>
              </ng-container>
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
export default class DemoAnimation {
  protected readonly duration = signal(400);
  protected readonly delay = signal(0);
  protected readonly easing = signal('ease');
  protected readonly show = signal(true);
  protected readonly copied = signal(false);
  protected readonly easings = ['ease', 'ease-in', 'ease-out', 'ease-in-out'];

  protected readonly animationConfig = computed(
    (): MoveAnimationConfig => ({
      initial: { opacity: 0, y: 24, scale: 0.95 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -16, scale: 0.95 },
      duration: this.duration(),
      delay: this.delay(),
      easing: this.easing(),
    }),
  );

  protected readonly highlightedCode = computed(() => {
    const attr = (s: string) => `<span class="code-attr">${s}</span>`;
    const str = (s: string | number) => `<span class="code-string">${s}</span>`;
    const kw = (s: string) => `<span class="code-keyword">${s}</span>`;
    const num = (n: number) => str(String(n));

    let code = `&lt;${kw('ng-container')} *${attr('movePresence')}=${str('"isOpen()"')}&gt;\n`;
    code += `  &lt;${kw('div')}\n`;
    code += `    [${attr('moveAnimation')}]=${str('"{')}\n`;
    code += `      ${attr('initial')}: { ${attr('opacity')}: ${num(0)}, ${attr('y')}: ${num(24)}, ${attr('scale')}: ${num(0.95)} },\n`;
    code += `      ${attr('animate')}: { ${attr('opacity')}: ${num(1)}, ${attr('y')}: ${num(0)}, ${attr('scale')}: ${num(1)} },\n`;
    code += `      ${attr('exit')}: { ${attr('opacity')}: ${num(0)}, ${attr('y')}: ${num(-16)}, ${attr('scale')}: ${num(0.95)} }\n`;
    code += `    ${str('}"')}\n`;

    if (this.duration() !== 400) {
      code += `    ${attr('moveDuration')}=${str(`"${this.duration()}"`)}\n`;
    }
    if (this.delay()) {
      code += `    ${attr('moveDelay')}=${str(`"${this.delay()}"`)}\n`;
    }
    if (this.easing() !== 'ease') {
      code += `    ${attr('moveEasing')}=${str(`"${this.easing()}"`)}\n`;
    }

    code += `  &gt;\n    Card\n  &lt;/${kw('div')}&gt;\n`;
    code += `&lt;/${kw('ng-container')}&gt;`;

    return code;
  });

  protected toggleShow(): void {
    this.show.update((v) => !v);
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
