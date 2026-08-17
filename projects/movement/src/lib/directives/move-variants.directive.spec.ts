import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { signal } from '@angular/core';
import { vi } from 'vitest';
import { MoveVariantsDirective } from './move-variants.directive';
import { MoveVariant } from '../presets/presets.types';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  selector: 'move-variants-host',
  template: `
    <div [moveVariants]="variants()" [moveVariant]="activeVariant()" [moveDuration]="300">
      Variant Child
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class TestHostComponent {
  activeVariant = signal<string>('idle');
  variants = signal({
    idle: { opacity: [0.5, 1] },
    active: { scale: [1, 1.2] },
  });
}

describe('MoveVariantsDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveVariantsDirective));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('should animate when activeVariant changes', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture.componentInstance.activeVariant.set('active');
    fixture.detectChanges();

    expect(playSpy).toHaveBeenCalled();
  });

  it('should cancel previous player when variant changes again', () => {
    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    const engine = TestBed.inject(AnimationEngine);
    vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);

    fixture.componentInstance.activeVariant.set('active');
    fixture.detectChanges();

    fixture.componentInstance.activeVariant.set('idle');
    fixture.detectChanges();

    expect(mockPlayer.cancel).toHaveBeenCalledTimes(1);
  });

  it('should not animate if variant name does not exist', () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture.componentInstance.activeVariant.set('nonexistent');
    fixture.detectChanges();

    // No additional play call beyond initial
    const callsForNonExistent = playSpy.mock.calls.filter(
      (call) => call[1] === undefined || Object.keys(call[1] as object).length === 0,
    );
    // Should not have tried to animate undefined variant
    expect(callsForNonExistent.length).toBe(0);
  });

  it('should pass transition config from variant to engine', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TransitionHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(TransitionHostComponent);
    localFixture.detectChanges();

    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    localFixture.componentInstance.activeVariant.set('active');
    localFixture.detectChanges();

    expect(playSpy).toHaveBeenCalled();
    const lastCall = playSpy.mock.calls[playSpy.mock.calls.length - 1];
    const options = lastCall[2] as Record<string, unknown>;
    expect(options['transition']).toBeDefined();
    expect(options['transition']).toEqual(
      expect.objectContaining({ duration: 400, opacity: { duration: 120, delay: 100 } }),
    );
  });

  it('should use moveTransition as the default transition for variants', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [DefaultTransitionHostComponent],
      providers: [provideMovement()],
    });

    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);
    const localFixture = TestBed.createComponent(DefaultTransitionHostComponent);

    localFixture.detectChanges();
    localFixture.componentInstance.activeVariant.set('active');
    localFixture.detectChanges();

    const lastCall = playSpy.mock.calls[playSpy.mock.calls.length - 1];
    const options = lastCall[2] as Record<string, unknown>;
    expect(options['transition']).toEqual(
      expect.objectContaining({ duration: 500, opacity: { duration: 150 } }),
    );
  });

  it('should let a variant transition override the default moveTransition', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TransitionOverrideHostComponent],
      providers: [provideMovement()],
    });

    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);
    const localFixture = TestBed.createComponent(TransitionOverrideHostComponent);

    localFixture.detectChanges();
    localFixture.componentInstance.activeVariant.set('active');
    localFixture.detectChanges();

    const lastCall = playSpy.mock.calls[playSpy.mock.calls.length - 1];
    const options = lastCall[2] as Record<string, unknown>;
    expect(options['transition']).toEqual(
      expect.objectContaining({ duration: 240, opacity: { duration: 80 } }),
    );
  });

  it('should convert scalar variant states into keyframes from the previous state', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ScalarHostComponent],
      providers: [provideMovement()],
    });
    const localFixture = TestBed.createComponent(ScalarHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    localFixture.detectChanges();
    localFixture.componentInstance.activeVariant.set('active');
    localFixture.detectChanges();

    const lastCall = playSpy.mock.calls[playSpy.mock.calls.length - 1];
    expect(lastCall[1]).toEqual(expect.objectContaining({ scale: [1, 1.2], rotate: [0, 8] }));
  });

  it('should play the configured exit variant for presence leave', async () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [ExitVariantHostComponent],
      providers: [provideMovement()],
    });

    const mockPlayer: AnimationControls = {
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    };
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(mockPlayer);
    const localFixture = TestBed.createComponent(ExitVariantHostComponent);

    localFixture.detectChanges();
    const localDebugElement = localFixture.debugElement.query(By.directive(MoveVariantsDirective));
    const directive = localDebugElement.injector.get(MoveVariantsDirective);

    await directive.playLeave();

    const lastCall = playSpy.mock.calls[playSpy.mock.calls.length - 1];
    expect(lastCall[1]).toEqual(expect.objectContaining({ opacity: [1, 0], y: [0, -16] }));
    expect(mockPlayer.cancel).toHaveBeenCalled();
  });
});

@Component({
  selector: 'move-variants-transition-host',
  template: `
    <div [moveVariants]="variants()" [moveVariant]="activeVariant()" [moveDuration]="300">
      Variant Child
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class TransitionHostComponent {
  activeVariant = signal<string>('idle');
  variants = signal({
    idle: { opacity: [0.5, 1] },
    active: {
      opacity: [0, 1],
      pathLength: [0, 1],
      transition: { duration: 400, opacity: { duration: 120, delay: 100 } },
    },
  });
}

