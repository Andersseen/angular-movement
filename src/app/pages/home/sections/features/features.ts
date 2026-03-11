import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MOVEMENT_DIRECTIVES } from 'movement';

@Component({
  selector: 'app-features',
  imports: [...MOVEMENT_DIRECTIVES],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        <!-- Feature 1: Attribute-first -->
        <div 
          moveEnter="fade-up" [moveDuration]="500" [moveDelay]="100"
          class="group p-8 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-accent-glow"
        >
          <div class="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/10 transition-transform">
            <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path></svg>
          </div>
          <h3 class="text-xl font-display font-bold text-text mb-3">Attribute-first</h3>
          <p class="text-text-muted leading-relaxed">
            Add animations with a single HTML attribute. No TypeScript setup, triggers, or state boilerplate required.
          </p>
        </div>

        <!-- Feature 2: Angular-native -->
        <div 
          moveEnter="fade-up" [moveDuration]="500" [moveDelay]="200"
          class="group p-8 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-accent-glow"
        >
          <div class="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/10 transition-transform">
            <!-- Angular Hexagon Base -->
            <svg class="w-6 h-6 text-accent" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2L2 6v12l10 4 10-4V6L12 2zm0 2.2l8 3.2v9l-8 3.2-8-3.2v-9l8-3.2z"/></svg>
          </div>
          <h3 class="text-xl font-display font-bold text-text mb-3">Angular-native</h3>
          <p class="text-text-muted leading-relaxed">
            Built directly on top of Angular's native animation API. No external dependencies or bloated CSS libraries. Zero Zone.js requirements.
          </p>
        </div>

        <!-- Feature 3: Accessible -->
        <div 
          moveEnter="fade-up" [moveDuration]="500" [moveDelay]="300"
          class="group p-8 rounded-2xl bg-surface border border-border hover:border-accent/40 transition-all duration-300 hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-accent-glow"
        >
          <div class="w-12 h-12 rounded-xl bg-surface-raised border border-border flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-accent/10 transition-transform">
            <svg class="w-6 h-6 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
          </div>
          <h3 class="text-xl font-display font-bold text-text mb-3">Accessible defaults</h3>
          <p class="text-text-muted leading-relaxed">
            Automatically respects user device preferences. Safe for all users out of the box with <code class="text-sm font-mono bg-surface-raised px-1 py-0.5 rounded text-text-subtle">prefers-reduced-motion</code>.
          </p>
        </div>

      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Features {}
