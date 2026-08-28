import { MoveAnimateDirective } from './directives/move-animate.directive';
import { MoveAnimationDirective } from './directives/move-animation.directive';
import { MoveEnterDirective } from './directives/move-enter.directive';
import { MoveLeaveDirective } from './directives/move-leave.directive';
import { MoveHoverDirective } from './directives/move-hover.directive';
import { MoveTapDirective } from './directives/move-tap.directive';
import { MoveVariantsDirective } from './directives/move-variants.directive';
import { MoveStaggerDirective } from './directives/move-stagger.directive';
import { MoveLayoutDirective } from './directives/move-layout.directive';
import { MoveScrollDirective } from './directives/move-scroll.directive';
import { MovePresenceDirective } from './directives/move-presence.directive';
import { MovePresenceForDirective } from './directives/move-presence-for.directive';
import { MoveDragDirective } from './directives/move-drag.directive';
import { MoveInViewDirective } from './directives/move-in-view.directive';
import { MoveTextDirective } from './directives/move-text.directive';
import { MoveSmoothScrollDirective } from './scroll/move-smooth-scroll.directive';
import { MoveFocusDirective } from './directives/move-focus.directive';
import { MoveParallaxDirective } from './directives/move-parallax.directive';
import { MoveLoopDirective } from './directives/move-loop.directive';
import { MoveTargetDirective } from './directives/move-target.directive';
import { MoveTriggerDirective } from './directives/move-trigger.directive';

/**
 * Every public declaration carries a `@stability` JSDoc tag so the guarantee is visible in the IDE,
 * not just in the README table:
 *
 * - `@stability stable` — semantic-versioning guarantees apply.
 * - `@stability candidate` — feature-complete; small naming/behaviour adjustments possible before 1.0.
 * - `@stability experimental` — may change significantly between minor versions (also `@experimental`).
 *
 * The authoritative summary lives in the "API stability" table in `README.md`.
 */

/**
 * Every stable directive — none of these change behavior or shape outside a major version.
 *
 * Prefer importing only the directives a component actually uses — it keeps route-level
 * tree-shaking effective. Use this aggregate (rather than {@link MOVEMENT_DIRECTIVES}) when you
 * want a stability-pure `imports` array that can never silently start pulling in an experimental
 * directive.
 *
 * @stability stable
 */
export const MOVEMENT_STABLE_DIRECTIVES = [
  MoveEnterDirective,
  MoveLeaveDirective,
  MoveAnimateDirective,
  MoveHoverDirective,
  MoveTapDirective,
  MoveVariantsDirective,
  MoveStaggerDirective,
  MoveScrollDirective,
  MovePresenceDirective,
  MovePresenceForDirective,
  MoveInViewDirective,
  MoveTextDirective,
  MoveFocusDirective,
  MoveParallaxDirective,
  MoveAnimationDirective,
  MoveLoopDirective,
] as const;

/**
 * Every experimental directive — may change or be removed in any `1.x` minor. See the
 * "Experimental compatibility policy" in `README.md` / `docs/ai/ARCHITECTURE.md`.
 *
 * @stability experimental
 * @experimental
 */
export const MOVEMENT_EXPERIMENTAL_DIRECTIVES = [
  MoveLayoutDirective,
  MoveDragDirective,
  MoveSmoothScrollDirective,
  MoveTargetDirective,
  MoveTriggerDirective,
] as const;

/**
 * All directives the library ships (every {@link MOVEMENT_STABLE_DIRECTIVES} plus every
 * {@link MOVEMENT_EXPERIMENTAL_DIRECTIVES} member), ready to spread into a standalone component's
 * `imports`.
 *
 * This aggregate itself is stable — spreading it will always compile and its own shape follows
 * SemVer — but its **contents** are not stability-pure: it includes experimental directives, whose
 * individual behavior may change in a `1.x` minor. Prefer importing only the directives a
 * component actually uses (best for tree-shaking), or {@link MOVEMENT_STABLE_DIRECTIVES} if you
 * want a spread that can never pull in an experimental directive.
 *
 * @stability stable
 */
export const MOVEMENT_DIRECTIVES = [
  ...MOVEMENT_STABLE_DIRECTIVES,
  ...MOVEMENT_EXPERIMENTAL_DIRECTIVES,
] as const;

export * from './directives/move-animate.directive';
export * from './directives/move-enter.directive';
export * from './directives/move-leave.directive';
export * from './directives/move-hover.directive';
export * from './directives/move-tap.directive';
export * from './directives/move-variants.directive';
export * from './directives/move-stagger.directive';
export * from './directives/move-layout.directive';
export * from './directives/move-scroll.directive';
export * from './directives/move-presence.directive';
export * from './directives/move-presence-for.directive';
export * from './directives/move-drag.directive';
export * from './directives/move-in-view.directive';
export * from './directives/move-text.directive';
export * from './directives/move-focus.directive';
export * from './directives/move-parallax.directive';
export * from './directives/move-animation.directive';
export * from './directives/move-loop.directive';
export * from './directives/move-target.directive';
export * from './directives/move-trigger.directive';
export * from './scroll/smooth-scroll.service';
export * from './scroll/move-smooth-scroll.directive';
export * from './engines/animation-controls';
export * from './engines/move-animator.service';
export * from './presets/presets';
export * from './presets/presets.types';
export * from './presets/icon-helpers';
export * from './values/move-values';
export * from './providers/provide-movement';
export * from './tokens/movement.tokens';
