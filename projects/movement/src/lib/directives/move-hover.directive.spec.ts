import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveHoverDirective } from './move-hover.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<div [moveWhileHover]="{ scale: [1, 1.1] }">Hover Me</div>`,
  imports: [MoveHoverDirective],
})
class TestHostComponent {}

describe('MoveHoverDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveHoverDirective));
  });

  it('should create and attach the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('should handle enter and leave events natively through host bindings', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    // Simulate mouseenter native host binding
    debugElement.triggerEventHandler('mouseenter', null);
    expect(playSpy).toHaveBeenCalledTimes(1);

    playSpy.mockClear();

    // Simulate mouseleave
    debugElement.triggerEventHandler('mouseleave', null);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('should clear styles immediately when reverseDuration is 0', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [InstantReverseHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(InstantReverseHostComponent);
    localFixture.detectChanges();
    const de = localFixture.debugElement.query(By.directive(MoveHoverDirective));

    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    de.triggerEventHandler('mouseenter', null);
    expect(playSpy).toHaveBeenCalledTimes(1);

    playSpy.mockClear();

    de.triggerEventHandler('mouseleave', null);
    expect(playSpy).not.toHaveBeenCalled();
    expect((de.nativeElement as HTMLElement).style.opacity).toBe('');
  });
});

@Component({
  template: `
    <div [moveWhileHover]="{ opacity: [0, 1] }" [moveReverseDuration]="0">Hover Me</div>
  `,
  imports: [MoveHoverDirective],
})
class InstantReverseHostComponent {}
