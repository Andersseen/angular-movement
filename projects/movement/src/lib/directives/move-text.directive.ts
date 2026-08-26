import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  OnDestroy,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  applyInitialStyles,
  clearInitialStyles,
  numberAttribute,
  optionalBooleanAttribute,
  optionalNumberAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

/**
 * Stable candidate — feature-complete, but naming or behaviour may still receive small adjustments before 1.0.
 *
 * @stability candidate
 */
@Directive({
  selector: '[moveText]',
})
export class MoveTextDirective implements OnDestroy {
  readonly moveText = input<MovePreset | MoveKeyframes>('fade-up');
  readonly moveTextSplit = input<'chars' | 'words'>('chars');
  readonly moveTextStagger = input<number, unknown>(30, { transform: numberAttribute });

  readonly moveDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveDisabled = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  readonly #renderer = inject(Renderer2);

  #players: AnimationControls[] = [];
  #spans: HTMLElement[] = [];
  #observer: IntersectionObserver | null = null;
  #frames: MoveKeyframes | null = null;
  #originalText = '';
  #destroyed = false;

  constructor() {
    effect(() => {
      // React to input changes (and initial values).
      const presetOrFrames = this.moveText();
      this.moveTextSplit();
      const duration = this.moveDuration();
      const easing = this.moveEasing();
      const delay = this.moveDelay();
      const stagger = this.moveTextStagger();
      const spring = this.moveSpring();
      const disabled = this.moveDisabled();

      // Reading the inputs above is enough to re-run the effect when they change.
      // We defer the actual DOM work so Angular finishes rendering interpolated text.
      Promise.resolve().then(() => {
        // A destroy that lands in the same tick the effect fired must not let this continuation
        // create a new IntersectionObserver after ngOnDestroy already ran — nothing would ever
        // disconnect it.
        if (this.#destroyed) return;

        this.#reset();

        if (!isPlatformBrowser(this.#platformId) || disabled) return;

        this.#splitText();

        const isReduced = prefersReducedMotion(this.#documentRef);
        if (isReduced) return;

        this.#frames = resolveMoveFrames(presetOrFrames, 'enter');

        // Apply initial (invisible) state to each span directly — no player yet
        this.#spans.forEach((span) => {
          if (this.#frames) {
            applyInitialStyles(span, this.#frames);
          }
        });

        // Create player and animate only when visible
        this.#observer = new IntersectionObserver((entries) => {
          if (entries[0].isIntersecting) {
            this.#playAll({ duration, easing, delay, stagger, spring, disabled });
            this.#observer?.disconnect();
          }
        });

        this.#observer.observe(this.#host.nativeElement);
      });
    });
  }

  #playAll(options: {
    duration: number | undefined;
    easing: string | undefined;
    delay: number | undefined;
    stagger: number;
    spring: MoveSpring | undefined;
    disabled: boolean | undefined;
  }): void {
    if (!this.#frames) return;

    const baseDelay = options.delay ?? 0;

    this.#spans.forEach((span, index) => {
      if (!this.#frames) return;

      const config = resolveMovementConfig(
        this.#defaults,
        {
          duration: options.duration,
          easing: options.easing,
          delay: baseDelay + index * options.stagger,
          disabled: options.disabled,
        },
        false,
      );

      // Clear inline styles so WAAPI can animate from the keyframe starting point
      clearInitialStyles(span);

      const player = this.#engine.play(span, this.#frames!, {
        config,
        spring: options.spring,
        // The engine keys off this flag, not `config.disabled` — a hardcoded `false` here would
        // silently ignore `MOVEMENT_CONFIG.disabled` (the app-wide kill switch).
        disabled: config.disabled,
      });

      if (player) {
        this.#players.push(player);
      }
    });
  }

  #splitText() {
    const el = this.#host.nativeElement;
    const text = (el.textContent ?? '').trim();
    this.#originalText = text;

    // Clear existing content safely via Renderer2
    while (el.firstChild) {
      this.#renderer.removeChild(el, el.firstChild);
    }
    this.#renderer.setAttribute(el, 'aria-label', text);

    const byChars = this.moveTextSplit() === 'chars';

    if (byChars) {
      // Split character by character, preserving spaces as text nodes
      [...text].forEach((char) => {
        if (char === ' ') {
          this.#renderer.appendChild(el, this.#documentRef.createTextNode(' '));
          return;
        }
        const span = this.#renderer.createElement('span');
        this.#renderer.setAttribute(span, 'aria-hidden', 'true');
        this.#renderer.setStyle(span, 'display', 'inline-block');
        this.#renderer.setProperty(span, 'textContent', char);
        this.#renderer.appendChild(el, span);
        this.#spans.push(span as HTMLElement);
      });
    } else {
      // Split word by word
      const words = text.split(/\s+/);
      words.forEach((word: string, index: number) => {
        const span = this.#renderer.createElement('span');
        this.#renderer.setAttribute(span, 'aria-hidden', 'true');
        this.#renderer.setStyle(span, 'display', 'inline-block');
        this.#renderer.setStyle(span, 'white-space', 'pre');
        this.#renderer.setProperty(
          span,
          'textContent',
          index < words.length - 1 ? word + ' ' : word,
        );
        this.#renderer.appendChild(el, span);
        this.#spans.push(span as HTMLElement);
      });
    }
  }

  #reset(): void {
    this.#observer?.disconnect();
    this.#observer = null;
    this.#players.forEach((p) => p.cancel());
    this.#players = [];

    // Restore original text content so a re-split starts from clean source text.
    const el = this.#host.nativeElement;
    if (this.#spans.length > 0) {
      while (el.firstChild) {
        this.#renderer.removeChild(el, el.firstChild);
      }
      this.#renderer.appendChild(el, this.#documentRef.createTextNode(this.#originalText));
      this.#renderer.removeAttribute(el, 'aria-label');
    }

    this.#spans = [];
    this.#frames = null;
  }

  ngOnDestroy(): void {
    this.#destroyed = true;
    this.#observer?.disconnect();
    this.#players.forEach((p) => p.cancel());
    this.#players = [];
    this.#spans = [];
  }
}
