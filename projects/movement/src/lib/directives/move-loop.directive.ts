import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
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
  selector: '[moveLoop]',
})
export class MoveLoopDirective implements OnDestroy, OnInit {
  readonly moveLoop = input<MovePreset | MoveKeyframes>('none');
  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);

  #player: AnimationControls | null = null;

  ngOnInit(): void {
    const frames = resolveMoveFrames(this.moveLoop(), 'loop');

    // Skip noop presets to avoid creating an infinite animation that does nothing
    if (this.moveLoop() === 'none' || Object.keys(frames).length === 0) {
      return;
    }

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

    this.#player = this.#engine.play(this.#host.nativeElement, frames, {
      config,
      spring: this.moveSpring(),
      disabled: config.disabled,
      iterations: Infinity,
    });
  }

  ngOnDestroy(): void {
    this.#player?.cancel();
  }
}
