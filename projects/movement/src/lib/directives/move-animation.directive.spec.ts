import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MoveAnimationDirective } from './move-animation.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  selector: 'move-animation-string-host',
  template: `
    <div
      [moveAnimation]="{
        initial: { opacity: 0, strokeDasharray: '0 24' },
        animate: { opacity: 1, strokeDasharray: '24 24' },
      }"
    >
      Animate Me
    </div>
  `,
  imports: [MoveAnimationDirective],
})
class StringStateHostComponent {}

describe('MoveAnimationDirective', () => {
  let fixture: ComponentFixture<StringStateHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StringStateHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(StringStateHostComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('converts shared numeric and string state properties into keyframes', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        opacity: [0, 1],
        strokeDasharray: ['0 24', '24 24'],
      }),
    );
  });
});
