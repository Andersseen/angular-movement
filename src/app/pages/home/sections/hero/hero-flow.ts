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
import {
  createHeroFlowRenderer,
  type HeroFlowFrame,
  type HeroFlowRenderer,
} from './hero-flow-renderer';
import { warmHeroGpu } from './hero-flow-warmup';

// 60 draws/s at most: slow motion only looks fluid when it is not sampled in steps. The
// slack keeps a 60 Hz display on every frame and halves a 120 Hz one.
const FRAME_INTERVAL = 1000 / 60 - 2;
const INTRO_SECONDS = 2.4;
// The lens stays on while the pointer is moving and for this long after it stops.
const LENS_LINGER = 1200;

/** Frame-rate independent smoothing: the share of the remaining gap to close in `dt` seconds. */
const approach = (rate: number, dt: number) => 1 - Math.exp(-rate * dt);

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
  #cursor = { x: 0, y: 0 };
  #pull = 0;
  #inside = false;
  #lastMove = -Infinity;
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
        // Canvas-relative, so the lens lands under the cursor however far the page scrolled.
        const rect = canvas.getBoundingClientRect();
        this.#pointerTarget.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.#pointerTarget.y = -(((event.clientY - rect.top) / rect.height) * 2 - 1);
        this.#inside =
          event.pointerType !== 'touch' &&
          Math.abs(this.#pointerTarget.x) <= 1 &&
          Math.abs(this.#pointerTarget.y) <= 1;
        this.#lastMove = performance.now();
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
    this.#renderer.draw(this.#frameState());
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
        this.#renderer?.draw(this.#frameState());
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
      const dt = Math.min(delta, 100) / 1000;
      this.#elapsed += dt;
      // The volume leans toward the pointer slowly (weighted parallax); the lens follows it
      // closely, and fades in while the pointer moves and back out once it rests or leaves.
      const parallax = approach(2.5, dt);
      this.#pointer.x += (this.#pointerTarget.x - this.#pointer.x) * parallax;
      this.#pointer.y += (this.#pointerTarget.y - this.#pointer.y) * parallax;
      const follow = approach(12, dt);
      this.#cursor.x += (this.#pointerTarget.x - this.#cursor.x) * follow;
      this.#cursor.y += (this.#pointerTarget.y - this.#cursor.y) * follow;
      const engaged = this.#inside && now - this.#lastMove < LENS_LINGER;
      this.#pull += ((engaged ? 1 : 0) - this.#pull) * approach(engaged ? 5 : 1.6, dt);
      this.#renderer.draw(this.#frameState());
      this.#lastDraw = now - (delta % FRAME_INTERVAL);
    }
    this.#frame = requestAnimationFrame(this.#tick);
  };

  #frameState(): HeroFlowFrame {
    // Ease-out cubic entrance; a reduced-motion (static) frame is drawn fully revealed.
    const progress = Math.min(this.#elapsed / INTRO_SECONDS, 1);
    return {
      time: this.#elapsed,
      dark: this.#dark,
      pointerX: this.#pointer.x,
      pointerY: this.#pointer.y,
      cursorX: this.#cursor.x,
      cursorY: this.#cursor.y,
      pull: this.reduced() ? 0 : this.#pull,
      intro: this.reduced() ? 1 : 1 - Math.pow(1 - progress, 3),
    };
  }

  #stop(): void {
    if (this.#frame !== null) cancelAnimationFrame(this.#frame);
    this.#frame = null;
    this.#lastDraw = 0;
  }
}
