import {
  Directive,
  ElementRef,
  InjectionToken,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MoveKeyframes, MoveSpring, MoveVariant } from '../presets/presets.types';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import { prefersReducedMotion, resolveMovementConfig } from './move-animation.utils';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_STAGGER_PARENT } from '../tokens/stagger.tokens';

export interface MoveVariantsProvider {
  activeVariant: () => string | undefined;
}

export const MOVE_VARIANTS_PARENT = new InjectionToken<MoveVariantsProvider>('MOVE_VARIANTS_PARENT');

@Directive({
  selector: '[moveVariants]',
  providers: [
    {
      provide: MOVE_VARIANTS_PARENT,
      useExisting: forwardRef(() => MoveVariantsDirective),
    },
  ],
})
export class MoveVariantsDirective implements MoveVariantsProvider, OnDestroy {
  readonly moveVariants = input.required<Record<string, MoveVariant>>();
  readonly moveAnimate = input<string | undefined>(undefined);

  readonly moveDuration = input<number | undefined>(undefined);
  readonly moveEasing = input<string | undefined>(undefined);
  readonly moveDelay = input<number | undefined>(undefined);
  readonly moveDisabled = input<boolean | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  private readonly parent = inject(MOVE_VARIANTS_PARENT, { optional: true, skipSelf: true });
  private readonly engine = inject(AnimationEngine);
  private readonly defaults = inject(MOVEMENT_CONFIG);
  private readonly documentRef = inject(DOCUMENT);
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly stagger = inject(MOVE_STAGGER_PARENT, { optional: true });

  private currentPlayer: AnimationControls | null = null;
  private isReducedMotion = false;

  readonly activeVariant = computed(() => {
    return this.moveAnimate() ?? this.parent?.activeVariant();
  });

  constructor() {
    this.isReducedMotion = prefersReducedMotion(this.documentRef);
    this.stagger?.register(this.host.nativeElement);

    effect(() => {
      const variantName = this.activeVariant();
      if (!variantName) return;

      const variants = this.moveVariants();
      if (!variants) return;

      const state = variants[variantName];
      if (!state) return;

      this.currentPlayer?.cancel();

      const { spring, duration, easing, delay, ...keyframesMap } = state;
      const keyframes = keyframesMap as MoveKeyframes;

      const staggerDelay = this.stagger?.getDelay(this.host.nativeElement) ?? 0;

      const config = resolveMovementConfig(
        this.defaults,
        {
          duration: duration ?? this.moveDuration(),
          easing: easing ?? this.moveEasing(),
          delay: (delay ?? this.moveDelay() ?? 0) + staggerDelay,
          disabled: this.moveDisabled(),
        },
        this.isReducedMotion,
      );

      this.currentPlayer = this.engine.play(
        this.host.nativeElement,
        keyframes,
        {
          config,
          spring: spring ?? this.moveSpring(),
          disabled: config.disabled,
        }
      );
    });
  }

  ngOnDestroy(): void {
    this.stagger?.unregister(this.host.nativeElement);
    this.currentPlayer?.cancel();
  }
}
