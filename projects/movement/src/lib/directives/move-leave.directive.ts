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
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';

@Directive({
  selector: '[moveLeave]',
})
export class MoveLeaveDirective implements OnDestroy, OnInit, MovePresenceChild {
  readonly moveLeave = input<MovePreset | MoveKeyframes>('none');
  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  private readonly defaults = inject(MOVEMENT_CONFIG);
  private readonly documentRef = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly engine = inject(AnimationEngine);
  private readonly presence = inject(MOVE_PRESENCE_PARENT, { optional: true });

  private config = this.defaults;
  private player: AnimationControls | null = null;

  ngOnInit(): void {
    this.presence?.register(this);

    this.config = resolveMovementConfig(
      this.defaults,
      {
        duration: this.moveDuration(),
        easing: this.moveEasing(),
        delay: this.moveDelay(),
        disabled: this.moveDisabled(),
      },
      prefersReducedMotion(this.documentRef),
    );
  }

  ngOnDestroy(): void {
    this.presence?.unregister(this);
    this.player?.cancel();
  }

  playLeave(): Promise<void> {
    if (this.config.disabled) {
      return Promise.resolve();
    }

    this.player = this.engine.play(
      this.host.nativeElement,
      resolveMoveFrames(this.moveLeave(), 'leave'),
      {
        config: this.config,
        spring: this.moveSpring(),
        disabled: false
      }
    );

    return this.player?.finished ?? Promise.resolve();
  }
}
