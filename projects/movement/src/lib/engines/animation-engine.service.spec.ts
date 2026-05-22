import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { AnimationEngine } from './animation-engine.service';
import { provideMovement } from '../providers/provide-movement';

describe('AnimationEngine', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be created', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    expect(engine).toBeTruthy();
  });

  it('should return null on server platform', () => {
    TestBed.configureTestingModule({
      providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
    });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const result = engine.play(host, { opacity: [0, 1] });
    expect(result).toBeNull();
  });

  it('should return null when disabled and apply final styles', () => {
    TestBed.configureTestingModule({
      providers: [provideMovement({ disabled: true })],
    });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const result = engine.play(host, { opacity: [0, 1] }, { disabled: true });
    expect(result).toBeNull();
    expect(host.style.opacity).toBe('1');
  });

  it('should create a SpringPlayer when spring config is provided', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as HTMLElement).animate = animateSpy;

    const result = engine.play(
      host,
      { opacity: [0, 1] },
      { spring: { stiffness: 200, damping: 20 } },
    );
    expect(result).toBeTruthy();
    expect(animateSpy).toHaveBeenCalled();
    const keyframes = animateSpy.mock.calls[0][0] as Keyframe[];
    expect(keyframes.length).toBeGreaterThan(0);
  });

  it('should create a WaapiPlayer when no spring is provided', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as HTMLElement).animate = animateSpy;

    const result = engine.play(host, { opacity: [0, 1] });
    expect(result).toBeTruthy();
    expect(animateSpy).toHaveBeenCalled();
  });

  it('should prepare SVG stroke draw styles before animating strokeDashoffset', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    Object.defineProperty(host, 'getTotalLength', {
      value: vi.fn().mockReturnValue(42),
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as SVGElement).animate = animateSpy;

    const result = engine.play(host, { strokeDashoffset: [42, 0] });

    expect(result).toBeTruthy();
    expect(host.style.strokeDasharray).toBe('42');
    expect(host.style.strokeDashoffset).toBe('42');
    expect(animateSpy).toHaveBeenCalled();
  });

  it('should fall back to a default SVG stroke length when getTotalLength fails', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    Object.defineProperty(host, 'getTotalLength', {
      value: vi.fn(() => {
        throw new Error('not measurable');
      }),
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as SVGElement).animate = animateSpy;

    engine.play(host, { strokeDashoffset: [28, 0] });

    expect(host.style.strokeDasharray).toBe('28');
    expect(host.style.strokeDashoffset).toBe('28');
  });

  it('should validate invalid spring values and fall back to defaults', () => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    const engine = TestBed.inject(AnimationEngine);
    const host = document.createElement('div');

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {
      /* suppress dev warnings in tests */
    });

    const animateSpy = vi.fn().mockReturnValue({
      addEventListener: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      playState: 'running',
      commitStyles: vi.fn(),
    });
    (host as HTMLElement).animate = animateSpy;

    // Use ngDevMode guard path - the test environment may or may not have ngDevMode
    const result = engine.play(
      host,
      { opacity: [0, 1] },
      {
        spring: { stiffness: -100, damping: -5, mass: 0 },
      },
    );
    expect(result).toBeTruthy();
    warnSpy.mockRestore();
  });
});
