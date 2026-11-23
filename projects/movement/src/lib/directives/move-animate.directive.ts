import { DOCUMENT } from '@angular/common';
import { Directive, ElementRef, inject, input, OnDestroy, OnInit, Injector } from '@angular/core';
import { MoveKeyframes, MoveKeyframeState, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  afterLeaveBindings,
  isMovePresetOrKeyframes,
  isMoveState,
  optionalBooleanAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
  statesToKeyframes,
} from './move-animation.utils';
import { optionalTimeAttribute } from '../move-time';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_STAGGER_PARENT } from '../tokens/stagger.tokens';
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';
import { MOVE_VARIANTS_PARENT } from '../tokens/variants.tokens';
import { warnOnChangeAfterPlay } from '../dev-warn';

/**
 * Plays an entrance when the element is created and, inside `*movePresence`, a leave before it is
 * removed — the one-attribute `[move]` / `[moveAnimate]` shorthand.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Directive({
  selector: '[move],[moveAnimate]',
})
export class MoveAnimateDirective implements OnDestroy, OnInit, MovePresenceChild {
  readonly move = input<MovePreset | MoveKeyframes | undefined>(undefined);
  readonly moveAnimate = input<string | MoveKeyframes | MoveKeyframeState | undefined>(undefined);
  readonly moveInitial = input<MoveKeyframeState | undefined>(undefined);
  readonly moveExit = input<MoveKeyframeState | undefined>(undefined);
  readonly moveAnimateLeave = input<MovePreset | MoveKeyframes | undefined>(undefined);
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
  readonly #injector = inject(Injector);
  readonly #stagger = inject(MOVE_STAGGER_PARENT, { optional: true });
  readonly #presence = inject(MOVE_PRESENCE_PARENT, { optional: true });
  readonly #variantsParent = inject(MOVE_VARIANTS_PARENT, { optional: true, self: true });

  #config = this.#defaults;
  #enterPlayer: AnimationControls | null = null;
  #leavePlayer: AnimationControls | null = null;
  /** Bumped by every leave, cancel and destroy so a deferred leave can tell it is stale. */
  #leaveToken = 0;
  #played = false;

  ngOnInit(): void {
    // Only the entrance is one-shot. `moveDisabled` and the exit inputs are read when the element
    // leaves, so changing them is legitimate and must not warn.
    warnOnChangeAfterPlay(
      this.#injector,
      'moveAnimate',
      () => [this.move(), this.moveAnimate(), this.moveInitial()],
      () => this.#played,
    );

    // If moveVariants is on the same host, let it handle animation. Do not
    // register with stagger/presence so we don't create no-op entries.
    if (this.#variantsParent) {
      return;
    }

    this.#stagger?.register(this.#host.nativeElement);
    this.#presence?.register(this);

    Promise.resolve().then(() => {
      const staggerDelay = this.#stagger?.getDelay(this.#host.nativeElement) ?? 0;
      this.#played = true;

      this.#config = resolveMovementConfig(
        this.#defaults,
        {
          duration: this.moveDuration(),
          easing: this.moveEasing(),
          delay: (this.moveDelay() ?? 0) + staggerDelay,
          disabled: this.moveDisabled(),
        },
        prefersReducedMotion(this.#documentRef),
      );

      const frames = this.resolveEnterFrames();
      if (!frames) return;

      this.#enterPlayer = this.#engine.play(this.#host.nativeElement, frames, {
        config: this.#config,
        spring: this.moveSpring(),
        disabled: this.#config.disabled,
      });
    });
  }

  ngOnDestroy(): void {
    this.#leaveToken += 1;
    this.#stagger?.unregister(this.#host.nativeElement);
    this.#presence?.unregister(this);
    this.#enterPlayer?.cancel();
    this.#leavePlayer?.cancel();
  }

  playLeave(): Promise<void> {
    if (this.#variantsParent) {
      return Promise.resolve();
    }

    const token = ++this.#leaveToken;

    // See `afterLeaveBindings`: `moveDisabled` is read as it is when the item leaves, not as it was
    // when it entered, so `[moveDisabled]="!changed()"` can skip a hydrated entrance and still exit.
    return afterLeaveBindings().then(() => {
      if (token !== this.#leaveToken) return;

      const disabled =
        prefersReducedMotion(this.#documentRef) || (this.moveDisabled() ?? this.#defaults.disabled);
      if (disabled) return;

      this.#enterPlayer?.cancel();

      const frames = this.resolveLeaveFrames();
      if (!frames) return;

      this.#leavePlayer = this.#engine.play(this.#host.nativeElement, frames, {
        config: { ...this.#config, disabled: false },
        spring: this.moveSpring(),
        disabled: false,
      });

      return this.#leavePlayer?.finished;
    });
  }

  cancelLeave(): void {
    this.#leaveToken += 1;
    this.#leavePlayer?.cancel();
    this.#leavePlayer = null;
  }

  private resolveEnterFrames(): MoveKeyframes | null {
    const initial = this.moveInitial();
    const animate = this.moveAnimate();

    if (initial && isMoveState(animate)) {
      const frames = statesToKeyframes(initial, animate);
      return Object.keys(frames).length > 0 ? frames : null;
    }

    return resolveMoveFrames(this.resolveEnterInput(), 'enter');
  }

  private resolveLeaveFrames(): MoveKeyframes | null {
    const exit = this.moveExit();
    const animate = this.moveAnimate();

    if (exit && isMoveState(animate)) {
      const frames = statesToKeyframes(animate, exit);
      return Object.keys(frames).length > 0 ? frames : null;
    }

    return resolveMoveFrames(this.resolveLeaveInput(), 'leave');
  }

  private resolveEnterInput(): MovePreset | MoveKeyframes {
    const animate = this.moveAnimate();
    if (animate !== undefined && isMovePresetOrKeyframes(animate)) return animate;
    return this.move() ?? 'none';
  }

  private resolveLeaveInput(): MovePreset | MoveKeyframes {
    return this.moveAnimateLeave() ?? this.resolveEnterInput();
  }
}
