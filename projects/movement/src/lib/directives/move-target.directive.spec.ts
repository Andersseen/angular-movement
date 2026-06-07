import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { AnimationControls } from '../engines/animation-controls';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MoveKeyframes } from '../presets/presets.types';
import { provideMovement } from '../providers/provide-movement';
import { MoveTargetDirective } from './move-target.directive';

@Component({
  template: `
    <div
      [moveTarget]="active()"
      [moveFrames]="frames"
      [moveDuration]="duration"
      [moveReverseDuration]="reverseDuration"
      moveDelay="60"
    ></div>
  `,
  imports: [MoveTargetDirective],
})
class TestHostComponent {
  readonly active = signal(false);
  frames: MoveKeyframes = { scale: [1, 1.15] };
  duration = 500;
  reverseDuration: number | undefined = undefined;
}

@Component({
  selector: 'move-target-preset-host',
  template: `<div [moveTarget]="active()" movePreset="icon-bounce"></div>`,
  imports: [MoveTargetDirective],
})
class PresetHostComponent {
  readonly active = signal(false);
}

describe('MoveTargetDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let engine: AnimationEngine;
  let playSpy: ReturnType<typeof vi.spyOn>;
  let player: AnimationControls;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });

    fixture = TestBed.createComponent(TestHostComponent);
    engine = TestBed.inject(AnimationEngine);
    player = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      finished: Promise.resolve(),
      currentTime: 0,
    };
    playSpy = vi.spyOn(engine, 'play').mockReturnValue(player);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('should create and attach the directive', () => {
    const debugElement = fixture.debugElement.query(By.directive(MoveTargetDirective));
    expect(debugElement).toBeTruthy();
  });

  it('plays forward frames when the target becomes true', () => {
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.calls[0][1]).toEqual({ scale: [1, 1.15] });
  });

  it('passes duration and delay overrides to the forward animation', () => {
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();

    const options = playSpy.mock.calls[0][2];
    expect(options?.config?.duration).toBe(500);
    expect(options?.config?.delay).toBe(60);
  });

  it('cancels the previous player and plays reverse frames when the target becomes false', () => {
    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    playSpy.mockClear();

    fixture.componentInstance.active.set(false);
    fixture.detectChanges();

    expect(player.cancel).toHaveBeenCalledTimes(1);
    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.calls[0][1]).toEqual({ scale: [1.15, 1] });
    expect(playSpy.mock.calls[0][2]?.config?.duration).toBe(500);
    expect(playSpy.mock.calls[0][2]?.config?.easing).toBe('ease-out');
    expect(playSpy.mock.calls[0][2]?.config?.delay).toBe(0);
  });

  it('uses moveReverseDuration when provided', () => {
    fixture.componentInstance.reverseDuration = 180;

    fixture.componentInstance.active.set(true);
    fixture.detectChanges();
    playSpy.mockClear();

    fixture.componentInstance.active.set(false);
    fixture.detectChanges();

    expect(playSpy.mock.calls[0][2]?.config?.duration).toBe(180);
  });

  it('passes disabled true when reduced motion is preferred', () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    );

    fixture.componentInstance.active.set(true);
    fixture.detectChanges();

    expect(playSpy.mock.calls[0][2]?.disabled).toBe(true);
  });

  it('resolves frames from movePreset when moveFrames is not provided', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PresetHostComponent],
      providers: [provideMovement()],
    });

    const localFixture = TestBed.createComponent(PresetHostComponent);
    const localEngine = TestBed.inject(AnimationEngine);
    const localSpy = vi.spyOn(localEngine, 'play').mockReturnValue(player);
    localFixture.detectChanges();

    localFixture.componentInstance.active.set(true);
    localFixture.detectChanges();

    expect(localSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ y: [0, -3, 0] }),
      expect.any(Object),
    );
  });
});
