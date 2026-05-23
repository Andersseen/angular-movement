import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { MOVEMENT_DIRECTIVES, movePathDraw } from 'movement';
import { DemoContainer, DemoState } from '../../shared/components/demo-container/demo-container';

@Component({
  selector: 'app-demo-icons',
  imports: [DemoContainer, ...MOVEMENT_DIRECTIVES],
  template: `
    <app-demo-container
      title="SVG Icons"
      description="First-class SVG path drawing with pathLength, pathOffset, per-property transitions, and one-shot triggers. Ideal for animated icon systems like @lumen/icons."
      directive="moveTarget"
      [availablePresets]="['icon-draw', 'icon-pulse', 'icon-bounce']"
      [controls]="controlsConfig"
      [initialDuration]="700"
      initialEasing="ease-out"
      [showReplay]="false"
      [customCode]="iconsCode()"
      (stateChange)="onStateChange($event)"
    >
      <div preview class="flex h-full w-full flex-col items-center justify-center gap-8">
        <!-- Toggle -->
        <div class="flex gap-2">
          <button
            type="button"
            class="bg-accent hover:bg-accent-light rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
            (click)="animated.update((v) => !v)"
          >
            {{ animated() ? 'Reset' : 'Animate' }}
          </button>
        </div>

        <!-- Icon Grid -->
        <div class="flex flex-wrap items-center justify-center gap-8">
          <!-- 1. Paperclip with pathLength + pathOffset -->
          <div class="flex flex-col items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              class="text-accent h-16 w-16"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            >
              <path
                [moveTrigger]="animated()"
                [moveFrames]="{ pathLength: [0, 1], pathOffset: [0, 0], opacity: [0, 1] }"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                moveResetState="clear"
                d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"
              />
            </svg>
            <span class="text-text-muted text-xs">moveTrigger + pathLength</span>
          </div>

          <!-- 2. Checkmark with variants + transition -->
          <div class="flex flex-col items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              class="text-accent h-16 w-16"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            >
              <path
                [moveVariants]="checkVariants()"
                [moveAnimate]="animated() ? 'draw' : 'normal'"
                [moveDuration]="duration()"
                d="M20 6L9 17l-5-5"
              />
            </svg>
            <span class="text-text-muted text-xs">moveVariants + transition</span>
          </div>

          <!-- 3. Mail with movePathDraw helper -->
          <div class="flex flex-col items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              class="text-accent h-16 w-16"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            >
              <path
                [moveTarget]="animated()"
                [moveFrames]="mailFrames()"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                [moveTransition]="mailTransition()"
                moveReverseDuration="0"
                d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
              />
              <path
                [moveTarget]="animated()"
                [moveFrames]="mailFrames()"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                [moveTransition]="mailTransition()"
                moveReverseDuration="0"
                moveDelay="120"
                d="M22 6l-10 7L2 6"
              />
            </svg>
            <span class="text-text-muted text-xs">movePathDraw + per-property</span>
          </div>

          <!-- 4. Download with icon-bounce preset -->
          <div class="flex flex-col items-center gap-2">
            <svg
              viewBox="0 0 24 24"
              class="text-accent h-16 w-16"
              fill="none"
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
            >
              <path
                [moveTarget]="animated()"
                movePreset="icon-bounce"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                moveReverseDuration="0"
                d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"
              />
              <polyline
                [moveTarget]="animated()"
                movePreset="icon-bounce"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                moveReverseDuration="0"
                moveDelay="60"
                points="7 10 12 15 17 10"
              />
              <line
                [moveTarget]="animated()"
                movePreset="icon-bounce"
                [moveDuration]="duration()"
                [moveEasing]="easing()"
                moveReverseDuration="0"
                moveDelay="120"
                x1="12"
                y1="15"
                x2="12"
                y2="3"
              />
            </svg>
            <span class="text-text-muted text-xs">icon-bounce preset</span>
          </div>
        </div>

        <p class="text-text-muted max-w-md text-center text-sm">
          pathLength is automatically converted to strokeDasharray/strokeDashoffset via
          getTotalLength(). Per-property transitions let opacity fade faster than the stroke draws.
        </p>
      </div>
    </app-demo-container>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export default class DemoIcons {
  protected readonly controlsConfig = {
    showPreset: false,
    showDuration: true,
    showDelay: false,
    showEasing: true,
  };

  protected readonly animated = signal(false);
  protected readonly duration = signal(700);
  protected readonly easing = signal('ease-out');

  protected readonly checkVariants = signal({
    normal: { pathLength: 1, opacity: 1 },
    draw: {
      pathLength: [0, 1],
      opacity: [0, 1],
      transition: { duration: 700, opacity: { duration: 200, delay: 100 } },
    },
  });

  protected readonly mailFrames = computed(() => movePathDraw({ opacity: [0, 0.72, 0] }));

  protected readonly mailTransition = computed(() => ({
    duration: this.duration(),
    opacity: { duration: 300, delay: 100 },
  }));

  protected readonly iconsCode = computed(() => {
    return `&lt;!-- Trigger (no reverse) --&gt;
&lt;<span class="code-keyword">path</span>
  <span class="code-attr">[moveTrigger]</span>=<span class="code-string">"animated()"</span>
  <span class="code-attr">[moveFrames]</span>=<span class="code-string">"{ pathLength: [0, 1], opacity: [0, 1] }"</span>
  <span class="code-attr">moveDuration</span>=<span class="code-string">"${this.duration()}"</span>
  <span class="code-attr">moveResetState</span>=<span class="code-string">"clear"</span> /&gt;

&lt;!-- Variants with per-property transition --&gt;
&lt;<span class="code-keyword">path</span>
  <span class="code-attr">[moveVariants]</span>=<span class="code-string">"{
    normal: { pathLength: 1, opacity: 1 },
    draw: {
      pathLength: [0, 1],
      opacity: [0, 1],
      transition: { duration: ${this.duration()}, opacity: { duration: 200, delay: 100 } }
    }
  }"</span>
  <span class="code-attr">[moveAnimate]</span>=<span class="code-string">"animated() ? 'draw' : 'normal'"</span> /&gt;

&lt;!-- Helper function --&gt;
&lt;<span class="code-keyword">path</span>
  <span class="code-attr">[moveTarget]</span>=<span class="code-string">"animated()"</span>
  <span class="code-attr">[moveFrames]</span>=<span class="code-string">"movePathDraw({ opacity: [0, 0.72, 0] })"</span>
  <span class="code-attr">moveDuration</span>=<span class="code-string">"${this.duration()}"</span> /&gt;`;
  });

  protected onStateChange(state: DemoState): void {
    this.duration.set(state.duration);
    this.easing.set(state.easing);
  }
}
