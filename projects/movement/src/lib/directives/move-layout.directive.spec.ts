import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';
import { vi } from 'vitest';
import { MoveLayoutDirective } from './move-layout.directive';
import { SHARED_LAYOUT_MAX_AGE_MS } from './shared-layout.registry';
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

@Component({
  selector: 'move-layout-no-disabled-input-host',
  template: `
    <div moveLayout>Layout item</div>
    <span class="sr-only">{{ renderTick() }}</span>
  `,
  imports: [MoveLayoutDirective],
})
class NoDisabledInputHostComponent {
  renderTick = signal(0);
}

describe('MoveLayoutDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let host: HTMLElement;
  let currentRect: DOMRect;
  let layoutRect: DOMRect;
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

  it('should not animate when only the host inline transform changed', async () => {
    useTransformAwareRect();
    await render();

    // A committed hover scale / drag offset changes the painted box but not the layout box.
    host.style.transform = 'translate(40px, 0px) scale(1.2)';
    await render();

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('should exclude the host inline transform from the FLIP delta', async () => {
    useTransformAwareRect();
    host.style.transform = 'translate(40px, 0px)';
    await render();

    // The layout moves while the drag offset also grows — the realistic drag + layout case.
    layoutRect = rect({ left: 30, top: 20, width: 100, height: 50 });
    host.style.transform = 'translate(70px, 0px)';
    await render();

    expect(playSpy).toHaveBeenCalledTimes(1);
    const [, frames] = playSpy.mock.calls[0];

    // Pure layout delta (10 - 30). The +40px translate must NOT leak in — the engine composes
    // the FLIP on top of that same base transform, so counting it here would double it.
    expect(frames).toEqual(
      expect.objectContaining({
        x: [-20, 0],
        y: [0, 0],
        scaleX: [1, 1],
        scaleY: [1, 1],
      }),
    );
  });

  it('should restore the inline transform after measuring', async () => {
    useTransformAwareRect();
    host.style.transform = 'translate(40px, 0px)';
    const before = host.style.transform;

    await render();
    layoutRect = rect({ left: 30, top: 20, width: 100, height: 50 });
    await render();

    expect(before).toBe('translate(40px, 0px)');
    expect(host.style.transform).toBe(before);
  });

  it('passes disabled through to the engine when MOVEMENT_CONFIG.disabled is true', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [NoDisabledInputHostComponent],
      providers: [provideMovement({ disabled: true })],
    });

    const disabledEngine = TestBed.inject(AnimationEngine);
    const disabledPlaySpy = vi.spyOn(disabledEngine, 'play').mockReturnValue(mockPlayer);

    const disabledFixture = TestBed.createComponent(NoDisabledInputHostComponent);
    disabledFixture.detectChanges();

    const disabledHost = disabledFixture.debugElement.query(
      By.directive(MoveLayoutDirective),
    ).nativeElement;
    let disabledRect = rect({ left: 10, top: 20, width: 100, height: 50 });
    vi.spyOn(disabledHost, 'getBoundingClientRect').mockImplementation(() => disabledRect);

    const renderDisabled = async () => {
      disabledFixture.componentInstance.renderTick.update((value) => value + 1);
      disabledFixture.detectChanges();
      await disabledFixture.whenStable();
    };

    await renderDisabled();
    disabledRect = rect({ left: 30, top: 10, width: 200, height: 25 });
    await renderDisabled();

    expect(disabledPlaySpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.anything(),
      expect.objectContaining({ disabled: true }),
    );
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

  /**
   * Replaces the flat rect mock with one that behaves like the real
   * `getBoundingClientRect()`: the reported box reflects the host's inline transform on top of
   * `layoutRect`. Clearing the transform before measuring must therefore yield `layoutRect`.
   */
  function useTransformAwareRect(): void {
    layoutRect = rect({ left: 10, top: 20, width: 100, height: 50 });

    vi.spyOn(host, 'getBoundingClientRect').mockImplementation(() => {
      const transform = host.style.transform;
      const translate = /translate\(([^)]+)\)/.exec(transform);
      const scale = /scale\(([^)]+)\)/.exec(transform);

      const [tx = 0, ty = 0] = translate
        ? translate[1].split(',').map((part) => parseFloat(part))
        : [];
      const s = scale ? parseFloat(scale[1]) : 1;

      return rect({
        left: layoutRect.left + tx,
        top: layoutRect.top + ty,
        width: layoutRect.width * s,
        height: layoutRect.height * s,
      });
    });
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

@Component({
  selector: 'move-shared-layout-host',
  template: `
    @if (expanded()) {
      <div moveLayout [moveLayoutId]="sharedId()" class="expanded">card</div>
    } @else {
      <div moveLayout [moveLayoutId]="sharedId()" class="thumb">card</div>
    }
    <span class="sr-only">{{ renderTick() }}</span>
  `,
  imports: [MoveLayoutDirective],
})
class SharedLayoutHostComponent {
  expanded = signal(false);
  sharedId = signal<string | undefined>('card');
  renderTick = signal(0);
}

describe('MoveLayoutDirective shared layout', () => {
  let fixture: ComponentFixture<SharedLayoutHostComponent>;
  let playSpy: ReturnType<typeof vi.spyOn>;
  let now: number;

  const THUMB = rect({ left: 0, top: 0, width: 100, height: 100 });
  const EXPANDED = rect({ left: 200, top: 150, width: 400, height: 300 });

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SharedLayoutHostComponent],
      providers: [provideMovement()],
    });

    const engine = TestBed.inject(AnimationEngine);
    playSpy = vi.spyOn(engine, 'play').mockReturnValue({
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    });

    now = 1_000;
    vi.spyOn(Date, 'now').mockImplementation(() => now);

    // Each node reports the box its class stands for, so a handover has a real delta to animate.
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
      this: HTMLElement,
    ) {
      if (this.classList.contains('thumb')) return THUMB;
      if (this.classList.contains('expanded')) return EXPANDED;
      return rect({ left: 0, top: 0, width: 0, height: 0 });
    });

    fixture = TestBed.createComponent(SharedLayoutHostComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('animates the incoming element in from the outgoing element rect', async () => {
    await render();
    expect(playSpy).not.toHaveBeenCalled();

    fixture.componentInstance.expanded.set(true);
    await render();

    expect(playSpy).toHaveBeenCalledTimes(1);
    const [element, frames] = playSpy.mock.calls[0];

    expect((element as HTMLElement).classList.contains('expanded')).toBe(true);
    expect(frames).toEqual(
      expect.objectContaining({
        x: [THUMB.left - EXPANDED.left, 0],
        y: [THUMB.top - EXPANDED.top, 0],
        scaleX: [THUMB.width / EXPANDED.width, 1],
        scaleY: [THUMB.height / EXPANDED.height, 1],
      }),
    );
  });

  it('ignores a rect that has aged past the max age', async () => {
    await render();

    now += SHARED_LAYOUT_MAX_AGE_MS + 1;
    fixture.componentInstance.expanded.set(true);
    await render();

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('does not claim anything without a moveLayoutId', async () => {
    fixture.componentInstance.sharedId.set(undefined);
    await render();

    fixture.componentInstance.expanded.set(true);
    await render();

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('claims at most once, so later renders fall back to ordinary layout FLIP', async () => {
    await render();

    fixture.componentInstance.expanded.set(true);
    await render();
    expect(playSpy).toHaveBeenCalledTimes(1);

    // Same element, same box: nothing further to animate.
    await render();
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  async function render(): Promise<void> {
    fixture.componentInstance.renderTick.update((value) => value + 1);
    fixture.detectChanges();
    await fixture.whenStable();
  }
});
