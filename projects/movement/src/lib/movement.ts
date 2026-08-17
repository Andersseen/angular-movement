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
 * All directives the library ships, ready to spread into a standalone component's `imports`.
 *
 * Prefer importing only the directives a component actually uses — it keeps route-level
 * tree-shaking effective.
 *
 * @stability stable
 */
export const MOVEMENT_DIRECTIVES = [
  MoveEnterDirective,
  MoveLeaveDirective,
  MoveAnimateDirective,
  MoveHoverDirective,
  MoveTapDirective,
  MoveVariantsDirective,
  MoveStaggerDirective,
  MoveLayoutDirective,
  MoveScrollDirective,
  MovePresenceDirective,
  MovePresenceForDirective,
  MoveDragDirective,
  MoveInViewDirective,
  MoveTextDirective,
  MoveSmoothScrollDirective,
  MoveFocusDirective,
  MoveParallaxDirective,
  MoveAnimationDirective,
  MoveLoopDirective,
  MoveTargetDirective,
  MoveTriggerDirective,
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
