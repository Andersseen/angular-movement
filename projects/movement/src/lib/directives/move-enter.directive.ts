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
  playMoveAnimation,
  prefersReducedMotion,
  resolveMovementConfig,
  resolveMoveFrames,
} from './move-animation.utils';

@Directive({
  selector: '[moveEnter]',
})
export class MoveEnterDirective implements OnDestroy, OnInit {
  readonly moveEnter = input<MovePreset | MoveKeyframes>('none');
  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);

  private readonly defaults = inject(MOVEMENT_CONFIG);
  private readonly documentRef = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly platformId = inject(PLATFORM_ID);

  private player: Animation | null = null;

  ngOnInit(): void {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const config = resolveMovementConfig(
      this.defaults,
      {
        duration: this.moveDuration(),
        easing: this.moveEasing(),
        delay: this.moveDelay(),
        disabled: this.moveDisabled(),
      },
      prefersReducedMotion(this.documentRef),
    );

    this.player = playMoveAnimation(
      this.host.nativeElement,
      resolveMoveFrames(this.moveEnter(), 'enter'),
      config,
    );
  }

  ngOnDestroy(): void {
    this.player?.cancel();
  }
}
