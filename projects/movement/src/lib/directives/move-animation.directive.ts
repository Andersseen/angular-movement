import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, effect, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MoveAnimationConfig, MoveKeyframeState, MoveSpring } from '../presets/presets.types';
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

/**
 * Stable candidate — feature-complete, but naming or behaviour may still receive small adjustments before 1.0.
 *
 * @stability candidate
 */
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
  /** The last `animate` state acted on, and the origin of the next transition. */
  #previousAnimate: MoveKeyframeState | null = null;

  constructor() {
    effect(() => {
      const cfg = this.moveAnimation();

      // Read the config inputs so a change to any of them refreshes `#config`. It will not by
      // itself replay anything — only a changed `animate` state does that.
      this.moveDuration();
      this.moveEasing();
      this.moveDelay();
      this.moveDisabled();
      this.moveSpring();

      // Deferred so sibling directives have registered with the stagger parent before the delay
      // is read, matching what the enter animation did when it lived in ngOnInit.
      Promise.resolve().then(() => this.#applyAnimate(cfg));
    });
  }

  ngOnInit(): void {
    this.#stagger?.register(this.#host.nativeElement);
    this.#presence?.register(this);
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

  #applyAnimate(cfg: MoveAnimationConfig): void {
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

    const animate = cfg.animate;
    if (!animate) return;

    // Templates usually pass an object literal, which is a fresh reference on every change
    // detection pass. Comparing by value is what keeps that from replaying the animation
    // continuously now that this runs in an effect rather than once in ngOnInit.
    const changed = !this.#previousAnimate || !sameState(this.#previousAnimate, animate);
    const from = this.#previousAnimate ?? cfg.initial;

    this.#previousAnimate = animate;

    // Without `initial` there is nothing to animate *from* on the first render, so the element
    // simply starts at `animate`. A later change still animates, using the previous state.
    if (!changed || !from) return;

    const frames = statesToKeyframes(from, animate);
    if (Object.keys(frames).length === 0) return;

    this.#enterPlayer?.cancel();
    this.#enterPlayer = this.#engine.play(this.#host.nativeElement, frames, {
      config: this.#config,
      spring: this.moveSpring() ?? cfg.spring,
      disabled: this.#config.disabled,
    });
  }
}

/** Shallow value equality over the union of both states' keys. */
function sameState(a: MoveKeyframeState, b: MoveKeyframeState): boolean {
  if (a === b) return true;

  for (const key of new Set([...Object.keys(a), ...Object.keys(b)])) {
    if (a[key] !== b[key]) return false;
  }

  return true;
}
