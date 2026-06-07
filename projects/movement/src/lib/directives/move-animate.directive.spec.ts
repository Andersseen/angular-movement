import { Component, DebugElement, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveAnimateDirective } from './move-animate.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import { MoveVariantsDirective } from './move-variants.directive';

@Component({
  selector: 'move-animate-host',
  template: `<div [move]="'fade-up'">Animate Me</div>`,
  imports: [MoveAnimateDirective],
})
class TestHostComponent {}

@Component({
  selector: 'move-animate-disabled-host',
  template: `<div [move]="'fade-up'" [moveDisabled]="true">Disabled</div>`,
  imports: [MoveAnimateDirective],
})
class DisabledHostComponent {}

@Component({
  selector: 'move-animate-state-host',
  template: `
    <div
      [moveInitial]="{ opacity: 0, y: 24 }"
      [moveAnimate]="{ opacity: 1, y: 0 }"
      [moveExit]="{ opacity: 0, y: -24 }"
    >
      State Animate
    </div>
  `,
  imports: [MoveAnimateDirective],
})
class StateHostComponent {}

@Component({
  selector: 'move-animate-unknown-string-host',
  template: `<div [moveAnimate]="'missing-preset'">Unknown Animate</div>`,
  imports: [MoveAnimateDirective],
})
class UnknownStringHostComponent {}

@Component({
  selector: 'move-animate-variant-host',
  template: `
    <div [moveVariants]="variants" [moveAnimate]="activeVariant()">Variant Animate</div>
  `,
  imports: [MoveAnimateDirective, MoveVariantsDirective],
})
class VariantHostComponent {
  readonly activeVariant = signal('idle');
  readonly variants = {
    idle: { opacity: 1, scale: 1 },
    active: { opacity: 0.75, scale: 1.08 },
  };
}

describe('MoveAnimateDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;
  let engine: AnimationEngine;
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveAnimateDirective));
    engine = TestBed.inject(AnimationEngine);
    playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create and attach the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('plays the enter animation on init (after microtask flush)', async () => {
    // MoveAnimateDirective defers via Promise.resolve().then(...)
    // Flushing the microtask queue lets it run synchronously in tests
    await Promise.resolve();
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('passes the correct frames for the fade-up preset to the engine', async () => {
    await Promise.resolve();
    const frames = playSpy.mock.calls[0][1] as { opacity: number[]; y: number[] };
    // fade-up enter: opacity [0,1], y [24,0]
    expect(frames.opacity).toEqual([0, 1]);
    expect(frames.y).toEqual([24, 0]);
  });

  it('passes disabled:true to the engine when moveDisabled is set', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DisabledHostComponent],
      providers: [provideMovement()],
    });
    const f = TestBed.createComponent(DisabledHostComponent);
    f.detectChanges();
    const eng = TestBed.inject(AnimationEngine);
    const spy = vi.spyOn(eng, 'play').mockReturnValue(null as unknown as AnimationControls);

    await Promise.resolve();

    const callOpts = spy.mock.calls[0]?.[2];
    expect(callOpts?.disabled).toBe(true);
  });

  it('supports Motion-style initial and animate state inputs', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [StateHostComponent],
      providers: [provideMovement()],
    });
    const f = TestBed.createComponent(StateHostComponent);
    const eng = TestBed.inject(AnimationEngine);
    const spy = vi.spyOn(eng, 'play').mockReturnValue(null as unknown as AnimationControls);

    f.detectChanges();
    await Promise.resolve();

    expect(spy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: [0, 1], y: [24, 0] }),
      expect.any(Object),
    );
  });

  it('supports Motion-style exit state inputs for presence leave animations', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [StateHostComponent],
      providers: [provideMovement()],
    });
    const f = TestBed.createComponent(StateHostComponent);
    const eng = TestBed.inject(AnimationEngine);
    const spy = vi.spyOn(eng, 'play').mockReturnValue(null as unknown as AnimationControls);

    f.detectChanges();
    await Promise.resolve();

    const directive = f.debugElement
      .query(By.directive(MoveAnimateDirective))
      .injector.get(MoveAnimateDirective);
    await directive.playLeave();

    expect(spy).toHaveBeenLastCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: [1, 0], y: [0, -24] }),
      expect.any(Object),
    );
  });

  it('falls back to the none preset and warns for unknown string presets', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [UnknownStringHostComponent],
      providers: [provideMovement()],
    });
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const f = TestBed.createComponent(UnknownStringHostComponent);
    const eng = TestBed.inject(AnimationEngine);
    const spy = vi.spyOn(eng, 'play').mockReturnValue(null as unknown as AnimationControls);

    f.detectChanges();
    await Promise.resolve();

    expect(warnSpy).toHaveBeenCalledWith(
      '[Movement] Unknown preset: "missing-preset". Using "none" preset.',
    );
    expect(spy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: [1, 1] }),
      expect.any(Object),
    );
  });

  it('lets moveVariants own string moveAnimate values on the same host', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [VariantHostComponent],
      providers: [provideMovement()],
    });
    const eng = TestBed.inject(AnimationEngine);
    const spy = vi.spyOn(eng, 'play').mockReturnValue(null as unknown as AnimationControls);
    const f = TestBed.createComponent(VariantHostComponent);

    f.detectChanges();
    await Promise.resolve();

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy.mock.calls[0][1]).toEqual(
      expect.objectContaining({ opacity: [1, 1], scale: [1, 1] }),
    );
  });
});
