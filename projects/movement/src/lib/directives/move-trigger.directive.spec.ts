import { Component, input, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { AnimationControls } from '../engines/animation-controls';
import { AnimationEngine } from '../engines/animation-engine.service';
import { MoveTriggerDirective } from './move-trigger.directive';

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
