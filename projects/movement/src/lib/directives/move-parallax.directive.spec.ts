import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveParallaxDirective } from './move-parallax.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `
    <div style="height: 1000px">Spacer</div>
    <div [moveParallax]="0.5" moveParallaxAxis="y">Parallax Element</div>
    <div style="height: 1000px">Spacer</div>
  `,
  imports: [MoveParallaxDirective],
})
class TestHostComponent {}

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
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;
  let engine: AnimationEngine;
  let playSpy: ReturnType<typeof vi.spyOn>;
  let observerInstance: MockIntersectionObserver;
  let w: Window;

  beforeEach(() => {
    w = window;
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(cb: IntersectionObserverCallback) {
          observerInstance = new MockIntersectionObserver(cb);
          return observerInstance;
        }
      },
    );

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });

    engine = TestBed.inject(AnimationEngine);
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

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
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
  });
});
