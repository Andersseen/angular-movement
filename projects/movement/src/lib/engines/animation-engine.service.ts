import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { AnimationControls } from './animation-controls';
import { WaapiPlayer } from './waapi-player';
import { SpringPlayer } from './spring-player';
import {
  MoveKeyframes,
  MoveRepeatOptions,
  MoveRepeatType,
  MoveSpring,
  MoveTransitionConfig,
} from '../presets/presets.types';
import { MovementConfig, MOVEMENT_CONFIG, MOVEMENT_DEFAULTS } from '../tokens/movement.tokens';
import { movementWarn } from '../dev-warn';
import {
  applyComposedStyle,
  applyKeyframeTimes,
  ComposedKeyframe,
  composeElementKeyframes,
  composeFinalStyle,
} from './keyframe-composer';
import { validateSpring } from '../directives/move-animation.utils';
import { composeTransitionKeyframes } from './transition-composer';
import { groupByEasing } from './easing-groups';
import { CompositeAnimationControls } from './composite-controls';
import { composeKeyframeAt } from './keyframe-composer';
import { registerActivePlayer } from './active-player-registry';
import { resolveTime } from '../move-time';

export interface PlayAnimationOptions {
  config?: MovementConfig;
  spring?: MoveSpring;
  delay?: number;
  disabled?: boolean;
  iterations?: number;
  onDone?: () => void;
  transition?: MoveTransitionConfig;
  repeat?: MoveRepeatOptions;
  /** Animate a pseudo-element of `host` (`'::before'`, `'::view-transition-new(root)'`). */
  pseudoElement?: string;
}

@Injectable({ providedIn: 'root' })
export class AnimationEngine {
  #platformId = inject(PLATFORM_ID);
  #defaults = inject(MOVEMENT_CONFIG);

