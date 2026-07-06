import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MovePresenceDirective } from './move-presence.directive';
import { MoveAnimateDirective } from './move-animate.directive';
import { MoveLeaveDirective } from './move-leave.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `
    <ng-container *movePresence="show()">
      <div [move]="'fade-up'" [moveDuration]="300">Child</div>
    </ng-container>
  `,
  imports: [MovePresenceDirective, MoveAnimateDirective],
})
class TestHostComponent {
  show = signal(true);
}

@Component({
  template: `
    <ng-container *movePresence="show()">
      <div [moveLeave]="'fade-up'" [moveDuration]="300">Leaving Child</div>
    </ng-container>
  `,
  imports: [MovePresenceDirective, MoveLeaveDirective],
})
class LeaveHostComponent {
  show = signal(true);
}

describe('MovePresenceDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should render content when movePresence is true', () => {
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Child');
  });

  it('should remove content when movePresence becomes false', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Child');

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();

    // Wait for Promise.all in removeView
    await new Promise((r) => setTimeout(r, 50));

    expect(fixture.nativeElement.textContent).not.toContain('Child');
  });

  it('should cancel removal if show toggles back quickly', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const enterPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    const leavePlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: new Promise(() => {
        /* intentionally never resolves */
      }),
    };
    vi.spyOn(engine, 'play').mockReturnValueOnce(enterPlayer).mockReturnValueOnce(leavePlayer);

    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    await Promise.resolve();

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();

    // Toggle back before leave finishes
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();

    expect(enterPlayer.cancel).toHaveBeenCalledTimes(1);
    expect(leavePlayer.cancel).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).toContain('Child');
  });

  it('should not remove the view if leave resolves after show toggles back', async () => {
    const engine = TestBed.inject(AnimationEngine);
    let resolveLeave: () => void = () => {
      // resolved manually below
    };
    const leavePlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: new Promise((resolve) => {
        resolveLeave = resolve;
        // Intentionally deferred; we resolve manually after toggling back to visible.
      }),
    };
    vi.spyOn(engine, 'play').mockReturnValue(leavePlayer);

    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    await Promise.resolve();

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await Promise.resolve();

    // Toggle back before leave finishes
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();
    await Promise.resolve();

    // Leave now resolves after the view has been recreated
    resolveLeave();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 50));

    expect(fixture.nativeElement.textContent).toContain('Child');
  });

  it('should play moveLeave before removing the view', async () => {
    const leaveFixture = TestBed.createComponent(LeaveHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    leaveFixture.componentInstance.show.set(true);
    leaveFixture.detectChanges();
    expect(leaveFixture.nativeElement.textContent).toContain('Leaving Child');

    leaveFixture.componentInstance.show.set(false);
    leaveFixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve, 50));

    expect(playSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ opacity: expect.any(Array), y: expect.any(Array) }),
      expect.any(Object),
    );
    expect(leaveFixture.nativeElement.textContent).not.toContain('Leaving Child');
  });
});
