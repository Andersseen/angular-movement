import { Component, input, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { AnimationControls } from '../engines/animation-controls';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MoveTriggerDirective } from './move-trigger.directive';
import { provideMovement } from '../providers/provide-movement';

describe('MoveTriggerDirective', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function setup() {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
    });

    const fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();

    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      currentTime: 0,
    } as unknown as AnimationControls);

    return { fixture, playSpy };
  }

  it('plays forward when trigger becomes true', async () => {
    const { fixture, playSpy } = setup();
    const directive = fixture.debugElement
      .query(By.directive(MoveTriggerDirective))
      .injector.get(MoveTriggerDirective);

    directive.play();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ opacity: [0, 1] }),
      expect.anything(),
    );
  });

  it('does not play reverse when trigger becomes false', async () => {
    const { fixture, playSpy } = setup();

    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);

    playSpy.mockClear();

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    await Promise.resolve();

    // By default trigger resets to clear, not reverse
    expect(playSpy).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ opacity: expect.arrayContaining([1, 0]) }),
      expect.anything(),
    );
  });

  it('supports imperative play()', async () => {
    const { fixture, playSpy } = setup();
    const instance = fixture.debugElement
      .query(By.directive(MoveTriggerDirective))
      .injector.get(MoveTriggerDirective);

    await instance.play();
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('supports imperative reset()', async () => {
    const { fixture } = setup();
    const instance = fixture.debugElement
      .query(By.directive(MoveTriggerDirective))
      .injector.get(MoveTriggerDirective);

    const el = fixture.nativeElement.querySelector('div');
    el.style.opacity = '0.5';

    instance.reset();
    expect(el.style.opacity).toBe('');
  });

  it('supports imperative set()', async () => {
    const { fixture } = setup();
    const instance = fixture.debugElement
      .query(By.directive(MoveTriggerDirective))
      .injector.get(MoveTriggerDirective);

    const el = fixture.nativeElement.querySelector('div');
    instance.set({ opacity: 0.75 });
    expect(el.style.opacity).toBe('0.75');
  });

  it('plays reset frames when provided and trigger becomes false', async () => {
    TestBed.configureTestingModule({
      imports: [ResetHostComponent],
    });
    const fixture = TestBed.createComponent(ResetHostComponent);
    fixture.detectChanges();

    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue({
      finished: Promise.resolve(),
      cancel: vi.fn(),
      play: vi.fn(),
      pause: vi.fn(),
      currentTime: 0,
    } as unknown as AnimationControls);

    fixture.componentRef.setInput('active', true);
    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);

    playSpy.mockClear();

    fixture.componentRef.setInput('active', false);
    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ opacity: [1, 0] }),
      expect.anything(),
    );
  });

  describe('imperative-only mode (bare attribute)', () => {
    function setupImperative(providers: unknown[] = []) {
      TestBed.configureTestingModule({
        imports: [ImperativeHostComponent],
        providers: providers as never[],
      });
      const fixture = TestBed.createComponent(ImperativeHostComponent);
      const engine = TestBed.inject(AnimationEngine);
      const playSpy = vi.spyOn(engine, 'play').mockReturnValue({
        finished: Promise.resolve(),
        cancel: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        currentTime: 0,
      } as unknown as AnimationControls);
      fixture.detectChanges();
      const trigger = fixture.componentInstance.trigger();
      return { fixture, playSpy, trigger };
    }

    it('needs no dummy [moveTrigger]="false" / [moveFrames]="{}" and plays nothing on its own', async () => {
      const { fixture, playSpy, trigger } = setupImperative();
      await fixture.whenStable();

      expect(trigger.moveTrigger()).toBeUndefined();
      expect(trigger.moveFrames()).toBeUndefined();
      expect(playSpy).not.toHaveBeenCalled();
    });

    it('plays frames passed to play()', async () => {
      const { playSpy, trigger } = setupImperative();

      await trigger.play({ opacity: [0, 1] });

      expect(playSpy).toHaveBeenCalledWith(
        expect.any(HTMLElement),
        { opacity: [0, 1] },
        expect.anything(),
      );
    });

    it('warns and resolves when play() has nothing to play', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { playSpy, trigger } = setupImperative();

      await expect(trigger.play()).resolves.toBeUndefined();

      expect(playSpy).not.toHaveBeenCalled();
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('without frames'));
      warn.mockRestore();
    });

    it('reset() and destroy clean up the frames that were actually played', async () => {
      const { fixture, trigger } = setupImperative();
      const host = fixture.nativeElement.querySelector('div') as HTMLElement;

      await trigger.play({ clipPath: ['inset(50%)', 'inset(0%)'] });
      host.style.clipPath = 'inset(0%)';
      trigger.reset();
      expect(host.style.clipPath).toBe('');

      await trigger.play({ opacity: [0, 1] });
      host.style.opacity = '1';
      fixture.destroy();
      expect(host.style.opacity).toBe('');
    });
  });

  describe('per-call play() options', () => {
    function setupWithInputs() {
      TestBed.configureTestingModule({
        imports: [InputsHostComponent],
        providers: [provideMovement({ duration: 999, easing: 'linear', delay: 7 })],
      });
      const fixture = TestBed.createComponent(InputsHostComponent);
      const engine = TestBed.inject(AnimationEngine);
      const playSpy = vi.spyOn(engine, 'play').mockReturnValue({
        finished: Promise.resolve(),
        cancel: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        currentTime: 0,
      } as unknown as AnimationControls);
      fixture.detectChanges();
      return { playSpy, trigger: fixture.componentInstance.trigger() };
    }

    function lastConfig(playSpy: ReturnType<typeof vi.spyOn>) {
      const [, , options] = playSpy.mock.calls.at(-1)!;
      return options as {
        config: { duration: number; easing: string; delay: number; disabled: boolean };
        disabled: boolean;
        spring?: unknown;
      };
    }

    it('layer 1+2: global defaults, overridden by the directive inputs', async () => {
      const { playSpy, trigger } = setupWithInputs();

      await trigger.play({ opacity: [0, 1] });

      // moveDuration=520 beats the global 999; delay falls through to the global 7.
      expect(lastConfig(playSpy).config).toEqual(
        expect.objectContaining({ duration: 520, easing: 'ease-in', delay: 7 }),
      );
    });

    it('layer 3: play() options beat the directive inputs, for that call only', async () => {
      const { playSpy, trigger } = setupWithInputs();

      await trigger.play({ opacity: [0, 1] }, { duration: '180ms', easing: 'ease-out' });
      expect(lastConfig(playSpy).config).toEqual(
        expect.objectContaining({ duration: 180, easing: 'ease-out', delay: 7 }),
      );

      await trigger.play({ opacity: [1, 0] });
      expect(lastConfig(playSpy).config).toEqual(
        expect.objectContaining({ duration: 520, easing: 'ease-in' }),
      );
    });

    it('passes spring and transition through from the call', async () => {
      const { playSpy, trigger } = setupWithInputs();

      await trigger.play(
        { opacity: [0, 1] },
        { spring: { stiffness: 300 }, transition: { repeat: 2, repeatType: 'reverse' } },
      );

      const [, , options] = playSpy.mock.calls.at(-1)!;
      expect(options).toEqual(
        expect.objectContaining({
          spring: { stiffness: 300 },
          transition: { repeat: 2, repeatType: 'reverse' },
        }),
      );
    });

    it('layer 4: reduced motion wins over everything, including disabled: false', async () => {
      vi.stubGlobal(
        'matchMedia',
        vi.fn().mockImplementation((query: string) => ({
          matches: query.includes('prefers-reduced-motion'),
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
        })),
      );
      const { playSpy, trigger } = setupWithInputs();

      await trigger.play({ opacity: [0, 1] }, { disabled: false });

      expect(lastConfig(playSpy).disabled).toBe(true);
      vi.unstubAllGlobals();
    });

    it('resolves (never rejects) when a second play() cancels the first', async () => {
      TestBed.configureTestingModule({ imports: [ImperativeHostComponent] });
      const fixture = TestBed.createComponent(ImperativeHostComponent);
      fixture.detectChanges();
      const trigger = fixture.componentInstance.trigger();
      const host = fixture.nativeElement.querySelector('div') as HTMLElement;
      const listeners: Record<string, () => void>[] = [];
      host.animate = vi.fn(() => {
        const bag: Record<string, () => void> = {};
        listeners.push(bag);
        return {
          addEventListener: (type: string, cb: () => void) => (bag[type] = cb),
          cancel: vi.fn(),
          play: vi.fn(),
          pause: vi.fn(),
          commitStyles: vi.fn(),
          playState: 'running',
          currentTime: 0,
        } as unknown as Animation;
      });

      const first = trigger.play({ opacity: [0, 1] }, { duration: 400 });
      const second = trigger.play({ opacity: [1, 0] }, { duration: 160 });
      listeners[1]['finish']?.();

      await expect(first).resolves.toBeUndefined();
      await expect(second).resolves.toBeUndefined();
    });
  });

  describe('moveResetState', () => {
    /**
     * Renders a host with the given reset mode, plays forward, then releases the trigger so the
     * reset path runs.
     */
    async function runReset(mode: 'clear' | 'initial' | 'final'): Promise<HTMLElement> {
      @Component({
        standalone: true,
        imports: [MoveTriggerDirective],
        template: `
          <div
            [moveTrigger]="active()"
            [moveFrames]="{ opacity: [0.25, 0.75] }"
            [moveResetState]="mode()"
          ></div>
        `,
      })
      class ResetStateHost {
        active = signal(true);
        mode = signal<'clear' | 'initial' | 'final'>(mode);
      }

      TestBed.configureTestingModule({ imports: [ResetStateHost] });
      const fixture = TestBed.createComponent(ResetStateHost);

      const engine = TestBed.inject(AnimationEngine);
      vi.spyOn(engine, 'play').mockReturnValue({
        finished: Promise.resolve(),
        cancel: vi.fn(),
        play: vi.fn(),
        pause: vi.fn(),
        currentTime: 0,
      } as unknown as AnimationControls);

      fixture.detectChanges();
      await fixture.whenStable();

      const host = fixture.debugElement.query(By.directive(MoveTriggerDirective))
        .nativeElement as HTMLElement;
      host.style.opacity = '0.75';

      fixture.componentInstance.active.set(false);
      fixture.detectChanges();
      await fixture.whenStable();

      return host;
    }

    it('clear removes the animated properties entirely', async () => {
      const host = await runReset('clear');
      expect(host.style.opacity).toBe('');
    });

    it('initial restores the first keyframe', async () => {
      const host = await runReset('initial');
      expect(host.style.opacity).toBe('0.25');
    });

    it('final keeps the last keyframe', async () => {
      const host = await runReset('final');
      expect(host.style.opacity).toBe('0.75');
    });
  });
});

@Component({
  standalone: true,
  imports: [MoveTriggerDirective],
  template: `<div [moveTrigger]="active()" [moveFrames]="{ opacity: [0, 1] }"></div>`,
})
class TestHostComponent {
  active = input(false);
}

@Component({
  standalone: true,
  imports: [MoveTriggerDirective],
  template: `
    <div
      [moveTrigger]="active()"
      [moveFrames]="{ opacity: [0, 1] }"
      [moveResetFrames]="{ opacity: [1, 0] }"
    ></div>
  `,
})
class ResetHostComponent {
  active = input(false);
}

@Component({
  standalone: true,
  imports: [MoveTriggerDirective],
  template: `<div moveTrigger></div>`,
})
class ImperativeHostComponent {
  readonly trigger = viewChild.required(MoveTriggerDirective);
}

@Component({
  standalone: true,
  imports: [MoveTriggerDirective],
  template: `<div moveTrigger moveDuration="520ms" moveEasing="ease-in"></div>`,
})
class InputsHostComponent {
  readonly trigger = viewChild.required(MoveTriggerDirective);
}
