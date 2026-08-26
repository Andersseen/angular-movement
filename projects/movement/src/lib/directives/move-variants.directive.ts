import {
  Directive,
  ElementRef,
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
  MoveTransitionConfig,
  MoveValue,
  MoveVariant,
} from '../presets/presets.types';
import { compareDocumentOrder } from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MovementConfig, MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import {
  optionalBooleanAttribute,
  optionalNumberAttribute,
  prefersReducedMotion,
  resolveMovementConfig,
} from './move-animation.utils';
import { AnimationControls } from '../engines/animation-controls';
import { MOVE_STAGGER_PARENT } from '../tokens/stagger.tokens';
import { MOVE_PRESENCE_PARENT, MovePresenceChild } from '../tokens/presence.tokens';
import { MOVE_VARIANTS_PARENT, MoveVariantsProvider } from '../tokens/variants.tokens';

@Directive({
  selector: '[moveVariants]',
  providers: [
    {
      provide: MOVE_VARIANTS_PARENT,
      useExisting: forwardRef(() => MoveVariantsDirective),
    },
  ],
})
export class MoveVariantsDirective implements MoveVariantsProvider, MovePresenceChild, OnDestroy {
  readonly moveVariants = input.required<Record<string, MoveVariant>>();
  /** Active variant name. Prefer `moveVariant`; `moveActiveVariant` is an alias. */
  readonly moveVariant = input<string | undefined>(undefined);
  readonly moveActiveVariant = input<string | undefined>(undefined);
  readonly moveExitVariant = input<string | undefined>(undefined);

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
  readonly moveTransition = input<MoveTransitionConfig | undefined>(undefined);

  readonly #parent = inject(MOVE_VARIANTS_PARENT, { optional: true, skipSelf: true });
  readonly #engine = inject(AnimationEngine);
  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #stagger = inject(MOVE_STAGGER_PARENT, { optional: true });
  readonly #presence = inject(MOVE_PRESENCE_PARENT, { optional: true });

  #currentPlayer: AnimationControls | null = null;
  #config: MovementConfig = this.#defaults;
  #isReducedMotion = false;
  #previousState: Record<string, MoveStateValue | undefined> | null = null;
  readonly #orchestratedChildren = new Set<HTMLElement>();

  readonly activeVariant = computed(() => {
    return this.moveVariant() ?? this.moveActiveVariant() ?? this.#parent?.activeVariant();
  });

  constructor() {
    this.#isReducedMotion = prefersReducedMotion(this.#documentRef);
    this.#stagger?.register(this.#host.nativeElement);
    this.#presence?.register(this);
    this.#parent?.registerChild?.(this.#host.nativeElement);

    effect(() => {
      const variantName = this.activeVariant();
      if (!variantName) return;

      this.#currentPlayer?.cancel();
      this.#currentPlayer = this.#playVariant(variantName);
    });
  }

  ngOnDestroy(): void {
    this.#stagger?.unregister(this.#host.nativeElement);
    this.#presence?.unregister(this);
    this.#parent?.unregisterChild?.(this.#host.nativeElement);
    this.#currentPlayer?.cancel();
  }

  registerChild(element: HTMLElement): void {
    this.#orchestratedChildren.add(element);
  }

  unregisterChild(element: HTMLElement): void {
    this.#orchestratedChildren.delete(element);
  }

  /**
   * Orchestration delay for one nested `[moveVariants]` child, from this element's active variant.
   *
   * `beforeChildren` offsets the children by the parent's own duration. Children are assumed to
   * share that duration unless they override it — there is no way to know a child's duration from
   * here, and guessing one number is more useful than refusing to orchestrate at all.
   */
  childDelay(element: HTMLElement): number {
    const variantName = this.activeVariant();
    if (!variantName) return 0;

    const variant = this.moveVariants()?.[variantName];
    if (!variant) return 0;

    const stagger = variant.staggerChildren ?? 0;
    const base = variant.delayChildren ?? 0;
    if (stagger === 0 && base === 0 && variant.when !== 'beforeChildren') return 0;

    const index = this.#childIndex(element);
    const lead =
      variant.when === 'beforeChildren' ? (variant.duration ?? this.#config.duration) : 0;

    return base + lead + index * stagger;
  }

  #childIndex(element: HTMLElement): number {
    const ordered = Array.from(this.#orchestratedChildren).sort(compareDocumentOrder);
    const index = ordered.indexOf(element);
    return index === -1 ? 0 : index;
  }

  /** How long the whole child stagger takes, used by `when: 'afterChildren'`. */
  #childrenSpan(variant: MoveVariant): number {
    const stagger = variant.staggerChildren ?? 0;
    const base = variant.delayChildren ?? 0;
    const count = this.#orchestratedChildren.size;
    const lastStart = count > 1 ? (count - 1) * stagger : 0;

    return base + lastStart + (variant.duration ?? this.#defaults.duration);
  }

  playLeave(): Promise<void> {
    const exitVariant = this.moveExitVariant();
    if (this.#config.disabled || !exitVariant) {
      return Promise.resolve();
    }

    this.#currentPlayer?.cancel();
    this.#currentPlayer = this.#playVariant(exitVariant);
    return this.#currentPlayer?.finished ?? Promise.resolve();
  }

  cancelLeave(): void {
    this.#currentPlayer?.cancel();
    this.#currentPlayer = null;
  }

  #playVariant(variantName: string): AnimationControls | null {
    const variants = this.moveVariants();
    if (!variants) return null;

    const state = variants[variantName];
    if (!state) return null;

    const { spring, duration, easing, delay, transition, when, ...keyframesMap } = state;
    const stateValues = pickStateValues(keyframesMap);
    const keyframes = stateToKeyframes(stateValues, this.#previousState);
    this.#previousState = stateValues;

    const staggerDelay = this.#stagger?.getDelay(this.#host.nativeElement) ?? 0;
    const orchestrationDelay = this.#parent?.childDelay?.(this.#host.nativeElement) ?? 0;
    const afterChildrenDelay = when === 'afterChildren' ? this.#childrenSpan(state) : 0;

    this.#config = resolveMovementConfig(
      this.#defaults,
      {
        duration: duration ?? this.moveDuration(),
        easing: easing ?? this.moveEasing(),
        delay:
          (delay ?? this.moveDelay() ?? 0) + staggerDelay + orchestrationDelay + afterChildrenDelay,
        disabled: this.moveDisabled(),
      },
      this.#isReducedMotion,
    );

    return this.#engine.play(this.#host.nativeElement, keyframes, {
      config: this.#config,
      spring: spring ?? this.moveSpring(),
      disabled: this.#config.disabled,
      transition: transition ?? this.moveTransition(),
    });
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

/**
 * Variant keys that configure orchestration rather than describe a value to animate.
 *
 * `pickStateValues` keeps every number it finds, so without this `staggerChildren: 60` would be
 * handed to the engine as a CSS property.
 */
const ORCHESTRATION_KEYS = new Set(['staggerChildren', 'delayChildren', 'when']);

function pickStateValues(
  state: Record<string, unknown>,
): Record<string, MoveStateValue | undefined> {
  const result: Record<string, MoveStateValue | undefined> = {};

  for (const key of Object.keys(state)) {
    if (ORCHESTRATION_KEYS.has(key)) continue;
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
