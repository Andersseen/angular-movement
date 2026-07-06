import { AnimationControls } from './animation-controls';
import { MoveKeyframes } from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';
import { composeElementKeyframes } from './keyframe-composer';
import { BaseAnimationPlayer } from './base-player';

export class WaapiPlayer extends BaseAnimationPlayer implements AnimationControls {
  constructor(
    host: Element,
    frames: MoveKeyframes | Keyframe[],
    config: MovementConfig,
    onDone?: () => void,
  ) {
    super();

    if (typeof (host as HTMLElement).animate !== 'function') {
      this.resolveAndCleanup(onDone);
      return;
    }

    const keyframes = Array.isArray(frames)
      ? (frames as Keyframe[])
      : composeElementKeyframes(host, frames as MoveKeyframes);
    const iterations = config.iterations ?? 1;

    const animation = (host as HTMLElement).animate(keyframes, {
      duration: config.duration,
      easing: config.easing,
      delay: config.delay,
      fill: 'both',
      iterations,
    });

    if (iterations === Infinity) {
      // Infinite loops never finish; consumer must call cancel() manually.
      this.attachAnimation(animation);
      return;
    }

    this.attachAnimation(animation, onDone);
  }
}