  play(
    host: Element,
    rawFrames: MoveKeyframes,
    options: PlayAnimationOptions = {},
  ): AnimationControls | null {
    if (!isPlatformBrowser(this.#platformId)) {
      options.onDone?.();
      return null;
    }

    if (options.pseudoElement) {
      return this.#playPseudoElement(host, rawFrames, options.pseudoElement, options);
    }

    const frames = this.#resolveSvgFrames(host, rawFrames);

    if (options.disabled) {
      this.#prepareSvgPathDraw(host, frames);
      this.#applyFinalStyles(host, frames);
      options.onDone?.();
      return null;
    }

    this.#prepareSvgPathDraw(host, frames);

    const config = options.config ?? this.#defaults;
    const spring = validateSpring(options.spring);
    const isSpring = spring || config.easing === 'spring';
    const repeat = resolveRepeat(options);
    const iterations = repeat?.repeat ?? options.iterations ?? config.iterations;

    // Properties with different easings cannot share one WAAPI animation — a keyframe's easing
    // applies to every property in that segment — so they run as separate, jointly-controlled ones.
    if (options.transition && !isSpring) {
      const groups = groupByEasing(frames, options.transition, config);
      if (groups) {
        const controls = new CompositeAnimationControls(
          groups.map((group, index) => {
            const keyframes = group.isTransform
              ? composeElementKeyframes(host, group.frames)
              : composeStandaloneKeyframes(group.frames);

            return new WaapiPlayer(
              host,
              keyframes,
              {
                duration: group.duration,
                easing: group.easing,
                delay: group.delay,
                disabled: false,
                iterations,
              },
              // Only one member reports completion, or onDone would fire once per group.
              index === 0 ? options.onDone : undefined,
              repeat,
            );
          }),
        );
        registerActivePlayer(host, controls);
        return controls;
      }
    }

    // Per-property transitions only supported with WaapiPlayer (not spring)
    if (options.transition && !isSpring) {
      const resolved = composeTransitionKeyframes(frames, options.transition, config);
      if (resolved) {
        const controls = new WaapiPlayer(
          host,
          resolved.keyframes,
          {
            duration: resolved.duration,
            easing: resolved.easing,
            delay: resolved.delay,
            disabled: false,
            iterations,
          },
          options.onDone,
          repeat,
        );
        registerActivePlayer(host, controls);
        return controls;
      }
    }

    // Explicit keyframe offsets. Applied only when per-property timings did not already rewrite
    // the timeline above, so the two cannot fight over the same offsets.
    const times = options.transition?.times;
    if (times && !isSpring) {
      const timed = applyKeyframeTimes(composeElementKeyframes(host, frames), times);
      if (timed) {
        const controls = new WaapiPlayer(
          host,
          timed,
          {
            duration: config.duration,
            easing: config.easing,
            delay: options.delay ?? config.delay,
            disabled: false,
            iterations,
          },
          options.onDone,
          repeat,
        );
        registerActivePlayer(host, controls);
        return controls;
      }
    }

    if (isSpring) {
      const controls = new SpringPlayer(
        host,
        frames,
        spring ?? {},
        options.delay ?? config.delay,
        iterations,
        options.onDone,
      );
      registerActivePlayer(host, controls);
      return controls;
    } else {
      const controls = new WaapiPlayer(
        host,
        frames,
        {
          duration: config.duration,
          easing: config.easing,
          delay: options.delay ?? config.delay,
          disabled: false,
          iterations,
        },
        options.onDone,
        repeat,
      );
      registerActivePlayer(host, controls);
      return controls;
    }
  }

  /**
   * WAAPI interop for pseudo-elements, the path View Transitions need.
   *
   * Deliberately narrower than the element path: there is no inline style on a pseudo-element, so
   * nothing is committed on finish, and reduced motion / `disabled` means *skip the animation* —
   * the caller's DOM change is already the committed state (applying "final styles" to a
   * pseudo-element is impossible). It is also never registered as the host's active player: a
   * `moveDrag` or `MoveAnimator.set()` on the real element must not cancel a View Transition.
   *
   * Progressive enhancement: a browser without `KeyframeEffect.pseudoElement`, or one that rejects
   * the selector (`::view-transition-new(root)` where View Transitions are unsupported), gets a
   * no-op instead of a throw — and never the dangerous fallback of animating the host itself.
   */
  #playPseudoElement(
    host: Element,
    frames: MoveKeyframes,
    pseudoElement: string,
    options: PlayAnimationOptions,
  ): AnimationControls | null {
    if (options.disabled || !supportsPseudoElementAnimation(host)) {
      options.onDone?.();
      return null;
    }

    const config = options.config ?? this.#defaults;
    if (options.spring || config.easing === 'spring' || hasPerPropertyTiming(options.transition)) {
      movementWarn(
        `pseudoElement "${pseudoElement}": \`spring\` and per-property \`transition\` timing are ` +
          'not applied to pseudo-elements. Using duration, delay, easing and repeat only.',
      );
    }

    const repeat = resolveRepeat(options);
    const iterations = repeat?.repeat ?? options.iterations ?? config.iterations;

    try {
      return new WaapiPlayer(
        host,
        composeStandaloneKeyframes(frames),
        {
          duration: config.duration,
          easing: config.easing === 'spring' ? MOVEMENT_DEFAULTS.easing : config.easing,
          delay: options.delay ?? config.delay,
          disabled: false,
          iterations,
        },
        options.onDone,
        repeat,
        pseudoElement,
      );
    } catch (error) {
      movementWarn(
        `Could not animate pseudo-element "${pseudoElement}" (${String(error)}). ` +
          'Skipping the animation.',
      );
      options.onDone?.();
      return null;
    }
  }

  /**
   * Commits the end state without animating — the reduced-motion and `disabled` path.
   *
   * When the host already carries an inline transform the frames have to be composed on top of it,
   * so the final style comes from `composeElementKeyframes` rather than `composeFinalStyle`. Both
   * results are applied through the same helper: hand-rolling the second one with
   * `style.setProperty()` silently dropped camelCase properties like `strokeDashoffset`, which is
   * exactly what an SVG path-draw preset resolves to.
   */
  #applyFinalStyles(host: Element, frames: MoveKeyframes): void {
    const inlineTransform = (host as HTMLElement).style.transform;

    if (inlineTransform && inlineTransform !== 'none') {
      const composed = composeElementKeyframes(host, frames);
      if (composed.length > 0) {
        applyComposedStyle(host, composed[composed.length - 1] as ComposedKeyframe);
        return;
      }
    }

