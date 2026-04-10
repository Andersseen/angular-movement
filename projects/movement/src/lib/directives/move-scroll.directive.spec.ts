import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { AnimationControls } from '../engines/animation-controls';
import { AnimationEngine } from '../engines/animation-engine.service';
import { SmoothScrollService } from '../scroll/smooth-scroll.service';
import { MoveScrollDirective } from './move-scroll.directive';

@Component({
  template: `<div [moveScroll]="{ opacity: [0, 1] }">Scroll Me</div>`,
  imports: [MoveScrollDirective],
})
class TestHostComponent {}

/** A minimal fake AnimationControls to simulate a paused player */
function makeFakePlayer(): AnimationControls & { currentTime: number } {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    currentTime: 0,
    finished: Promise.resolve(),
  };
}

/** Helper: set up a class-based IntersectionObserver mock and return a callback holder */
function mockIntersectionObserver(): { getCallback: () => IntersectionObserverCallback } {
  let cb: IntersectionObserverCallback = () => {
    // no - op;
  };
  class MockIO {
    constructor(callback: IntersectionObserverCallback) {
      cb = callback;
    }
    observe = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIO);
  return { getCallback: () => cb };
}

describe('MoveScrollDirective — native scroll (no SmoothScrollService)', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let engine: AnimationEngine;
  let fakePlayer: AnimationControls & { currentTime: number };
  let capturedScrollListener: EventListener | null;
  let ioHolder: { getCallback: () => IntersectionObserverCallback };

  beforeEach(() => {
    fakePlayer = makeFakePlayer();
    capturedScrollListener = null;
    ioHolder = mockIntersectionObserver();

    vi.spyOn(window, 'addEventListener').mockImplementation(
      (event: string, listener: EventListenerOrEventListenerObject) => {
        if (event === 'scroll') capturedScrollListener = listener as EventListener;
      },
    );

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        {
          provide: SmoothScrollService,
          useValue: { scrollY: signal(0), isActive: false },
        },
      ],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(fakePlayer);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('creates and attaches the directive', () => {
    const el = fixture.debugElement.query(By.directive(MoveScrollDirective));
    expect(el).toBeTruthy();
  });

  it('creates a paused player for the provided keyframes', () => {
    expect(engine.play).toHaveBeenCalledTimes(1);
    expect(fakePlayer.pause).toHaveBeenCalledTimes(1);
  });

  it('attaches native scroll listener when element enters viewport and smooth scroll is NOT active', () => {
    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(capturedScrollListener).not.toBeNull();
  });

  it('exposes a reactive progress signal defaulting to 0', () => {
    const directive = fixture.debugElement
      .query(By.directive(MoveScrollDirective))
      .injector.get(MoveScrollDirective);
    expect(directive.progress()).toBe(0);
  });
});

describe('MoveScrollDirective — with SmoothScrollService active', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let engine: AnimationEngine;
  let nativeScrollAttached: boolean;

  beforeEach(() => {
    nativeScrollAttached = false;
    mockIntersectionObserver();

    vi.spyOn(window, 'addEventListener').mockImplementation((event: string) => {
      if (event === 'scroll') nativeScrollAttached = true;
    });

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [
        {
          provide: SmoothScrollService,
          useValue: { scrollY: signal(0), isActive: true },
        },
      ],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(makeFakePlayer());
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('does NOT attach a native scroll listener when smooth scroll is active', () => {
    expect(nativeScrollAttached).toBe(false);
  });
});
