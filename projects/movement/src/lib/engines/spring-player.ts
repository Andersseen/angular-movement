import { AnimationControls } from './animation-controls';
import { MoveKeyframes, MoveSpring } from '../presets/presets.types';
import { composeInterpolatedKeyframe, composeKeyframesWithBase } from './keyframe-composer';
import {
  SIMULATION_MAX_ITERATIONS,
  SIMULATION_SETTLED_THRESHOLD,
  SIMULATION_TICK_RATE,
} from '../constants';
import { BaseAnimationPlayer } from './base-player';
import { movementWarn } from '../dev-warn';

export class SpringPlayer extends BaseAnimationPlayer implements AnimationControls {
  constructor(
    private readonly host: Element,
    private readonly frames: MoveKeyframes,
    userConfig: MoveSpring,
    private readonly delay: number,
    private readonly iterations = 1,
    onDone?: () => void,
  ) {
    super();

    if (typeof (host as HTMLElement).animate !== 'function') {
      this.resolveAndCleanup(onDone);
      return;
    }

    if (this.iterations !== 1) {
      movementWarn(
        'Spring animations with iterations !== 1 may produce visual glitches. ' +
          'Consider using WaapiPlayer (no spring) for loops.',
      );
    }

    const config: MoveSpring = {
      stiffness: 100,
      damping: 10,
      mass: 1,
      velocity: 0,
      ...userConfig,
    };

    const generatedKeyframes = this.#generateSpringKeyframes(frames, config);
    const keyframes = composeKeyframesWithBase(this.host, generatedKeyframes);

    if (keyframes.length === 0) {
      this.resolveAndCleanup(onDone);
      return;
    }

    // Default duration of the calculated simulation is bound to the arrays output.
    // We run it over that specific time frame, we know exactly the duration by counting ticks * tick duration.
    // Let's assume tick rate is 16.66ms (60fps simulation)
    const duration = keyframes.length * SIMULATION_TICK_RATE;

    const animation = (host as HTMLElement).animate(keyframes, {
      duration,
      delay: this.delay,
      fill: 'both',
      easing: 'linear', // Spring physics already has the easing baked into the frames
      iterations: this.iterations,
    });

    if (this.iterations === Infinity) {
      // Infinite loops never finish; consumer must call cancel() manually.
      this.attachAnimation(animation);
      return;
    }

    this.attachAnimation(animation, onDone);
  }

  #generateSpringKeyframes(frames: MoveKeyframes, config: MoveSpring): Keyframe[] {
    let maxSteps = 0;
    for (const key in frames) {
      const arr = frames[key as keyof MoveKeyframes];
      if (Array.isArray(arr)) {
        maxSteps = Math.max(maxSteps, arr.length);
      }
    }

    if (maxSteps <= 1) return [];

    const keyframes: Keyframe[] = [];
    const dt = 1 / 60; // Simulate at 60fps (16.66ms per tick)

    const stiffness = config.stiffness!;
    const damping = config.damping!;
    const mass = config.mass!;

    // We will simulate segments between keyframes based on physics
    for (let step = 0; step < maxSteps - 1; step++) {
      let progress = 0;
      let velocity = step === 0 ? (config.velocity ?? 0) : 0;
      let isSettled = false;

      // Simulate the spring for this intermediate segment
      // Prevent infinite loops safely by bounding iterations
      let iterations = 0;
      const maxIterations = SIMULATION_MAX_ITERATIONS; // max 10 seconds per step

      while (!isSettled && iterations < maxIterations) {
        // Evaluate frame
        const p = Math.min(Math.max(progress, 0), 1);
        keyframes.push(this.#composeFrame(frames, step, step + 1, p));

        // Advance physics F = -k*x - c*v
        const displacement = progress - 1;
        const force = -stiffness * displacement - damping * velocity;
        const acceleration = force / mass;

        velocity += acceleration * dt;
        progress += velocity * dt;

        if (
          Math.abs(displacement) < SIMULATION_SETTLED_THRESHOLD &&
          Math.abs(velocity) < SIMULATION_SETTLED_THRESHOLD
        ) {
          isSettled = true;
        }
        iterations++;
      }

      // Ensure the final state of the step is exactly 1
      keyframes.push(this.#composeFrame(frames, step, step + 1, 1));
    }

    return keyframes;
  }

  #composeFrame(frames: MoveKeyframes, i1: number, i2: number, p: number): Keyframe {
    return composeInterpolatedKeyframe(frames, i1, i2, p);
  }
}
