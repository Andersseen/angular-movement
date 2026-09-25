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

    debugElement.triggerEventHandler('pointerenter', { pointerType: 'mouse' });
    expect(playSpy).toHaveBeenCalledTimes(1);

    playSpy.mockClear();

    debugElement.triggerEventHandler('pointerleave', { pointerType: 'mouse' });
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore a repeated pointerenter while already hovered', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    debugElement.triggerEventHandler('pointerenter', { pointerType: 'mouse' });
    debugElement.triggerEventHandler('pointerenter', { pointerType: 'mouse' });

    // Browsers can emit repeated enters over child elements; replaying would restart the animation.
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('should ignore pointerleave when it was never hovered', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    debugElement.triggerEventHandler('pointerleave', { pointerType: 'mouse' });

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('should ignore touch pointers entirely — touch has no hover state', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    debugElement.triggerEventHandler('pointerenter', { pointerType: 'touch' });
    debugElement.triggerEventHandler('pointerleave', { pointerType: 'touch' });

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('should treat a pen as hover-capable and leave cleanly on lift', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    debugElement.triggerEventHandler('pointerenter', { pointerType: 'pen' });
    expect(playSpy).toHaveBeenCalledTimes(1);

    debugElement.triggerEventHandler('pointerleave', { pointerType: 'pen' });
    expect(playSpy).toHaveBeenCalledTimes(2);
  });

  it('should never bind touch events, so it cannot preventDefault a tap or a scroll', () => {
    const host = debugElement.nativeElement as HTMLElement;
    const touchstart = new Event('touchstart', { bubbles: true, cancelable: true });

    host.dispatchEvent(touchstart);

    expect(touchstart.defaultPrevented).toBe(false);
    const bound = debugElement.listeners.map((listener) => listener.name);
    expect(bound).toEqual(expect.arrayContaining(['pointerenter', 'pointerleave']));
    expect(bound.filter((name) => name.startsWith('touch') || name.startsWith('mouse'))).toEqual(
      [],
    );
  });

  it('should not enter hover from the compatibility mouse events a touch tap emits', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);
    const host = debugElement.nativeElement as HTMLElement;

    // After a tap, browsers fire mouseover/mouseenter for legacy pages. Those used to leave the
    // element stuck in its hovered state on mobile.
    host.dispatchEvent(new MouseEvent('mouseenter'));
    host.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('keeps the deprecated touch members callable without effect on hover start', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);
    const directive = debugElement.injector.get(MoveHoverDirective);

    directive.onTouchStart();
    expect(playSpy).not.toHaveBeenCalled();

    directive.onMouseEnter();
    playSpy.mockClear();
    directive.onTouchEnd();
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

    de.triggerEventHandler('pointerenter', { pointerType: 'mouse' });
    expect(playSpy).toHaveBeenCalledTimes(1);

    playSpy.mockClear();

    de.triggerEventHandler('pointerleave', { pointerType: 'mouse' });
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

    de.triggerEventHandler('pointerenter', { pointerType: 'mouse' });
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

    de.triggerEventHandler('pointerenter', { pointerType: 'mouse' });
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
