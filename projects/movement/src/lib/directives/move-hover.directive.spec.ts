import { Component, DebugElement, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveHoverDirective } from './move-hover.directive';
import { MovePresenceDirective } from './move-presence.directive';
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

  it('should ignore a repeated mouseenter while already hovered', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    debugElement.triggerEventHandler('mouseenter', null);
    debugElement.triggerEventHandler('mouseenter', null);

    // Browsers can emit repeated enters over child elements; replaying would restart the animation.
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore mouseleave when it was never hovered', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    debugElement.triggerEventHandler('mouseleave', null);

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('should treat touchstart as hover and prevent the emulated mouse event', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);
    const preventDefault = vi.fn();

    debugElement.triggerEventHandler('touchstart', { preventDefault });

    // Without preventDefault the browser also fires mouseenter, double-triggering on mobile.
    expect(preventDefault).toHaveBeenCalledTimes(1);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('should reverse on touchend and on touchcancel', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    debugElement.triggerEventHandler('touchstart', { preventDefault: vi.fn() });
    playSpy.mockClear();
    debugElement.triggerEventHandler('touchend', null);
    expect(playSpy).toHaveBeenCalledTimes(1);

    debugElement.triggerEventHandler('touchstart', { preventDefault: vi.fn() });
    playSpy.mockClear();
    debugElement.triggerEventHandler('touchcancel', null);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore a repeated touchstart while already active', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    debugElement.triggerEventHandler('touchstart', { preventDefault: vi.fn() });
    debugElement.triggerEventHandler('touchstart', { preventDefault: vi.fn() });

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

  it('should restart animation when inputs change while hovered', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ReactiveHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(ReactiveHostComponent);
    localFixture.detectChanges();
    const de = localFixture.debugElement.query(By.directive(MoveHoverDirective));

    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    de.triggerEventHandler('mouseenter', null);
    expect(playSpy).toHaveBeenCalledTimes(1);

    localFixture.componentInstance.duration.set(500);
    localFixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(2);
  });

  it('cancels its own player once a *movePresence exit begins, instead of racing the leave animation', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PresenceHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(PresenceHostComponent);
    localFixture.detectChanges();
    const de = localFixture.debugElement.query(By.directive(MoveHoverDirective));

    const engine = TestBed.inject(AnimationEngine);
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    de.triggerEventHandler('mouseenter', null);
    expect(mockPlayer.cancel).not.toHaveBeenCalled();

    localFixture.componentInstance.show.set(false);
    localFixture.detectChanges();
    await Promise.resolve();

    expect(mockPlayer.cancel).toHaveBeenCalled();
  });
});

@Component({
  template: `
    <ng-container *movePresence="show()">
      <div [moveWhileHover]="{ scale: [1, 1.1] }">Hover Me</div>
    </ng-container>
  `,
  imports: [MoveHoverDirective, MovePresenceDirective],
})
class PresenceHostComponent {
  show = signal(true);
}

@Component({
  template: `
    <div [moveWhileHover]="{ opacity: [0, 1] }" [moveReverseDuration]="0">Hover Me</div>
  `,
  imports: [MoveHoverDirective],
})
class InstantReverseHostComponent {}

@Component({
  template: `<div [moveWhileHover]="frames()" [moveDuration]="duration()">Hover Me</div>`,
  imports: [MoveHoverDirective],
})
class ReactiveHostComponent {
  frames = signal<{ scale: number[] }>({ scale: [1, 1.1] });
  duration = signal(300);
}
