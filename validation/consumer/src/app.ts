import { ChangeDetectionStrategy, Component, inject, Injector, signal } from '@angular/core';
import {
  MoveAnimateDirective,
  MoveAnimationDirective,
  MoveDragDirective,
  MoveEnterDirective,
  MoveFocusDirective,
  MoveHoverDirective,
  MoveInViewDirective,
  MoveLayoutDirective,
  MoveLeaveDirective,
  MoveLoopDirective,
  MoveParallaxDirective,
  MovePresenceDirective,
  MovePresenceForDirective,
  MoveScrollDirective,
  MoveStaggerDirective,
  MoveTapDirective,
  MoveTargetDirective,
  MoveTextDirective,
  MoveTriggerDirective,
  MoveVariantsDirective,
  MoveAnimator,
  moveSpringValue,
  moveTransform,
  moveValue,
  type MoveKeyframes,
  type MovePreset,
  type MoveVariant,
} from 'angular-movement';

/**
 * Exercises the **published package** the way a real consumer does: importing from
 * `angular-movement` rather than through the monorepo's Vite source alias, and compiling every
 * template ahead of time.
 *
 * AOT is the point. It type-checks each binding against the shipped `.d.ts`, so a missing export,
 * a renamed selector, or an input whose declared type no longer matches its usage fails the build
 * here — none of which the demo site can catch, because it never touches the built package.
 */
@Component({
  selector: 'app-root',
  imports: [
    MoveAnimateDirective,
    MoveAnimationDirective,
    MoveDragDirective,
    MoveEnterDirective,
    MoveFocusDirective,
    MoveHoverDirective,
    MoveInViewDirective,
    MoveLayoutDirective,
    MoveLeaveDirective,
    MoveLoopDirective,
    MoveParallaxDirective,
    MovePresenceDirective,
    MovePresenceForDirective,
    MoveScrollDirective,
    MoveStaggerDirective,
    MoveTapDirective,
    MoveTargetDirective,
    MoveTextDirective,
    MoveTriggerDirective,
    MoveVariantsDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 [moveEnter]="preset">angular-movement consumer</h1>

    <!-- Keyframes and presets, both binding shapes -->
    <div [move]="frames">shorthand</div>
    <div [moveEnter]="'fade-up'" [moveDuration]="400" moveEasing="ease-out">enter</div>
    <div [moveAnimation]="{ initial: { opacity: 0 }, animate: { opacity: 1 } }">animation</div>

    <!-- Attribute-style inputs must coerce -->
    <div moveEnter="fade-up" moveDuration="400" moveDelay="50">coerced attributes</div>

    <!-- Interaction -->
    <button [moveWhileHover]="{ scale: [1, 1.05] }" [moveWhileTap]="{ scale: [1, 0.95] }">
      hover / tap
    </button>
    <button [moveWhileFocus]="{ scale: [1, 1.05] }">focus</button>
    <div [moveTarget]="on()" [moveFrames]="frames">target</div>
    <div [moveTrigger]="on()" [moveFrames]="frames" moveResetState="clear">trigger</div>

    <!-- Viewport and scroll -->
    <div [moveInView]="frames" [moveInViewOnce]="true" moveInViewMargin="0px">in view</div>
    <section #scroll="moveScroll" [moveScroll]="frames" [moveScrollOffset]="['0 1', '1 0']">
      {{ scroll.progress() }}
    </section>
    <div #par="moveParallax" [moveParallax]="0.4" moveParallaxAxis="y">{{ par.progress() }}</div>

    <!-- Orchestration -->
    <ul [moveStagger]="80" moveStaggerDirection="center">
      @for (item of items; track item) {
        <li [moveEnter]="frames">{{ item }}</li>
      }
    </ul>

    <div [moveVariants]="variants" [moveVariant]="variant()">variants</div>

    <ng-container *movePresence="on()">
      <div [moveLeave]="{ opacity: [1, 0] }">leaves through presence</div>
    </ng-container>

    <!-- Keyed-list presence: microsyntax + context must type-check against the shipped .d.ts -->
    <ul>
      <li
        *movePresenceFor="let row of rows(); trackBy: trackRow; mode: 'wait'; let i = index"
        [moveAnimation]="{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }"
      >
        {{ i }}: {{ row.label }}
      </li>
    </ul>

    <!-- Layout, drag, text, loop -->
    <div moveLayout [moveLayoutId]="'card'">layout</div>
    <div
      moveDrag
      [moveDragConstraints]="{ left: -100, right: 100 }"
      [moveDragElastic]="0.2"
      (moveDragEnd)="onDragEnd()"
    >
      drag
    </div>
    <p [moveText]="'fade-up'" moveTextSplit="chars" [moveTextStagger]="30">split text</p>
    <div [moveLoop]="frames" [moveDuration]="1000">loop</div>

    <!-- Signal helpers -->
    <div [style.transform]="'translateX(' + x() + 'px)'">{{ springX() }}</div>
  `,
})
export class App {
  readonly #injector = inject(Injector);

  protected readonly preset: MovePreset = 'fade-up';
  protected readonly frames: MoveKeyframes = { opacity: [0, 1], y: [24, 0] };
  protected readonly items = ['a', 'b', 'c'];
  protected readonly on = signal(true);
  protected readonly variant = signal('idle');

  protected readonly variants: Record<string, MoveVariant> = {
    idle: { opacity: [1, 1] },
    active: { opacity: [0, 1], scale: [0.9, 1] },
  };

  protected readonly rows = signal([{ id: 1, label: 'first' }]);
  protected readonly trackRow = (_index: number, row: { id: number }) => row.id;

  readonly #animator = inject(MoveAnimator);

  protected readonly progress = moveValue(0);
  protected readonly x = moveTransform(this.progress, [0, 1], [0, 200]);
  protected readonly springX = moveSpringValue(this.x, {
    stiffness: 170,
    damping: 20,
    injector: this.#injector,
  });

  protected onDragEnd(): void {
    this.on.update((value) => !value);
  }

  /** The imperative entry point has to be callable from a plain consumer, not just internally. */
  protected async animateImperatively(element: HTMLElement): Promise<void> {
    await this.#animator.animate(element, this.frames, { duration: 200 })?.finished;
  }
}
