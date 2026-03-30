import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
} from '@angular/core';
import { MoveKeyframes, MovePreset, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_STAGGER_PARENT } from '../tokens/stagger.tokens';
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';

@Directive({
  selector: '[move],[moveAnimate]',
})
export class MoveAnimateDirective implements OnDestroy, OnInit, MovePresenceChild {
  readonly move = input<MovePreset | MoveKeyframes | undefined>(undefined);
  readonly moveAnimate = input<MovePreset | MoveKeyframes | undefined>(undefined);
  readonly moveAnimateLeave = input<MovePreset | MoveKeyframes | undefined>(undefined);
  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  private readonly defaults = inject(MOVEMENT_CONFIG);
  private readonly documentRef = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly engine = inject(AnimationEngine);
  private readonly stagger = inject(MOVE_STAGGER_PARENT, { optional: true });
  private readonly presence = inject(MOVE_PRESENCE_PARENT, { optional: true });

  private config = this.defaults;
  private enterPlayer: AnimationControls | null = null;
  private leavePlayer: AnimationControls | null = null;

  ngOnInit(): void {
    this.stagger?.register(this.host.nativeElement);
    this.presence?.register(this);

    Promise.resolve().then(() => {
      const staggerDelay = this.stagger?.getDelay(this.host.nativeElement) ?? 0;

      this.config = resolveMovementConfig(
        this.defaults,
        {
          duration: this.moveDuration(),
          easing: this.moveEasing(),
          delay: (this.moveDelay() ?? 0) + staggerDelay,
          disabled: this.moveDisabled(),
        },
        prefersReducedMotion(this.documentRef),
      );

      const enterInput = this.resolveEnterInput();
      this.enterPlayer = this.engine.play(
        this.host.nativeElement,
        resolveMoveFrames(enterInput, 'enter'),
        {
          config: this.config,
          spring: this.moveSpring(),
          disabled: this.config.disabled
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.stagger?.unregister(this.host.nativeElement);
    this.presence?.unregister(this);
    this.enterPlayer?.cancel();
    this.leavePlayer?.cancel();
  }

  playLeave(): Promise<void> {
    if (this.config.disabled) {
      return Promise.resolve();
    }

    this.enterPlayer?.cancel();

    this.leavePlayer = this.engine.play(
      this.host.nativeElement,
      resolveMoveFrames(this.resolveLeaveInput(), 'leave'),
      {
        config: this.config,
        spring: this.moveSpring(),
        disabled: false
      }
    );

    return this.leavePlayer?.finished ?? Promise.resolve();
  }

  private resolveEnterInput(): MovePreset | MoveKeyframes {
    return this.moveAnimate() ?? this.move() ?? 'none';
  }

  private resolveLeaveInput(): MovePreset | MoveKeyframes {
    return this.moveAnimateLeave() ?? this.resolveEnterInput();
  }
}
