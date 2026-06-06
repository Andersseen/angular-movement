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
import {
  MoveKeyframes,
  MoveSpring,
  MoveStateValue,
  MoveValue,
  MoveVariant,
} from '../presets/presets.types';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import { prefersReducedMotion, resolveMovementConfig } from './move-animation.utils';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_STAGGER_PARENT } from '../tokens/stagger.tokens';

export interface MoveVariantsProvider {
  activeVariant: () => string | undefined;
}

export const MOVE_VARIANTS_PARENT = new InjectionToken<MoveVariantsProvider>(
  'MOVE_VARIANTS_PARENT',
);

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

  readonly #parent = inject(MOVE_VARIANTS_PARENT, { optional: true, skipSelf: true });
  readonly #engine = inject(AnimationEngine);
  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #stagger = inject(MOVE_STAGGER_PARENT, { optional: true });

  #currentPlayer: AnimationControls | null = null;
  #isReducedMotion = false;
  #previousState: Record<string, MoveStateValue | undefined> | null = null;

  readonly activeVariant = computed(() => {
    return this.moveAnimate() ?? this.#parent?.activeVariant();
  });

  constructor() {
    this.#isReducedMotion = prefersReducedMotion(this.#documentRef);
    this.#stagger?.register(this.#host.nativeElement);

    effect(() => {
      const variantName = this.activeVariant();
      if (!variantName) return;

      const variants = this.moveVariants();
      if (!variants) return;

      const state = variants[variantName];
      if (!state) return;

      this.#currentPlayer?.cancel();

      const { spring, duration, easing, delay, transition, ...keyframesMap } = state;
      const stateValues = pickStateValues(keyframesMap);
      const keyframes = stateToKeyframes(stateValues, this.#previousState);
      this.#previousState = stateValues;

      const staggerDelay = this.#stagger?.getDelay(this.#host.nativeElement) ?? 0;

      const config = resolveMovementConfig(
        this.#defaults,
        {
          duration: duration ?? this.moveDuration(),
          easing: easing ?? this.moveEasing(),
          delay: (delay ?? this.moveDelay() ?? 0) + staggerDelay,
          disabled: this.moveDisabled(),
        },
        this.#isReducedMotion,
      );

      this.#currentPlayer = this.#engine.play(this.#host.nativeElement, keyframes, {
        config,
        spring: spring ?? this.moveSpring(),
        disabled: config.disabled,
        transition,
      });
    });
  }

  ngOnDestroy(): void {
    this.#stagger?.unregister(this.#host.nativeElement);
    this.#currentPlayer?.cancel();
  }
}

function stateToKeyframes(
  state: Record<string, MoveStateValue | undefined>,
  previousState: Record<string, MoveStateValue | undefined> | null,
): MoveKeyframes {
  const keyframes: MoveKeyframes = {};

  for (const key of Object.keys(state)) {
    const value = state[key];
    if (value === undefined) continue;

    if (Array.isArray(value)) {
      keyframes[key] = value;
      continue;
    }

    const previousValue = previousState ? previousState[key] : undefined;
    const from = resolvePreviousScalar(previousValue, value as MoveValue);
    keyframes[key] = [from, value];
  }

  return keyframes;
}

function pickStateValues(
  state: Record<string, unknown>,
): Record<string, MoveStateValue | undefined> {
  const result: Record<string, MoveStateValue | undefined> = {};

  for (const key of Object.keys(state)) {
    const value = state[key];
    if (
      value === undefined ||
      typeof value === 'number' ||
      typeof value === 'string' ||
      Array.isArray(value)
    ) {
      result[key] = value as MoveStateValue | undefined;
    }
  }

  return result;
}

function resolvePreviousScalar(previousValue: MoveStateValue | undefined, fallback: MoveValue) {
  if (Array.isArray(previousValue)) {
    return previousValue[previousValue.length - 1] ?? fallback;
  }

  return previousValue ?? fallback;
}
