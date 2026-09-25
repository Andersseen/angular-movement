/**
 * The universal handle every animation returns, whether it comes from a directive internally or
 * from `MoveAnimator.animate()`.
 *
 * **`finished` always resolves and never rejects.** It settles when the animation:
 *
 * - finishes naturally (the end state has been committed to inline styles);
 * - is cancelled through `cancel()` — including the replacement case, since every directive and
 *   `MoveTriggerDirective.play()` cancel their previous player before starting a new one;
 * - is preempted (a `moveDrag` gesture starting on the element);
 * - is torn down with its owner (directives cancel in `ngOnDestroy`);
 * - is cancelled by something else, e.g. a skipped View Transition removing its pseudo-elements.
 *
 * So `await controls.finished` needs no `try/catch`, and code after it runs in every case. It does
 * not tell completion and cancellation apart; when that matters, track it in application state.
 * (Raw WAAPI differs: `Animation.finished` rejects with an `AbortError` on cancel.)
 *
 * Stable API — covered by semantic-versioning guarantees.
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
