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
  selector: 'move-drag-constrained-momentum-host',
  template: `
    <div
      moveDrag
      [moveDragConstraints]="{ left: -50, right: 50, top: -50, bottom: 50 }"
      [moveDragMomentum]="true"
    >
      Constrained Momentum
    </div>
  `,
  imports: [MoveDragDirective],
})
class ConstrainedMomentumHostComponent {}

@Component({
  selector: 'move-drag-snap-points-host',
  template: ` <div moveDrag [moveDragSnapPoints]="snapPoints">Snap Points</div> `,
  imports: [MoveDragDirective],
})
class SnapPointsHostComponent {
  snapPoints = [
    { x: 0, y: 0 },
    { x: 80, y: 0 },
    { x: 80, y: 80 },
  ];
}

@Component({
  selector: 'move-drag-axis-snap-points-host',
  template: ` <div moveDrag="x" [moveDragSnapPoints]="snapPoints">Axis Snap Points</div> `,
  imports: [MoveDragDirective],
})
class AxisSnapPointsHostComponent {
  snapPoints = [
    { x: 0, y: 0 },
    { x: 80, y: 80 },
  ];
}

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

    expect(el.style.transform).toBe('translate(20px, 30px)');
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
    const transform = el.style.transform;
    expect(transform).toContain('75px');
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

    expect(el.style.transform).toBe('translate(20px, 0px)');
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
      pointerEvent('pointerdown', {
        button: 0,
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        timeStamp: 100,
      }),
    );
    el.dispatchEvent(
      pointerEvent('pointermove', {
        pointerId: 1,
        clientX: 120,
        clientY: 100,
        timeStamp: 120,
      }),
    );
    el.dispatchEvent(
      pointerEvent('pointerup', { pointerId: 1, clientX: 120, clientY: 100, timeStamp: 121 }),
    );

    const frames = playSpy.mock.calls[0][1] as { x: number[]; y: number[] };
    expect(frames.x[0]).toBe(20);
    expect(frames.x[1]).toBe(200);
  });

  it('should clamp momentum to constraints on release', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ConstrainedMomentumHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(ConstrainedMomentumHostComponent);
    localFixture.detectChanges();
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    const el = localFixture.nativeElement.querySelector('div') as HTMLElement;
    el.dispatchEvent(
      pointerEvent('pointerdown', {
        button: 0,
        pointerId: 1,
        clientX: 100,
        clientY: 100,
        timeStamp: 100,
      }),
    );
    el.dispatchEvent(
      pointerEvent('pointermove', {
        pointerId: 1,
        clientX: 130,
        clientY: 100,
        timeStamp: 110,
      }),
    );
    el.dispatchEvent(
      pointerEvent('pointerup', { pointerId: 1, clientX: 130, clientY: 100, timeStamp: 111 }),
    );

    expect(playSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ x: [30, 50], y: [0, 0] }),
      expect.any(Object),
    );
  });

  it('should snap to the nearest configured snap point', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [SnapPointsHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(SnapPointsHostComponent);
    localFixture.detectChanges();
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    const el = localFixture.nativeElement.querySelector('div') as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 165, clientY: 112 }));
    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 165, clientY: 112 }));

    expect(playSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ x: [65, 80], y: [12, 0] }),
      expect.any(Object),
    );
  });

  it('should keep locked axes at zero when snapping to configured points', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [AxisSnapPointsHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(AxisSnapPointsHostComponent);
    localFixture.detectChanges();
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    const el = localFixture.nativeElement.querySelector('div') as HTMLElement;
    el.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    el.dispatchEvent(new PointerEvent('pointermove', { pointerId: 1, clientX: 165, clientY: 180 }));
    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 165, clientY: 180 }));

    expect(playSpy).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({ x: [65, 80], y: [0, 0] }),
      expect.any(Object),
    );
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

function pointerEvent(type: string, init: PointerEventInit & { timeStamp?: number }): PointerEvent {
  const { timeStamp, ...eventInit } = init;
  const event = new PointerEvent(type, eventInit);

  if (timeStamp !== undefined) {
    Object.defineProperty(event, 'timeStamp', { value: timeStamp });
  }

  return event;
}

