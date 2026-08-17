import { AnimationControls } from './animation-controls';

/**
 * Presents several players as one.
 *
 * Per-property easing cannot be expressed in a single WAAPI animation — a keyframe's `easing`
 * applies to every property in that segment — so properties with different easings run as separate
 * animations. Callers still hold one handle, so `cancel()` in `ngOnDestroy` cannot leak half of them.
 */
export class CompositeAnimationControls implements AnimationControls {
  readonly #players: AnimationControls[];

  constructor(players: readonly (AnimationControls | null)[]) {
    this.#players = players.filter((player): player is AnimationControls => player !== null);
  }

  get size(): number {
    return this.#players.length;
  }

  play(): void {
    for (const player of this.#players) player.play();
  }

  pause(): void {
    for (const player of this.#players) player.pause();
  }

  cancel(): void {
    for (const player of this.#players) player.cancel();
  }

  /** The longest-running member, so scrubbing reads the timeline the caller sees. */
  get currentTime(): number {
    let max = 0;
    for (const player of this.#players) {
      max = Math.max(max, player.currentTime);
    }
    return max;
  }

  set currentTime(time: number) {
    for (const player of this.#players) player.currentTime = time;
  }

  get finished(): Promise<void> {
    return Promise.all(this.#players.map((player) => player.finished)).then(() => undefined);
  }
}
