import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
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
          this.#applyInitialStyles(span, this.#frames);
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
      this.#clearInitialStyles(span);

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

  #applyInitialStyles(el: HTMLElement, frames: MoveKeyframes): void {
    const getFirst = (arr: readonly number[] | undefined) =>
      arr && arr.length > 0 ? arr[0] : undefined;

    const opacity = getFirst(frames.opacity);
    if (opacity !== undefined) el.style.opacity = `${opacity}`;

    const x = getFirst(frames.x);
    const y = getFirst(frames.y);
    if (x !== undefined || y !== undefined) {
      el.style.translate = `${x ?? 0}px ${y ?? 0}px`;
    }

    const scale = getFirst(frames.scale);
    if (scale !== undefined) el.style.scale = `${scale}`;

    const rotateX = getFirst(frames.rotateX);
    const rotateY = getFirst(frames.rotateY);
    if (rotateX !== undefined || rotateY !== undefined) {
      el.style.transform = `perspective(1200px) rotateX(${rotateX ?? 0}deg) rotateY(${rotateY ?? 0}deg)`;
    }
  }

  #clearInitialStyles(el: HTMLElement): void {
    el.style.opacity = '';
    el.style.translate = '';
    el.style.scale = '';
    el.style.transform = '';
  }

  #splitText() {
    const el = this.#host.nativeElement;
    const text = (el.textContent ?? '').trim();
    el.innerHTML = '';
    el.setAttribute('aria-label', text);

    const byChars = this.moveTextSplit() === 'chars';

    if (byChars) {
      // Split character by character, preserving spaces as text nodes
      [...text].forEach((char) => {
        if (char === ' ') {
          el.appendChild(this.#documentRef.createTextNode(' '));
          return;
        }
        const span = this.#documentRef.createElement('span');
        span.setAttribute('aria-hidden', 'true');
        span.style.display = 'inline-block';
        span.textContent = char;
        el.appendChild(span);
        this.#spans.push(span);
      });
    } else {
      // Split word by word
      const words = text.split(/\s+/);
      words.forEach((word: string, index: number) => {
        const span = this.#documentRef.createElement('span');
        span.setAttribute('aria-hidden', 'true');
        span.style.display = 'inline-block';
        span.style.whiteSpace = 'pre';
        span.textContent = index < words.length - 1 ? word + ' ' : word;
        el.appendChild(span);
        this.#spans.push(span);
      });
    }
  }

  ngOnDestroy(): void {
    this.#observer?.disconnect();
    this.#players.forEach((p) => p.cancel());
  }
}
