import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveDragDirective } from './move-drag.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
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
});
