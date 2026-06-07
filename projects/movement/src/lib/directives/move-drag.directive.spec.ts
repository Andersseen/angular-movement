import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveDragDirective } from './move-drag.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  selector: 'move-drag-host',
  template: `
    <div
      moveDrag
      [moveDragConstraints]="{ left: -50, right: 50, top: -50, bottom: 50 }"
      [moveDragElastic]="0.5"
    >
      Drag Me
    </div>
  `,
  imports: [MoveDragDirective],
})
class TestHostComponent {}

@Component({
  selector: 'move-drag-axis-host',
  template: `<div moveDrag="x">Drag X</div>`,
  imports: [MoveDragDirective],
})
class AxisHostComponent {}

@Component({
  selector: 'move-drag-snap-host',
  template: `<div moveDrag [moveDragSnapToOrigin]="true">Snap</div>`,
  imports: [MoveDragDirective],
})
class SnapHostComponent {}

@Component({
  selector: 'move-drag-momentum-host',
  template: `<div moveDrag [moveDragMomentum]="true">Momentum</div>`,
  imports: [MoveDragDirective],
})
class MomentumHostComponent {}

@Component({
  selector: 'move-drag-output-host',
  template: `
    <div
      moveDrag
      (moveDragStart)="events.push($event)"
      (moveDragMove)="events.push($event)"
      (moveDragEnd)="events.push($event)"
    >
      Events
    </div>
  `,
  imports: [MoveDragDirective],
})
class OutputHostComponent {
  events: unknown[] = [];
}

describe('MoveDragDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;

  beforeEach(() => {
    // jsdom doesn't implement Pointer Capture API
    HTMLElement.prototype.setPointerCapture = HTMLElement.prototype.setPointerCapture || vi.fn();
    HTMLElement.prototype.releasePointerCapture =
      HTMLElement.prototype.releasePointerCapture || vi.fn();

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveDragDirective));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('should start dragging on pointerdown', () => {
    const el = debugElement.nativeElement as HTMLElement;
    const event = new PointerEvent('pointerdown', {
      button: 0,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    el.dispatchEvent(event);

    expect(el.style.touchAction).toBe('none');
    expect(el.style.userSelect).toBe('none');
  });

  it('should ignore pointerdown on non-primary button', () => {
    const el = debugElement.nativeElement as HTMLElement;
    const event = new PointerEvent('pointerdown', {
      button: 1,
      pointerId: 1,
      clientX: 100,
      clientY: 100,
    });
    el.dispatchEvent(event);

    expect(el.style.touchAction).not.toBe('none');
  });

  it('should update position on pointermove', () => {
    const el = debugElement.nativeElement as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 120, clientY: 130 }));

    expect(el.style.translate).toBe('20px 30px');
  });

  it('should stop dragging on pointerup', () => {
    const el = debugElement.nativeElement as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 120, clientY: 130 }));

    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');
  });

  it('should apply elastic when beyond bounds', () => {
    const el = debugElement.nativeElement as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    // Move beyond right bound (50)
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 200, clientY: 100 }));

    // 100px beyond bound with elastic 0.5 => 50 + 50*0.5 = 75
    const translate = el.style.translate;
    expect(translate).toContain('75px');
  });

  it('should cancel player and cleanup on destroy', () => {
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    const engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    const el = debugElement.nativeElement as HTMLElement;
    // Drag beyond right bound (50) to trigger snap animation
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 300, clientY: 100 }));
    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 300, clientY: 100 }));

    expect(mockPlayer.cancel).not.toHaveBeenCalled(); // player created on snap, not cancelled yet

    fixture.destroy();
    expect(mockPlayer.cancel).toHaveBeenCalled();
    expect(el.style.touchAction).toBe('');
    expect(el.style.userSelect).toBe('');
  });

  it('should lock movement to the x axis when moveDrag is "x"', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AxisHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(AxisHostComponent);
    localFixture.detectChanges();

    const el = localFixture.nativeElement.querySelector('div') as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 120, clientY: 160 }));

    expect(el.style.translate).toBe('20px 0px');
  });

  it('should snap back to origin when moveDragSnapToOrigin is true', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SnapHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(SnapHostComponent);
    localFixture.detectChanges();
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    const el = localFixture.nativeElement.querySelector('div') as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 140, clientY: 130 }));
    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 140, clientY: 130 }));

    expect(playSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ x: [40, 0], y: [30, 0] }),
      expect.any(Object),
    );
  });

  it('should project release position when momentum is enabled', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [MomentumHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(MomentumHostComponent);
    localFixture.detectChanges();
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    const el = localFixture.nativeElement.querySelector('div') as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', {
        button: 0,
        pointerId: 1,
        clientX: 100,
        clientY: 100,
      }),
    );
    el.dispatchEvent(
      new PointerEvent('pointermove', {
        pointerId: 1,
        clientX: 120,
        clientY: 100,
      }),
    );
    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 120, clientY: 100 }));

    const frames = playSpy.mock.calls[0][1] as { x: number[]; y: number[] };
    expect(frames.x[0]).toBe(20);
    expect(frames.x[1]).toBeGreaterThan(20);
  });

  it('should emit start, move, and end events', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [OutputHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(OutputHostComponent);
    localFixture.detectChanges();

    const el = localFixture.nativeElement.querySelector('div') as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 120, clientY: 130 }));
    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 120, clientY: 130 }));

    expect(localFixture.componentInstance.events).toHaveLength(3);
    expect(localFixture.componentInstance.events[1]).toEqual(
      expect.objectContaining({ x: 20, y: 30, deltaX: 20, deltaY: 30 }),
    );
  });
});