@Component({
  selector: 'move-drag-while-host',
  template: `<div moveDrag [moveWhileDrag]="{ scale: [1, 1.2], rotate: [0, 4] }">Lift</div>`,
  imports: [MoveDragDirective],
})
class WhileDragHostComponent {}

@Component({
  selector: 'move-drag-plain-host',
  template: `<div moveDrag>Plain</div>`,
  imports: [MoveDragDirective],
})
class PlainDragHostComponent {}

describe('MoveDragDirective whileDrag', () => {
  let el: HTMLElement;
  let playSpy: ReturnType<typeof vi.spyOn>;

  function mount(host: unknown): HTMLElement {
    TestBed.configureTestingModule({
      imports: [host as never],
      providers: [provideMovement()],
    });
    playSpy = vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue({
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    } as AnimationControls);
    const fixture = TestBed.createComponent(host as never) as ComponentFixture<unknown>;
    fixture.detectChanges();
    return fixture.debugElement.query(By.directive(MoveDragDirective)).nativeElement;
  }

  function stubReducedMotion(reduce: boolean): void {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockImplementation((query: string) => ({
        matches: reduce && query.includes('prefers-reduced-motion'),
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      })),
    );
  }

  function drag(target: HTMLElement, dx: number, dy: number): void {
    target.dispatchEvent(
      new PointerEvent('pointerdown', { button: 0, pointerId: 1, clientX: 100, clientY: 100 }),
    );
    target.dispatchEvent(
      new PointerEvent('pointermove', { pointerId: 1, clientX: 100 + dx, clientY: 100 + dy }),
    );
  }

  beforeEach(() => {
    // Run the gesture tween synchronously to its final frame.
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      cb(performance.now() + 10_000);
      return 1;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('composes the gesture with the drag translate in a single transform', () => {
    el = mount(WhileDragHostComponent);
    drag(el, 40, 25);

    const transform = el.style.transform;
    // Both channels must be present exactly once: the drag owns translate, whileDrag owns the rest.
    expect(transform).toContain('translate(40px, 25px)');
    expect(transform).toContain('scale(1.2)');
    expect(transform).toContain('rotate(4deg)');
    expect(transform.match(/translate\(/g)).toHaveLength(1);
  });

  it('leaves the transform untouched by a gesture when whileDrag is absent', () => {
    el = mount(PlainDragHostComponent);
    drag(el, 40, 25);

    expect(el.style.transform).toContain('translate(40px, 25px)');
    expect(el.style.transform).not.toContain('scale(');
    expect(el.style.transform).not.toContain('rotate(');
  });

  it('releases the gesture through the same engine play as the snap-back', () => {
    el = mount(WhileDragHostComponent);
    drag(el, 40, 25);
    playSpy.mockClear();

    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 140, clientY: 125 }));

    expect(playSpy).toHaveBeenCalledTimes(1);
    const frames = playSpy.mock.calls[0][1] as Record<string, number[]>;
    // One play, so translate and scale settle together rather than through two writers.
    expect(frames['scaleX']).toEqual([1.2, 1]);
    expect(frames['scaleY']).toEqual([1.2, 1]);
    expect(frames['rotate']).toEqual([4, 0]);
    expect(frames['x']).toBeDefined();
  });

  it('does not start a release animation when there is nothing to release', () => {
    el = mount(PlainDragHostComponent);
    drag(el, 40, 25);
    playSpy.mockClear();

    el.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 140, clientY: 125 }));

    // No constraints, no snap, no gesture — an unconstrained drag should just stay put.
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('applies the gesture instantly under reduced motion', () => {
    stubReducedMotion(true);
    // A rAF stub that never runs its callback: anything that reaches the tween cannot land.
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );

    el = mount(WhileDragHostComponent);
    drag(el, 10, 0);

    expect(el.style.transform).toContain('scale(1.2)');
  });

  it('tweens rather than jumping when motion is allowed', () => {
    stubReducedMotion(false);
    vi.stubGlobal(
      'requestAnimationFrame',
      vi.fn(() => 1),
    );

    el = mount(WhileDragHostComponent);
    drag(el, 10, 0);

    // The control for the test above: with frames never running, the gesture must still be at
    // identity, proving the reduced-motion case really took the instant path.
    expect(el.style.transform).not.toContain('scale(');
  });
});
