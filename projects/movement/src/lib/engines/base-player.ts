import { AnimationControls } from './animation-controls';

/**
 * Shared foundation for WAAPI-backed animation players.
 * Handles promise resolution, play/pause/cancel, currentTime, and the finish
 * listener pattern (commitStyles + cancel + resolve + onDone).
 *
 * `finished` always resolves and never rejects — on natural finish, on `cancel()`, and on an
 * external cancellation of the underlying animation. This is the public `AnimationControls`
 * contract.
 */
export abstract class BaseAnimationPlayer implements AnimationControls {
  #animation: Animation | null = null;
  #resolveFinished!: () => void;
  readonly finished = new Promise<void>((resolve) => {
    this.#resolveFinished = resolve;
  });

  constructor(onDone?: () => void) {
    if (onDone) {
      this.finished.then(onDone).catch(() => {
        /* ignore */
      });
    }
  }

  /**
   * @param commit `false` for targets that have no inline style to commit to (pseudo-elements):
   *   the animation is left to end on its own instead of being committed and cancelled.
   */
  protected attachAnimation(animation: Animation | null, onDone?: () => void, commit = true): void {
    this.#animation = animation;

    if (!animation) {
      this.#resolveFinished();
      onDone?.();
      return;
    }

    animation.addEventListener(
      'finish',
      () => {
        // `finished` resolves and `onDone` runs whatever happens while committing: an exception
        // here would otherwise skip both and leave every awaiting caller hanging.
        try {
          if (commit) {
            commitFinalState(animation);
            animation.cancel();
          }
        } finally {
          this.#resolveFinished();
          onDone?.();
        }
      },
      { once: true },
    );

    // Something other than this player cancelled the animation — a skipped View Transition
    // tearing down its pseudo-elements, `el.getAnimations().forEach((a) => a.cancel())`. Without
    // this, `finished` would never settle and an awaiting caller would hang. Same outcome as
    // `cancel()`: resolved, `onDone` not called.
    animation.addEventListener('cancel', () => this.#resolveFinished(), { once: true });
  }

  play(): void {
    this.#animation?.play();
  }

  pause(): void {
    this.#animation?.pause();
  }

  cancel(): void {
    if (this.#animation?.playState !== 'idle') {
      this.#animation?.cancel();
    }
    this.#resolveFinished();
  }

  protected resolveAndCleanup(onDone?: () => void): void {
    this.#resolveFinished();
    onDone?.();
  }

  get currentTime(): number {
    return (this.#animation?.currentTime as number) ?? 0;
  }

  set currentTime(time: number) {
    if (this.#animation) {
      this.#animation.currentTime = time;
    }
  }
}

/** Timing members of a keyframe that are not CSS properties. */
const NON_STYLE_KEYS = new Set(['offset', 'computedOffset', 'easing', 'composite']);

/**
 * Writes the animation's end state into the target's inline style so it survives `cancel()`.
 *
 * `commitStyles()` throws `InvalidStateError` when the target is not rendered — `display: none` on
 * it or an ancestor (a column hidden by a media query, a closed `<details>`). Nothing is painted
 * then, but the element still needs its final state for when it is shown, so the end keyframe is
 * written inline instead. A failure here is swallowed: the caller must still cancel and resolve.
 */
function commitFinalState(animation: Animation): void {
  try {
    animation.commitStyles?.();
    return;
  } catch {
    // Not rendered — fall through to the keyframe fallback.
  }

  try {
    applyEndKeyframe(animation);
  } catch {
    // Nothing more can be done; the animation still ends cleanly.
  }
}

function applyEndKeyframe(animation: Animation): void {
  const effect = animation.effect as KeyframeEffect | null;
  if (!effect || typeof effect.getKeyframes !== 'function' || effect.pseudoElement) return;

  const style = (effect.target as (Element & Partial<ElementCSSInlineStyle>) | null)?.style;
  if (!style) return;

  const frames = effect.getKeyframes();
  if (!frames.length) return;

  const frame = endsOnFirstFrame(effect.getTiming()) ? frames[0] : frames[frames.length - 1];

  for (const [property, value] of Object.entries(frame)) {
    if (NON_STYLE_KEYS.has(property) || value === null || value === undefined) continue;
    if (property.startsWith('--')) {
      style.setProperty(property, String(value));
    } else {
      // Keyframe keys are camelCase CSSOM names (`backgroundColor`, `cssFloat`).
      (style as unknown as Record<string, string>)[property] = String(value);
    }
  }
}

/** Whether playback stops on the first keyframe rather than the last. */
function endsOnFirstFrame(timing: EffectTiming): boolean {
  const iterations = Math.max(1, Math.ceil(Number(timing.iterations ?? 1)) || 1);
  switch (timing.direction) {
    case 'reverse':
      return true;
    case 'alternate':
      return iterations % 2 === 0;
    case 'alternate-reverse':
      return iterations % 2 === 1;
    default:
      return false;
  }
}
