import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
  Renderer2,
} from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  applyInitialStyles,
  clearInitialStyles,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Directive({
  selector: '[moveText]',
})
export class MoveTextDirective implements OnDestroy, OnInit {
  readonly moveText = input<MovePreset | MoveKeyframes>('fade-up');
  readonly moveTextSplit = input<'chars' | 'words'>('chars');
  readonly moveTextStagger = input<number>(30);

  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
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

  ngOnInit(): void {
    if (!isPlatformBrowser(this.#platformId) || this.moveDisabled()) return;

    // Defer to after Angular has completed its first rendering pass and set
    // the interpolated text content on the host element (same pattern as moveEnter).
    Promise.resolve().then(() => {
      this.#splitText();

      const isReduced = prefersReducedMotion(this.#documentRef);
      if (isReduced) return;

      this.#frames = resolveMoveFrames(this.moveText(), 'enter');

      // Apply initial (invisible) state to each span directly — no player yet
      this.#spans.forEach((span) => {
        if (this.#frames) {
          applyInitialStyles(span, this.#frames);
        }
      });

      // Create player and animate only when visible
      this.#observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting) {
          this.#playAll();
          this.#observer?.disconnect();
        }
      });

      this.#observer.observe(this.#host.nativeElement);
    });
  }

  #playAll(): void {
    if (!this.#frames) return;

    const baseDelay = this.moveDelay() ?? 0;
    const stagger = this.moveTextStagger();

    this.#spans.forEach((span, index) => {
      if (!this.#frames) return;

      const config = resolveMovementConfig(
        this.#defaults,
        {
          duration: this.moveDuration(),
          easing: this.moveEasing(),
          delay: baseDelay + index * stagger,
          disabled: false,
        },
        false,
      );

      // Clear inline styles so WAAPI can animate from the keyframe starting point
      clearInitialStyles(span);

      const player = this.#engine.play(span, this.#frames!, {
        config,
        spring: this.moveSpring(),
        disabled: false,
      });

      if (player) {
        this.#players.push(player);
      }
    });
  }

  #splitText() {
    const el = this.#host.nativeElement;
    const text = (el.textContent ?? '').trim();

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

  ngOnDestroy(): void {
    this.#observer?.disconnect();
    this.#players.forEach((p) => p.cancel());
    this.#players = [];
    this.#spans = [];
  }
}
