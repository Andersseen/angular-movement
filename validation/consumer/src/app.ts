import {
  ChangeDetectionStrategy,
  Component,
  inject,
  Injector,
  signal,
  type Signal,
} from '@angular/core';
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
  MOVE_PRESETS,
  moveIconBounce,
  moveIconPulse,
  moveIconRotate,
  moveIconShake,
  movePathDraw,
  moveSpringValue,
  moveTransform,
  moveValue,
  type MoveAnimateOptions,
  type MoveKeyframes,
  type MovePreset,
  type MovePresenceForMode,
  type MoveSpringValueConfig,
  type MoveTransitionConfig,
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
        *movePresenceFor="let row of rows(); trackBy: trackRow; mode: listMode; let i = index"
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

    <!-- Repeat controls: the loop inputs frozen for 1.0 -->
    <div [moveLoop]="'pulse'" moveLoopType="reverse" [moveLoopDelay]="150" [moveLoopCount]="4">
      repeat controls
    </div>

    <!-- Per-property transition config -->
    <div [moveVariants]="variants" [moveVariant]="variant()" [moveTransition]="transition">
      transition config
    </div>

    <!-- Icon helpers returning MoveKeyframes, on SVG geometry -->
    <svg viewBox="0 0 24 24">
      <path [moveTarget]="on()" [moveFrames]="pathDraw" d="M2 12 L22 12" />
      <circle [moveEnter]="iconPulse" cx="12" cy="12" r="6" />
    </svg>
    <div [moveEnter]="iconBounce">bounce</div>
    <div [moveEnter]="iconShake">shake</div>
    <div [moveEnter]="iconRotate">rotate</div>

    <!-- Signal helpers -->
    <div [style.transform]="'translateX(' + x() + 'px)'">{{ springX() }}</div>
    <!-- moveTransform's string/unit overload must infer Signal<string>, not Signal<number> -->
    <div [style.width]="width()">{{ inferredSpring() }}</div>
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
  /** The mode union has to be nameable and assignable from a consumer, not just inline. */
  protected readonly listMode: MovePresenceForMode = 'wait';

  readonly #animator = inject(MoveAnimator);

  /** Per-property transition config, shared by the variants host above. */
  protected readonly transition: MoveTransitionConfig = {
    duration: 300,
    easing: 'ease-out',
    opacity: { duration: 150, delay: 50 },
    times: [0, 1],
  };

  // Icon helpers: each returns MoveKeyframes, so they must bind straight into a directive input.
  protected readonly pathDraw: MoveKeyframes = movePathDraw({ opacity: [0, 1] });
  protected readonly iconPulse: MoveKeyframes = moveIconPulse();
  protected readonly iconBounce: MoveKeyframes = moveIconBounce();
  protected readonly iconShake: MoveKeyframes = moveIconShake();
  protected readonly iconRotate: MoveKeyframes = moveIconRotate();

  /** The preset table has to stay indexable by MovePreset from a consumer. */
  protected readonly zoomIn = MOVE_PRESETS['zoom-in'];

  protected readonly progress = moveValue(0);
  protected readonly x = moveTransform(this.progress, [0, 1], [0, 200]);
  protected readonly springX = moveSpringValue(this.x, {
    stiffness: 170,
    damping: 20,
    injector: this.#injector,
  });

  /**
   * The string overload must resolve to `Signal<string>` — assigning it to `Signal<number>` (or
   * binding it where a number is required) has to fail, which is what pins the overload order.
   */
  protected readonly width: Signal<string> = moveTransform(this.progress, [0, 1], ['0px', '200px']);

  /**
   * No `injector` in config: a field initializer runs inside the component's own injection
   * context, so `moveSpringValue` infers it. This is the 0.9 DX contract being frozen for 1.x.
   */
  protected readonly inferredSpring = moveSpringValue(this.x, this.springConfig());

  private springConfig(): MoveSpringValueConfig {
    return { stiffness: 120, damping: 18, precision: 0.01 };
  }

  protected onDragEnd(): void {
    this.on.update((value) => !value);
  }

  /** The imperative entry point has to be callable from a plain consumer, not just internally. */
  protected async animateImperatively(element: HTMLElement): Promise<void> {
    // Built as a named MoveAnimateOptions so the options type stays nameable, not just inferrable
    // from an inline literal.
    const options: MoveAnimateOptions = {
      duration: 200,
      easing: 'ease-out',
      spring: { stiffness: 170, damping: 20 },
      transition: this.transition,
      onDone: () => undefined,
    };

    await this.#animator.animate(element, this.frames, options)?.finished;
  }
}
