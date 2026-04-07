import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';

@Component({
  selector: 'app-hero',
  imports: [...MOVEMENT_DIRECTIVES],
  template: `
    <section
      class="relative flex min-h-[90vh] flex-col items-center justify-center overflow-hidden pt-24 pb-16"
    >
      <!-- Background mesh using CSS gradient -->
      <div
        class="pointer-events-none absolute inset-0 z-0 opacity-20"
        style="background: radial-gradient(circle at 50% 50%, var(--color-accent) 0%, transparent 60%); filter: blur(100px); mix-blend-mode: screen;"
      ></div>

      <div
        class="relative z-10 mx-auto flex w-full max-w-7xl flex-col items-center px-4 text-center sm:px-6 lg:px-8"
      >
        <!-- Logo animates in -->
        <div moveEnter="zoom-in" [moveDuration]="600" moveEasing="ease-out" class="mb-8">
          <svg class="text-accent mx-auto mb-4 h-20 w-20" viewBox="0 0 100 100" fill="none">
            <path
              d="M 25 20 L 50 50 L 25 80 L 45 80 L 70 50 L 45 20 Z"
              fill="currentColor"
              fill-opacity="0.8"
            />
            <path d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z" fill="currentColor" />
          </svg>
          <div class="font-display text-accent/80 text-xl font-bold tracking-widest uppercase">
            Angular Movement
          </div>
        </div>

        <!-- H1 -->
        <h1
          moveEnter="fade-up"
          [moveDelay]="100"
          [moveDuration]="600"
          class="font-display text-text mb-6 max-w-4xl text-5xl font-extrabold tracking-tighter md:text-7xl"
        >
          Animate Angular with a
          <span class="from-accent to-accent-light bg-gradient-to-r bg-clip-text text-transparent"
            >single attribute</span
          >.
        </h1>

        <!-- Subheading -->
        <p
          moveEnter="fade-up"
          [moveDelay]="200"
          [moveDuration]="600"
          class="text-text-muted mb-10 max-w-2xl text-xl font-light md:text-2xl"
        >
          Enter and leave animations for Angular 21. No boilerplate. Just HTML.
        </p>

        <!-- CTAs -->
        <div
          moveEnter="fade-up"
          [moveDelay]="300"
          [moveDuration]="600"
          class="mb-16 flex w-full flex-col justify-center gap-4 sm:flex-row"
        >
          <a
            href="/docs"
            class="bg-accent hover:bg-accent-light inline-flex min-w-[200px] items-center justify-center rounded-xl px-8 py-3.5 text-base font-semibold text-white shadow-[0_0_20px_var(--color-accent-glow)] transition-all hover:shadow-[0_0_30px_var(--color-accent-glow)]"
          >
            Get Started &rarr;
          </a>
          <a
            href="https://github.com/angular-movement/core"
            target="_blank"
            class="text-text border-border bg-surface hover:bg-surface-raised inline-flex min-w-[200px] items-center justify-center rounded-xl border px-8 py-3.5 text-base font-semibold transition-colors"
          >
            View on GitHub
          </a>
        </div>

        <!-- Install block -->
        <div
          moveEnter="fade-up"
          [moveDelay]="400"
          [moveDuration]="600"
          class="bg-code-bg border-border mx-auto flex w-full max-w-md items-center justify-between gap-6 rounded-xl border p-4"
        >
          <code class="text-text-muted flex-1 text-left font-mono text-sm select-all"
            >npm install @angular-movement/core</code
          >
          <button
            type="button"
            class="text-text-subtle hover:text-text hover:bg-surface-raised rounded-md p-2 transition-colors"
            onclick="navigator.clipboard.writeText('npm install @angular-movement/core')"
            aria-label="Copy install command"
          >
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {}
