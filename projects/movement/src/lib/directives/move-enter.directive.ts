import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  optionalBooleanAttribute,
  optionalNumberAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_STAGGER_PARENT } from '../tokens/stagger.tokens';

/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Directive({
  selector: '[moveEnter]',
})
export class MoveEnterDirective implements OnDestroy, OnInit {
  readonly moveEnter = input<MovePreset | MoveKeyframes>('none');
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
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  readonly #stagger = inject(MOVE_STAGGER_PARENT, { optional: true });

  #player: AnimationControls | null = null;

  ngOnInit(): void {
    this.#stagger?.register(this.#host.nativeElement);

    Promise.resolve().then(() => {
      const staggerDelay = this.#stagger?.getDelay(this.#host.nativeElement) ?? 0;

      const config = resolveMovementConfig(
        this.#defaults,
        {
          duration: this.moveDuration(),
          easing: this.moveEasing(),
          delay: (this.moveDelay() ?? 0) + staggerDelay,
          disabled: this.moveDisabled(),
        },
        prefersReducedMotion(this.#documentRef),
      );

      this.#player = this.#engine.play(
        this.#host.nativeElement,
        resolveMoveFrames(this.moveEnter(), 'enter'),
        {
          config: config,
          spring: this.moveSpring(),
          disabled: config.disabled,
        },
      );
    });
  }

  ngOnDestroy(): void {
    this.#stagger?.unregister(this.#host.nativeElement);
    this.#player?.cancel();
  }
}
