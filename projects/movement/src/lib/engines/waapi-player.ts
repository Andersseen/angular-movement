import { AnimationControls } from './animation-controls';
import { MoveKeyframes, MoveRepeatOptions } from '../presets/presets.types';
import { MovementConfig } from '../tokens/movement.tokens';
import { composeElementKeyframes } from './keyframe-composer';
import { BaseAnimationPlayer } from './base-player';
import { resolveTime } from '../move-time';

export class WaapiPlayer extends BaseAnimationPlayer implements AnimationControls {
  constructor(
    host: Element,
    frames: MoveKeyframes | Keyframe[],
    config: MovementConfig,
    onDone?: () => void,
    repeat?: MoveRepeatOptions,
    pseudoElement?: string,
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
    const repeatDelay = Math.max(0, resolveTime(repeat?.repeatDelay) ?? 0);
    const padded =
      repeatDelay > 0 && iterations !== 1
        ? padTimelineWithHold(composed, config.duration, repeatDelay)
        : composed;
    const duration =
      repeatDelay > 0 && iterations !== 1 ? config.duration + repeatDelay : config.duration;

    const timing: KeyframeAnimationOptions = {
      duration,
      easing: config.easing,
      delay: config.delay,
      // A pseudo-element has no inline style to commit the end state to, so its animation must not
      // fill forwards (it would hold a finished Animation alive forever). `backwards` still shows
      // the first keyframe through the delay — a View Transition reveal must not flash the
      // unclipped new snapshot before it starts.
      fill: pseudoElement ? 'backwards' : 'both',
      iterations,
      // Without this every cycle jumps back to the first keyframe — the reason `moveLoop` could
      // never breathe or yoyo.
      direction: repeat?.repeatType === 'reverse' ? 'alternate' : 'normal',
    };
    if (pseudoElement) timing.pseudoElement = pseudoElement;

    const animation = (host as HTMLElement).animate(padded, timing);
    const commit = !pseudoElement;

    if (iterations === Infinity) {
      // Infinite loops never finish; consumer must call cancel() manually.
      this.attachAnimation(animation, undefined, commit);
      return;
    }

    this.attachAnimation(animation, onDone, commit);
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
