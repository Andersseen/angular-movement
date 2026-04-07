import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
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
  selector: '[moveWhileTap]',
  host: {
    '(pointerdown)': 'onPointerDown()',
    '(pointerup)': 'onPointerUp()',
    '(pointercancel)': 'onPointerUp()',
    '(pointerleave)': 'onPointerUp()',
  },
})
export class MoveTapDirective implements OnDestroy {
  readonly moveWhileTap = input.required<MovePreset | MoveKeyframes>();
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
  #isTapped = false;

  onPointerDown() {
    if (this.#isTapped) return;
    this.#isTapped = true;
    this.play(false);
  }

  onPointerUp() {
    if (!this.#isTapped) return;
    this.#isTapped = false;
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

    let frames = resolveMoveFrames(this.moveWhileTap(), 'enter');
    if (reverse) {
      frames = this.reverseFrames(frames);
    }

    this.#currentPlayer = this.#engine.play(this.#host.nativeElement, frames, {
      config,
      spring: this.moveSpring(),
      disabled: false,
    });
  }

  private reverseFrames(frames: MoveKeyframes): MoveKeyframes {
    const reversed: MoveKeyframes = {};
    for (const key in frames) {
      const k = key as keyof MoveKeyframes;
      const arr = frames[k];
      if (arr) {
        reversed[k] = [...arr].reverse();
      }
    }
    return reversed;
  }

  ngOnDestroy(): void {
    this.#currentPlayer?.cancel();
  }
}
