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
});

function createRafMock() {
  let frame = 0;
  const callbacks: FrameRequestCallback[] = [];

  const requestAnimationFrame = vi.fn((callback: FrameRequestCallback) => {
    callbacks.push(callback);
    return callbacks.length;
  });

  const cancelAnimationFrame = vi.fn();

  vi.stubGlobal('requestAnimationFrame', requestAnimationFrame);
  vi.stubGlobal('cancelAnimationFrame', cancelAnimationFrame);

  return {
    flushFrames(count: number) {
      for (let i = 0; i < count; i += 1) {
        const callback = callbacks.shift();
        if (!callback) return;
        frame += 16;
        callback(frame);
      }
    },
  };
}
