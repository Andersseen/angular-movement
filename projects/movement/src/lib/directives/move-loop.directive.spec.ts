import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveLoopDirective } from './move-loop.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<div [moveLoop]="'spin'">Loop Me</div>`,
  imports: [MoveLoopDirective],
})
class TestHostComponent {}

@Component({
  template: `<div [moveLoop]="'spin'" [moveDisabled]="true">Disabled</div>`,
  imports: [MoveLoopDirective],
})
class DisabledHostComponent {}

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

  it('plays the loop animation on init with iterations Infinity', () => {
    expect(playSpy).toHaveBeenCalledTimes(1);

    const options = playSpy.mock.calls[0]?.[2];
    expect(options?.iterations).toBe(Infinity);
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
});
