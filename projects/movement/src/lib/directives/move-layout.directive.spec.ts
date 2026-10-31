import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { PLATFORM_ID } from '@angular/core';
import { onTestFinished, vi } from 'vitest';
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
      // A *running* player: `finished` only settles on finish or cancel.
      finished: new Promise<void>(() => undefined),
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

  describe('interrupted (cancelled) layout animations', () => {
    /**
     * Mirrors the real `BasePlayer` contract: `cancel()` settles `finished` but never calls
     * `onDone`, so cleanup that only lives in `onDone` is skipped when something else (drag,
     * `MoveAnimator.set/clear`, a newer play) preempts the FLIP.
     */
    function cancellablePlayer(): { player: AnimationControls; cancel: () => void } {
      let settle!: () => void;
      const finished = new Promise<void>((resolve) => (settle = resolve));
      const player: AnimationControls = {
        play: vi.fn(),
        pause: vi.fn(),
        cancel: vi.fn(() => settle()),
        currentTime: 0,
        finished,
      };
      return { player, cancel: () => player.cancel() };
    }

    it('restores transform origin when the FLIP is cancelled before finishing', async () => {
      const { player, cancel } = cancellablePlayer();
      playSpy.mockReturnValue(player);
      host.style.transformOrigin = '50% 50%';
      await render();

      currentRect = rect({ left: 40, top: 20, width: 100, height: 50 });
      await render();
      expect(host.style.transformOrigin).not.toBe('50% 50%');

      cancel();
      await player.finished;
      await Promise.resolve();

      expect(host.style.transformOrigin).toBe('50% 50%');
    });

    it('measures and animates again after a cancelled FLIP (measurement is not suppressed)', async () => {
      const first = cancellablePlayer();
      playSpy.mockReturnValueOnce(first.player);
      await render();

      currentRect = rect({ left: 40, top: 20, width: 100, height: 50 });
      await render();
      expect(playSpy).toHaveBeenCalledTimes(1);

      first.cancel();
      await first.player.finished;
      await Promise.resolve();

      currentRect = rect({ left: 90, top: 20, width: 100, height: 50 });
      await render();
      expect(playSpy).toHaveBeenCalledTimes(2);
    });

    it('a stale cancelled player cannot clear the state of a newer animation', async () => {
      const first = cancellablePlayer();
      const second = cancellablePlayer();
      playSpy.mockReturnValueOnce(first.player).mockReturnValueOnce(second.player);
      await render();

      currentRect = rect({ left: 40, top: 20, width: 100, height: 50 });
      await render();
      first.cancel();
      await first.player.finished;
      await Promise.resolve();

      currentRect = rect({ left: 90, top: 20, width: 100, height: 50 });
      await render();
      expect(playSpy).toHaveBeenCalledTimes(2);

      // The first player settling again (e.g. a late microtask) must not interfere.
      await first.player.finished;
      await Promise.resolve();
      expect(host.style.transformOrigin).toBe('0 0');
      second.cancel();
    });
  });

  describe('a layout change while a FLIP is running', () => {
    function runningPlayer(): { player: AnimationControls; cancel: ReturnType<typeof vi.fn> } {
      let settle!: () => void;
      const finished = new Promise<void>((resolve) => (settle = resolve));
      const cancel = vi.fn(() => settle());
      return {
        player: { play: vi.fn(), pause: vi.fn(), cancel, currentTime: 0, finished },
        cancel,
      };
    }

    it('replaces the running FLIP instead of layering a second one on top', async () => {
      const first = runningPlayer();
      const second = runningPlayer();
      playSpy.mockReturnValueOnce(first.player).mockReturnValueOnce(second.player);
      await render();

      currentRect = rect({ left: 40, top: 20, width: 100, height: 50 });
      await render();
      expect(first.cancel).not.toHaveBeenCalled();

      currentRect = rect({ left: 90, top: 60, width: 100, height: 50 });
      await render(); // lands while the first FLIP is still running

      expect(playSpy).toHaveBeenCalledTimes(2);
      expect(first.cancel).toHaveBeenCalledTimes(1);
      expect(second.cancel).not.toHaveBeenCalled();
    });

    it('does not restart the FLIP for a render that moved nothing', async () => {
      const first = runningPlayer();
      playSpy.mockReturnValueOnce(first.player);
      await render();

      currentRect = rect({ left: 40, top: 20, width: 100, height: 50 });
      await render();
      await render();
      await render();

      expect(playSpy).toHaveBeenCalledTimes(1);
      expect(first.cancel).not.toHaveBeenCalled();
    });

    it('hands the user their original transform-origin back after any number of replaced FLIPs', async () => {
      const players = [runningPlayer(), runningPlayer(), runningPlayer()];
      players.forEach((p) => playSpy.mockReturnValueOnce(p.player));
      host.style.transformOrigin = '50% 50%';
      await render();

      for (const left of [40, 90, 130]) {
        currentRect = rect({ left, top: 20, width: 100, height: 50 });
        await render();
      }
      expect(host.style.transformOrigin).toBe('0 0'); // borrowed while a FLIP runs

      players[2].player.cancel();
      await players[2].player.finished;
      await Promise.resolve();

      expect(host.style.transformOrigin).toBe('50% 50%');
    });

    it('turning layout off mid-FLIP cancels it and releases the host', async () => {
      const first = runningPlayer();
      playSpy.mockReturnValueOnce(first.player);
      host.style.transformOrigin = '50% 50%';
      await render();

      currentRect = rect({ left: 40, top: 20, width: 100, height: 50 });
      await render();

      fixture.componentInstance.disabled.set(true);
      await render();

      expect(first.cancel).toHaveBeenCalledTimes(1);
      expect(host.style.transformOrigin).toBe('50% 50%');
    });

    it('destroying the host cancels the FLIP, restores the origin and ignores a late settle', async () => {
      const first = runningPlayer();
      playSpy.mockReturnValueOnce(first.player);
      host.style.transformOrigin = '50% 50%';
      await render();

      currentRect = rect({ left: 40, top: 20, width: 100, height: 50 });
      await render();
      expect(host.style.transformOrigin).not.toBe('50% 50%');

      fixture.destroy();
      expect(first.cancel).toHaveBeenCalledTimes(1);
      expect(host.style.transformOrigin).toBe('50% 50%');

      host.style.transformOrigin = '10px 10px'; // a later owner of the node
      await first.player.finished;
      await Promise.resolve();
      expect(host.style.transformOrigin).toBe('10px 10px');
    });

    it('re-reads prefers-reduced-motion on every pass', async () => {
      let reduce = false;
      const original = Object.getOwnPropertyDescriptor(window, 'matchMedia');
      Object.defineProperty(window, 'matchMedia', {
        configurable: true,
        writable: true,
        value: () => ({ matches: reduce }) as MediaQueryList,
      });
      onTestFinished(() => {
        if (original) Object.defineProperty(window, 'matchMedia', original);
        else delete (window as { matchMedia?: unknown }).matchMedia;
      });
      await render();

      reduce = true;
      currentRect = rect({ left: 40, top: 20, width: 100, height: 50 });
      await render();
      expect(playSpy).not.toHaveBeenCalled();

      reduce = false;
      currentRect = rect({ left: 90, top: 20, width: 100, height: 50 });
      await render();
      expect(playSpy).toHaveBeenCalledTimes(1);
    });
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
      <div moveLayout [moveLayoutId]="sharedId()" [moveLayoutScope]="scope()" class="expanded">
        card
      </div>
    } @else {
      <div moveLayout [moveLayoutId]="sharedId()" [moveLayoutScope]="scope()" class="thumb">
        card
      </div>
    }
    <span class="sr-only">{{ renderTick() }}</span>
  `,
  imports: [MoveLayoutDirective],
})
class SharedLayoutHostComponent {
  expanded = signal(false);
  sharedId = signal<string | undefined>('card');
  scope = signal<string | undefined>(undefined);
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

  it('does not hand over across moveLayoutScope boundaries', async () => {
    fixture.componentInstance.scope.set('panel-a');
    await render();

    // The incoming element lives in a different scope: the other panel's thumb is not its source.
    fixture.componentInstance.scope.set('panel-b');
    fixture.componentInstance.expanded.set(true);
    await render();

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('a changed moveLayoutId does not hand over from the old id', async () => {
    await render();
    fixture.componentInstance.expanded.set(true);
    await render();
    expect(playSpy).toHaveBeenCalledTimes(1);

    now += 10;
    fixture.componentInstance.sharedId.set('other');
    await render();
    // Nothing is published under 'other' yet.
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  async function render(): Promise<void> {
    fixture.componentInstance.renderTick.update((value) => value + 1);
    fixture.detectChanges();
    await fixture.whenStable();
  }
});
