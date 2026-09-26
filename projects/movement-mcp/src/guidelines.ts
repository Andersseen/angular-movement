import type { Guideline } from './types.js';

/**
 * Conventions an agent cannot derive from selectors and input names alone — each one a mistake
 * found in real apps that consume angular-movement (spec 014's consumer audit). Kept short on
 * purpose: this is served verbatim to agents.
 */
export const GUIDELINES: Guideline[] = [
  {
    topic: 'imports',
    rule: 'Import the directives a component uses (usually one to three). Do not use MOVEMENT_DIRECTIVES for a component that uses a few directives — it pulls in all 21, experimental ones included.',
    example: `imports: [MoveHoverDirective, MoveTapDirective]`,
  },
  {
    topic: 'timing units',
    rule: 'Every duration, delay and stagger takes a MoveTime: a number is ALWAYS milliseconds; a string states its unit ("80ms", "0.08s"). [moveStaggerStep]="0.08" means 0.08 milliseconds, not seconds. Prefer unit strings on static attributes.',
    example: `<ul moveStagger moveStaggerStep="80ms">…</ul>`,
  },
  {
    topic: 'interaction presets',
    rule: 'Use the lift preset for hover and press for tap instead of hand-written literals. They animate different channels (translate vs scale) so they compose on one element. Tap keyframes should have two values: a three-value tap like { scale: [1, 0.97, 1] } replays on release.',
    example: `<button moveWhileHover="lift" moveWhileTap="press">Save</button>`,
  },
  {
    topic: 'touch',
    rule: 'moveWhileHover responds to mouse and pen only — touch never triggers hover. For touch feedback add moveWhileTap. Neither calls preventDefault(), so they are safe on links and scrollable content.',
  },
  {
    topic: 'reduced motion',
    rule: 'prefers-reduced-motion is honoured automatically. Do not query matchMedia and pass it to provideMovement({ disabled }). disabled is an app-level kill switch; moveDisabled disables one element. Nothing needs disabling for SSR — directives are no-ops on the server.',
    example: `provideMovement({ duration: '320ms', easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })`,
  },
  {
    topic: 'imperative animation',
    rule: 'From TypeScript use MoveAnimator (inject(MoveAnimator)): animate(target, keyframes, options) accepts an Element or ElementRef; set() commits a state instantly; clear() removes inline styles. Do not create a template element with moveTrigger just to get an imperative handle. moveTarget/moveTrigger are experimental and meant for declarative trigger relationships.',
    example: `await this.#animator.animate(this.panel(), { opacity: [0, 1] }, { duration: '200ms' })?.finished;`,
  },
  {
    topic: 'cancellation',
    rule: 'AnimationControls.finished and moveTrigger.play() always resolve, never reject — including on cancel. No try/catch is needed around await.',
  },
  {
    topic: 'view transitions',
    rule: 'Animate View Transition pseudo-elements with MoveAnimator and the pseudoElement option instead of raw element.animate(). It is skipped under reduced motion and a no-op where unsupported.',
    example: `animator.animate(document.documentElement, { clipPath: [from, to] }, { duration: '520ms', pseudoElement: '::view-transition-new(root)' })`,
  },
  {
    topic: 'keyframes',
    rule: 'Keyframes are value arrays ({ opacity: [0, 1] }), except [moveAnimation] states which are single values. Any CSS property WAAPI can animate passes through (clipPath, filter, borderRadius, …).',
  },
  {
    topic: 'first paint',
    rule: 'The library runs after hydration. An above-the-fold entrance that must animate at first paint belongs in CSS; do not hide content in CSS expecting a directive to reveal it.',
  },
];
