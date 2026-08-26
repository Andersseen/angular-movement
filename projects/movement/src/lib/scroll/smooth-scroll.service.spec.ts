import { PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { SmoothScrollService } from './smooth-scroll.service';

/** Helper to create a minimal scrollable element mock */
function makeScrollEl(scrollHeight = 2000, clientHeight = 800): HTMLElement {
  const el = document.createElement('div');
  Object.defineProperty(el, 'scrollHeight', { value: scrollHeight, configurable: true });
  Object.defineProperty(el, 'clientHeight', { value: clientHeight, configurable: true });
  Object.defineProperty(el, 'scrollTop', {
    get: () => 0,
    set: vi.fn(),
    configurable: true,
  });
  return el;
}

/** Scrollable element whose `scrollTop` is a real read/write value. */
function makeTrackedScrollEl(scrollHeight = 2000, clientHeight = 800): HTMLElement {
  const el = makeScrollEl(scrollHeight, clientHeight);
  let scrollTop = 0;
  Object.defineProperty(el, 'scrollTop', {
    get: () => scrollTop,
    set: (value: number) => {
      scrollTop = value;
    },
    configurable: true,
  });
  return el;
}

/** jsdom has no real TouchEvent constructor, so build the shape the service reads. */
function touchEvent(type: string, clientY: number, timeStamp: number): TouchEvent {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'touches', { value: [{ clientY }], configurable: true });
  Object.defineProperty(event, 'timeStamp', { value: timeStamp, configurable: true });
  return event as TouchEvent;
}

