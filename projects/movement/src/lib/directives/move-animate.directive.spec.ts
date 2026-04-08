import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveAnimateDirective } from './move-animate.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<div [move]="'fade-up'">Animate Me</div>`,
  imports: [MoveAnimateDirective],
})
class TestHostComponent {}

@Component({
  template: `<div [move]="'fade-up'" [moveDisabled]="true">Disabled</div>`,
  imports: [MoveAnimateDirective],
})
class DisabledHostComponent {}

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
});
