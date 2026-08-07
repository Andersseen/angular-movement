import { Component, DebugElement, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveParallaxDirective } from './move-parallax.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { SmoothScrollService } from '../scroll/smooth-scroll.service';

@Component({
  template: `
    <div style="height: 1000px">Spacer</div>
    <div [moveParallax]="0.5" moveParallaxAxis="y">Parallax Element</div>
    <div style="height: 1000px">Spacer</div>
  `,
  imports: [MoveParallaxDirective],
})
class TestHostComponent {}

@Component({
  template: `
    <div id="parallax-container" style="height: 400px; overflow-y: auto;">
      <div style="height: 800px">Spacer</div>
      <div [moveParallax]="0.5" moveParallaxContainer="#parallax-container" moveParallaxAxis="y">
        Parallax Element
      </div>
      <div style="height: 800px">Spacer</div>
    </div>
  `,
  imports: [MoveParallaxDirective],
})
class TestContainerHostComponent {}

// Quick mock for IntersectionObserver
class MockIntersectionObserver {
  callback: IntersectionObserverCallback;
  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
  }
  observe() {
    // no-op
  }
  unobserve() {
    // no-op
  }
  disconnect() {
    // no-op
  }

  // Helper to trigger
  trigger(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting }] as IntersectionObserverEntry[],
      this as unknown as IntersectionObserver,
    );
  }
}

