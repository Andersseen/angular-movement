import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';

@Component({
  selector: 'app-presets-showcase',
  imports: [...MOVEMENT_DIRECTIVES],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border">
      <div class="text-center mb-16">
        <h2 class="font-display text-3xl md:text-5xl font-bold tracking-tight text-text mb-4">
          Presets showcase
        </h2>
        <p class="text-lg text-text-muted">
          Click any card to replay its native enter animation
        </p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        @for (preset of presets; track preset) {
          <button 
            type="button"
            (click)="replay(preset)"
            class="group flex flex-col items-center justify-center gap-4 bg-surface border border-border p-6 rounded-2xl hover:border-accent hover:bg-surface-raised transition-all cursor-pointer relative overflow-hidden"
          >
            <!-- Demo Block Container (fixed height) -->
            <div class="h-16 w-full flex items-center justify-center">
              @if (activePresets()[preset] !== false) {
                <div 
                  [moveEnter]="preset" 
                  [moveDuration]="500"
                  class="w-12 h-12 rounded-lg bg-accent shadow-[0_0_15px_var(--color-accent-glow)] flex items-center justify-center"
                >
                  <svg class="w-6 h-6 text-white" viewBox="0 0 100 100" fill="none">
                    <path d="M 25 20 L 50 50 L 25 80 L 45 80 L 70 50 L 45 20 Z" fill="currentColor" fill-opacity="0.8"/>
                    <path d="M 45 20 L 70 50 L 45 80 L 65 80 L 90 50 L 65 20 Z" fill="currentColor"/>
                  </svg>
                </div>
              }
            </div>
            
            <code class="text-sm font-mono text-text-muted group-hover:text-accent transition-colors">
              {{ preset }}
            </code>
          </button>
        }
      </div>
    </section>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PresetsShowcase {
  protected readonly presets: MovePreset[] = [
    'fade-up', 'fade-down', 'fade-left', 'fade-right',
    'slide-up', 'slide-down', 'zoom-in', 'zoom-out',
    'flip-x', 'flip-y', 'bounce-in'
  ];

  // Map to track visibility state per preset to force re-render
  protected readonly activePresets = signal<Record<string, boolean>>(
    this.presets.reduce((acc, preset) => ({ ...acc, [preset]: true }), {})
  );

  protected replay(preset: string): void {
    // Hide Element
    this.activePresets.update(state => ({ ...state, [preset]: false }));
    
    // Trigger tick and immediately re-show
    queueMicrotask(() => {
      this.activePresets.update(state => ({ ...state, [preset]: true }));
    });
  }
}
