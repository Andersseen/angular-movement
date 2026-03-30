import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, MovePreset } from 'movement';
import { CodeBlock } from '../../../../shared/components/code-block/code-block';

@Component({
  selector: 'app-presets-showcase',
  imports: [...MOVEMENT_DIRECTIVES, CodeBlock],
  template: `
    <section class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 border-t border-border">
      <div class="text-center mb-16">
        <h2 class="font-display text-3xl md:text-5xl font-bold tracking-tight text-text mb-4">
          Presets showcase
        </h2>
        <p class="text-lg text-text-muted">
          Click any card to select and replay its native enter animation
        </p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Preset Grid -->
        <div class="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-4">
          @for (preset of presets; track preset) {
            <button 
              type="button"
              (click)="selectAndReplay(preset)"
              class="group flex flex-col items-center justify-center gap-4 bg-surface border p-6 rounded-2xl transition-all cursor-pointer relative overflow-hidden"
              [class.border-accent]="selectedPreset() === preset"
              [class.bg-surface-raised]="selectedPreset() === preset"
              [class.border-border]="selectedPreset() !== preset"
              [class.hover:border-accent]="selectedPreset() !== preset"
              [class.hover:bg-surface-raised]="selectedPreset() !== preset"
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
              
              <code class="text-sm font-mono transition-colors"
                [class.text-accent]="selectedPreset() === preset"
                [class.text-text-muted]="selectedPreset() !== preset"
                [class.group-hover:text-accent]="selectedPreset() !== preset"
              >
                {{ preset }}
              </code>
            </button>
          }
        </div>

        <!-- Dynamic Code Snippet Sidebar -->
        <div class="lg:col-span-1 border border-border rounded-2xl bg-surface/50 overflow-hidden flex flex-col">
          <div class="p-6 border-b border-border">
            @if (!selectedPreset()) {
              <h3 class="text-xl font-bold font-display text-text mb-2 animate-pulse">
                Select a preset to view code
              </h3>
            }
            @if (selectedPreset()) {
              <h3 class="text-xl font-bold font-display text-text mb-2">
                {{ selectedPreset() }}
              </h3>
            }
            <p class="text-sm text-text-subtle">
              Copy and drop this directive into any native Angular component.
            </p>
          </div>
          
          <div class="flex-1 p-4 bg-code-bg">
            <app-code-block 
              [title]="'my-component.html'" 
              [code]="dynamicSnippet()"
            />
          </div>
        </div>
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

  protected readonly selectedPreset = signal<MovePreset | null>(null);

  protected readonly dynamicSnippet = computed(() => {
    const preset = this.selectedPreset() || 'fade-up'; // Fallback visual
    return `<span class="code-comment">&lt;!-- Just add the moveEnter directive --&gt;</span>
&lt;div 
  <span class="code-keyword">moveEnter</span>=<span class="code-string">"${preset}"</span>
  <span class="code-keyword">[moveDuration]</span>=<span class="code-string">"500"</span>
&gt;
  Hello Movement!
&lt;/div&gt;`;
  });

  // Map to track visibility state per preset to force re-render
  protected readonly activePresets = signal<Record<string, boolean>>(
    this.presets.reduce((acc, preset) => ({ ...acc, [preset]: true }), {})
  );

  protected selectAndReplay(preset: MovePreset): void {
    this.selectedPreset.set(preset);
    
    // Hide Element
    this.activePresets.update(state => ({ ...state, [preset]: false }));
    
    // Use setTimeout to ensure Angular processes the removal before re-creation
    setTimeout(() => {
      this.activePresets.update(state => ({ ...state, [preset]: true }));
    }, 0);
  }
}
