import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveTapDirective } from './move-tap.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<button [moveWhileTap]="{ scale: [1, 0.95] }">Tap Me</button>`,
  imports: [MoveTapDirective],
})
class TestHostComponent {}

describe('MoveTapDirective', () => {
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
    debugElement = fixture.debugElement.query(By.directive(MoveTapDirective));
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

  it('plays animation on pointerdown', () => {
    debugElement.triggerEventHandler('pointerdown', null);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('plays reverse animation on pointerup', () => {
    debugElement.triggerEventHandler('pointerdown', null);
    playSpy.mockClear();

    debugElement.triggerEventHandler('pointerup', null);
    expect(playSpy).toHaveBeenCalledTimes(1);

    // The frames passed on pointerup should be reversed
    const callArgs = playSpy.mock.calls[0];
    const frames = callArgs[1] as { scale: number[] };
    expect(frames.scale[0]).toBe(0.95); // reversed: first value is the end of original
    expect(frames.scale[1]).toBe(1);
  });

  it('plays reverse animation on pointercancel', () => {
    debugElement.triggerEventHandler('pointerdown', null);
    playSpy.mockClear();

    debugElement.triggerEventHandler('pointercancel', null);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('plays reverse animation on pointerleave', () => {
    debugElement.triggerEventHandler('pointerdown', null);
    playSpy.mockClear();

    debugElement.triggerEventHandler('pointerleave', null);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('does not play twice if already tapped (guard against double events)', () => {
    debugElement.triggerEventHandler('pointerdown', null);
    debugElement.triggerEventHandler('pointerdown', null); // second call should be ignored
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('does not play pointerup reverse if not currently tapped', () => {
    // pointerup without prior pointerdown should do nothing
    debugElement.triggerEventHandler('pointerup', null);
    expect(playSpy).not.toHaveBeenCalled();
  });
});
