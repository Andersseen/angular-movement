import { AnimationControls } from './animation-controls';
import { MoveKeyframes, MoveSpring } from '../presets/presets.types';

export class SpringPlayer implements AnimationControls {
  #resolveFinished!: () => void;
  public readonly finished = new Promise<void>((resolve) => {
    this.#resolveFinished = resolve;
  });

  #animation: Animation | null = null;

  constructor(
    private readonly host: HTMLElement,
    private readonly frames: MoveKeyframes,
    userConfig: MoveSpring,
    private readonly delay: number,
    private readonly onDone?: () => void,
  ) {
    if (typeof host.animate !== 'function') {
      this.#resolveFinished();
      onDone?.();
      return;
    }

    const config: MoveSpring = {
      stiffness: 100,
      damping: 10,
      mass: 1,
      velocity: 0,
      ...userConfig,
    };

    const keyframes = this.#generateSpringKeyframes(frames, config);

    if (keyframes.length === 0) {
      this.#resolveFinished();
      onDone?.();
      return;
    }

    // Default duration of the calculated simulation is bound to the arrays output.
    // We run it over that specific time frame, we know exactly the duration by counting ticks * tick duration.
    // Let's assume tick rate is 16.66ms (60fps simulation)
    const duration = keyframes.length * (1000 / 60);

    this.#animation = host.animate(keyframes, {
      duration,
      delay: this.delay,
      fill: 'both',
      easing: 'linear', // Spring physics already has the easing baked into the frames
    });

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
      const maxIterations = 600; // max 10 seconds per step

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

        if (Math.abs(displacement) < 0.001 && Math.abs(velocity) < 0.001) {
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
    const frame: Keyframe = {};

    const getVal = (arr: readonly number[] | undefined) => {
      if (!arr || arr.length === 0) return undefined;
      const v1 = arr[Math.min(i1, arr.length - 1)];
      const v2 = arr[Math.min(i2, arr.length - 1)];
      return v1 + (v2 - v1) * p;
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

    // 3D rotations for rotateX and rotateY via CSS rotate and transform perspective if needed
    const rotateX = getVal(frames.rotateX);
    const rotateY = getVal(frames.rotateY);
    if (rotateX !== undefined || rotateY !== undefined) {
      frame['transform'] =
        `perspective(1200px) rotateX(${rotateX ?? 0}deg) rotateY(${rotateY ?? 0}deg)`;
    }

    return frame;
  }
}
