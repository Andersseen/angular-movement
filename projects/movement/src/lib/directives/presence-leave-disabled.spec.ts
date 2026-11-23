import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockInstance, vi } from 'vitest';
import { MovePresenceForDirective } from './move-presence-for.directive';
import { MovePresenceDirective } from './move-presence.directive';
import { MoveAnimateDirective } from './move-animate.directive';
import { MoveLeaveDirective } from './move-leave.directive';
import { MoveAnimationDirective } from './move-animation.directive';
import { MoveVariantsDirective } from './move-variants.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

/**
 * The SSR carousel pattern: the first, server-rendered slide must not fade in again after hydration
 * (`[moveDisabled]="!changed()"`), but once the user navigates the outgoing slide must still play
 * its exit. The leave has to read `moveDisabled` as it is when the item leaves, not as it was when
 * the item entered.
 */
@Component({
  template: `
    <img
      *movePresenceFor="let src of slides()"
      move="fade-up"
      [moveDisabled]="!changed()"
      [attr.data-src]="src"
      alt=""
    />
  `,
  imports: [MovePresenceForDirective, MoveAnimateDirective],
})
class AnimateCarouselComponent {
  readonly slides = signal(['a']);
  readonly changed = signal(false);
}

@Component({
  template: `
    <img
      *movePresenceFor="let src of slides()"
      moveLeave="fade-up"
      [moveDisabled]="!changed()"
      [attr.data-src]="src"
      alt=""
    />
  `,
  imports: [MovePresenceForDirective, MoveLeaveDirective],
})
class LeaveCarouselComponent {
  readonly slides = signal(['a']);
  readonly changed = signal(false);
}

@Component({
  template: `
    <img
      *movePresenceFor="let src of slides()"
      [moveAnimation]="{ initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }"
      [moveDisabled]="!changed()"
      [attr.data-src]="src"
      alt=""
    />
  `,
  imports: [MovePresenceForDirective, MoveAnimationDirective],
})
class AnimationCarouselComponent {
  readonly slides = signal(['a']);
  readonly changed = signal(false);
}

@Component({
  template: `
    <img
      *movePresenceFor="let src of slides()"
      [moveVariants]="{ hidden: { opacity: 0 }, shown: { opacity: 1 } }"
      moveVariant="shown"
      moveExitVariant="hidden"
      [moveDisabled]="!changed()"
      [attr.data-src]="src"
      alt=""
    />
  `,
  imports: [MovePresenceForDirective, MoveVariantsDirective],
})
class VariantsCarouselComponent {
  readonly slides = signal(['a']);
  readonly changed = signal(false);
}

@Component({
  template: `
    <div *movePresence="shown()" moveLeave="fade-up" [moveDisabled]="disabled()" data-box></div>
  `,
  imports: [MovePresenceDirective, MoveLeaveDirective],
})
class PresenceToggleComponent {
  readonly shown = signal(true);
  readonly disabled = signal(false);
}

function controls(): AnimationControls {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    currentTime: 0,
    finished: new Promise<void>(() => undefined),
  };
}

async function flush(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  await Promise.resolve();
  fixture.detectChanges();
}

function leaveCalls(play: MockInstance<AnimationEngine['play']>) {
  return play.mock.calls.filter((call) => (call[2] as { disabled: boolean }).disabled === false);
}

describe('leave reads moveDisabled when the item leaves', () => {
  let play: MockInstance<AnimationEngine['play']>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    play = vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockImplementation(() => controls());
  });

  it('moveAnimate: the server-rendered slide still plays its exit after navigation', async () => {
    const fixture = TestBed.createComponent(AnimateCarouselComponent);
    await flush(fixture);

    // The first slide's entrance is skipped.
    expect(play).toHaveBeenCalledTimes(1);
    expect((play.mock.calls[0][2] as { disabled: boolean }).disabled).toBe(true);

    // Navigate: both signals change in the same tick.
    fixture.componentInstance.changed.set(true);
    fixture.componentInstance.slides.set(['b']);
    await flush(fixture);

    const leaving = fixture.nativeElement.querySelector('[data-src="a"]') as HTMLElement;
    const exits = leaveCalls(play).filter((call) => call[0] === leaving);
    expect(exits).toHaveLength(1);
  });

  it('moveLeave: the server-rendered slide still plays its exit after navigation', async () => {
    const fixture = TestBed.createComponent(LeaveCarouselComponent);
    await flush(fixture);
    expect(play).not.toHaveBeenCalled();

    fixture.componentInstance.changed.set(true);
    fixture.componentInstance.slides.set(['b']);
    await flush(fixture);

    const leaving = fixture.nativeElement.querySelector('[data-src="a"]') as HTMLElement;
    expect(play.mock.calls.filter((call) => call[0] === leaving)).toHaveLength(1);
  });

  for (const [name, host] of [
    ['moveAnimation', AnimationCarouselComponent],
    ['moveVariants', VariantsCarouselComponent],
  ] as const) {
    it(`${name}: the server-rendered slide still plays its exit after navigation`, async () => {
      const fixture = TestBed.createComponent<AnimateCarouselComponent>(host);
      await flush(fixture);
      const leaving = fixture.nativeElement.querySelector('[data-src="a"]') as HTMLElement;
      expect(leaveCalls(play).filter((call) => call[0] === leaving)).toHaveLength(0);

      fixture.componentInstance.changed.set(true);
      fixture.componentInstance.slides.set(['b']);
      await flush(fixture);

      // The exit is the call that ends at `opacity: 0`.
      const exits = leaveCalls(play).filter(
        (call) => call[0] === leaving && (call[1] as { opacity?: number[] }).opacity?.at(-1) === 0,
      );
      expect(exits).toHaveLength(1);
    });
  }

  it('moveLeave: disabling right before removal skips the exit', async () => {
    const fixture = TestBed.createComponent(PresenceToggleComponent);
    await flush(fixture);

    fixture.componentInstance.disabled.set(true);
    fixture.componentInstance.shown.set(false);
    await flush(fixture);

    expect(play).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[data-box]')).toBeNull();
  });
});
