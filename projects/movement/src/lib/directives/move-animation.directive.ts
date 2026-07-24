import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MoveAnimationConfig, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  optionalBooleanAttribute,
  optionalNumberAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
  statesToKeyframes,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_STAGGER_PARENT } from '../tokens/stagger.tokens';
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';

@Directive({
  selector: '[moveAnimation]',
})
export class MoveAnimationDirective implements OnInit, OnDestroy, MovePresenceChild {
  readonly moveAnimation = input.required<MoveAnimationConfig>();
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
  readonly #presence = inject(MOVE_PRESENCE_PARENT, { optional: true });

  #config = this.#defaults;
  #enterPlayer: AnimationControls | null = null;
  #leavePlayer: AnimationControls | null = null;

  ngOnInit(): void {
    this.#stagger?.register(this.#host.nativeElement);
    this.#presence?.register(this);

    Promise.resolve().then(() => {
      const cfg = this.moveAnimation();
      const staggerDelay = this.#stagger?.getDelay(this.#host.nativeElement) ?? 0;

      this.#config = resolveMovementConfig(
        this.#defaults,
        {
          duration: this.moveDuration() ?? cfg.duration,
          easing: this.moveEasing() ?? cfg.easing,
          delay: (this.moveDelay() ?? cfg.delay ?? 0) + staggerDelay,
          disabled: this.moveDisabled(),
        },
        prefersReducedMotion(this.#documentRef),
      );

      if (!cfg.initial || !cfg.animate) return;

      const frames = statesToKeyframes(cfg.initial, cfg.animate);
      if (Object.keys(frames).length === 0) return;

      this.#enterPlayer = this.#engine.play(this.#host.nativeElement, frames, {
        config: this.#config,
        spring: this.moveSpring() ?? cfg.spring,
        disabled: this.#config.disabled,
      });
    });
  }

  ngOnDestroy(): void {
    this.#stagger?.unregister(this.#host.nativeElement);
    this.#presence?.unregister(this);
    this.#enterPlayer?.cancel();
    this.#leavePlayer?.cancel();
  }

  playLeave(): Promise<void> {
    const cfg = this.moveAnimation();

    if (this.#config.disabled || !cfg.exit || !cfg.animate) {
      return Promise.resolve();
    }

    this.#enterPlayer?.cancel();

    const frames = statesToKeyframes(cfg.animate, cfg.exit);
    if (Object.keys(frames).length === 0) return Promise.resolve();

    this.#leavePlayer = this.#engine.play(this.#host.nativeElement, frames, {
      config: this.#config,
      spring: this.moveSpring() ?? cfg.spring,
      disabled: false,
    });

    return this.#leavePlayer?.finished ?? Promise.resolve();
  }

  cancelLeave(): void {
    this.#leavePlayer?.cancel();
    this.#leavePlayer = null;
  }
}
