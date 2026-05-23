import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  clearComposedStyle,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
  reverseFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

function optionalNumberAttribute(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }
  return Number(value);
}

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
  readonly moveDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);
  readonly moveReverseDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalNumberAttribute,
  });
  readonly moveReverseEasing = input<string | undefined>(undefined);

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
      const reverseDuration = this.moveReverseDuration();
      if (reverseDuration === 0) {
        clearComposedStyle(this.#host.nativeElement, Object.keys(frames));
        return;
      }
      frames = reverseFrames(frames);
    }

    const reverseConfig = reverse
      ? resolveMovementConfig(
          { ...this.#defaults, duration: 200, easing: 'ease-out', delay: 0 },
          {
            duration: this.moveReverseDuration() ?? this.moveDuration(),
            easing: this.moveReverseEasing(),
            delay: 0,
          },
          isReduced,
        )
      : config;

    this.#currentPlayer = this.#engine.play(this.#host.nativeElement, frames, {
      config: reverseConfig,
      spring: this.moveSpring(),
      disabled: false,
    });
  }

  ngOnDestroy(): void {
    this.#currentPlayer?.cancel();
  }
}
