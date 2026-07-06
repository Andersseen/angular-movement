import { AnimationControls } from './animation-controls';
import { MoveKeyframes } from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';
import { composeElementKeyframes } from './keyframe-composer';

export class WaapiPlayer implements AnimationControls {
  #animation: Animation | null = null;
  #resolveFinished!: () => void;
  public readonly finished = new Promise<void>((resolve) => {
    this.#resolveFinished = resolve;
  });

  constructor(
    host: Element,
    frames: MoveKeyframes | Keyframe[],
    config: MovementConfig,
    onDone?: () => void,
  ) {
    if (typeof (host as HTMLElement).animate !== 'function') {
      this.#resolveFinished();
      onDone?.();
      return;
    }

    const keyframes = Array.isArray(frames)
      ? (frames as Keyframe[])
      : composeElementKeyframes(host, frames as MoveKeyframes);
    const iterations = config.iterations ?? 1;

    this.#animation = (host as HTMLElement).animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      fill: 'both',
      iterations,
    });

    if (iterations === Infinity) {
      // Infinite loops never finish; consumer must call cancel() manually.
      return;
    }

    this.#animation.addEventListener(
      'finish',
      () => {
        this.#animation?.commitStyles?.();
        this.#animation?.cancel();
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

  get currentTime(): number {
    return (this.#animation?.currentTime as number) ?? 0;
  }

  set currentTime(time: number) {
    if (this.#animation) {
      this.#animation.currentTime = time;
    }
  }
}
