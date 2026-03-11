import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-install',
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-32 mb-16 relative overflow-hidden rounded-3xl group">
      <!-- Glow background -->
      <div class="absolute inset-0 bg-accent/5 transition-colors duration-500 group-hover:bg-accent/10"></div>
      <div 
        class="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none transition-opacity duration-1000 group-hover:opacity-70"
        style="background: radial-gradient(circle at top right, var(--color-accent) 0%, transparent 50%);"
      ></div>
      
      <div class="relative z-10 text-center flex flex-col items-center">
        <h2 class="font-display text-4xl md:text-5xl font-extrabold tracking-tight text-text mb-6">
          Ready to move?
        </h2>
        <p class="text-xl text-text-muted mb-10 max-w-2xl font-light">
          Drop the boilerplate. Start animating your Angular 21 applications in minutes with a single import.
        </p>

        <!-- Install block -->
        <div class="bg-surface border border-border rounded-xl p-4 flex items-center justify-between gap-6 w-full max-w-md shadow-2xl transition-transform hover:scale-[1.02]">
          <code class="font-mono text-sm text-text-muted flex-1 text-left select-all">npm install @angular-movement/core</code>
          <button 
            type="button"
            class="p-2 text-text-subtle hover:text-text hover:bg-surface-raised rounded-md transition-colors"
            onclick="navigator.clipboard.writeText('npm install @angular-movement/core')"
            aria-label="Copy install command"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
          </button>
        </div>
        
        <div class="mt-8 flex gap-4">
          <a href="/docs" class="text-sm font-semibold text-text hover:text-accent transition-colors flex items-center gap-1">
            Read the docs <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Install {}
