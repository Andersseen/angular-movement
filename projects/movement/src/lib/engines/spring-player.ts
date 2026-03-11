import { AnimationControls } from './animation-controls';
import { MoveKeyframes, MoveSpring } from '../presets/presets.types';

export class SpringPlayer implements AnimationControls {
  private resolveFinished!: () => void;
  public readonly finished = new Promise<void>((resolve) => {
    this.resolveFinished = resolve;
  });

  private isPaused = false;
  private isCanceled = false;
  private startTime = 0;
  private activeRaf: number | null = null;
  private delayTimeout: number | ReturnType<typeof setTimeout> | null = null;
  private _currentTime = 0;

  get currentTime(): number {
    return this._currentTime;
  }

  set currentTime(time: number) {
    this._currentTime = time;
  }
  
  // Spring state
  private _progress = 0;
  private _velocity = 0;
  private stepIndex = 0;
  private maxSteps: number;
  private config: MoveSpring;

  constructor(
    private readonly host: HTMLElement,
    private readonly frames: MoveKeyframes,
    userConfig: MoveSpring,
    private readonly delay: number,
    private readonly onDone?: () => void
  ) {
    this.config = {
      stiffness: 100,
      damping: 10,
      mass: 1,
      velocity: 0,
      ...userConfig
    };
    
    this._velocity = this.config.velocity!;

    this.maxSteps = 0;
    for (const key in frames) {
      const arr = frames[key as keyof MoveKeyframes];
      if (Array.isArray(arr)) {
        this.maxSteps = Math.max(this.maxSteps, arr.length);
      }
    }
    
    if (this.maxSteps <= 1) {
      this.resolveFinished();
      this.onDone?.();
      return;
    }

    if (this.delay > 0) {
      this.delayTimeout = setTimeout(() => {
        this.delayTimeout = null;
        if (!this.isCanceled && !this.isPaused) {
          this.startNextStep();
        }
      }, this.delay);
    } else {
      this.startNextStep();
    }
  }

  play(): void {
    if (this.isPaused) {
      this.isPaused = false;
      if (this.delayTimeout === null && this.activeRaf === null) {
        this.startTime = performance.now();
        this.tick(this.startTime);
      }
    }
  }

  pause(): void {
    this.isPaused = true;
    if (this.activeRaf !== null) {
      cancelAnimationFrame(this.activeRaf);
      this.activeRaf = null;
    }
  }

  cancel(): void {
    this.isCanceled = true;
    this.pause();
    if (this.delayTimeout !== null) {
      clearTimeout(this.delayTimeout as number);
      this.delayTimeout = null;
    }
    this.resolveFinished();
  }

  private startNextStep() {
    if (this.stepIndex >= this.maxSteps - 1) {
      this.resolveFinished();
      this.onDone?.();
      return;
    }

    this._progress = 0;
    if (this.stepIndex === 0) {
      this._velocity = this.config.velocity ?? 0;
    }
    
    this.startTime = performance.now();
    this.activeRaf = requestAnimationFrame((t) => this.tick(t));
  }

  private tick(time: number) {
    if (this.isCanceled || this.isPaused) return;

    // cap dt to 50ms to prevent massive jumps when tab is in background
    const dt = Math.min((time - this.startTime) / 1000, 0.05); 
    this.startTime = time;
    this._currentTime += dt * 1000;

    const stiffness = this.config.stiffness!;
    const damping = this.config.damping!;
    const mass = this.config.mass!;

    // F = -k*x - c*v
    const displacement = this._progress - 1;
    const force = -stiffness * displacement - damping * this._velocity;
    const acceleration = force / mass;

    this._velocity += acceleration * dt;
    this._progress += this._velocity * dt;

    this.applyStyles(this._progress);

    if (Math.abs(displacement) < 0.001 && Math.abs(this._velocity) < 0.001) {
      this._progress = 1;
      this.applyStyles(1);
      this.stepIndex++;
      this.startNextStep();
    } else {
      this.activeRaf = requestAnimationFrame((t) => this.tick(t));
    }
  }

  private applyStyles(p: number) {
    const i1 = this.stepIndex;
    const i2 = this.stepIndex + 1;
    
    const getVal = (arr: readonly number[] | undefined) => {
      if (!arr || arr.length === 0) return undefined;
      const v1 = arr[Math.min(i1, arr.length - 1)];
      const v2 = arr[Math.min(i2, arr.length - 1)];
      return v1 + (v2 - v1) * p;
    };

    const opacity = getVal(this.frames.opacity);
    if (opacity !== undefined) {
      this.host.style.opacity = `${opacity}`;
    }

    const transforms: string[] = [];
    
    const x = getVal(this.frames.x);
    if (x !== undefined) transforms.push(`translateX(${x}px)`);

    const y = getVal(this.frames.y);
    if (y !== undefined) transforms.push(`translateY(${y}px)`);

    const scale = getVal(this.frames.scale);
    if (scale !== undefined) transforms.push(`scale(${scale})`);

    const scaleX = getVal(this.frames.scaleX);
    if (scaleX !== undefined) transforms.push(`scaleX(${scaleX})`);

    const scaleY = getVal(this.frames.scaleY);
    if (scaleY !== undefined) transforms.push(`scaleY(${scaleY})`);

    const rotate = getVal(this.frames.rotate);
    if (rotate !== undefined) transforms.push(`rotate(${rotate}deg)`);

    const rotateX = getVal(this.frames.rotateX);
    if (rotateX !== undefined) transforms.push(`rotateX(${rotateX}deg)`);

    const rotateY = getVal(this.frames.rotateY);
    if (rotateY !== undefined) transforms.push(`rotateY(${rotateY}deg)`);

    if (transforms.length > 0) {
      this.host.style.transform = transforms.join(' ');
    }
  }
}
