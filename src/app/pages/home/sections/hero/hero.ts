import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';

@Component({
  selector: 'app-hero',
  imports: [...MOVEMENT_DIRECTIVES],
  template: `
    <section class="relative min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden">
      <!-- Background mesh using CSS gradient -->
      <div 
        class="absolute inset-0 z-0 opacity-20 pointer-events-none" 
        style="background: radial-gradient(circle at 50% 50%, var(--color-accent) 0%, transparent 60%); filter: blur(100px); mix-blend-mode: screen;"
      ></div>
      
      <div class="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        <!-- Logo animates in -->
        <div moveEnter="zoom-in" [moveDuration]="600" moveEasing="ease-out" class="mb-8">
          <svg class="h-20 w-20 text-accent mx-auto mb-4" viewBox="0 0 100 100" fill="none">
            <path d="M 25 20 L 50 50 L 25 80 L 45 80 L 70 50 L 45 20 Z" fill="currentColor" fill-opacity="0.8"/>
            <path d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z" fill="currentColor"/>
          </svg>
          <div class="font-display font-bold text-xl tracking-widest uppercase text-accent/80">
            Angular Movement
          </div>
        </div>

        <!-- H1 -->
        <h1 
          moveEnter="fade-up" [moveDelay]="100" [moveDuration]="600"
          class="font-display text-5xl md:text-7xl font-extrabold tracking-tighter text-text mb-6 max-w-4xl"
        >
          Animate Angular with a <span class="bg-clip-text text-transparent bg-gradient-to-r from-accent to-accent-light">single attribute</span>.
        </h1>

        <!-- Subheading -->
        <p 
          moveEnter="fade-up" [moveDelay]="200" [moveDuration]="600"
          class="text-xl md:text-2xl text-text-muted mb-10 max-w-2xl font-light"
        >
          Enter and leave animations for Angular 21. No boilerplate. Just HTML.
        </p>

        <!-- CTAs -->
        <div 
          moveEnter="fade-up" [moveDelay]="300" [moveDuration]="600"
          class="flex flex-col sm:flex-row gap-4 mb-16 w-full justify-center"
        >
          <a href="/docs" class="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-white bg-accent hover:bg-accent-light rounded-xl transition-all shadow-[0_0_20px_var(--color-accent-glow)] hover:shadow-[0_0_30px_var(--color-accent-glow)] min-w-[200px]">
            Get Started &rarr;
          </a>
          <a href="https://github.com/angular-movement/core" target="_blank" class="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold text-text border border-border bg-surface hover:bg-surface-raised rounded-xl transition-colors min-w-[200px]">
            View on GitHub
          </a>
        </div>

        <!-- Install block -->
        <div 
          moveEnter="fade-up" [moveDelay]="400" [moveDuration]="600"
          class="bg-code-bg border border-border rounded-xl p-4 flex items-center justify-between gap-6 max-w-md w-full mx-auto"
        >
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
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Hero {}
