import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { MoveVariantsDirective } from './move-variants.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `
    <div [moveVariants]="variants()" [moveAnimate]="activeVariant()" [moveDuration]="300">
      Variant Child
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class TestHostComponent {
  activeVariant = signal<string>('idle');
  variants = signal({
    idle: { opacity: [0.5, 1] },
    active: { scale: [1, 1.2] },
  });
}

describe('MoveVariantsDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveVariantsDirective));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('should animate when activeVariant changes', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture.componentInstance.activeVariant.set('active');
    fixture.detectChanges();

    expect(playSpy).toHaveBeenCalled();
  });

  it('should cancel previous player when variant changes again', () => {
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    const engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    fixture.componentInstance.activeVariant.set('active');
    fixture.detectChanges();

    fixture.componentInstance.activeVariant.set('idle');
    fixture.detectChanges();

    expect(mockPlayer.cancel).toHaveBeenCalledTimes(1);
  });

  it('should not animate if variant name does not exist', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture.componentInstance.activeVariant.set('nonexistent');
    fixture.detectChanges();

    // No additional play call beyond initial
    const callsForNonExistent = playSpy.mock.calls.filter(
      (call) => call[1] === undefined || Object.keys(call[1] as object).length === 0,
    );
    // Should not have tried to animate undefined variant
    expect(callsForNonExistent.length).toBe(0);
  });
});
