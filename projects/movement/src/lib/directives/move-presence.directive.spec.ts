import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MovePresenceDirective } from './move-presence.directive';
import { MoveAnimateDirective } from './move-animate.directive';
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
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: new Promise(() => {
        /* intentionally never resolves */
      }),
    };
    vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    fixture.componentInstance.show.set(true);
    fixture.detectChanges();

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();

    // Toggle back before leave finishes
    fixture.componentInstance.show.set(true);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Child');
  });
});
