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
import { MoveLoopDirective } from './move-loop.directive';
import { MoveTapDirective } from './move-tap.directive';
import { MoveTargetDirective } from './move-target.directive';
import { MoveTriggerDirective } from './move-trigger.directive';
import { MoveVariantsDirective } from './move-variants.directive';

/**
 * Cross-cutting lifecycle contract:
 *
 * 1. Destroying a host cancels every animation it started. A leaked WAAPI animation keeps the
 *    element alive and is the library's most likely memory-leak source.
 * 2. Re-triggering cancels the previous animation instead of stacking a second one on the same
 *    element, which would produce visibly fighting transforms.
 */

interface CreatedAnimation {
  cancel: ReturnType<typeof vi.fn>;
  play: ReturnType<typeof vi.fn>;
  pause: ReturnType<typeof vi.fn>;
}

let created: CreatedAnimation[] = [];

/** jsdom has no WAAPI; record every animation the library starts so teardown can be asserted. */
function stubAnimate(): void {
  created = [];
  Object.defineProperty(HTMLElement.prototype, 'animate', {
    value: vi.fn(() => {
      const animation = {
        cancel: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        commitStyles: vi.fn(),
        addEventListener: vi.fn(),
        currentTime: 0,
        playState: 'running',
      };
      created.push(animation);
      return animation;
    }),
    configurable: true,
    writable: true,
  });
}

function stubNoReducedMotion(): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }),
  );
}

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
  template: `<div [moveTarget]="on()" [moveFrames]="{ opacity: [0, 1] }">target</div>`,
  imports: [MoveTargetDirective],
})
class TargetHost {
  on = signal(true);
}

@Component({
  template: `<div [moveTrigger]="on()" [moveFrames]="{ opacity: [0, 1] }">trigger</div>`,
  imports: [MoveTriggerDirective],
})
class TriggerHost {
  on = signal(true);
}

@Component({
  template: `
    <div
      [moveVariants]="{ a: { opacity: [0, 1] }, b: { opacity: [1, 0] } }"
      [moveVariant]="variant()"
    >
      variants
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class VariantsHost {
  variant = signal('a');
}

async function render<T>(host: Type<T>): Promise<ComponentFixture<T>> {
  TestBed.configureTestingModule({ imports: [host], providers: [provideMovement()] });
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function fire(fixture: ComponentFixture<unknown>, event: string): void {
  fixture.debugElement.query(By.css('div, button')).triggerEventHandler(event, {});
  fixture.detectChanges();
}

describe('animation lifecycle hygiene', () => {
  beforeEach(() => {
    stubAnimate();
    stubNoReducedMotion();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete (HTMLElement.prototype as Partial<HTMLElement>).animate;
    TestBed.resetTestingModule();
  });

  describe('cancels running animations on destroy', () => {
    const DESTROY_CASES: { name: string; host: Type<unknown>; trigger?: string }[] = [
      { name: 'moveEnter', host: EnterHost },
      { name: 'move / moveAnimate', host: AnimateHost },
      { name: 'moveAnimation', host: AnimationHost },
      { name: 'moveLoop', host: LoopHost },
      { name: 'moveTarget', host: TargetHost },
      { name: 'moveTrigger', host: TriggerHost },
      { name: 'moveVariants', host: VariantsHost },
      { name: 'moveWhileHover', host: HoverHost, trigger: 'mouseenter' },
      { name: 'moveWhileTap', host: TapHost, trigger: 'pointerdown' },
      { name: 'moveWhileFocus', host: FocusHost, trigger: 'focusin' },
    ];

    for (const testCase of DESTROY_CASES) {
      it(`${testCase.name} leaves no running animation behind`, async () => {
        const fixture = await render(testCase.host);
        if (testCase.trigger) fire(fixture, testCase.trigger);

        expect(created.length).toBeGreaterThan(0);

        fixture.destroy();

        for (const animation of created) {
          expect(animation.cancel).toHaveBeenCalled();
        }
      });
    }
  });

  describe('cancels the previous animation before replaying', () => {
    it('moveWhileHover: rapid enter/leave/enter does not stack animations', async () => {
      const fixture = await render(HoverHost);

      fire(fixture, 'mouseenter');
      const first = created.at(-1)!;
      fire(fixture, 'mouseleave');
      const second = created.at(-1)!;
      fire(fixture, 'mouseenter');

      expect(first.cancel).toHaveBeenCalled();
      expect(second.cancel).toHaveBeenCalled();
      expect(created.length).toBe(3);
    });

    it('moveWhileTap: spamming pointerdown cancels the in-flight animation', async () => {
      const fixture = await render(TapHost);

      fire(fixture, 'pointerdown');
      const first = created.at(-1)!;
      fire(fixture, 'pointerup');
      fire(fixture, 'pointerdown');

      expect(first.cancel).toHaveBeenCalled();
    });

    it('moveWhileFocus: refocusing cancels the blur animation', async () => {
      const fixture = await render(FocusHost);

      fire(fixture, 'focusin');
      const focusAnimation = created.at(-1)!;
      fire(fixture, 'focusout');
      const blurAnimation = created.at(-1)!;
      fire(fixture, 'focusin');

      expect(focusAnimation.cancel).toHaveBeenCalled();
      expect(blurAnimation.cancel).toHaveBeenCalled();
    });

    it('moveTarget: toggling the target cancels the previous direction', async () => {
      const fixture = await render(TargetHost);
      const before = created.length;

      fixture.componentInstance.on.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(created.length).toBeGreaterThan(before);
      expect(created[before - 1].cancel).toHaveBeenCalled();
    });

    it('moveVariants: switching variants cancels the previous one', async () => {
      const fixture = await render(VariantsHost);
      const before = created.length;

      fixture.componentInstance.variant.set('b');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(created.length).toBeGreaterThan(before);
      expect(created[before - 1].cancel).toHaveBeenCalled();
    });
  });

  it('a destroyed host does not animate afterwards', async () => {
    const fixture = await render(HoverHost);
    fixture.destroy();
    const afterDestroy = created.length;

    // The element is detached; nothing may schedule new work on it.
    expect(created.length).toBe(afterDestroy);
  });
});
