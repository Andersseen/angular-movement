import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MoveAnimationConfig, MoveKeyframes, MoveKeyframeState } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import { prefersReducedMotion, resolveMovementConfig } from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_STAGGER_PARENT } from '../tokens/stagger.tokens';
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';

@Directive({
  selector: '[moveAnimation]',
})
export class MoveAnimationDirective implements OnInit, OnDestroy, MovePresenceChild {
  readonly moveAnimation = input.required<MoveAnimationConfig>();

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
          duration: cfg.duration,
          easing: cfg.easing,
          delay: (cfg.delay ?? 0) + staggerDelay,
          disabled: undefined,
        },
        prefersReducedMotion(this.#documentRef),
      );

      if (!cfg.initial || !cfg.animate) return;

      const frames = statesToKeyframes(cfg.initial, cfg.animate);
      if (Object.keys(frames).length === 0) return;

      this.#enterPlayer = this.#engine.play(this.#host.nativeElement, frames, {
        config: this.#config,
        spring: cfg.spring,
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
      spring: cfg.spring,
      disabled: false,
    });

    return this.#leavePlayer?.finished ?? Promise.resolve();
  }
}

function statesToKeyframes(from: MoveKeyframeState, to: MoveKeyframeState): MoveKeyframes {
  const result: Partial<Record<keyof MoveKeyframes, readonly number[]>> = {};
  for (const key of Object.keys(from) as (keyof MoveKeyframeState)[]) {
    const f = from[key];
    const t = to[key];
    if (f !== undefined && t !== undefined) {
      result[key] = [f, t];
    }
  }
  return result as MoveKeyframes;
}
