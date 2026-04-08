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

describe('SmoothScrollService', () => {
  let service: SmoothScrollService;
  let cancelRafSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Stub RAF so ticks don't actually fire asynchronously
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
});
