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
import { ThemeService } from '../../../../shared/theme.service';
import { createHeroFlowRenderer, type HeroFlowRenderer } from './hero-flow-renderer';
import { warmHeroGpu } from './hero-flow-warmup';

// 60 draws/s at most: slow motion only looks fluid when it is not sampled in steps. The
// slack keeps a 60 Hz display on every frame and halves a 120 Hz one.
const FRAME_INTERVAL = 1000 / 60 - 2;

@Component({
  selector: 'app-hero-flow',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <canvas #field aria-hidden="true"></canvas>
    <div class="hero-flow-scrim" aria-hidden="true"></div>
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
      mask-image: linear-gradient(transparent, #000 10%, #000 78%, transparent);
    }
    /* Centred copy sits on the sphere: a soft pool of background keeps it readable. */
    .hero-flow-scrim {
      position: absolute;
      inset: 0;
      background: radial-gradient(ellipse 38% 30% at 50% 48%, var(--color-bg) 0%, transparent 100%);
      opacity: 0.72;
    }
  `,
})
export class HeroFlow {
  readonly #document = inject(DOCUMENT);
  readonly #zone = inject(NgZone);
  readonly #theme = inject(ThemeService);
  readonly #isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  protected readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('field');
  protected readonly reduced = signal(false);
  protected readonly supported = signal(false);
  readonly #visible = signal(false);
  readonly #hidden = signal(false);
  protected readonly state = computed(() =>
    !this.supported()
      ? 'unavailable'
      : this.reduced()
        ? 'static'
        : !this.#visible() || this.#hidden()
          ? 'paused'
          : 'running',
  );
  #renderer: HeroFlowRenderer | null = null;
  #frame: number | null = null;
  #lastDraw = 0;
  #elapsed = 0;
  #dark = true;
  #pointerTarget = { x: 0, y: 0 };
  #pointer = { x: 0, y: 0 };
  #events: AbortController | undefined;
  #resizeObserver: ResizeObserver | undefined;
  #intersectionObserver: IntersectionObserver | undefined;

  constructor() {
    effect(() => {
      this.#dark = this.#theme.theme() === 'dark';
      const active = this.supported() && !this.reduced() && this.#visible() && !this.#hidden();
      this.#zone.runOutsideAngular(() => this.#sync(active));
    });
    afterNextRender(() => {
      if (this.#isBrowser) this.#zone.runOutsideAngular(() => void this.#setup());
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

  async #setup(): Promise<void> {
    const canvas = this.canvas().nativeElement;
    const view = this.#document.defaultView;
    if (!view) return;
    this.#events = new AbortController();
    if (!(await warmHeroGpu(this.#events.signal)) || this.#events.signal.aborted) return;
    try {
      this.#renderer = createHeroFlowRenderer(canvas);
    } catch {
      return;
    }
    if (!this.#renderer) return;
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
    // The field quietly follows the pointer; the hero content above it never notices.
    this.#document.addEventListener(
      'pointermove',
      (event) => {
        this.#pointerTarget.x = (event.clientX / view.innerWidth) * 2 - 1;
        this.#pointerTarget.y = -((event.clientY / view.innerHeight) * 2 - 1);
      },
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
    this.#renderer.draw(this.#elapsed, this.#dark, this.#pointer.x, this.#pointer.y);
  }

  #sync(active: boolean): void {
    if (active) {
      if (this.#frame === null) {
        this.#lastDraw = 0;
        this.#frame = requestAnimationFrame(this.#tick);
      }
    } else {
      this.#stop();
      if (this.#visible() && !this.#hidden()) {
        this.#renderer?.draw(this.#elapsed, this.#dark, this.#pointer.x, this.#pointer.y);
      }
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
      // Glide toward the pointer so the parallax feels weighted, not sticky.
      this.#pointer.x += (this.#pointerTarget.x - this.#pointer.x) * 0.04;
      this.#pointer.y += (this.#pointerTarget.y - this.#pointer.y) * 0.04;
      this.#renderer.draw(this.#elapsed, this.#dark, this.#pointer.x, this.#pointer.y);
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
