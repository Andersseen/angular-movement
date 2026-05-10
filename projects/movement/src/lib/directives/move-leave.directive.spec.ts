import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveLeaveDirective } from './move-leave.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<div [moveLeave]="'fade-up'" [moveDuration]="400">Leave Me</div>`,
  imports: [MoveLeaveDirective],
})
class TestHostComponent {}

describe('MoveLeaveDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveLeaveDirective));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create and attach the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('should not play animation on init', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('should play leave animation when playLeave is called', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const directive = debugElement.injector.get(MoveLeaveDirective);
    directive.playLeave();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: expect.any(Array), y: expect.any(Array) }),
      expect.any(Object),
    );
  });

  it('should cancel player on destroy', () => {
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    const engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    const localFixture = TestBed.createComponent(TestHostComponent);
    localFixture.detectChanges();

    const directive = localFixture.debugElement
      .query(By.directive(MoveLeaveDirective))
      .injector.get(MoveLeaveDirective);
    directive.playLeave();

    localFixture.destroy();
    expect(mockPlayer.cancel).toHaveBeenCalled();
  });
});
