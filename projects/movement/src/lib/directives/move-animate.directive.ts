import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { MoveKeyframes, MovePreset } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  createLeaveClone,
  playMoveAnimation,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';

@Directive({
  selector: '[move],[moveAnimate]',
})
export class MoveAnimateDirective implements OnDestroy, OnInit {
  readonly move = input<MovePreset | MoveKeyframes | undefined>(undefined);
  readonly moveAnimate = input<MovePreset | MoveKeyframes | undefined>(undefined);
  readonly moveAnimateLeave = input<MovePreset | MoveKeyframes | undefined>(undefined);
  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);

  private readonly defaults = inject(MOVEMENT_CONFIG);
  private readonly documentRef = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  private config = this.defaults;
  private enterPlayer: Animation | null = null;
  private leavePlayer: Animation | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

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

    const enterInput = this.resolveEnterInput();
    this.enterPlayer = playMoveAnimation(
      this.host.nativeElement,
      resolveMoveFrames(enterInput, 'enter'),
      this.config,
    );
  }

  ngOnDestroy(): void {
    this.enterPlayer?.cancel();
    this.leavePlayer?.cancel();

    if (!isPlatformBrowser(this.platformId) || this.config.disabled) {
      return;
    }

    const cloned = createLeaveClone(this.documentRef, this.host.nativeElement);
    if (!cloned) {
      return;
    }

    this.leavePlayer = playMoveAnimation(
      cloned,
      resolveMoveFrames(this.resolveLeaveInput(), 'leave'),
      this.config,
      () => cloned.remove(),
    );
  }

  private resolveEnterInput(): MovePreset | MoveKeyframes {
    return this.moveAnimate() ?? this.move() ?? 'none';
  }

  private resolveLeaveInput(): MovePreset | MoveKeyframes {
    return this.moveAnimateLeave() ?? this.resolveEnterInput();
  }
}
