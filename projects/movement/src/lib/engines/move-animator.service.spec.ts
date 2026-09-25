import { ElementRef, PLATFORM_ID } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MoveAnimator } from './move-animator.service';
import { AnimationEngine } from './animation-engine.service';
import { AnimationControls } from './animation-controls';
import { provideMovement } from '../providers/provide-movement';
import { registerActivePlayer } from './active-player-registry';

function stubControls(): AnimationControls {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    currentTime: 0,
    finished: Promise.resolve(),
  };
}

describe('MoveAnimator', () => {
  let animator: MoveAnimator;
  let playSpy: ReturnType<typeof vi.spyOn>;
  let el: HTMLElement;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    playSpy = vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue(stubControls());
    animator = TestBed.inject(MoveAnimator);
    el = document.createElement('div');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('falls back to the global defaults', () => {
    animator.animate(el, { opacity: [0, 1] });

    const [element, frames, options] = playSpy.mock.calls[0];
    expect(element).toBe(el);
    expect(frames).toEqual({ opacity: [0, 1] });
    expect(options).toEqual(
      expect.objectContaining({
        config: expect.objectContaining({ duration: 300, disabled: false }),
      }),
    );
  });

  it('lets per-call options override the defaults', () => {
    animator.animate(el, { x: [0, 40] }, { duration: 900, easing: 'linear', delay: 50 });

    const [, , options] = playSpy.mock.calls[0];
    expect(options).toEqual(
      expect.objectContaining({
        config: expect.objectContaining({ duration: 900, easing: 'linear', delay: 50 }),
        delay: 50,
      }),
    );
  });

  it('honours the config supplied through provideMovement', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({ providers: [provideMovement({ duration: 42 })] });
    const spy = vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue(stubControls());

    TestBed.inject(MoveAnimator).animate(el, { opacity: [0, 1] });

    const [, , options] = spy.mock.calls[0];
    expect(options).toEqual(
      expect.objectContaining({ config: expect.objectContaining({ duration: 42 }) }),
    );
  });

  it('passes spring, iterations and transition straight through', () => {
    animator.animate(
      el,
      { scale: [1, 2] },
      {
        spring: { stiffness: 200, damping: 12 },
        iterations: 3,
        transition: { opacity: { duration: 100 } },
      },
    );

    const [, , options] = playSpy.mock.calls[0];
    expect(options).toEqual(
      expect.objectContaining({
        spring: { stiffness: 200, damping: 12 },
        iterations: 3,
        transition: { opacity: { duration: 100 } },
      }),
    );
  });

  it('forwards onDone', () => {
    const onDone = vi.fn();
    animator.animate(el, { opacity: [0, 1] }, { onDone });

    const [, , options] = playSpy.mock.calls[0];
    expect((options as { onDone?: () => void }).onDone).toBe(onDone);
  });

  it('marks the play disabled when the caller disables it', () => {
    animator.animate(el, { opacity: [0, 1] }, { disabled: true });

    const [, , options] = playSpy.mock.calls[0];
    // The engine keys off `disabled`, not `config.disabled`; both must agree.
    expect(options).toEqual(
      expect.objectContaining({
        disabled: true,
        config: expect.objectContaining({ disabled: true }),
      }),
    );
  });

  it('disables the play when the user prefers reduced motion', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );

    animator.animate(el, { opacity: [0, 1] });

    const [, , options] = playSpy.mock.calls[0];
    expect(options).toEqual(expect.objectContaining({ disabled: true }));
  });

  it('returns whatever the engine returns', () => {
    const controls = stubControls();
    playSpy.mockReturnValue(controls);

    expect(animator.animate(el, { opacity: [0, 1] })).toBe(controls);
  });

  it('no-ops on the server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
    });

    const result = TestBed.inject(MoveAnimator).animate(el, { opacity: [0, 1] });

    expect(result).toBeNull();
  });
  it('accepts the ElementRef a viewChild() already provides', () => {
    animator.animate(new ElementRef(el), { opacity: [0, 1] });

    expect(playSpy.mock.calls[0][0]).toBe(el);
  });

  it('accepts MoveTime strings for duration and delay', () => {
    animator.animate(el, { opacity: [0, 1] }, { duration: '0.18s', delay: '40ms' });

    const [, , options] = playSpy.mock.calls[0];
    expect(options).toEqual(
      expect.objectContaining({
        config: expect.objectContaining({ duration: 180, delay: 40 }),
        delay: 40,
      }),
    );
  });

  it('forwards pseudoElement to the engine', () => {
    animator.animate(
      document.documentElement,
      { clipPath: ['circle(0px at 0px 0px)', 'circle(100px at 0px 0px)'] },
      { pseudoElement: '::view-transition-new(root)', duration: 520 },
    );

    const [target, frames, options] = playSpy.mock.calls[0];
    expect(target).toBe(document.documentElement);
    // Arbitrary CSS properties pass through untouched — no enumeration needed.
    expect(frames).toEqual({ clipPath: ['circle(0px at 0px 0px)', 'circle(100px at 0px 0px)'] });
    expect(options).toEqual(
      expect.objectContaining({ pseudoElement: '::view-transition-new(root)' }),
    );
  });

  describe('set() / clear()', () => {
    beforeEach(() => playSpy.mockRestore());

    it("set() commits a state instantly through the directives' composition", () => {
      animator.set(el, { opacity: 0.5, y: 12, scale: 0.9, clipPath: 'inset(10%)' });

      expect(el.style.opacity).toBe('0.5');
      expect(el.style.translate).toBe('0px 12px');
      expect(el.style.scale).toBe('0.9');
      expect(el.style.clipPath).toBe('inset(10%)');
    });

    it('set() accepts an ElementRef and cancels the in-flight engine animation first', () => {
      const running = stubControls();
      registerActivePlayer(el, running);

      animator.set(new ElementRef(el), { opacity: 0 });

      expect(running.cancel).toHaveBeenCalledTimes(1);
      expect(el.style.opacity).toBe('0');
    });

    it('clear() removes only the requested properties', () => {
      animator.set(el, { opacity: 0.5, y: 12, filter: 'saturate(2)' });

      animator.clear(el, ['y', 'filter']);

      expect(el.style.translate).toBe('');
      expect(el.style.filter).toBe('');
      expect(el.style.opacity).toBe('0.5');
    });

    it('clear() without properties removes the common library channels', () => {
      animator.set(el, { opacity: 0.5, y: 12, scale: 2 });

      animator.clear(el);

      expect(el.style.opacity).toBe('');
      expect(el.style.translate).toBe('');
      expect(el.style.scale).toBe('');
    });

    it('set() and clear() are no-ops on the server', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
      });
      const serverAnimator = TestBed.inject(MoveAnimator);
      el.style.opacity = '0.3';

      serverAnimator.set(el, { opacity: 1 });
      serverAnimator.clear(el);

      expect(el.style.opacity).toBe('0.3');
    });
  });
});
