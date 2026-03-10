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
  selector: '[moveLeave]',
})
export class MoveLeaveDirective implements OnDestroy, OnInit {
  readonly moveLeave = input<MovePreset | MoveKeyframes>('none');
  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);

  private readonly defaults = inject(MOVEMENT_CONFIG);
  private readonly documentRef = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  private config = this.defaults;
  private player: Animation | null = null;

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
  }

  ngOnDestroy(): void {
    this.player?.cancel();

    if (!isPlatformBrowser(this.platformId) || this.config.disabled) {
      return;
    }

    const cloned = createLeaveClone(this.documentRef, this.host.nativeElement);
    if (!cloned) {
      return;
    }

    this.player = playMoveAnimation(
      cloned,
      resolveMoveFrames(this.moveLeave(), 'leave'),
      this.config,
      () => cloned.remove(),
    );
  }
}
