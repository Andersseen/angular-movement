import { AnimationControls } from './animation-controls';
import { MoveKeyframes, MoveRepeatOptions } from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';
import { composeElementKeyframes } from './keyframe-composer';
import { BaseAnimationPlayer } from './base-player';

export class WaapiPlayer extends BaseAnimationPlayer implements AnimationControls {
  constructor(
    host: Element,
    frames: MoveKeyframes | Keyframe[],
    config: MovementConfig,
    onDone?: () => void,
    repeat?: MoveRepeatOptions,
  ) {
    super();

    if (typeof (host as HTMLElement).animate !== 'function') {
      this.resolveAndCleanup(onDone);
      return;
    }

    const composed = Array.isArray(frames)
      ? (frames as Keyframe[])
      : composeElementKeyframes(host, frames as MoveKeyframes);
    const iterations = repeat?.repeat ?? config.iterations ?? 1;

    // WAAPI has no per-iteration delay, so a repeatDelay has to be baked into the timeline: the
    // existing keyframes are squeezed into the leading fraction and the final value is held for
    // the rest of the cycle.
    const repeatDelay = Math.max(0, repeat?.repeatDelay ?? 0);
    const padded =
      repeatDelay > 0 && iterations !== 1
        ? padTimelineWithHold(composed, config.duration, repeatDelay)
        : composed;
    const duration =
      repeatDelay > 0 && iterations !== 1 ? config.duration + repeatDelay : config.duration;

    const animation = (host as HTMLElement).animate(padded, {
      duration,
      easing: config.easing,
      delay: config.delay,
      fill: 'both',
      iterations,
      // Without this every cycle jumps back to the first keyframe — the reason `moveLoop` could
      // never breathe or yoyo.
      direction: repeat?.repeatType === 'reverse' ? 'alternate' : 'normal',
    });

    if (iterations === Infinity) {
      // Infinite loops never finish; consumer must call cancel() manually.
      this.attachAnimation(animation);
      return;
    }

    this.attachAnimation(animation, onDone);
  }
}

/**
 * Rescales keyframe offsets into `[0, duration / (duration + hold)]` and appends a copy of the last
 * keyframe at offset 1, so the value sits still for the hold before the next cycle starts.
 */
function padTimelineWithHold(keyframes: Keyframe[], duration: number, hold: number): Keyframe[] {
  if (keyframes.length === 0) return keyframes;

  const total = duration + hold;
  const scale = total > 0 ? duration / total : 1;
  const count = keyframes.length;

  const rescaled = keyframes.map((keyframe, index) => {
    const offset = keyframe.offset ?? (count > 1 ? index / (count - 1) : 0);
    return { ...keyframe, offset: offset * scale };
  });

  return [...rescaled, { ...keyframes[count - 1], offset: 1 }];
}
