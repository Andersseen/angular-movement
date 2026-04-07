import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h1 class="text-6xl md:text-8xl font-black mb-4 tracking-tighter" style="color: var(--color-accent)">404</h1>
      <h2 class="text-2xl md:text-3xl font-bold mb-6 text-[var(--color-text)]">Página no encontrada</h2>
      <p class="text-lg mb-8 max-w-md mx-auto text-[var(--color-text-subtle)]">
        La página que buscas no existe o ha sido movida.
      </p>
      <a 
        routerLink="/" 
        class="inline-flex items-center justify-center px-6 py-3 rounded-full font-medium transition-all duration-200 hover:opacity-80"
        style="background-color: var(--color-surface-raised); color: var(--color-text); border: 1px solid var(--color-border);"
      >
        Volver al inicio
      </a>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFound {}
