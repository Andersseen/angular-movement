export interface AnimationControls {
  play(): void;
  pause(): void;
  cancel(): void;
  currentTime: number;
  readonly finished: Promise<void>;
}
