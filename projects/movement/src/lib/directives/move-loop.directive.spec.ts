import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveLoopDirective } from './move-loop.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  selector: 'move-loop-host',
  template: `<div [moveLoop]="'spin'">Loop Me</div>`,
  imports: [MoveLoopDirective],
})
class TestHostComponent {}

@Component({
  selector: 'move-loop-disabled-host',
  template: `<div [moveLoop]="'spin'" [moveDisabled]="true">Disabled</div>`,
  imports: [MoveLoopDirective],
})
class DisabledHostComponent {}

@Component({
  selector: 'move-loop-none-host',
  template: `<div [moveLoop]="'none'">No Loop</div>`,
  imports: [MoveLoopDirective],
})
class NoneHostComponent {}

describe('MoveLoopDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;
  let engine: AnimationEngine;
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    engine = TestBed.inject(AnimationEngine);
    playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveLoopDirective));
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('should create and attach the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('plays an endless, restarting loop by default', () => {
    expect(playSpy).toHaveBeenCalledTimes(1);

    const options = playSpy.mock.calls[0]?.[2];
    expect(options?.repeat).toEqual({
      repeat: Infinity,
      repeatType: 'loop',
      repeatDelay: 0,
    });
  });

  it('passes loop frames for the spin preset', () => {
    const frames = playSpy.mock.calls[0][1] as { rotate: number[] };
    expect(frames.rotate).toEqual([0, 360]);
  });

  it('passes disabled:true to the engine when moveDisabled is set', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DisabledHostComponent],
      providers: [provideMovement()],
    });
    const eng = TestBed.inject(AnimationEngine);
    const spy = vi.spyOn(eng, 'play').mockReturnValue(null as unknown as AnimationControls);
    const f = TestBed.createComponent(DisabledHostComponent);
    f.detectChanges();

    const callOpts = spy.mock.calls[0]?.[2];
    expect(callOpts?.disabled).toBe(true);
  });

  it('does not play when preset is none', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoneHostComponent],
      providers: [provideMovement()],
    });
    const eng = TestBed.inject(AnimationEngine);
    const spy = vi.spyOn(eng, 'play').mockReturnValue(null as unknown as AnimationControls);

    const f = TestBed.createComponent(NoneHostComponent);
    f.detectChanges();

    expect(spy).not.toHaveBeenCalled();
  });
});

@Component({
  selector: 'move-loop-repeat-host',
  template: `
    <div
      [moveLoop]="'pulse'"
      moveLoopType="reverse"
      [moveLoopDelay]="150"
      [moveLoopCount]="4"
    ></div>
  `,
  imports: [MoveLoopDirective],
})
class RepeatHostComponent {}

@Component({
  selector: 'move-loop-bad-count-host',
  template: `<div [moveLoop]="'pulse'" [moveLoopCount]="0"></div>`,
  imports: [MoveLoopDirective],
})
class BadCountHostComponent {}

describe('MoveLoopDirective repeat controls', () => {
  function playSpyFor(host: unknown) {
    TestBed.configureTestingModule({
      imports: [host as never],
      providers: [provideMovement()],
    });
    const spy = vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue({
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    } as AnimationControls);
    TestBed.createComponent(host as never).detectChanges();
    return spy;
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('forwards type, delay and count to the engine', () => {
    const spy = playSpyFor(RepeatHostComponent);

    expect(spy.mock.calls[0]?.[2]?.repeat).toEqual({
      repeat: 4,
      repeatType: 'reverse',
      repeatDelay: 150,
    });
  });

  it('falls back to an endless loop for a non-positive count', () => {
    const spy = playSpyFor(BadCountHostComponent);

    // A loop of zero cycles is meaningless; treat it as the default rather than animating nothing.
    expect(spy.mock.calls[0]?.[2]?.repeat?.repeat).toBe(Infinity);
  });
});
