import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { MoveLayoutDirective } from './move-layout.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  selector: 'move-layout-host',
  template: `
    <div moveLayout [moveDisabled]="disabled()">Layout item</div>
    <span class="sr-only">{{ renderTick() }}</span>
  `,
  imports: [MoveLayoutDirective],
})
class TestHostComponent {
  disabled = signal(false);
  renderTick = signal(0);
}

describe('MoveLayoutDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: HTMLElement;
  let currentRect: DOMRect;
  let playSpy: ReturnType<typeof vi.spyOn>;
  let mockPlayer: AnimationControls;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });

    mockPlayer = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };

    const engine = TestBed.inject(AnimationEngine);
    playSpy = vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    host = fixture.debugElement.query(By.directive(MoveLayoutDirective)).nativeElement;
    currentRect = rect({ left: 10, top: 20, width: 100, height: 50 });
    vi.spyOn(host, 'getBoundingClientRect').mockImplementation(() => currentRect);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should animate position and size changes with FLIP keyframes', async () => {
    await render();

    currentRect = rect({ left: 30, top: 10, width: 200, height: 25 });
    await render();

    expect(playSpy).toHaveBeenCalledTimes(1);
    const [element, frames] = playSpy.mock.calls[0];

    expect(element).toBe(host);
    expect(frames).toEqual(
      expect.objectContaining({
        x: [-20, 0],
        y: [10, 0],
        scaleX: [0.5, 1],
        scaleY: [2, 1],
      }),
    );
    expect(host.style.transformOrigin).toBe('0 0');
  });

  it('should ignore zero-sized target rects', async () => {
    await render();

    currentRect = rect({ left: 30, top: 10, width: 0, height: 25 });
    await render();

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('should refresh the snapshot while disabled without animating stale layout changes', async () => {
    await render();

    fixture.componentInstance.disabled.set(true);
    currentRect = rect({ left: 60, top: 20, width: 100, height: 50 });
    await render();

    fixture.componentInstance.disabled.set(false);
    await render();

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('should restore transform origin when no player is returned', async () => {
    playSpy.mockReturnValue(null as unknown as AnimationControls);
    host.style.transformOrigin = '50% 50%';
    await render();

    currentRect = rect({ left: 20, top: 20, width: 100, height: 50 });
    await render();

    expect(playSpy).toHaveBeenCalled();
    expect(host.style.transformOrigin).toBe('50% 50%');
  });

  it('should not register render work on the server platform', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
    });

    const engine = TestBed.inject(AnimationEngine);
    const serverPlaySpy = vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);
    const serverFixture = TestBed.createComponent(TestHostComponent);

    expect(() => serverFixture.detectChanges()).not.toThrow();
    expect(serverPlaySpy).not.toHaveBeenCalled();
  });

  async function render(): Promise<void> {
    fixture.componentInstance.renderTick.update((value) => value + 1);
    fixture.detectChanges();
    await fixture.whenStable();
  }
});

function rect(value: { left: number; top: number; width: number; height: number }): DOMRect {
  const right = value.left + value.width;
  const bottom = value.top + value.height;

  return {
    ...value,
    right,
    bottom,
    x: value.left,
    y: value.top,
    toJSON: () => ({ ...value, right, bottom, x: value.left, y: value.top }),
  } as DOMRect;
}