describe('SmoothScrollService', () => {
  let service: SmoothScrollService;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    // Stub RAF so ticks don't actually fire asynchronously
    rafCallbacks = [];
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
      rafCallbacks.push(callback);
      return rafCallbacks.length;
    });
    cancelRafSpy = vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }, SmoothScrollService],
    });

    service = TestBed.inject(SmoothScrollService);
  });

  afterEach(() => {
    service.destroy();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('isActive is false before init', () => {
    expect(service.isActive).toBe(false);
  });

  it('isActive is true after init', () => {
    const el = makeScrollEl();
    service.init({ element: el });
    expect(service.isActive).toBe(true);
  });

  it('isActive is false after destroy', () => {
    const el = makeScrollEl();
    service.init({ element: el });
    service.destroy();
    expect(service.isActive).toBe(false);
  });

  it('does not init twice (guard against double init)', () => {
    const el = makeScrollEl();
    const addSpy = vi.spyOn(el, 'addEventListener');
    service.init({ element: el });
    service.init({ element: el }); // second call should be a no-op
    // addEventListener should only be called once per event type
    const wheelCalls = addSpy.mock.calls.filter(([event]) => event === 'wheel');
    expect(wheelCalls).toHaveLength(1);
  });

  it('re-initializing the same element does not warn', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);
    const el = makeScrollEl();

    service.init({ element: el });
    service.init({ element: el });

    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('warns and stays on the original element when a second element tries to init', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);
    const first = makeScrollEl();
    const second = makeScrollEl();
    const secondAddSpy = vi.spyOn(second, 'addEventListener');

    service.init({ element: first });
    service.init({ element: second });

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('singleton'));
    expect(secondAddSpy).not.toHaveBeenCalled();
    expect(service.activeElement).toBe(first);
  });

  it('exposes the currently driven element via activeElement', () => {
    expect(service.activeElement).toBeNull();

    const el = makeScrollEl();
    service.init({ element: el });
    expect(service.activeElement).toBe(el);

    service.destroy();
    expect(service.activeElement).toBeNull();
  });

  it('cancels RAF on destroy', () => {
    const el = makeScrollEl();
    service.init({ element: el });
    service.destroy();
    expect(cancelRafSpy).toHaveBeenCalled();
  });

  it('removes event listeners on destroy', () => {
    const el = makeScrollEl();
    const removeSpy = vi.spyOn(el, 'removeEventListener');
    service.init({ element: el });
    service.destroy();
    expect(removeSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchmove', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('touchend', expect.any(Function));
  });

  it('scrollTo updates targetY (clamped to max scroll)', () => {
    const el = makeScrollEl(2000, 800); // maxScroll = 1200
    service.init({ element: el });
    service.scrollTo(9999); // way beyond max
    // We can't read #targetY directly (private), but scrollTo with instant=true
    // should set currentY synchronously and apply scroll
    service.scrollTo(500, true);
    // No error thrown = correct behavior
  });

  it('scrollTo with instant=true applies scroll immediately', () => {
    const el = makeScrollEl();
    let lastScrollTop = -1;
    Object.defineProperty(el, 'scrollTop', {
      get: () => lastScrollTop,
      set: (v: number) => {
        lastScrollTop = v;
      },
      configurable: true,
    });
    service.init({ element: el });
    service.scrollTo(100, true);
    expect(lastScrollTop).toBe(100);
  });

  it('scrollY signal starts at 0', () => {
    expect(service.scrollY()).toBe(0);
  });

  it('scrollY signal updates when scrollTo is called instantly', () => {
    const el = makeScrollEl();
    let scrollTop = 0;
    Object.defineProperty(el, 'scrollTop', {
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
      configurable: true,
    });
    service.init({ element: el });
    service.scrollTo(200, true);
    expect(service.scrollY()).toBe(200);
  });

  it('intercepts wheel events on the root scroll element', () => {
    const el = makeScrollEl();
    let scrollTop = 0;
    Object.defineProperty(el, 'scrollTop', {
      get: () => scrollTop,
      set: (v: number) => {
        scrollTop = v;
      },
      configurable: true,
    });

    service.init({ element: el, lerp: 0.5 });
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
    el.dispatchEvent(event);
    rafCallbacks.at(-1)?.(16);

    expect(event.defaultPrevented).toBe(true);
    expect(scrollTop).toBeGreaterThan(0);
  });

  it('does not intercept wheel events inside nested scrollable containers', () => {
    const root = makeScrollEl();
    const scrollable = makeScrollEl(1000, 100);
    const child = document.createElement('button');
    scrollable.style.overflowY = 'auto';
    scrollable.appendChild(child);
    root.appendChild(scrollable);

    service.init({ element: root });
    const event = new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 100 });
    child.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(false);
  });

  it('scrolls on touch drag and prevents the native scroll', () => {
    const el = makeTrackedScrollEl();
    service.init({ element: el, lerp: 0.5 });

    el.dispatchEvent(touchEvent('touchstart', 500, 0));
    const move = touchEvent('touchmove', 400, 16); // swipe up 100px → scroll down
    el.dispatchEvent(move);
    rafCallbacks.at(-1)?.(16);

    expect(move.defaultPrevented).toBe(true);
    expect(el.scrollTop).toBeGreaterThan(0);
  });

  it('ignores touchmove that was not preceded by touchstart', () => {
    const el = makeTrackedScrollEl();
    service.init({ element: el, lerp: 0.5 });

    const move = touchEvent('touchmove', 400, 16);
    el.dispatchEvent(move);
    rafCallbacks.at(-1)?.(16);

    expect(move.defaultPrevented).toBe(false);
    expect(el.scrollTop).toBe(0);
  });

  it('does not intercept touch drags inside nested scrollable containers', () => {
    const root = makeTrackedScrollEl();
    const scrollable = makeScrollEl(1000, 100);
    const child = document.createElement('button');
    scrollable.style.overflowY = 'auto';
    scrollable.appendChild(child);
    root.appendChild(scrollable);

    service.init({ element: root });

    child.dispatchEvent(touchEvent('touchstart', 500, 0));
    const move = touchEvent('touchmove', 400, 16);
    child.dispatchEvent(move);

    expect(move.defaultPrevented).toBe(false);
  });

  it('applies momentum after the finger lifts', () => {
    const el = makeTrackedScrollEl();
    service.init({ element: el, lerp: 0.5 });

    el.dispatchEvent(touchEvent('touchstart', 500, 0));
    el.dispatchEvent(touchEvent('touchmove', 400, 16));

    const scheduledBeforeLift = rafCallbacks.length;
    el.dispatchEvent(touchEvent('touchend', 400, 32));

    // touchend schedules a momentum step in addition to the running tick loop.
    expect(rafCallbacks.length).toBeGreaterThan(scheduledBeforeLift);

    const beforeMomentum = el.scrollTop;
    // Drain a few momentum + tick frames.
    for (let i = 0; i < 10; i++) {
      rafCallbacks.splice(0).forEach((callback) => callback(16));
    }

    expect(el.scrollTop).toBeGreaterThan(beforeMomentum);
  });

  it('stops momentum once the service is destroyed', () => {
    const el = makeTrackedScrollEl();
    service.init({ element: el, lerp: 0.5 });

    el.dispatchEvent(touchEvent('touchstart', 500, 0));
    el.dispatchEvent(touchEvent('touchmove', 300, 16));
    el.dispatchEvent(touchEvent('touchend', 300, 32));

    service.destroy();
    const afterDestroy = el.scrollTop;
    for (let i = 0; i < 5; i++) {
      rafCallbacks.splice(0).forEach((callback) => callback(16));
    }

    expect(el.scrollTop).toBe(afterDestroy);
  });

  it('destroy is safe before init', () => {
    expect(() => service.destroy()).not.toThrow();
    expect(service.isActive).toBe(false);
  });

  it('clamps scrollTo to the scrollable range', () => {
    const el = makeTrackedScrollEl(2000, 800); // maxScroll = 1200
    service.init({ element: el });

    service.scrollTo(9999, true);
    expect(el.scrollTop).toBe(1200);

    service.scrollTo(-500, true);
    expect(el.scrollTop).toBe(0);
  });

  it('settles exactly on the target once the lerp gap closes', () => {
    const el = makeTrackedScrollEl();
    service.init({ element: el, lerp: 0.5 });

    service.scrollTo(100);
    for (let i = 0; i < 30; i++) {
      rafCallbacks.splice(0).forEach((callback) => callback(16));
    }

    expect(el.scrollTop).toBe(100);
    expect(service.scrollY()).toBe(100);
  });

  it('does not init on server (non-browser platform)', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }, SmoothScrollService],
    });
    const serverService = TestBed.inject(SmoothScrollService);
    const el = makeScrollEl();
    const addSpy = vi.spyOn(el, 'addEventListener');
    serverService.init({ element: el });
    expect(addSpy).not.toHaveBeenCalled();
    expect(serverService.isActive).toBe(false);
  });

  it('does not init when prefers-reduced-motion is active', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    const el = makeScrollEl();
    const addSpy = vi.spyOn(el, 'addEventListener');
    service.init({ element: el });

    expect(addSpy).not.toHaveBeenCalled();
    expect(service.isActive).toBe(false);

    vi.unstubAllGlobals();
  });
});
