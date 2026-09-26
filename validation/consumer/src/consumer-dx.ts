import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core';
import {
  MoveAnimationDirective,
  MoveAnimator,
  MoveHoverDirective,
  MoveLoopDirective,
  MoveTextDirective,
  MoveInViewDirective,
  MoveStaggerDirective,
  MoveTapDirective,
  MoveTriggerDirective,
  moveTimeToMs,
  provideMovement,
  type AnimationControls,
  type MoveAnimateOptions,
  type MoveAnimationConfig,
  type MoveRepeatOptions,
  type MoveAnimationTarget,
  type MovementConfigInput,
  type MovePreset,
  type MoveTime,
  type MoveTransitionConfig,
  type MoveVariant,
} from 'angular-movement';

/**
 * 1.2 consumer-DX surface, compiled against the packed package (spec 014): the patterns the
 * consumer audit found most common, written the way the docs now teach them.
 */
@Component({
  selector: 'app-consumer-dx',
  imports: [
    MoveHoverDirective,
    MoveTapDirective,
    MoveInViewDirective,
    MoveStaggerDirective,
    MoveTriggerDirective,
    MoveAnimationDirective,
    MoveLoopDirective,
    MoveTextDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- Interaction presets, composed on one element -->
    <a href="/pricing" moveWhileHover="lift" moveWhileTap="press">Pricing</a>
    <button [moveWhileHover]="lift" [moveWhileTap]="press">Buy</button>

    <!-- Product card -->
    <article moveInView="fade-up" moveWhileHover="lift">card</article>

    <!-- Every timing spelling a template can use -->
    <ul moveStagger moveStaggerStep="80ms">
      <li>ms</li>
    </ul>
    <ul moveStagger moveStaggerStep="0.08s">
      <li>s</li>
    </ul>
    <ul moveStagger [moveStaggerStep]="80">
      <li>number</li>
    </ul>
    <ul moveStagger="80ms">
      <li>stagger</li>
    </ul>
    <button moveWhileHover="lift" moveDuration="0.2s" moveReverseDuration="120ms">timed</button>

    <div [moveLoop]="'pulse'" moveLoopDelay="150ms" moveDuration="0.8s">loop</div>
    <p moveText="fade-up" moveTextStagger="30ms">split</p>
    <div [moveAnimation]="animationConfig">state object</div>

    <!-- Imperative-only trigger: no dummy [moveTrigger] / [moveFrames] -->
    <div #overlay="moveTrigger" moveTrigger></div>

    <div #card>card</div>
  `,
})
export class ConsumerDx {
  readonly #animator = inject(MoveAnimator);

  protected readonly lift: MovePreset = 'lift';
  protected readonly press: MovePreset = 'press';

  protected readonly overlay = viewChild.required<MoveTriggerDirective>('overlay');
  protected readonly card = viewChild.required<ElementRef<HTMLElement>>('card');

  /** MoveTime is nameable and accepts all three spellings. */
  protected readonly times: MoveTime[] = [80, '80ms', '0.08s'];
  protected readonly stepMs: number = moveTimeToMs('0.08s');

  /** provideMovement's input accepts MoveTime; the injected config stays numeric. */
  protected readonly config: MovementConfigInput = { duration: '320ms', delay: '0.05s' };
  protected readonly providers = provideMovement(this.config);

  protected readonly variants: Record<string, MoveVariant> = {
    open: { opacity: [0, 1], duration: '0.3s', delay: 40, staggerChildren: '60ms' },
  };

  protected readonly animationConfig: MoveAnimationConfig = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    duration: '0.3s',
    delay: '40ms',
  };

  protected readonly repeat: MoveRepeatOptions = { repeat: 3, repeatDelay: '0.1s' };

  protected readonly transition: MoveTransitionConfig = {
    duration: '0.3s',
    opacity: { duration: '150ms', delay: 20 },
    repeat: 2,
    repeatType: 'reverse',
    repeatDelay: '100ms',
  };

  protected readonly options: MoveAnimateOptions = {
    duration: '180ms',
    delay: 0,
    easing: 'ease-out',
    transition: this.transition,
  };

  protected readonly badOptions: MoveAnimateOptions = {
    // @ts-expect-error — MoveTime is not an arbitrary string.
    duration: 'fast',
  };

  /** Imperative trigger with per-call options. */
  protected async flash(): Promise<void> {
    await this.overlay().play({ opacity: [0, 1] }, { duration: '180ms' });
    await this.overlay().play({ opacity: [1, 0] }, this.options);
  }

  /** MoveAnimator: ElementRef targets, set/clear, arbitrary CSS, pseudo-elements. */
  protected async animate(): Promise<void> {
    const target: MoveAnimationTarget = this.card();
    const controls: AnimationControls | null = this.#animator.animate(
      target,
      { clipPath: ['inset(0 100% 0 0)', 'inset(0 0% 0 0)'], borderRadius: ['0px', '12px'] },
      this.options,
    );
    await controls?.finished;

    this.#animator.set(this.card(), { opacity: 0.5, y: 8, filter: 'saturate(0.5)' });
    this.#animator.clear(this.card(), ['opacity', 'y']);
    this.#animator.clear(this.card().nativeElement);

    this.#animator.animate(
      document.documentElement,
      { clipPath: ['circle(0px at 0px 0px)', 'circle(900px at 0px 0px)'] },
      { duration: '520ms', pseudoElement: '::view-transition-new(root)' },
    );
  }
}
