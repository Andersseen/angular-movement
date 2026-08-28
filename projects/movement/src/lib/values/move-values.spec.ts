import { Component, inject, Injector, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { moveSpringValue, moveTransform, moveValue } from './move-values';

@Component({
  selector: 'move-spring-host',
  template: '',
})
class SpringHostComponent {
  source = signal(0);
  spring = moveSpringValue(this.source, {
    stiffness: 120,
    damping: 18,
    precision: 0.001,
    restSpeed: 0.001,
    injector: inject(Injector),
  });
}

@Component({
  selector: 'move-disabled-spring-host',
  template: '',
})
class DisabledSpringHostComponent {
  source = signal(0);
  spring = moveSpringValue(this.source, { disabled: true, injector: inject(Injector) });
}

@Component({
  selector: 'move-inferred-injector-spring-host',
  template: '',
})
class InferredInjectorSpringHostComponent {
  source = signal(0);
  // No `injector` in config: field initializers run inside the directive/component's own
  // injection context, so `moveSpringValue` infers it via `inject(Injector)` internally.
  spring = moveSpringValue(this.source, { stiffness: 120, damping: 18 });
}

@Component({
  selector: 'move-reduced-motion-spring-host',
  template: '',
})
class ReducedMotionSpringHostComponent {
  source = signal(0);
  spring = moveSpringValue(this.source, { injector: inject(Injector) });
}

describe('move values', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('creates a writable Angular signal', () => {
    const x = moveValue(0);

    x.set(24);
    x.update((value) => value + 1);

    expect(x()).toBe(25);
  });

  it('maps numeric values across an input range', () => {
    const progress = signal(0.5);
    const opacity = moveTransform(progress, [0, 1], [0, 100]);

    expect(opacity()).toBe(50);
  });

  it('supports multi-stop numeric ranges', () => {
    const progress = signal(0.75);
    const y = moveTransform(progress, [0, 0.5, 1], [0, 100, 0]);

    expect(y()).toBe(50);
  });

  it('clamps transform output by default', () => {
    const progress = signal(2);
    const scale = moveTransform(progress, [0, 1], [1, 2]);

    expect(scale()).toBe(2);
  });

  it('can extrapolate when clamp is false', () => {
    const progress = signal(2);
    const scale = moveTransform(progress, [0, 1], [1, 2], { clamp: false });

    expect(scale()).toBe(3);
  });

  it('interpolates matching CSS unit strings', () => {
    const progress = signal(0.5);
    const width = moveTransform(progress, [0, 1], ['0px', '20px']);

    expect(width()).toBe('10px');
  });

  it('falls back to discrete string output when units cannot be interpolated', () => {
    const progress = signal(0.75);
    const display = moveTransform(progress, [0, 1], ['none', 'block']);

    expect(display()).toBe('block');
  });

  it('interpolates 0deg -> 180deg and 0rem -> 2rem', () => {
    const rotateProgress = signal(0.5);
    const rotate = moveTransform(rotateProgress, [0, 1], ['0deg', '180deg']);
    expect(rotate()).toBe('90deg');

    const remProgress = signal(0.5);
    const rem = moveTransform(remProgress, [0, 1], ['0rem', '2rem']);
    expect(rem()).toBe('1rem');
  });

  it('does not interpolate mismatched units, non-numeric strings, or embedded transform functions', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* suppress */
    });

    // Mismatched units: falls to the discrete switch, never blends 10px with a rem value.
    const unitProgress = signal(0.75);
    const mismatchedUnit = moveTransform(unitProgress, [0, 1], ['10px', '2rem']);
    expect(mismatchedUnit()).toBe('2rem');

    // Non-numeric strings (e.g. colors): same discrete switch, no color blending.
    const colorProgress = signal(0.25);
    const color = moveTransform(colorProgress, [0, 1], ['red', 'blue']);
    expect(color()).toBe('red');

    // Embedded transform functions: the leading "translateX(" means there is no leading digit to
    // parse, so this hits the same discrete switch rather than interpolating the inner numbers.
    const fnProgress = signal(0.9);
    const fn = moveTransform(fnProgress, [0, 1], ['translateX(0px)', 'translateX(100px)']);
    expect(fn()).toBe('translateX(100px)');

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('cannot smoothly interpolate'));
      // One distinct pair per case above - never more than one warning per pair.
      expect(warnSpy).toHaveBeenCalledTimes(3);
    }

    warnSpy.mockRestore();
  });

  it('warns at most once per distinct mismatched pair, not once per recomputation', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* suppress */
    });

    const progress = signal(0.1);
    const display = moveTransform(progress, [0, 1], ['unique-warn-a', 'unique-warn-b']);

    display();
    progress.set(0.2);
    display();
    progress.set(0.9);
    display();

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const callsForThisPair = warnSpy.mock.calls.filter(([message]) =>
        String(message).includes('unique-warn-a'),
      );
      expect(callsForThisPair.length).toBe(1);
    }

    warnSpy.mockRestore();
  });

  it('throws when ranges do not match', () => {
    const progress = signal(0);

    expect(() => moveTransform(progress, [0, 1], [0])).toThrow(
      'moveTransform requires matching input and output ranges with at least two values.',
    );
  });

  it('throws when moveSpringValue is created outside an injection context and without an injector', () => {
    const source = signal(0);

    // Called from a plain test function body — not a field initializer, constructor, or
    // `runInInjectionContext` — so there is no injector to infer.
    expect(() => moveSpringValue(source, { stiffness: 100, damping: 10 })).toThrow(
      /injection context/i,
    );
  });

  it('infers the injector from a field initializer when config omits it', () => {
    const raf = createRafMock();
    TestBed.configureTestingModule({ imports: [InferredInjectorSpringHostComponent] });
    const fixture = TestBed.createComponent(InferredInjectorSpringHostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.spring()).toBe(0);

    fixture.componentInstance.source.set(100);
    fixture.detectChanges();
    TestBed.tick();
    raf.flushFrames(10);

    expect(fixture.componentInstance.spring()).toBeGreaterThan(0);
    expect(fixture.componentInstance.spring()).toBeLessThan(100);
  });

  it('animates toward source changes with spring physics', () => {
    const raf = createRafMock();
    TestBed.configureTestingModule({ imports: [SpringHostComponent] });
    const fixture = TestBed.createComponent(SpringHostComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.spring()).toBe(0);

    fixture.componentInstance.source.set(100);
    fixture.detectChanges();
    TestBed.tick();
    raf.flushFrames(10);

    expect(fixture.componentInstance.spring()).toBeGreaterThan(0);
    expect(fixture.componentInstance.spring()).toBeLessThan(100);

    raf.flushFrames(240);
    expect(fixture.componentInstance.spring()).toBeCloseTo(100, 1);
  });

  it('sets the source value immediately when spring is disabled', () => {
    TestBed.configureTestingModule({ imports: [DisabledSpringHostComponent] });
    const fixture = TestBed.createComponent(DisabledSpringHostComponent);
    fixture.detectChanges();

    fixture.componentInstance.source.set(40);
    fixture.detectChanges();
    TestBed.tick();

    expect(fixture.componentInstance.spring()).toBe(40);
  });

  it('jumps straight to the target under prefers-reduced-motion instead of animating', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }),
    );

    TestBed.configureTestingModule({ imports: [ReducedMotionSpringHostComponent] });
    const fixture = TestBed.createComponent(ReducedMotionSpringHostComponent);
    fixture.detectChanges();

    fixture.componentInstance.source.set(75);
    fixture.detectChanges();
    TestBed.tick();

    expect(fixture.componentInstance.spring()).toBe(75);
  });

  it('stops the RAF loop when the owning component is destroyed mid-animation', () => {
    const raf = createRafMock();
    TestBed.configureTestingModule({ imports: [SpringHostComponent] });
    const fixture = TestBed.createComponent(SpringHostComponent);
    fixture.detectChanges();

    fixture.componentInstance.source.set(100);
    fixture.detectChanges();
    TestBed.tick();
    raf.flushFrames(3);

    const pendingFrameId = raf.requestAnimationFrame.mock.results.at(-1)?.value;
    expect(pendingFrameId).toBeGreaterThan(0);

    fixture.destroy();

    // Proves the effect's own cleanup ran (cancelling the actual pending frame), not just that
    // cancelAnimationFrame was called at some earlier, unrelated point in the effect's lifetime.
    expect(raf.cancelAnimationFrame).toHaveBeenCalledWith(pendingFrameId);

    // No new frame gets scheduled once the effect's injector is gone, and flushing any frame that
    // was already in flight must not throw or resurrect the loop.
    const requestCountAfterDestroy = raf.requestAnimationFrame.mock.calls.length;
    expect(() => raf.flushFrames(10)).not.toThrow();
    expect(raf.requestAnimationFrame.mock.calls.length).toBe(requestCountAfterDestroy);
  });

  // Post-1.0 hardening: measures whether `moveSpringValue`'s one-RAF-loop-per-call architecture
  // scales acceptably before considering a shared/batched frame scheduler (see ARCHITECTURE.md,
  // "Motion Values runtime model"). Real browsers batch every callback registered for the same
  // frame into one native tick, so the question that matters is linear vs. quadratic growth in
  // callback *count*, not a per-spring timer — confirmed below at 1/10/50/100 concurrent springs.
  //
  // Measurements use deltas against a same-test baseline, with a small constant allowance, rather
  // than exact global counts: Angular's own zoneless change-detection scheduler also calls the
  // global `requestAnimationFrame` (stubbed here alongside the library's own calls), and that
  // framework overhead is unrelated to spring count. A true quadratic bug would blow far past the
  // allowance at 100 springs, which is what these bounds are actually checking for.
  const FRAMEWORK_RAF_ALLOWANCE = 8;

  describe.each([1, 10, 50, 100])(
    'moveSpringValue RAF scaling at %i concurrent springs',
    (count) => {
      it('registers O(count) RAF callbacks per frame, not O(count^2), and leaks none on teardown', () => {
        const raf = createRafMock();

        @Component({ selector: 'move-spring-scale-host', template: '' })
        class ScaleHostComponent {
          readonly injector = inject(Injector);
          sources = Array.from({ length: count }, () => signal(0));
          springs = this.sources.map((source) =>
            moveSpringValue(source, { stiffness: 120, damping: 18, injector: this.injector }),
          );
        }

        TestBed.configureTestingModule({ imports: [ScaleHostComponent] });
        const fixture = TestBed.createComponent(ScaleHostComponent);
        fixture.detectChanges();

        const callsBeforeTrigger = raf.requestAnimationFrame.mock.calls.length;

        for (const source of fixture.componentInstance.sources) source.set(100);
        fixture.detectChanges();
        TestBed.tick();

        const registeredForFirstFrame =
          raf.requestAnimationFrame.mock.calls.length - callsBeforeTrigger;

        // One independent RAF registration per spring — no shared/batched scheduler that would
        // register fewer, and no per-spring duplicate work (or cross-spring blowup) that would
        // register meaningfully more.
        expect(registeredForFirstFrame).toBeGreaterThanOrEqual(count);
        expect(registeredForFirstFrame).toBeLessThanOrEqual(count + FRAMEWORK_RAF_ALLOWANCE);

        fixture.destroy();

        // At least one cancellation per spring at the moment of destroy — no leaked RAF loops at
        // any scale.
        expect(raf.cancelAnimationFrame.mock.calls.length).toBeGreaterThanOrEqual(count);

        // Nothing keeps re-arming itself after teardown, at any scale.
        const requestCountAfterDestroy = raf.requestAnimationFrame.mock.calls.length;
        expect(() => raf.flushFrames(count + FRAMEWORK_RAF_ALLOWANCE)).not.toThrow();
        expect(raf.requestAnimationFrame.mock.calls.length).toBe(requestCountAfterDestroy);
      });
    },
  );

  it('derives multiple moveTransform values from one shared spring with no extra RAF work', () => {
    // moveTransform is a pure computed() (see move-values.ts) — deriving several output ranges
    // from the same spring source must not create any additional RAF registration beyond that one
    // spring's own loop.
    const raf = createRafMock();

    @Component({ selector: 'move-spring-derived-host', template: '' })
    class DerivedHostComponent {
      source = signal(0);
      spring = moveSpringValue(this.source, {
        stiffness: 120,
        damping: 18,
        injector: inject(Injector),
      });
      width = moveTransform(this.spring, [0, 100], ['0px', '200px']);
      opacity = moveTransform(this.spring, [0, 100], [0, 1]);
      rotate = moveTransform(this.spring, [0, 100], ['0deg', '360deg']);
    }

    TestBed.configureTestingModule({ imports: [DerivedHostComponent] });
    const fixture = TestBed.createComponent(DerivedHostComponent);
    fixture.detectChanges();

    const callsBeforeTrigger = raf.requestAnimationFrame.mock.calls.length;

    fixture.componentInstance.source.set(100);
    fixture.detectChanges();
    TestBed.tick();

    const registeredForFirstFrame =
      raf.requestAnimationFrame.mock.calls.length - callsBeforeTrigger;

    // Exactly one spring's worth of RAF registrations (plus a small, constant framework
    // allowance), regardless of how many moveTransform() values are derived from it.
    expect(registeredForFirstFrame).toBeGreaterThanOrEqual(1);
    expect(registeredForFirstFrame).toBeLessThanOrEqual(1 + FRAMEWORK_RAF_ALLOWANCE);

    raf.flushFrames(3);

    expect(fixture.componentInstance.width()).toMatch(/^-?\d+(\.\d+)?px$/);
    expect(fixture.componentInstance.rotate()).toMatch(/^-?\d+(\.\d+)?deg$/);
    expect(fixture.componentInstance.opacity()).toBeGreaterThan(0);
  });
});

function createRafMock() {
  let frame = 0;
  let nextId = 1;
  // A real cancelAnimationFrame prevents a pending callback from ever firing — tracked here as a
  // Map (not an array) so `cancelAnimationFrame(id)` can remove exactly that pending frame.
  const pending = new Map<number, FrameRequestCallback>();

  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    const id = nextId++;
    pending.set(id, callback);
    return id;
  });

  const cancelAnimationFrame = vi.fn((id: number) => {
    pending.delete(id);
  });

  vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
  vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

  return {
    requestAnimationFrame,
    cancelAnimationFrame,
    flushFrames(count: number) {
      for (let i = 0; i < count; i += 1) {
        const next = pending.entries().next().value;
        if (!next) return;
        const [id, callback] = next;
        pending.delete(id);
        frame += 16;
        callback(frame);
      }
    },
  };
}
