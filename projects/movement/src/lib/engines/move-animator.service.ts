import { ElementRef, Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { AnimationEngine } from './animation-engine.service';
import { AnimationControls } from './animation-controls';
import { cancelActivePlayer } from './active-player-registry';
import { clearComposedStyle } from './keyframe-composer';
import { animateWithOptions } from './animate-with-options';
import {
  MoveKeyframes,
  MoveKeyframeState,
  MoveSpring,
  MoveTransitionConfig,
  MoveValuePair,
} from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';
import { MoveTime } from '../move-time';

/**
 * Options for one imperative animation — the same vocabulary `MoveTriggerDirective.play()` takes.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export interface MoveAnimateOptions {
  /** A number is milliseconds; `'180ms'` / `'0.18s'` also work. */
  duration?: MoveTime;
  easing?: string;
  /** A number is milliseconds; `'180ms'` / `'0.18s'` also work. */
  delay?: MoveTime;
  /**
   * `true` skips the animation and commits the end state instantly. The user's reduced-motion
   * preference already does this automatically — you never need to pass it for that.
   */
  disabled?: boolean;
  spring?: MoveSpring;
  iterations?: number;
  /** Per-property timing, keyframe `times`, and `repeat` / `repeatType` / `repeatDelay`. */
  transition?: MoveTransitionConfig;
  /**
   * Animate a pseudo-element of the target instead of the target itself — e.g.
   * `'::view-transition-new(root)'` on `document.documentElement`, or `'::before'`.
   *
   * Pseudo-element animations are plain WAAPI interop: duration, delay, easing, iterations and
   * repeat apply; `spring` and per-property `transition` do not. Nothing is committed when it
   * finishes (a pseudo-element has no inline style), so style its resting state in CSS. Under
   * reduced motion or `disabled` the animation is skipped and `null` is returned. Browsers that
   * cannot target pseudo-elements get the same no-op — never an exception.
   */
  pseudoElement?: string;
  /** Called when the animation finishes naturally — not when it is cancelled. */
  onDone?: () => void;
}

/**
 * Anything `MoveAnimator` can animate: an element, or the `ElementRef` a `viewChild()` already
 * gives you.
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
export type MoveAnimationTarget = Element | ElementRef<Element>;

/**
 * The supported way to animate from TypeScript — sequencing phases, reacting to a server
 * response, driving a node the template does not own, View Transitions. For a trigger
 * relationship between two elements in a template, see `moveTarget` / `moveTrigger`.
 *
 * Resolution order matches the directives exactly: `MOVEMENT_CONFIG` defaults, then the options
 * passed here, then the reduced-motion override. `animate()` returns `null` when nothing was
 * scheduled — on the server, or when motion is disabled — in which case the final styles have
 * still been applied (except for pseudo-elements, which have none).
 *
 * ```ts
 * readonly #animator = inject(MoveAnimator);
 * readonly panel = viewChild.required<ElementRef<HTMLElement>>('panel');
 *
 * async reveal() {
 *   await this.#animator.animate(this.panel(), { opacity: [0, 1], y: [20, 0] }, { duration: '400ms' })
 *     ?.finished;
 * }
 * ```
 *
 * `finished` always resolves — also when the animation is cancelled — so sequencing needs no
 * `try/catch` (see {@link AnimationControls}).
 *
 * Stable API — covered by semantic-versioning guarantees.
 *
 * @stability stable
 */
@Injectable({ providedIn: 'root' })
export class MoveAnimator {
  readonly #engine = inject(AnimationEngine);
  readonly #defaults = inject(MOVEMENT_CONFIG);
  readonly #documentRef = inject(DOCUMENT);
  readonly #platformId = inject(PLATFORM_ID);

  animate(
    target: MoveAnimationTarget,
    keyframes: MoveKeyframes,
    options: MoveAnimateOptions = {},
  ): AnimationControls | null {
    return animateWithOptions(
      this.#engine,
      this.#documentRef,
      this.#defaults,
      unwrap(target),
      keyframes,
      options,
    );
  }

  /**
   * Commits a state instantly, through the same style composition the directives use — so `x`,
   * `scale`, `blur` and friends land on the right channels and compose with an existing
   * transform, instead of hand-writing `style.transform`.
   *
   * Cancels the target's in-flight engine animation first, so a finishing animation cannot
   * overwrite the state afterwards. A no-op on the server.
   *
   * ```ts
   * animator.set(overlay, { opacity: 0, clipPath: 'circle(0px at 50% 50%)' });
   * ```
   */
  set(target: MoveAnimationTarget, state: MoveKeyframeState): void {
    const element = unwrap(target);
    cancelActivePlayer(element);

    const frames: Record<string, MoveValuePair> = {};
    for (const key of Object.keys(state)) {
      const value = state[key];
      if (value !== undefined) frames[key] = [value];
    }

    this.#engine.play(element, frames as MoveKeyframes, { disabled: true });
  }

  /**
   * Removes styles the library wrote inline, returning the element to its stylesheet state.
   *
   * With `properties`, only those keyframe keys are cleared (`['opacity', 'y']`; transform
   * shorthands clear the channel they wrote). Without, the library's common channels are cleared:
   * opacity, translate, scale, rotate, transform and filter. Cancels the target's in-flight engine
   * animation first. A no-op on the server.
   */
  clear(target: MoveAnimationTarget, properties?: readonly string[]): void {
    if (!isPlatformBrowser(this.#platformId)) return;

    const element = unwrap(target);
    cancelActivePlayer(element);
    clearComposedStyle(element, properties);
  }
}

function unwrap(target: MoveAnimationTarget): Element {
  return target instanceof ElementRef ? target.nativeElement : target;
}