@Component({
  selector: 'move-variants-default-transition-host',
  template: `
    <div
      [moveVariants]="variants()"
      [moveVariant]="activeVariant()"
      [moveTransition]="{ duration: 500, opacity: { duration: 150 } }"
      [moveDuration]="300"
    >
      Variant Child
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class DefaultTransitionHostComponent {
  activeVariant = signal<string>('idle');
  variants = signal({
    idle: { opacity: 0 },
    active: { opacity: 1 },
  });
}

@Component({
  selector: 'move-variants-transition-override-host',
  template: `
    <div
      [moveVariants]="variants()"
      [moveVariant]="activeVariant()"
      [moveTransition]="{ duration: 500, opacity: { duration: 150 } }"
      [moveDuration]="300"
    >
      Variant Child
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class TransitionOverrideHostComponent {
  activeVariant = signal<string>('idle');
  variants = signal({
    idle: { opacity: 0 },
    active: {
      opacity: 1,
      transition: { duration: 240, opacity: { duration: 80 } },
    },
  });
}

@Component({
  selector: 'move-variants-scalar-host',
  template: `
    <div [moveVariants]="variants()" [moveVariant]="activeVariant()" [moveDuration]="300">
      Variant Child
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class ScalarHostComponent {
  activeVariant = signal<string>('idle');
  variants = signal({
    idle: { scale: 1, rotate: 0 },
    active: { scale: 1.2, rotate: 8 },
  });
}

@Component({
  selector: 'move-variants-exit-host',
  template: `
    <div
      [moveVariants]="variants()"
      [moveVariant]="activeVariant()"
      moveExitVariant="hidden"
      [moveDuration]="300"
    >
      Variant Child
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class ExitVariantHostComponent {
  activeVariant = signal<string>('visible');
  variants = signal({
    visible: { opacity: 1, y: 0 },
    hidden: { opacity: 0, y: -16 },
  });
}

@Component({
  selector: 'move-variants-orchestration-host',
  template: `
    <div [moveVariants]="parentVariants" [moveVariant]="state()" data-role="parent">
      <div [moveVariants]="childVariants" data-role="child" data-id="a">a</div>
      <div [moveVariants]="childVariants" data-role="child" data-id="b">b</div>
      <div [moveVariants]="childVariants" data-role="child" data-id="c">c</div>
    </div>
  `,
  imports: [MoveVariantsDirective],
})
class OrchestrationHostComponent {
  readonly state = signal('closed');
  readonly childVariants: Record<string, MoveVariant> = {
    closed: { opacity: 0 },
    open: { opacity: 1 },
  };
  parentVariants: Record<string, MoveVariant> = {
    closed: { opacity: 0 },
    open: { opacity: 1, staggerChildren: 60, delayChildren: 100, duration: 200 },
  };
}

describe('MoveVariantsDirective orchestration', () => {
  let fixture: ComponentFixture<OrchestrationHostComponent>;
  let playSpy: ReturnType<typeof vi.spyOn>;

  /** Delay the engine received for each host, keyed by its data-id (parent has none). */
  function delaysById(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const call of playSpy.mock.calls) {
      const element = call[0] as HTMLElement;
      const id = element.dataset['id'] ?? element.dataset['role'] ?? '?';
      result[id] = (call[2] as { config?: { delay?: number } })?.config?.delay ?? 0;
    }
    return result;
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OrchestrationHostComponent],
      providers: [provideMovement()],
    });
    playSpy = vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue({
      play: vi.fn(),
      pause: vi.fn(),
      cancel: vi.fn(),
      currentTime: 0,
      finished: Promise.resolve(),
    } as AnimationControls);
    fixture = TestBed.createComponent(OrchestrationHostComponent);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('staggers nested children in DOM order', () => {
    fixture.detectChanges();
    playSpy.mockClear();

    fixture.componentInstance.state.set('open');
    fixture.detectChanges();

    const delays = delaysById();
    // delayChildren 100, then +60 per child in document order.
    expect(delays['a']).toBe(100);
    expect(delays['b']).toBe(160);
    expect(delays['c']).toBe(220);
  });

  it('does not treat orchestration fields as animatable properties', () => {
    fixture.detectChanges();
    playSpy.mockClear();

    fixture.componentInstance.state.set('open');
    fixture.detectChanges();

    const parentCall = playSpy.mock.calls.find(
      (call: unknown[]) => (call[0] as HTMLElement).dataset['role'] === 'parent',
    );
    const frames = parentCall?.[1] as Record<string, unknown>;

    // `pickStateValues` keeps every number it sees, so these must be destructured out earlier.
    expect(frames).not.toHaveProperty('staggerChildren');
    expect(frames).not.toHaveProperty('delayChildren');
    expect(frames).not.toHaveProperty('when');
    expect(frames).toHaveProperty('opacity');
  });

  it("offsets children by the parent duration for when: 'beforeChildren'", () => {
    fixture.componentInstance.parentVariants = {
      closed: { opacity: 0 },
      open: { opacity: 1, staggerChildren: 60, duration: 200, when: 'beforeChildren' },
    };
    fixture.detectChanges();
    playSpy.mockClear();

    fixture.componentInstance.state.set('open');
    fixture.detectChanges();

    const delays = delaysById();
    expect(delays['a']).toBe(200);
    expect(delays['b']).toBe(260);
  });

  it("delays the parent past the child span for when: 'afterChildren'", () => {
    fixture.componentInstance.parentVariants = {
      closed: { opacity: 0 },
      open: {
        opacity: 1,
        staggerChildren: 60,
        delayChildren: 100,
        duration: 200,
        when: 'afterChildren',
      },
    };
    fixture.detectChanges();
    playSpy.mockClear();

    fixture.componentInstance.state.set('open');
    fixture.detectChanges();

    const delays = delaysById();
    // 100 delayChildren + 2 * 60 stagger for the last child + 200 duration.
    expect(delays['parent']).toBe(420);
    expect(delays['a']).toBe(100);
  });
});
