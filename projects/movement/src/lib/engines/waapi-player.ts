import { AnimationControls } from './animation-controls';
import { MoveKeyframes } from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';

export class WaapiPlayer implements AnimationControls {
  private animation: Animation | null = null;
  private resolveFinished!: () => void;
  public readonly finished = new Promise<void>((resolve) => {
    this.resolveFinished = resolve;
  });

  constructor(
    host: HTMLElement,
    frames: MoveKeyframes,
    config: MovementConfig,
    onDone?: () => void
  ) {
    if (typeof host.animate !== 'function') {
      this.resolveFinished();
      onDone?.();
      return;
    }

    const keyframes = this.toWAAPIKeyframes(frames);

    this.animation = host.animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      fill: 'both',
    });

    this.animation.addEventListener(
      'finish',
      () => {
        this.animation?.commitStyles?.();
        this.animation?.cancel();
        this.resolveFinished();
        onDone?.();
      },
      { once: true }
    );
  }

  play(): void {
    this.animation?.play();
  }

  pause(): void {
    this.animation?.pause();
  }

  cancel(): void {
    if (this.animation?.playState !== 'idle') {
      this.animation?.cancel();
    }
    this.resolveFinished();
  }

  get currentTime(): number {
    return (this.animation?.currentTime as number) ?? 0;
  }

  set currentTime(time: number) {
    if (this.animation) {
      this.animation.currentTime = time;
    }
  }

  private toWAAPIKeyframes(frames: MoveKeyframes): Keyframe[] {
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
      const transforms: string[] = [];

      const getVal = (arr: readonly number[] | undefined) => {
        if (!arr || arr.length === 0) return undefined;
        return arr[Math.min(i, arr.length - 1)];
      };

      const opacity = getVal(frames.opacity);
      if (opacity !== undefined) {
        frame['opacity'] = opacity;
      }

      const x = getVal(frames.x);
      if (x !== undefined) transforms.push(`translateX(${x}px)`);

      const y = getVal(frames.y);
      if (y !== undefined) transforms.push(`translateY(${y}px)`);

      const scale = getVal(frames.scale);
      if (scale !== undefined) transforms.push(`scale(${scale})`);

      const scaleX = getVal(frames.scaleX);
      if (scaleX !== undefined) transforms.push(`scaleX(${scaleX})`);

      const scaleY = getVal(frames.scaleY);
      if (scaleY !== undefined) transforms.push(`scaleY(${scaleY})`);

      const rotate = getVal(frames.rotate);
      if (rotate !== undefined) transforms.push(`rotate(${rotate}deg)`);

      const rotateX = getVal(frames.rotateX);
      if (rotateX !== undefined) transforms.push(`rotateX(${rotateX}deg)`);

      const rotateY = getVal(frames.rotateY);
      if (rotateY !== undefined) transforms.push(`rotateY(${rotateY}deg)`);

      if (transforms.length > 0) {
        frame['transform'] = transforms.join(' ');
      }

      keyframes.push(frame);
    }
    return keyframes;
  }
}