describe('MoveParallaxDirective', () => {
  let observerInstance: MockIntersectionObserver;

  beforeEach(() => {
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          observerInstance = new MockIntersectionObserver(cb);
          return observerInstance;
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  describe('with window scroll', () => {
    let fixture: ComponentFixture<TestHostComponent>;
    let debugElement: DebugElement;
    let playSpy: ReturnType<typeof vi.spyOn>;
    let w: Window;

    beforeEach(() => {
      w = window;

      TestBed.configureTestingModule({
        imports: [TestHostComponent],
        providers: [provideMovement()],
      });

      const engine = TestBed.inject(AnimationEngine);
      playSpy = vi.spyOn(engine, 'play').mockReturnValue({
        play: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(),
        currentTime: 0,
      } as unknown as AnimationControls);

      fixture = TestBed.createComponent(TestHostComponent);

      // Mock getBoundingClientRect
      debugElement = fixture.debugElement.query(By.directive(MoveParallaxDirective));
      debugElement.nativeElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 500,
        bottom: 600,
        height: 100,
        width: 100,
      });
      Object.defineProperty(debugElement.nativeElement, 'offsetHeight', { value: 100 });

      // Mock window sizes
      Object.defineProperty(w, 'innerHeight', { writable: true, configurable: true, value: 500 });
      Object.defineProperty(w, 'scrollY', { writable: true, configurable: true, value: 0 });

      fixture.detectChanges();
    });

    it('initializes animation with calculated properties', () => {
      // el height: 100
      // window height: 500
      // total distance: 600
      // speed: 0.5 -> translateDist: 300
      // frames: [150, -150]
      expect(playSpy).toHaveBeenCalled();
      const args = playSpy.mock.calls[0];
      const frames = args[1] as { y: number[] };
      expect(frames.y).toEqual([150, -150]);
    });

    it('updates target animation based on scroll progress', () => {
      const mockPlayer = playSpy.mock.results[0].value;

      // Trigger intersection
      observerInstance.trigger(true);

      // Fast forward to where element is at the top of the viewport
      // Initial absolute top = 500
      // Current scroll = 500
      // Virtual top = 0
      Object.defineProperty(w, 'scrollY', { writable: true, value: 500 });
      w.dispatchEvent(new Event('scroll'));

      // Progress calculation:
      // windowHeight (500) - currentVirtualTop (0) = 500
      // p = 500 / totalDistance (600) = 0.8333
      expect(mockPlayer.currentTime).toBeCloseTo(833.3, 0);
      expect(debugElement.injector.get(MoveParallaxDirective).progress()).toBeCloseTo(0.8333, 3);
    });
  });

  describe('with custom scroll container', () => {
    let fixture: ComponentFixture<TestContainerHostComponent>;
    let debugElement: DebugElement;
    let playSpy: ReturnType<typeof vi.spyOn>;
    let mockContainer: HTMLElement;
    let querySelectorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      mockContainer = document.createElement('div');
      Object.defineProperty(mockContainer, 'clientHeight', { value: 400 });
      Object.defineProperty(mockContainer, 'scrollTop', { value: 0, writable: true });
      vi.spyOn(mockContainer, 'getBoundingClientRect').mockReturnValue({
        top: 0,
        bottom: 400,
        left: 0,
        right: 400,
        width: 400,
        height: 400,
        x: 0,
        y: 0,
        toJSON: () => '',
      } as DOMRect);

      const originalQuerySelector = document.querySelector.bind(document);
      querySelectorSpy = vi
        .spyOn(document, 'querySelector')
        .mockImplementation((selector) =>
          selector === '#parallax-container'
            ? mockContainer
            : originalQuerySelector(selector as string),
        );

      TestBed.configureTestingModule({
        imports: [TestContainerHostComponent],
        providers: [provideMovement()],
      });

      const engine = TestBed.inject(AnimationEngine);
      playSpy = vi.spyOn(engine, 'play').mockReturnValue({
        play: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(),
        currentTime: 0,
      } as unknown as AnimationControls);

      fixture = TestBed.createComponent(TestContainerHostComponent);
      debugElement = fixture.debugElement.query(By.directive(MoveParallaxDirective));
      debugElement.nativeElement.getBoundingClientRect = vi.fn().mockReturnValue({
        top: 400,
        bottom: 500,
        left: 0,
        right: 400,
        width: 400,
        height: 100,
        x: 0,
        y: 400,
        toJSON: () => '',
      });
      Object.defineProperty(debugElement.nativeElement, 'offsetHeight', { value: 100 });

      fixture.detectChanges();
    });

    afterEach(() => {
      querySelectorSpy.mockRestore();
    });

    it('uses container dimensions to calculate parallax frames', () => {
      // container height: 400
      // el height: 100
      // total distance: 500
      // speed: 0.5 -> translateDist: 250
      // frames: [125, -125]
      const args = playSpy.mock.calls[0];
      const frames = args[1] as { y: number[] };
      expect(frames.y).toEqual([125, -125]);
    });

    it('keeps listening to the container when smooth scroll is active', () => {
      // The demo app calls SmoothScrollService.init() at the root, so this is the common case.
      // SmoothScrollService only drives the page; skipping the container listener because it is
      // active leaves the container with no scroll source and freezes the parallax.
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [TestContainerHostComponent],
        providers: [
          provideMovement(),
          { provide: SmoothScrollService, useValue: { scrollY: signal(0), isActive: true } },
        ],
      });
      vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue({
        play: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(),
        currentTime: 0,
      } as unknown as AnimationControls);

      const addSpy = vi.spyOn(mockContainer, 'addEventListener');
      const activeFixture = TestBed.createComponent(TestContainerHostComponent);
      activeFixture.detectChanges();
      observerInstance.trigger(true);

      expect(addSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    });

    it('updates progress based on container scroll', () => {
      const directive = debugElement.injector.get(MoveParallaxDirective);
      const mockPlayer = playSpy.mock.results[0].value;

      observerInstance.trigger(true);

      // Element top inside scroll content = 400.
      // Scroll to 400 => virtual top = 0.
      // containerHeight (400) - 0 = 400
      // p = 400 / totalDistance (500) = 0.8
      Object.defineProperty(mockContainer, 'scrollTop', { value: 400, writable: true });
      mockContainer.dispatchEvent(new Event('scroll'));

      expect(mockPlayer.currentTime).toBeCloseTo(800, 0);
      expect(directive.progress()).toBeCloseTo(0.8, 3);
    });
  });
});
