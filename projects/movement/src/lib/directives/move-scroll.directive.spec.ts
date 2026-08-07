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

@Component({
  template: ` <div [moveScroll]="frames()" [moveScrollOffset]="offset()">Scroll Me</div> `,
  imports: [MoveScrollDirective],
})
class ConfigurableHostComponent {
  frames = signal<Record<string, number[]> | undefined>({ opacity: [0, 1] });
  offset = signal<[string, string]>(['0 1', '1 0']);
}

describe('MoveScrollDirective — progress mapping and teardown', () => {
  let fixture: ComponentFixture<ConfigurableHostComponent>;
  let engine: AnimationEngine;
  let fakePlayer: AnimationControls & { currentTime: number };
  let ioHolder: { getCallback: () => IntersectionObserverCallback };
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    fakePlayer = makeFakePlayer();
    ioHolder = mockIntersectionObserver();
    rafCallbacks = [];

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);
    vi.spyOn(window, 'addEventListener').mockImplementation(() => undefined);

    TestBed.configureTestingModule({
      imports: [ConfigurableHostComponent],
      providers: [
        { provide: SmoothScrollService, useValue: { scrollY: signal(0), isActive: false } },
      ],
    });
    fixture = TestBed.createComponent(ConfigurableHostComponent);
    engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(fakePlayer);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  function directive(): MoveScrollDirective {
    return fixture.debugElement
      .query(By.directive(MoveScrollDirective))
      .injector.get(MoveScrollDirective);
  }

  function drainRaf(frames = 40): void {
    for (let i = 0; i < frames; i++) {
      rafCallbacks.splice(0).forEach((callback) => callback(16));
    }
  }

  it('drives the player currentTime from the scroll progress', () => {
    const host = fixture.debugElement.query(By.directive(MoveScrollDirective))
      .nativeElement as HTMLElement;
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      height: 200,
    } as DOMRect);

    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    drainRaf();

    const progress = directive().progress();
    expect(progress).toBeGreaterThan(0);
    expect(progress).toBeLessThanOrEqual(0.999);
    expect(fakePlayer.currentTime).toBeCloseTo(progress * 1000, 5);
  });

  it('never reaches currentTime 1000, so the player cannot auto-finish', () => {
    const host = fixture.debugElement.query(By.directive(MoveScrollDirective))
      .nativeElement as HTMLElement;
    // Element far above the viewport → raw progress well beyond 1.
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({
      top: -5000,
      height: 200,
    } as DOMRect);

    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    drainRaf();

    expect(directive().progress()).toBeLessThanOrEqual(0.999);
    expect(fakePlayer.currentTime).toBeLessThanOrEqual(999);
  });

  it('does not create a player when a scroll offset is malformed', () => {
    vi.mocked(engine.play).mockClear();
    fixture.componentInstance.offset.set(['not-an-offset', '1 0']);
    fixture.detectChanges();

    expect(engine.play).not.toHaveBeenCalled();
  });

  it('cancels and recreates the player when the keyframes change', () => {
    const first = fakePlayer;
    const second = makeFakePlayer();
    vi.mocked(engine.play).mockReturnValue(second);

    fixture.componentInstance.frames.set({ opacity: [1, 0] });
    fixture.detectChanges();

    expect(first.cancel).toHaveBeenCalled();
    expect(second.pause).toHaveBeenCalled();
  });

  it('tears down the player, listener and observer on destroy', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame');

    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    fixture.destroy();

    expect(fakePlayer.cancel).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(cancelRafSpy).toHaveBeenCalled();
  });

  it('detaches the scroll listener when the element leaves the viewport', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');

    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    ioHolder.getCallback()(
      [{ isIntersecting: false } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});

@Component({
  template: `
    <div class="scroll-container">
      <div [moveScroll]="{ opacity: [0, 1] }" moveScrollContainer=".scroll-container">
        Scroll Me
      </div>
    </div>
  `,
  imports: [MoveScrollDirective],
})
class ContainerHostComponent {}

describe('MoveScrollDirective — custom scroll container', () => {
  let fixture: ComponentFixture<ContainerHostComponent>;
  let engine: AnimationEngine;
  let fakePlayer: AnimationControls & { currentTime: number };
  let ioHolder: { getCallback: () => IntersectionObserverCallback };
  let rafCallbacks: FrameRequestCallback[];
  let container: HTMLElement;

  beforeEach(() => {
    fakePlayer = makeFakePlayer();
    ioHolder = mockIntersectionObserver();
    rafCallbacks = [];

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);

    TestBed.configureTestingModule({
      imports: [ContainerHostComponent],
      providers: [
        { provide: SmoothScrollService, useValue: { scrollY: signal(0), isActive: false } },
      ],
    });
    fixture = TestBed.createComponent(ContainerHostComponent);
    engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(fakePlayer);
    fixture.detectChanges();

    container = fixture.nativeElement.querySelector('.scroll-container') as HTMLElement;
    Object.defineProperty(container, 'clientHeight', { value: 500, configurable: true });
    Object.defineProperty(container, 'scrollTop', {
      value: 300,
      writable: true,
      configurable: true,
    });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 0 } as DOMRect);

    const host = fixture.debugElement.query(By.directive(MoveScrollDirective))
      .nativeElement as HTMLElement;
    Object.defineProperty(host, 'offsetHeight', { value: 200, configurable: true });
    vi.spyOn(host, 'getBoundingClientRect').mockReturnValue({ top: 100, height: 200 } as DOMRect);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('attaches the scroll listener to the container instead of the window', () => {
    const containerSpy = vi.spyOn(container, 'addEventListener');
    const windowSpy = vi.spyOn(window, 'addEventListener');

    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(containerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
    expect(windowSpy).not.toHaveBeenCalledWith('scroll', expect.any(Function), expect.anything());
  });

  it('computes progress from the container scrollTop', () => {
    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    for (let i = 0; i < 40; i++) {
      rafCallbacks.splice(0).forEach((callback) => callback(16));
    }

    const directive = fixture.debugElement
      .query(By.directive(MoveScrollDirective))
      .injector.get(MoveScrollDirective);

    expect(directive.progress()).toBeGreaterThan(0);
    expect(directive.progress()).toBeLessThanOrEqual(0.999);
    expect(fakePlayer.currentTime).toBeCloseTo(directive.progress() * 1000, 5);
  });

  it('removes the container listener on destroy', () => {
    const removeSpy = vi.spyOn(container, 'removeEventListener');

    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    fixture.destroy();

    expect(removeSpy).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});

describe('MoveScrollDirective — custom container while smooth scroll is active', () => {
  let fixture: ComponentFixture<ContainerHostComponent>;
  let ioHolder: { getCallback: () => IntersectionObserverCallback };
  let container: HTMLElement;
  let fakePlayer: AnimationControls & { currentTime: number };
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    fakePlayer = makeFakePlayer();
    ioHolder = mockIntersectionObserver();
    rafCallbacks = [];

    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);

    TestBed.configureTestingModule({
      imports: [ContainerHostComponent],
      providers: [
        // The demo app calls SmoothScrollService.init() at the root, so this is the common case.
        { provide: SmoothScrollService, useValue: { scrollY: signal(0), isActive: true } },
      ],
    });
    fixture = TestBed.createComponent(ContainerHostComponent);
    vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue(fakePlayer);
    fixture.detectChanges();

    container = fixture.nativeElement.querySelector('.scroll-container') as HTMLElement;
    Object.defineProperty(container, 'clientHeight', { value: 300, configurable: true });
    Object.defineProperty(container, 'scrollTop', {
      value: 0,
      writable: true,
      configurable: true,
    });
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({ top: 0 } as DOMRect);

    const host = fixture.debugElement.query(By.directive(MoveScrollDirective))
      .nativeElement as HTMLElement;
    Object.defineProperty(host, 'offsetHeight', { value: 100, configurable: true });
    // The element's viewport position must fall as the container scrolls, exactly as it does in a
    // browser. A fixed rect would make the directive's `elTop` track scrollTop and cancel it out,
    // so progress would never change and the test would prove nothing.
    vi.spyOn(host, 'getBoundingClientRect').mockImplementation(
      () => ({ top: 200 - container.scrollTop, height: 100 }) as DOMRect,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('still listens to the container, which smooth scroll does not drive', () => {
    const containerSpy = vi.spyOn(container, 'addEventListener');

    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    // SmoothScrollService only governs the root/page scroll. Skipping the listener because it is
    // active leaves a custom container with no scroll source at all.
    expect(containerSpy).toHaveBeenCalledWith('scroll', expect.any(Function), { passive: true });
  });

  it('updates progress when the container scrolls', () => {
    ioHolder.getCallback()(
      [{ isIntersecting: true } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    const drain = () => {
      for (let i = 0; i < 60; i++) rafCallbacks.splice(0).forEach((callback) => callback(16));
    };

    const directive = fixture.debugElement
      .query(By.directive(MoveScrollDirective))
      .injector.get(MoveScrollDirective);

    // The lerp must have settled before sampling, or a value still in flight would "change" on its
    // own and the assertion below would pass without the scroll doing anything.
    drain();
    const settled = directive.progress();
    drain();
    expect(directive.progress()).toBe(settled);

    (container as unknown as { scrollTop: number }).scrollTop = 250;
    container.dispatchEvent(new Event('scroll'));
    drain();

    expect(directive.progress()).not.toBe(settled);
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
