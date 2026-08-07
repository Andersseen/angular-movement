import { Component, signal, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { provideMovement } from '../providers/provide-movement';
import { MoveAnimateDirective } from './move-animate.directive';
import { MoveAnimationDirective } from './move-animation.directive';
import { MoveEnterDirective } from './move-enter.directive';
import { MoveFocusDirective } from './move-focus.directive';
import { MoveHoverDirective } from './move-hover.directive';
import { MoveInViewDirective } from './move-in-view.directive';
import { MoveLeaveDirective } from './move-leave.directive';
import { MoveLoopDirective } from './move-loop.directive';
import { MoveParallaxDirective } from './move-parallax.directive';
import { MovePresenceDirective } from './move-presence.directive';
import { MoveScrollDirective } from './move-scroll.directive';
import { MoveTapDirective } from './move-tap.directive';
import { MoveTargetDirective } from './move-target.directive';
import { MoveTextDirective } from './move-text.directive';
import { MoveTriggerDirective } from './move-trigger.directive';
import { MoveVariantsDirective } from './move-variants.directive';

/**
 * Cross-cutting accessibility contract: when `prefers-reduced-motion: reduce` is active, no
 * directive may start a real animation.
 *
 * Asserted at the boundary that actually matters — `Element.animate()`, the single call every
 * player funnels into — rather than on internal config plumbing. A directive that resolves its
 * config correctly but still hands `disabled: false` to the engine would pass a plumbing test and
 * fail this one.
 *
 * Each case is also run with reduced motion OFF, which proves the assertion can fail.
 */

@Component({
  template: `<div [moveEnter]="{ opacity: [0, 1] }">enter</div>`,
  imports: [MoveEnterDirective],
})
class EnterHost {}

@Component({
  template: `<div [move]="{ opacity: [0, 1] }">animate</div>`,
  imports: [MoveAnimateDirective],
})
class AnimateHost {}

@Component({
  template: `
    <div [moveAnimation]="{ initial: { opacity: 0 }, animate: { opacity: 1 } }">animation</div>
  `,
  imports: [MoveAnimationDirective],
})
class AnimationHost {}

@Component({
  template: `<div [moveWhileHover]="{ scale: [1, 1.1] }">hover</div>`,
  imports: [MoveHoverDirective],
})
class HoverHost {}

@Component({
  template: `<div [moveWhileTap]="{ scale: [1, 0.9] }">tap</div>`,
  imports: [MoveTapDirective],
})
class TapHost {}

@Component({
  template: `<button [moveWhileFocus]="{ scale: [1, 1.05] }">focus</button>`,
  imports: [MoveFocusDirective],
})
class FocusHost {}

@Component({
  template: `<div [moveLoop]="{ opacity: [0, 1] }">loop</div>`,
  imports: [MoveLoopDirective],
})
class LoopHost {}

@Component({
  template: `<div [moveText]="{ opacity: [0, 1] }">split me</div>`,
  imports: [MoveTextDirective],
})
class TextHost {}

@Component({
  template: `<div [moveTarget]="true" [moveFrames]="{ opacity: [0, 1] }">target</div>`,
  imports: [MoveTargetDirective],
})
class TargetHost {}

@Component({
  template: `<div [moveTrigger]="true" [moveFrames]="{ opacity: [0, 1] }">trigger</div>`,
  imports: [MoveTriggerDirective],
})
class TriggerHost {}

@Component({
  template: `
    <div
      [moveVariants]="{ idle: { opacity: [1, 1] }, active: { opacity: [0, 1] } }"
      moveVariant="active"
    >
      variants
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class VariantsHost {}

@Component({
  template: `<div [moveInView]="{ opacity: [0, 1] }">in view</div>`,
  imports: [MoveInViewDirective],
})
class InViewHost {}

@Component({
  template: `<div [moveScroll]="{ opacity: [0, 1], y: [50, 0] }">scroll</div>`,
  imports: [MoveScrollDirective],
})
class ScrollHost {}

@Component({
  template: `<div [moveParallax]="0.4">parallax</div>`,
  imports: [MoveParallaxDirective],
})
class ParallaxHost {}

@Component({
  template: `
    <ng-container *movePresence="visible()">
      <div [moveLeave]="{ opacity: [1, 0] }">leave</div>
    </ng-container>
  `,
  imports: [MovePresenceDirective, MoveLeaveDirective],
})
class LeaveHost {
  visible = signal(true);
}

interface Case {
  name: string;
  host: Type<unknown>;
  /** Some directives only animate in response to a DOM event or a viewport intersection. */
  trigger?: (fixture: ComponentFixture<unknown>) => void;
}

const triggerOn =
  (event: string) =>
  (fixture: ComponentFixture<unknown>): void => {
    const target = fixture.debugElement.query(By.css('div, button'));
    target.triggerEventHandler(event, {});
    fixture.detectChanges();
  };

/** Viewport-driven directives only play once their IntersectionObserver reports an intersection. */
const enterViewport = (fixture: ComponentFixture<unknown>): void => {
  for (const callback of ioCallbacks) {
    callback([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver);
  }
  fixture.detectChanges();
};

const CASES: Case[] = [
  { name: 'moveEnter', host: EnterHost },
  { name: 'move / moveAnimate', host: AnimateHost },
  { name: 'moveAnimation', host: AnimationHost },
  { name: 'moveLoop', host: LoopHost },
  { name: 'moveTarget', host: TargetHost },
  { name: 'moveTrigger', host: TriggerHost },
  { name: 'moveVariants', host: VariantsHost },
  { name: 'moveWhileHover', host: HoverHost, trigger: triggerOn('mouseenter') },
  { name: 'moveWhileTap', host: TapHost, trigger: triggerOn('pointerdown') },
  { name: 'moveWhileFocus', host: FocusHost, trigger: triggerOn('focusin') },
  { name: 'moveText', host: TextHost, trigger: enterViewport },
  { name: 'moveInView', host: InViewHost, trigger: enterViewport },
  { name: 'moveScroll', host: ScrollHost, trigger: enterViewport },
  { name: 'moveParallax', host: ParallaxHost, trigger: enterViewport },
  {
    name: 'moveLeave',
    host: LeaveHost,
    trigger: (fixture) => {
      (fixture.componentInstance as LeaveHost).visible.set(false);
      fixture.detectChanges();
    },
  },
];

let ioCallbacks: IntersectionObserverCallback[] = [];

/** Captures every IntersectionObserver created, so viewport entry can be simulated. */
function stubIntersectionObserver(): void {
  ioCallbacks = [];
  class MockIntersectionObserver {
    constructor(callback: IntersectionObserverCallback) {
      ioCallbacks.push(callback);
    }
    observe = vi.fn();
    unobserve = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);
}

/** Installs a matchMedia stub reporting the given reduced-motion preference. */
function stubReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
}

/** jsdom has no WAAPI; install a spy so we can observe whether an animation was ever started. */
function stubAnimate(): ReturnType<typeof vi.fn> {
  const animate = vi.fn(() => ({
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    commitStyles: vi.fn(),
    addEventListener: vi.fn(),
    currentTime: 0,
    playState: 'running',
  }));

  Object.defineProperty(HTMLElement.prototype, 'animate', {
    value: animate,
    configurable: true,
    writable: true,
  });

  return animate;
}

/**
 * Several directives defer their first play by a microtask (`Promise.resolve().then(...)`), so the
 * fixture must be flushed before asserting — otherwise every assertion here would pass vacuously.
 */
async function render(host: Type<unknown>): Promise<ComponentFixture<unknown>> {
  TestBed.configureTestingModule({ imports: [host], providers: [provideMovement()] });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

describe('prefers-reduced-motion contract', () => {
  let animate: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    animate = stubAnimate();
    stubIntersectionObserver();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    TestBed.resetTestingModule();
  });

  describe('with reduced motion active', () => {
    for (const testCase of CASES) {
      it(`${testCase.name} starts no animation`, async () => {
        stubReducedMotion(true);

        const fixture = await render(testCase.host);
        testCase.trigger?.(fixture);

        expect(animate).not.toHaveBeenCalled();
      });
    }
  });

  describe('with reduced motion off (control — proves the assertion can fail)', () => {
    for (const testCase of CASES) {
      it(`${testCase.name} does start an animation`, async () => {
        stubReducedMotion(false);

        const fixture = await render(testCase.host);
        testCase.trigger?.(fixture);

        expect(animate).toHaveBeenCalled();
      });
    }
  });

  it('still applies the final visual state so the UI is not left mid-transition', async () => {
    stubReducedMotion(true);

    const fixture = await render(EnterHost);
    const host = fixture.debugElement.query(By.directive(MoveEnterDirective))
      .nativeElement as HTMLElement;

    // The element must look finished, not stuck at the initial keyframe.
    expect(host.style.opacity).toBe('1');
  });
});
