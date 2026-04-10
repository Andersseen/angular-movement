import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-install',
  template: `
    <section
      class="group relative mx-auto mb-16 max-w-7xl overflow-hidden rounded-3xl px-4 py-32 sm:px-6 lg:px-8"
    >
      <!-- Glow background -->
      <div
        class="bg-accent/5 group-hover:bg-accent/10 absolute inset-0 transition-colors duration-500"
      ></div>
      <div
        class="pointer-events-none absolute inset-0 opacity-40 mix-blend-screen transition-opacity duration-1000 group-hover:opacity-70"
        style="background: radial-gradient(circle at top right, var(--color-accent) 0%, transparent 50%);"
      ></div>

      <div class="relative z-10 flex flex-col items-center text-center">
        <h2 class="font-display text-text mb-6 text-4xl font-extrabold tracking-tight md:text-5xl">
          Ready to move?
        </h2>
        <p class="text-text-muted mb-10 max-w-2xl text-xl font-light">
          Drop the boilerplate. Start animating your Angular 21 applications in minutes with a
          single import.
        </p>

        <!-- Install block -->
        <div
          class="bg-surface border-border flex w-full max-w-md items-center justify-between gap-6 rounded-xl border p-4 shadow-2xl transition-transform hover:scale-[1.02]"
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

        <div class="mt-8 flex gap-4">
          <a
            href="/docs"
            class="text-text hover:text-accent flex items-center gap-1 text-sm font-semibold transition-colors"
          >
            Read the docs <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Install {}
