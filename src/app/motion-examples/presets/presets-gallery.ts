import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import { MoveEnterDirective, MoveHoverDirective, MovePreset, MoveTapDirective } from 'movement';

interface PresetTile {
  readonly preset: MovePreset;
  readonly kind: 'box' | 'icon' | 'interaction';
}

const TILES: readonly PresetTile[] = [
  ...(
    [
      'fade-up',
      'fade-down',
      'fade-left',
      'fade-right',
      'slide-up',
      'slide-down',
      'zoom-in',
      'zoom-out',
      'blur-in',
      'bounce-in',
      'flip-x',
      'flip-y',
      'pulse',
      'shake',
      'swing',
      'tada',
    ] as const
  ).map((preset) => ({ preset, kind: 'box' as const })),
  ...(['icon-draw', 'icon-pulse', 'icon-bounce'] as const).map((preset) => ({
    preset,
    kind: 'icon' as const,
  })),
  ...(['lift', 'press'] as const).map((preset) => ({ preset, kind: 'interaction' as const })),
];

/**
 * Live preview of every preset, for `::demo[presets-gallery]`. Nothing animates until the gallery is
 * scrolled into view (an IntersectionObserver armed after the first browser render — server-rendered
 * HTML carries the placeholder), and each tile replays on demand because `moveEnter` is init-only (a
 * replay recreates the tile's element).
 */
@Component({
  selector: 'app-presets-gallery',
  imports: [MoveEnterDirective, MoveHoverDirective, MoveTapDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
  template: `
    @if (visible()) {
      <ul
        class="m-0 grid list-none gap-3 p-0 sm:grid-cols-2 lg:grid-cols-3"
        data-testid="presets-gallery"
      >
        @for (tile of tiles; track tile.preset) {
          <li class="border-border bg-surface rounded-xl border p-4">
            <div class="flex h-20 items-center justify-center overflow-hidden">
              @switch (tile.kind) {
                @case ('interaction') {
                  <button
                    type="button"
                    class="bg-accent-solid focus-visible:outline-accent min-h-11 rounded-lg px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2"
                    [moveWhileHover]="tile.preset === 'lift' ? 'lift' : 'none'"
                    [moveWhileTap]="tile.preset === 'press' ? 'press' : 'none'"
                  >
                    {{ tile.preset === 'lift' ? 'Hover me' : 'Press me' }}
                  </button>
                }
                @case ('icon') {
                  @for (run of [runs()[tile.preset] ?? 0]; track run) {
                    @if (tile.preset === 'icon-draw') {
                      <svg
                        class="text-accent h-12 w-12"
                        viewBox="0 0 48 48"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          [moveEnter]="tile.preset"
                          moveDuration="700ms"
                          d="M14 25.5 21 32l14-17"
                          stroke="currentColor"
                          stroke-width="4"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    } @else {
                      <svg
                        class="text-accent h-12 w-12"
                        viewBox="0 0 48 48"
                        fill="none"
                        aria-hidden="true"
                        [moveEnter]="tile.preset"
                        moveDuration="700ms"
                      >
                        <path
                          d="M14 25.5 21 32l14-17"
                          stroke="currentColor"
                          stroke-width="4"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                        />
                      </svg>
                    }
                  }
                }
                @default {
                  @for (run of [runs()[tile.preset] ?? 0]; track run) {
                    <div
                      class="bg-accent-solid flex h-12 w-12 items-center justify-center rounded-lg font-mono text-xs font-bold text-white"
                      [moveEnter]="tile.preset"
                      moveDuration="550ms"
                    >
                      UI
                    </div>
                  }
                }
              }
            </div>
            <div class="mt-3 flex items-center justify-between gap-2">
              <code class="text-text text-sm">{{ tile.preset }}</code>
              @if (tile.kind !== 'interaction') {
                <button
                  type="button"
                  class="text-accent focus-visible:outline-accent min-h-11 rounded px-2 text-sm font-medium hover:underline focus-visible:outline-2"
                  [attr.aria-label]="'Replay ' + tile.preset"
                  (click)="replay(tile.preset)"
                >
                  Replay
                </button>
              }
            </div>
          </li>
        }
      </ul>
    } @else {
      <div
        class="border-border text-text-muted min-h-64 rounded-xl border border-dashed p-6 text-sm"
      >
        Live preview of every preset loads as this section scrolls into view.
      </div>
    }
  `,
})
export class PresetsGallery {
  protected readonly tiles = TILES;
  protected readonly visible = signal(false);
  protected readonly runs = signal<Partial<Record<MovePreset, number>>>({});

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    const isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
    afterNextRender(() => {
      // Angular's prerender (Analog, Node) also runs this hook; there is no IntersectionObserver there.
      if (!isBrowser || typeof IntersectionObserver === 'undefined') return;
      const observer = new IntersectionObserver((entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          this.visible.set(true);
          observer.disconnect();
        }
      });
      observer.observe(host);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected replay(preset: MovePreset): void {
    this.runs.update((runs) => ({ ...runs, [preset]: (runs[preset] ?? 0) + 1 }));
  }
}
