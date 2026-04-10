import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
  reverseFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Directive({
  selector: '[moveWhileHover]',
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(touchstart)': 'onTouchStart($event)',
    '(touchend)': 'onTouchEnd()',
    '(touchcancel)': 'onTouchEnd()',
  },
})
export class MoveHoverDirective implements OnDestroy {
  readonly moveWhileHover = input.required<MovePreset | MoveKeyframes>();
  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);

  #currentPlayer: AnimationControls | null = null;
  #isHovered = false;

  onMouseEnter() {
    if (this.#isHovered) return;
    this.#isHovered = true;
    this.play(false);
  }

  onMouseLeave() {
    if (!this.#isHovered) return;
    this.#isHovered = false;
    this.play(true);
  }

  onTouchStart(event: TouchEvent) {
    event.preventDefault();
    if (this.#isHovered) return;
    this.#isHovered = true;
    this.play(false);
  }

  onTouchEnd() {
    if (!this.#isHovered) return;
    this.#isHovered = false;
    this.play(true);
  }

  private play(reverse: boolean) {
    this.#currentPlayer?.cancel();

    const isReduced = prefersReducedMotion(this.#documentRef);
    const config = resolveMovementConfig(
      this.#defaults,
      {
        duration: this.moveDuration(),
        easing: this.moveEasing(),
        delay: this.moveDelay(),
        disabled: this.moveDisabled(),
      },
      isReduced,
    );

    if (config.disabled) return;

    let frames = resolveMoveFrames(this.moveWhileHover(), 'enter');
    if (reverse) {
      frames = reverseFrames(frames);
    }

    this.#currentPlayer = this.#engine.play(this.#host.nativeElement, frames, {
      config,
      spring: this.moveSpring(),
      disabled: false,
    });
  }

  ngOnDestroy(): void {
    this.#currentPlayer?.cancel();
  }
}
