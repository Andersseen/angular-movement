import { AnimationControls } from './animation-controls';

/**
 * Shared foundation for WAAPI-backed animation players.
 * Handles promise resolution, play/pause/cancel, currentTime, and the finish
 * listener pattern (commitStyles + cancel + resolve + onDone).
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

  protected attachAnimation(animation: Animation | null, onDone?: () => void): void {
    this.#animation = animation;

    if (!animation) {
      this.#resolveFinished();
      onDone?.();
      return;
    }

    animation.addEventListener(
      'finish',
      () => {
        animation.commitStyles?.();
        animation.cancel();
        this.#resolveFinished();
        onDone?.();
      },
      { once: true },
    );
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
