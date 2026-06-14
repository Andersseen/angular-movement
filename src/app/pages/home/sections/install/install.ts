import { ChangeDetectionStrategy, Component } from '@angular/core';
import { InstallCommand } from '../../../../shared/components/install-command/install-command';

@Component({
  selector: 'app-install',
  imports: [InstallCommand],
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
        <div class="w-full max-w-md">
          <app-install-command />
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
