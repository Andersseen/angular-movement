import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <h1
        class="mb-4 text-6xl font-black tracking-tighter md:text-8xl"
        style="color: var(--color-accent)"
      >
        404
      </h1>
      <h2 class="mb-6 text-2xl font-bold text-[var(--color-text)] md:text-3xl">Page Not Found</h2>
      <p class="mx-auto mb-8 max-w-md text-lg text-[var(--color-text-subtle)]">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <a
        routerLink="/"
        class="inline-flex items-center justify-center rounded-full px-6 py-3 font-medium transition-all duration-200 hover:opacity-80"
        style="background-color: var(--color-surface-raised); color: var(--color-text); border: 1px solid var(--color-border);"
      >
        Back to Home
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class NotFound {}
