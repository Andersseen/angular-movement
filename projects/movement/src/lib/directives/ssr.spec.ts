import { Component, PLATFORM_ID, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { provideMovement } from '../providers/provide-movement';
import { MoveAnimateDirective } from './move-animate.directive';
import { MoveAnimationDirective } from './move-animation.directive';
import { MoveDragDirective } from './move-drag.directive';
import { MoveEnterDirective } from './move-enter.directive';
import { MoveFocusDirective } from './move-focus.directive';
import { MoveHoverDirective } from './move-hover.directive';
import { MoveInViewDirective } from './move-in-view.directive';
import { MoveLayoutDirective } from './move-layout.directive';
import { MoveLoopDirective } from './move-loop.directive';
import { MoveParallaxDirective } from './move-parallax.directive';
import { MovePresenceDirective } from './move-presence.directive';
import { MoveScrollDirective } from './move-scroll.directive';
import { MoveStaggerDirective } from './move-stagger.directive';
import { MoveTapDirective } from './move-tap.directive';
import { MoveTargetDirective } from './move-target.directive';
import { MoveTextDirective } from './move-text.directive';
import { MoveTriggerDirective } from './move-trigger.directive';
import { MoveVariantsDirective } from './move-variants.directive';

/**
 * Cross-cutting SSR contract: on the server no directive may throw, and none may reach for a
 * browser-only API. Angular Universal has no `IntersectionObserver`, no `requestAnimationFrame` and
 * no `Element.animate`; touching one crashes the render for the whole page, not just the element.
 *
 * The library is consumed through AnalogJS with SSR on, so this is a shipping requirement.
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
  template: `<div [moveInView]="{ opacity: [0, 1] }">in view</div>`,
  imports: [MoveInViewDirective],
})
class InViewHost {}

@Component({
  template: `<div [moveScroll]="{ opacity: [0, 1] }">scroll</div>`,
  imports: [MoveScrollDirective],
})
class ScrollHost {}

@Component({
  template: `<div [moveParallax]="0.4">parallax</div>`,
  imports: [MoveParallaxDirective],
})
class ParallaxHost {}

@Component({
  template: `<div moveDrag>drag</div>`,
  imports: [MoveDragDirective],
})
class DragHost {}

@Component({
  template: `<div moveLayout>layout</div>`,
  imports: [MoveLayoutDirective],
})
class LayoutHost {}

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
  template: ` <div [moveVariants]="{ a: { opacity: [0, 1] } }" moveVariant="a">variants</div> `,
  imports: [MoveVariantsDirective],
})
class VariantsHost {}

@Component({
  template: `
    <ul moveStagger>
      @for (item of [1, 2, 3]; track item) {
        <li [moveEnter]="{ opacity: [0, 1] }">{{ item }}</li>
      }
    </ul>
  `,
  imports: [MoveStaggerDirective, MoveEnterDirective],
})
class StaggerHost {}

@Component({
  template: `
    <ng-container *movePresence="true">
      <div [move]="{ opacity: [0, 1] }">presence</div>
    </ng-container>
  `,
  imports: [MovePresenceDirective, MoveAnimateDirective],
})
class PresenceHost {}

const HOSTS: { name: string; host: Type<unknown> }[] = [
  { name: 'moveEnter', host: EnterHost },
  { name: 'move / moveAnimate', host: AnimateHost },
  { name: 'moveAnimation', host: AnimationHost },
  { name: 'moveLoop', host: LoopHost },
  { name: 'moveText', host: TextHost },
  { name: 'moveInView', host: InViewHost },
  { name: 'moveScroll', host: ScrollHost },
  { name: 'moveParallax', host: ParallaxHost },
  { name: 'moveDrag', host: DragHost },
  { name: 'moveLayout', host: LayoutHost },
  { name: 'moveWhileHover', host: HoverHost },
  { name: 'moveWhileTap', host: TapHost },
  { name: 'moveWhileFocus', host: FocusHost },
  { name: 'moveTarget', host: TargetHost },
  { name: 'moveTrigger', host: TriggerHost },
  { name: 'moveVariants', host: VariantsHost },
  { name: 'moveStagger', host: StaggerHost },
  { name: 'movePresence', host: PresenceHost },
];

@Component({ template: `<div>no directives</div>` })
class BareHost {}

describe('server-side rendering contract', () => {
  /** Counters rather than spies: any excess over the baseline is a browser API reached on the server. */
  let touched: { animate: number; intersectionObserver: number; raf: number };

  /**
   * Angular's own zoneless scheduler calls `requestAnimationFrame` once per fixture, even for a
   * component with no directives at all (measured, not assumed). Comparing against a live baseline
   * keeps this spec honest if Angular changes its scheduling, instead of hard-coding a magic number.
   */
  let rafBaseline = 0;

  beforeEach(() => {
    touched = { animate: 0, intersectionObserver: 0, raf: 0 };

    Object.defineProperty(HTMLElement.prototype, 'animate', {
      value: () => {
        touched.animate++;
        return null;
      },
      configurable: true,
      writable: true,
    });

    class TrackingIntersectionObserver {
      constructor() {
        touched.intersectionObserver++;
      }
      observe = () => undefined;
      unobserve = () => undefined;
      disconnect = () => undefined;
    }
    vi.stubGlobal('IntersectionObserver', TrackingIntersectionObserver);
    vi.stubGlobal('requestAnimationFrame', () => {
      touched.raf++;
      return 1;
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    TestBed.resetTestingModule();
  });

  it('measures the framework-only baseline for requestAnimationFrame', async () => {
    TestBed.configureTestingModule({
      imports: [BareHost],
      providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
    });

    const fixture = TestBed.createComponent(BareHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    rafBaseline = touched.raf;

    expect(touched.animate).toBe(0);
    expect(touched.intersectionObserver).toBe(0);
  });

  for (const { name, host } of HOSTS) {
    it(`${name} renders on the server without touching browser APIs`, async () => {
      TestBed.configureTestingModule({
        imports: [host],
        providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
      });

      const fixture = TestBed.createComponent(host);

      expect(() => fixture.detectChanges()).not.toThrow();
      await fixture.whenStable();
      expect(() => fixture.detectChanges()).not.toThrow();

      // WAAPI and IntersectionObserver do not exist on the server at all.
      expect(touched.animate).toBe(0);
      expect(touched.intersectionObserver).toBe(0);
      // The directive must not add any rAF work of its own on top of Angular's.
      expect(touched.raf).toBeLessThanOrEqual(rafBaseline);

      expect(() => fixture.destroy()).not.toThrow();
    });
  }

  it('renders presence content on the server so it is present in the HTML', async () => {
    TestBed.configureTestingModule({
      imports: [PresenceHost],
      providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
    });

    const fixture = TestBed.createComponent(PresenceHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Content hidden on the server would be missing from the SSR payload and hurt SEO.
    expect(fixture.nativeElement.textContent).toContain('presence');
  });
});
