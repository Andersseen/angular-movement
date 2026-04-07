import { AnimationControls } from './animation-controls';
import { MoveKeyframes } from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';

export class WaapiPlayer implements AnimationControls {
  #animation: Animation | null = null;
  #resolveFinished!: () => void;
  public readonly finished = new Promise<void>((resolve) => {
    this.#resolveFinished = resolve;
  });

  constructor(
    host: HTMLElement,
    frames: MoveKeyframes,
    config: MovementConfig,
    onDone?: () => void
  ) {
    if (typeof host.animate !== 'function') {
      this.#resolveFinished();
      onDone?.();
      return;
    }

    const keyframes = this.#toWAAPIKeyframes(frames);

    this.#animation = host.animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      fill: 'both',
    });

    this.#animation.addEventListener(
      'finish',
      () => {
        this.#animation?.commitStyles?.();
        this.#animation?.cancel();
        this.#resolveFinished();
        onDone?.();
      },
      { once: true }
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

  #toWAAPIKeyframes(frames: MoveKeyframes): Keyframe[] {
    let maxLength = 0;
    for (const key in frames) {
      const arr = frames[key as keyof MoveKeyframes];
      if (Array.isArray(arr)) {
        maxLength = Math.max(maxLength, arr.length);
      }
    }

    if (maxLength === 0) return [];

    const keyframes: Keyframe[] = [];

    for (let i = 0; i < maxLength; i++) {
      const frame: Keyframe = {};

      const getVal = (arr: readonly number[] | undefined) => {
        if (!arr || arr.length === 0) return undefined;
        return arr[Math.min(i, arr.length - 1)];
      };

      const opacity = getVal(frames.opacity);
      if (opacity !== undefined) {
        frame['opacity'] = opacity;
      }

      const x = getVal(frames.x);
      const y = getVal(frames.y);
      if (x !== undefined || y !== undefined) {
        frame['translate'] = `${x ?? 0}px ${y ?? 0}px`;
      }

      const scale = getVal(frames.scale);
      if (scale !== undefined) {
        frame['scale'] = `${scale}`;
      } else {
        const scaleX = getVal(frames.scaleX);
        const scaleY = getVal(frames.scaleY);
        if (scaleX !== undefined || scaleY !== undefined) {
          frame['scale'] = `${scaleX ?? 1} ${scaleY ?? 1}`;
        }
      }

      const rotate = getVal(frames.rotate);
      if (rotate !== undefined) {
        frame['rotate'] = `${rotate}deg`;
      }

      const rotateX = getVal(frames.rotateX);
      const rotateY = getVal(frames.rotateY);
      if (rotateX !== undefined || rotateY !== undefined) {
        frame['transform'] = `perspective(1200px) rotateX(${rotateX ?? 0}deg) rotateY(${rotateY ?? 0}deg)`;
      }

      keyframes.push(frame);
    }
    return keyframes;
  }
}
