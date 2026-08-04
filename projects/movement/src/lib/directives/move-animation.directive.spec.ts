import { Component, PLATFORM_ID, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MoveAnimationConfig } from '../presets/presets.types';
import { AnimationControls } from '../engines/animation-controls';
import { AnimationEngine } from '../engines/animation-engine.service';
import { provideMovement } from '../providers/provide-movement';
import { MoveAnimationDirective } from './move-animation.directive';
import { MovePresenceDirective } from './move-presence.directive';

@Component({
  selector: 'move-animation-string-host',
  template: `
    <div
      [moveAnimation]="{
        initial: { opacity: 0, strokeDasharray: '0 24' },
        animate: { opacity: 1, strokeDasharray: '24 24' },
      }"
    >
      Animate Me
    </div>
  `,
  imports: [MoveAnimationDirective],
})
class StringStateHostComponent {}

@Component({
  selector: 'move-animation-partial-host',
  template: `
    <div
      [moveAnimation]="{
        initial: { opacity: 0, x: -20 },
        animate: { opacity: 1 },
      }"
    >
      Partial
    </div>
  `,
  imports: [MoveAnimationDirective],
})
class PartialStateHostComponent {}

@Component({
  selector: 'move-animation-overrides-host',
  template: `
    <div
      [moveAnimation]="{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      }"
      [moveDuration]="400"
      moveDelay="50"
      moveEasing="ease-in-out"
    >
      Overrides
    </div>
  `,
  imports: [MoveAnimationDirective],
})
class OverridesHostComponent {}

@Component({
  selector: 'move-animation-spring-host',
  template: `
    <div
      [moveAnimation]="{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      }"
      [moveSpring]="{ stiffness: 500, damping: 30 }"
    >
      Spring
    </div>
  `,
  imports: [MoveAnimationDirective],
})
class SpringHostComponent {}

@Component({
  selector: 'move-animation-disabled-host',
  template: `
    <div
      [moveAnimation]="{
        initial: { opacity: 0 },
        animate: { opacity: 1 },
      }"
      [moveDisabled]="true"
    >
      Disabled
    </div>
  `,
  imports: [MoveAnimationDirective],
})
class DisabledHostComponent {}

@Component({
  selector: 'move-animation-presence-host',
  template: `
    <ng-container *movePresence="show()">
      <div [moveAnimation]="animation()">Child</div>
    </ng-container>
  `,
  imports: [MovePresenceDirective, MoveAnimationDirective],
})
class PresenceHostComponent {
  readonly show = signal(true);
  readonly animation = signal<MoveAnimationConfig>({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  });
}

@Component({
  selector: 'move-animation-presence-no-exit-host',
  template: `
    <ng-container *movePresence="show()">
      <div [moveAnimation]="animation()">Child</div>
    </ng-container>
  `,
  imports: [MovePresenceDirective, MoveAnimationDirective],
})
class PresenceNoExitHostComponent {
  readonly show = signal(true);
  readonly animation = signal<MoveAnimationConfig>({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
  });
}

@Component({
  selector: 'move-animation-presence-no-animate-host',
  template: `
    <ng-container *movePresence="show()">
      <div [moveAnimation]="animation()">Child</div>
    </ng-container>
  `,
  imports: [MovePresenceDirective, MoveAnimationDirective],
})
class PresenceNoAnimateHostComponent {
  readonly show = signal(true);
  readonly animation = signal<MoveAnimationConfig>({
    initial: { opacity: 0 },
    exit: { opacity: 0 },
  });
}

function createMockPlayer(): AnimationControls {
  return {
    play: vi.fn(),
    pause: vi.fn(),
    cancel: vi.fn(),
    currentTime: 0,
    finished: Promise.resolve(),
  };
}

