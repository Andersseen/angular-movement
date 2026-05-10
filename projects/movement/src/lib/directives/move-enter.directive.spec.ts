import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveEnterDirective } from './move-enter.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<div [moveEnter]="'fade-up'" [moveDuration]="400">Enter Me</div>`,
  imports: [MoveEnterDirective],
})
class TestHostComponent {}

describe('MoveEnterDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveEnterDirective));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create and attach the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('should play enter animation via engine on init', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    await Promise.resolve(); // wait for Promise.resolve().then() in ngOnInit

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: expect.any(Array), y: expect.any(Array) }),
      expect.any(Object),
    );
  });

  it('should cancel player on destroy', async () => {
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    const engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    await Promise.resolve(); // wait for Promise.resolve().then() in ngOnInit

    fixture.destroy();
    expect(mockPlayer.cancel).toHaveBeenCalled();
  });
});
