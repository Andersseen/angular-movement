/**
 * Stable API — covered by semantic-versioning guarantees.
 *
 * The universal handle every animation returns, whether it comes from a directive internally or
 * from `MoveAnimator.animate()`.
 *
 * @stability stable
 */
export interface AnimationControls {
  play(): void;
  pause(): void;
  cancel(): void;
  currentTime: number;
  readonly finished: Promise<void>;
}