describe('MoveAnimationDirective', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('converts shared numeric and string state properties into keyframes', async () => {
    TestBed.configureTestingModule({
      imports: [StringStateHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(StringStateHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(createMockPlayer());

    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        opacity: [0, 1],
        strokeDasharray: ['0 24', '24 24'],
      }),
    );
  });

  it('converts initial + animate into keyframes', async () => {
    TestBed.configureTestingModule({
      imports: [PartialStateHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(PartialStateHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(createMockPlayer());

    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.calls[0][1]).toEqual(expect.objectContaining({ opacity: [0, 1] }));
  });

  it('ignores properties that are not present in both states', async () => {
    TestBed.configureTestingModule({
      imports: [PartialStateHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(PartialStateHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(createMockPlayer());

    fixture.detectChanges();
    await Promise.resolve();

    const frames = playSpy.mock.calls[0][1] as Record<string, unknown>;
    expect(frames).toHaveProperty('opacity');
    expect(frames).not.toHaveProperty('x');
  });

  it('uses moveDuration, moveDelay, moveEasing', async () => {
    TestBed.configureTestingModule({
      imports: [OverridesHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(OverridesHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(createMockPlayer());

    fixture.detectChanges();
    await Promise.resolve();

    const options = playSpy.mock.calls[0][2];
    expect(options?.config?.duration).toBe(400);
    expect(options?.config?.delay).toBe(50);
    expect(options?.config?.easing).toBe('ease-in-out');
  });

  it('uses moveSpring', async () => {
    TestBed.configureTestingModule({
      imports: [SpringHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(SpringHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(createMockPlayer());

    fixture.detectChanges();
    await Promise.resolve();

    const options = playSpy.mock.calls[0][2];
    expect(options?.spring).toEqual({ stiffness: 500, damping: 30 });
  });

  it('moveDisabled disables the animation', async () => {
    TestBed.configureTestingModule({
      imports: [DisabledHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(DisabledHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture.detectChanges();
    await Promise.resolve();

    const options = playSpy.mock.calls[0][2];
    expect(options?.disabled).toBe(true);
  });

  it('reduced motion disables the animation', async () => {
    vi.stubGlobal(
      'matchMedia',
      vi.fn().mockReturnValue({
        matches: true,
        media: '(prefers-reduced-motion: reduce)',
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }),
    );

    TestBed.configureTestingModule({
      imports: [StringStateHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(StringStateHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture.detectChanges();
    await Promise.resolve();

    const options = playSpy.mock.calls[0][2];
    expect(options?.disabled).toBe(true);
  });

  it('playLeave uses animate -> exit', async () => {
    TestBed.configureTestingModule({
      imports: [PresenceHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(PresenceHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(createMockPlayer());

    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.calls[0][1]).toEqual(expect.objectContaining({ opacity: [0, 1] }));

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));

    expect(playSpy).toHaveBeenCalledTimes(2);
    expect(playSpy.mock.calls[1][1]).toEqual(expect.objectContaining({ opacity: [1, 0] }));
    expect(fixture.nativeElement.textContent).not.toContain('Child');
  });

  it('playLeave does nothing if exit is missing', async () => {
    TestBed.configureTestingModule({
      imports: [PresenceNoExitHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(PresenceNoExitHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(createMockPlayer());

    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.calls[0][1]).toEqual(expect.objectContaining({ opacity: [0, 1] }));

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(fixture.nativeElement.textContent).not.toContain('Child');
  });

  it('playLeave does nothing if animate is missing', async () => {
    TestBed.configureTestingModule({
      imports: [PresenceNoAnimateHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(PresenceNoAnimateHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(createMockPlayer());

    fixture.detectChanges();
    await Promise.resolve();

    expect(playSpy).not.toHaveBeenCalled();

    fixture.componentInstance.show.set(false);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 0));

    expect(playSpy).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain('Child');
  });

  it('cancels players on ngOnDestroy', async () => {
    TestBed.configureTestingModule({
      imports: [StringStateHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(StringStateHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const player = createMockPlayer();
    vi.spyOn(engine, 'play').mockReturnValue(player);

    fixture.detectChanges();
    await Promise.resolve();

    fixture.destroy();

    expect(player.cancel).toHaveBeenCalledTimes(1);
  });

  it('does not touch browser APIs on the server', async () => {
    TestBed.configureTestingModule({
      imports: [StringStateHostComponent],
      providers: [provideMovement(), { provide: PLATFORM_ID, useValue: 'server' }],
    });
    const fixture = TestBed.createComponent(StringStateHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play');

    expect(() => {
      fixture.detectChanges();
    }).not.toThrow();
    await Promise.resolve();

    expect(playSpy).toHaveBeenCalledTimes(1);
    expect(playSpy.mock.results[0].value).toBeNull();

    const host = fixture.nativeElement.querySelector('div') as HTMLElement;
    expect(host.style.opacity).toBe('');
  });
});
