import { Component, DebugElement, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveFocusDirective } from './move-focus.directive';
import { MovePresenceDirective } from './move-presence.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<button [moveWhileFocus]="{ scale: [1, 1.05] }">Focus Me</button>`,
  imports: [MoveFocusDirective],
})
class TestHostComponent {}

describe('MoveFocusDirective', () => {
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
    debugElement = fixture.debugElement.query(By.directive(MoveFocusDirective));
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

  it('plays animation on focusin', () => {
    debugElement.triggerEventHandler('focusin', null);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('plays reverse animation on focusout', () => {
    debugElement.triggerEventHandler('focusin', null);
    playSpy.mockClear();

    debugElement.triggerEventHandler('focusout', null);
    expect(playSpy).toHaveBeenCalledTimes(1);

    const callArgs = playSpy.mock.calls[0];
    const frames = callArgs[1] as { scale: number[] };
    expect(frames.scale[0]).toBe(1.05);
    expect(frames.scale[1]).toBe(1);
  });

  it('does not play twice if already focused', () => {
    debugElement.triggerEventHandler('focusin', null);
    debugElement.triggerEventHandler('focusin', null);
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('does not play focusout reverse if not currently focused', () => {
    debugElement.triggerEventHandler('focusout', null);
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('cancels its own player once a *movePresence exit begins, instead of racing the leave animation', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PresenceHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(PresenceHostComponent);
    localFixture.detectChanges();
    const de = localFixture.debugElement.query(By.directive(MoveFocusDirective));

    const localEngine = TestBed.inject(AnimationEngine);
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    vi.spyOn(localEngine, 'play').mockReturnValue(mockPlayer);

    de.triggerEventHandler('focusin', null);
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
      <button [moveWhileFocus]="{ scale: [1, 1.05] }">Focus Me</button>
    </ng-container>
  `,
  imports: [MoveFocusDirective, MovePresenceDirective],
})
class PresenceHostComponent {
  show = signal(true);
}
