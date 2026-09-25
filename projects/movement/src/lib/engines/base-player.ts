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
        if (commit) {
          animation.commitStyles?.();
          animation.cancel();
        }
        this.#resolveFinished();
        onDone?.();
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
