import { AnimationControls } from './animation-controls';

/**
 * Internal bookkeeping only — never exported from the public barrel.
 *
 * Tracks, per host element, the most recent `AnimationControls` handed out by
 * `AnimationEngine.play()`. This exists for exactly one purpose: letting `MoveDragDirective`
 * unconditionally preempt an in-flight engine-driven animation (hover/tap/focus/variants/layout/
 * animate/loop) the instant a drag gesture starts on the same element, instead of racing it — see
 * "Transform ownership and composition" in `docs/ai/ARCHITECTURE.md`.
 *
 * Deliberately not used the other way around (a new engine-driven animation does not cancel a
 * previous one on the same element): two WAAPI animations composing concurrently on different
 * properties is normal, desired layering, not a conflict to resolve.
 */
const activePlayers = new WeakMap<Element, AnimationControls>();

/**
 * Registers `controls` as the host's current engine-driven player, replacing whatever was
 * registered before. Self-clears once the player settles, so a stale reference is never handed
 * back to a later caller.
 */
export function registerActivePlayer(host: Element, controls: AnimationControls | null): void {
  if (!controls) {
    activePlayers.delete(host);
    return;
  }

  activePlayers.set(host, controls);
  void controls.finished.then(() => {
    if (activePlayers.get(host) === controls) {
      activePlayers.delete(host);
    }
  });
}

/**
 * Cancels the host's currently-registered engine-driven player, if any. Safe to call
 * unconditionally — a no-op when nothing is registered or the player already settled.
 */
export function cancelActivePlayer(host: Element): void {
  const controls = activePlayers.get(host);
  if (!controls) return;

  activePlayers.delete(host);
  controls.cancel();
}