    applyComposedStyle(host, composeFinalStyle(frames));
  }

  #resolveSvgFrames(host: Element, frames: MoveKeyframes): MoveKeyframes {
    if (!frames.pathLength && !frames.pathOffset) {
      return frames;
    }

    const L = this.#getPathLength(host);
    const resolved: MoveKeyframes = { ...frames };

    const pValues = frames.pathLength ? frames.pathLength.map((v) => Number(v)) : [1];
    const oValues = frames.pathOffset ? frames.pathOffset.map((v) => Number(v)) : [0];
    const maxLen = Math.max(pValues.length, oValues.length);

    const strokeDasharray: string[] = [];
    const strokeDashoffset: number[] = [];

    for (let i = 0; i < maxLen; i++) {
      const p = pValues[Math.min(i, pValues.length - 1)];
      const o = oValues[Math.min(i, oValues.length - 1)];
      strokeDasharray.push(`${p * L} ${L}`);
      strokeDashoffset.push(-o * L);
    }

    resolved['strokeDasharray'] = strokeDasharray as unknown as readonly (number | string)[];
    resolved['strokeDashoffset'] = strokeDashoffset as unknown as readonly (number | string)[];

    delete (resolved as Record<string, unknown>)['pathLength'];
    delete (resolved as Record<string, unknown>)['pathOffset'];

    return resolved;
  }

  #prepareSvgPathDraw(host: Element, frames: MoveKeyframes): void {
    const hasPathProps =
      frames.strokeDashoffset || frames.strokeDasharray || frames.pathLength || frames.pathOffset;

    if (!hasPathProps || !this.#isSvgGeometryElement(host)) {
      return;
    }

    const styledHost = host as SVGElement;
    const L = this.#getPathLength(host);

    if (frames.strokeDasharray && frames.strokeDasharray.length > 0) {
      styledHost.style.strokeDasharray = String(frames.strokeDasharray[0]);
    } else if (frames.strokeDashoffset || frames.pathLength || frames.pathOffset) {
      styledHost.style.strokeDasharray = `${L}`;
    }

    if (frames.strokeDashoffset && frames.strokeDashoffset.length > 0) {
      styledHost.style.strokeDashoffset = String(frames.strokeDashoffset[0]);
    } else if (frames.pathLength && frames.pathLength.length > 0) {
      styledHost.style.strokeDashoffset = `${Number(frames.pathLength[0]) * L}`;
    }
  }

  #getPathLength(host: Element): number {
    if (!this.#isSvgGeometryElement(host)) return 28;
    try {
      return (host as SVGGeometryElement).getTotalLength() || 28;
    } catch {
      return 28;
    }
  }

  #isSvgGeometryElement(host: Element): host is SVGGeometryElement {
    const view = host.ownerDocument?.defaultView;
    const SvgGeometryElement = view?.SVGGeometryElement;

    if (typeof SvgGeometryElement === 'function' && host instanceof SvgGeometryElement) {
      return true;
    }

    return typeof (host as Partial<SVGGeometryElement>).getTotalLength === 'function';
  }
}

/**
 * Builds keyframes for a non-transform group.
 *
 * `composeElementKeyframes` would emit the element's base `transform` into every keyframe, and a
 * second animation writing `transform` would fight the transform group. These properties are
 * independent, so they are composed without any base.
 */
function composeStandaloneKeyframes(frames: MoveKeyframes): Keyframe[] {
  let length = 0;
  for (const key in frames) {
    const values = frames[key];
    if (Array.isArray(values)) length = Math.max(length, values.length);
  }

  const keyframes: Keyframe[] = [];
  for (let i = 0; i < length; i += 1) {
    keyframes.push(composeKeyframeAt(frames, i) as Keyframe);
  }
  return keyframes;
}

/**
 * Repeat options can arrive either directly (a directive with dedicated inputs, like `moveLoop`) or
 * inside a `moveTransition`, which is the Framer-shaped path every variant/target/trigger already
 * accepts. An explicit `options.repeat` wins per field.
 */
function resolveRepeat(options: PlayAnimationOptions): MoveRepeatOptions | undefined {
  const fromTransition = options.transition;
  const merged: MoveRepeatOptions = {
    repeat: options.repeat?.repeat ?? (fromTransition?.repeat as number | undefined),
    repeatType:
      options.repeat?.repeatType ?? (fromTransition?.repeatType as MoveRepeatType | undefined),
    repeatDelay: resolveTime(options.repeat?.repeatDelay ?? fromTransition?.repeatDelay),
  };

  const hasAny =
    merged.repeat !== undefined ||
    merged.repeatType !== undefined ||
    merged.repeatDelay !== undefined;

  return hasAny ? merged : undefined;
}

/** True when the host's realm can target a pseudo-element with `element.animate()`. */
function supportsPseudoElementAnimation(host: Element): boolean {
  const view = host.ownerDocument?.defaultView as (Window & typeof globalThis) | null | undefined;
  const KeyframeEffectCtor = view?.KeyframeEffect;
  return (
    typeof (host as HTMLElement).animate === 'function' &&
    typeof KeyframeEffectCtor === 'function' &&
    'pseudoElement' in KeyframeEffectCtor.prototype
  );
}

const REPEAT_KEYS = new Set(['repeat', 'repeatType', 'repeatDelay']);

function hasPerPropertyTiming(transition: MoveTransitionConfig | undefined): boolean {
  if (!transition) return false;
  return Object.keys(transition).some((key) => !REPEAT_KEYS.has(key));
}
