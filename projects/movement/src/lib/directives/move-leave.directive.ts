import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy, OnInit } from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  afterLeaveBindings,
  optionalBooleanAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';
import { optionalTimeAttribute } from '../move-time';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';

/**
 * Plays a preset or keyframes before the element is removed; inside `*movePresence` the view waits
 * for it to finish.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Directive({
  selector: '[moveLeave]',
})
export class MoveLeaveDirective implements OnDestroy, OnInit, MovePresenceChild {
  readonly moveLeave = input<MovePreset | MoveKeyframes>('none');
  readonly moveDuration = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveDuration'),
  });
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined, unknown>(undefined, {
    transform: optionalTimeAttribute('moveDelay'),
  });
  readonly moveDisabled = input<boolean | undefined, unknown>(undefined, {
    transform: optionalBooleanAttribute,
  });
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  readonly #presence = inject(MOVE_PRESENCE_PARENT, { optional: true });

  #player: AnimationControls | null = null;
  /** Bumped by every leave, cancel and destroy so a deferred leave can tell it is stale. */
  #leaveToken = 0;

  ngOnInit(): void {
    this.#presence?.register(this);
  }

  ngOnDestroy(): void {
    this.#leaveToken += 1;
    this.#presence?.unregister(this);
    this.#player?.cancel();
  }

  playLeave(): Promise<void> {
    const token = ++this.#leaveToken;

    // See `afterLeaveBindings`: the inputs are read once the leaving view has been refreshed.
    return afterLeaveBindings().then(() => {
      if (token !== this.#leaveToken) return;

      const config = resolveMovementConfig(
        this.#defaults,
        {
          duration: this.moveDuration(),
          easing: this.moveEasing(),
          delay: this.moveDelay(),
          disabled: this.moveDisabled(),
        },
        prefersReducedMotion(this.#documentRef),
      );
      if (config.disabled) return;

      this.#player = this.#engine.play(
        this.#host.nativeElement,
        resolveMoveFrames(this.moveLeave(), 'leave'),
        {
          config,
          spring: this.moveSpring(),
          disabled: false,
        },
      );

      return this.#player?.finished;
    });
  }

  cancelLeave(): void {
    this.#leaveToken += 1;
    this.#player?.cancel();
    this.#player = null;
  }
}
