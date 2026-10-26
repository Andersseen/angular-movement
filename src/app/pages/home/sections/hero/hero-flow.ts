import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  NgZone,
  PLATFORM_ID,
  signal,
  viewChild,
} from '@angular/core';
import { VoltNativeButton } from '@voltui/components';
import { ThemeService } from '../../../../shared/theme.service';
import { createHeroFlowRenderer, type HeroFlowRenderer } from './hero-flow-renderer';

const FRAME_INTERVAL = 1000 / 24;

@Component({
  selector: 'app-hero-flow',
  imports: [VoltNativeButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #field aria-hidden="true"></canvas>
    <div class="hero-flow-scrim" aria-hidden="true"></div>
    @if (supported() && !reduced()) {
      <button
        voltButton
        variant="ghost"
        size="sm"
        type="button"
        class="hero-flow-toggle"
        [attr.aria-pressed]="paused()"
        [attr.aria-label]="paused() ? 'Resume background motion' : 'Pause background motion'"
        (click)="paused.update(toggle)"
      >
        <span aria-hidden="true">{{ paused() ? '▶' : 'Ⅱ' }}</span>
        {{ paused() ? 'Resume motion' : 'Pause motion' }}
      </button>
    }
  `,
  host: {
    '[attr.data-motion-state]': 'state()',
  },
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      pointer-events: none;
    }
    canvas {
      width: 100%;
      height: 100%;
      display: block;
      opacity: 0.95;
      mask-image: linear-gradient(transparent, #000 12%, #000 85%, transparent);
    }
    .hero-flow-scrim {
      position: absolute;
      inset: 0;
      background: linear-gradient(90deg, var(--color-bg), transparent 72%);
      opacity: 0.22;
    }
    .hero-flow-toggle {
      position: absolute;
      top: 16px;
      right: 24px;
      pointer-events: auto;
      color: var(--color-text-muted);
      font-size: 11px;
      gap: 6px;
    }
    @media (max-width: 639px) {
      .hero-flow-toggle {
        right: 16px;
      }
    }
  `,
})
export class HeroFlow {
  readonly #document = inject(DOCUMENT);
  readonly #zone = inject(NgZone);
  readonly #theme = inject(ThemeService);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('field');
  protected readonly paused = signal(false);
  protected readonly reduced = signal(false);
  protected readonly supported = signal(false);
  readonly #visible = signal(false);
  readonly #hidden = signal(false);
  protected readonly toggle = (value: boolean) => !value;
  protected readonly state = computed(() =>
    !this.supported()
      ? 'unavailable'
      : this.reduced()
        ? 'static'
        : this.paused() || !this.#visible() || this.#hidden()
          ? 'paused'
          : 'running',
  );
  #renderer: HeroFlowRenderer | null = null;
  #frame: number | null = null;
  #lastDraw = 0;
  #elapsed = 0;
  #dark = true;
  #events: AbortController | undefined;
  #resizeObserver: ResizeObserver | undefined;
  #intersectionObserver: IntersectionObserver | undefined;

  constructor() {
    effect(() => {
      this.#dark = this.#theme.theme() === 'dark';
      const active =
        this.supported() && !this.reduced() && !this.paused() && this.#visible() && !this.#hidden();
      this.#zone.runOutsideAngular(() => this.#sync(active));
    });
    afterNextRender(() => {
      if (this.#isBrowser) this.#zone.runOutsideAngular(() => this.#setup());
    });
    inject(DestroyRef).onDestroy(() => {
      this.#events?.abort();
      this.#resizeObserver?.disconnect();
      this.#intersectionObserver?.disconnect();
      this.#stop();
      this.#renderer?.dispose(true);
      this.#renderer = null;
    });
  }

  #setup(): void {
    const canvas = this.canvas().nativeElement;
    const view = this.#document.defaultView;
    if (!view) return;
    try {
      this.#renderer = createHeroFlowRenderer(canvas);
    } catch {
      return;
    }
    if (!this.#renderer) return;
    this.#events = new AbortController();
    const options = { signal: this.#events.signal };
    const media = view.matchMedia('(prefers-reduced-motion: reduce)');
    this.reduced.set(media.matches);
    media.addEventListener('change', (event) => this.reduced.set(event.matches), options);
    this.#hidden.set(this.#document.hidden);
    this.#document.addEventListener(
      'visibilitychange',
      () => this.#hidden.set(this.#document.hidden),
      options,
    );
    canvas.addEventListener(
      'webglcontextlost',
      (event) => {
        event.preventDefault();
        this.#stop();
        this.#renderer?.dispose();
        this.#renderer = null;
        this.supported.set(false);
      },
      options,
    );
    canvas.addEventListener(
      'webglcontextrestored',
      () => {
        this.#renderer = createHeroFlowRenderer(canvas);
        this.#resize();
        this.supported.set(!!this.#renderer);
      },
      options,
    );
    this.#resizeObserver = new ResizeObserver(() => this.#resize());
    this.#resizeObserver.observe(canvas);
    this.#intersectionObserver = new IntersectionObserver(([entry]) =>
      this.#visible.set(entry.isIntersecting),
    );
    this.#intersectionObserver.observe(canvas);
    this.#resize();
    this.supported.set(true);
  }

  #resize(): void {
    const canvas = this.canvas().nativeElement;
    const { width, height } = canvas.getBoundingClientRect();
    if (!width || !height || !this.#renderer) return;
    this.#renderer.resize(width, height, this.#document.defaultView?.devicePixelRatio ?? 1);
    this.#renderer.draw(this.#elapsed, this.#dark);
  }

  #sync(active: boolean): void {
    if (active) {
      if (this.#frame === null) {
        this.#lastDraw = 0;
        this.#frame = requestAnimationFrame(this.#tick);
      }
    } else {
      this.#stop();
      if (this.#visible() && !this.#hidden()) this.#renderer?.draw(this.#elapsed, this.#dark);
    }
  }

  readonly #tick = (now: number): void => {
    if (!this.#renderer) {
      this.#frame = null;
      return;
    }
    const delta = this.#lastDraw ? now - this.#lastDraw : FRAME_INTERVAL;
    if (delta >= FRAME_INTERVAL) {
      this.#elapsed += Math.min(delta, 100) / 1000;
      this.#renderer.draw(this.#elapsed, this.#dark);
      this.#lastDraw = now - (delta % FRAME_INTERVAL);
    }
    this.#frame = requestAnimationFrame(this.#tick);
  };

  #stop(): void {
    if (this.#frame !== null) cancelAnimationFrame(this.#frame);
    this.#frame = null;
    this.#lastDraw = 0;
  }
}
