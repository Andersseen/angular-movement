import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { AnimationEngine } from '../engines/animation-engine.service';
import { provideMovement } from '../providers/provide-movement';
import { MoveEnterDirective } from './move-enter.directive';
import { MoveStaggerDirective } from './move-stagger.directive';

@Component({
  template: `
    <div [moveStagger]="100">
      <div class="stagger-child">A</div>
      <div class="stagger-child">B</div>
      <div class="stagger-child">C</div>
    </div>
  `,
  imports: [MoveStaggerDirective],
})
class TestHostComponent {}

describe('MoveStaggerDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let directive: MoveStaggerDirective;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [TestHostComponent] });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    const debugEl = fixture.debugElement.query(By.directive(MoveStaggerDirective));
    directive = debugEl.injector.get(MoveStaggerDirective);

    // Manually register children since plain divs don't auto-register
    const children = fixture.nativeElement.querySelectorAll('.stagger-child');
    children.forEach((c: HTMLElement) => directive.register(c));
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should compute stagger delays based on DOM order', () => {
    const children = fixture.nativeElement.querySelectorAll('.stagger-child');
    const delays = Array.from(children).map((c) => directive.getDelay(c as HTMLElement));
    // Verify delays are monotonically increasing (0, 100, 200)
    expect(delays).toEqual([0, 100, 200]);
  });

  it('should unregister children and return 0 delay', () => {
    const child = fixture.nativeElement.querySelector('.stagger-child');
    directive.unregister(child);
    expect(directive.getDelay(child)).toBe(0);
  });
});

describe('MoveStaggerDirective with direction=last', () => {
  @Component({
    template: `
      <div [moveStagger]="100" moveStaggerDirection="last">
        <div class="stagger-child">A</div>
        <div class="stagger-child">B</div>
        <div class="stagger-child">C</div>
      </div>
    `,
    imports: [MoveStaggerDirective],
  })
  class LastHostComponent {}

  it('should reverse stagger delays', () => {
    TestBed.configureTestingModule({ imports: [LastHostComponent] });
    const fixture = TestBed.createComponent(LastHostComponent);
    fixture.detectChanges();

    const debugEl = fixture.debugElement.query(By.directive(MoveStaggerDirective));
    const directive = debugEl.injector.get(MoveStaggerDirective);

    const children = fixture.nativeElement.querySelectorAll('.stagger-child');
    children.forEach((c: HTMLElement) => directive.register(c));

    const delays = Array.from(children).map((c) => directive.getDelay(c as HTMLElement));
    // Verify delays are monotonically decreasing (200, 100, 0)
    expect(delays).toEqual([200, 100, 0]);

    TestBed.resetTestingModule();
  });
});

describe('MoveStaggerDirective with moveStaggerStep alias', () => {
  @Component({
    template: `
      <div moveStagger [moveStaggerStep]="80">
        <div class="stagger-child">A</div>
        <div class="stagger-child">B</div>
        <div class="stagger-child">C</div>
      </div>
    `,
    imports: [MoveStaggerDirective],
  })
  class StepAliasHostComponent {}

  it('should compute stagger delays from moveStaggerStep', () => {
    TestBed.configureTestingModule({ imports: [StepAliasHostComponent] });
    const fixture = TestBed.createComponent(StepAliasHostComponent);
    fixture.detectChanges();

    const debugEl = fixture.debugElement.query(By.directive(MoveStaggerDirective));
    const directive = debugEl.injector.get(MoveStaggerDirective);

    const children = fixture.nativeElement.querySelectorAll('.stagger-child');
    children.forEach((c: HTMLElement) => directive.register(c));

    const delays = Array.from(children).map((c) => directive.getDelay(c as HTMLElement));
    expect(delays).toEqual([0, 80, 160]);

    TestBed.resetTestingModule();
  });
});

describe('MoveStaggerDirective with direction=center', () => {
  @Component({
    template: `
      <div [moveStagger]="100" moveStaggerDirection="center">
        <div class="stagger-child">A</div>
        <div class="stagger-child">B</div>
        <div class="stagger-child">C</div>
        <div class="stagger-child">D</div>
        <div class="stagger-child">E</div>
      </div>
    `,
    imports: [MoveStaggerDirective],
  })
  class CenterHostComponent {}

  it('should compute center-out stagger delays', () => {
    TestBed.configureTestingModule({ imports: [CenterHostComponent] });
    const fixture = TestBed.createComponent(CenterHostComponent);
    fixture.detectChanges();

    const debugEl = fixture.debugElement.query(By.directive(MoveStaggerDirective));
    const directive = debugEl.injector.get(MoveStaggerDirective);

    const children = fixture.nativeElement.querySelectorAll('.stagger-child');
    children.forEach((c: HTMLElement) => directive.register(c));

    const delays = Array.from(children).map((c) => directive.getDelay(c as HTMLElement));
    // Verify center-out pattern (200, 100, 0, 100, 200)
    expect(delays).toEqual([200, 100, 0, 100, 200]);

    TestBed.resetTestingModule();
  });
});

describe('MoveStaggerDirective — ordering and edge cases', () => {
  @Component({
    template: `
      <div [moveStagger]="50">
        <div class="stagger-child" id="a">A</div>
        <div class="stagger-child" id="b">B</div>
        <div class="stagger-child" id="c">C</div>
      </div>
    `,
    imports: [MoveStaggerDirective],
  })
  class OrderHostComponent {}

  afterEach(() => TestBed.resetTestingModule());

  function setup(): { directive: MoveStaggerDirective; el: (id: string) => HTMLElement } {
    TestBed.configureTestingModule({ imports: [OrderHostComponent] });
    const fixture = TestBed.createComponent(OrderHostComponent);
    fixture.detectChanges();
    const directive = fixture.debugElement
      .query(By.directive(MoveStaggerDirective))
      .injector.get(MoveStaggerDirective);

    return {
      directive,
      el: (id: string) => fixture.nativeElement.querySelector(`#${id}`) as HTMLElement,
    };
  }

  it('sorts by document position, not registration order', () => {
    const { directive, el } = setup();

    // Registered back-to-front: @for with a changing track can register in any order.
    directive.register(el('c'));
    directive.register(el('a'));
    directive.register(el('b'));

    expect(directive.getDelay(el('a'))).toBe(0);
    expect(directive.getDelay(el('b'))).toBe(50);
    expect(directive.getDelay(el('c'))).toBe(100);
  });

  it('returns 0 for an element that was never registered', () => {
    const { directive, el } = setup();
    directive.register(el('a'));

    expect(directive.getDelay(el('b'))).toBe(0);
  });

  it('returns 0 for a detached element sharing no document position', () => {
    const { directive } = setup();
    const orphan = document.createElement('div');
    directive.register(orphan);

    expect(directive.getDelay(orphan)).toBe(0);
  });

  it('gives a single child no delay', () => {
    const { directive, el } = setup();
    directive.register(el('b'));

    expect(directive.getDelay(el('b'))).toBe(0);
  });
});

describe('MoveStaggerDirective — integration with child directives', () => {
  @Component({
    template: `
      <ul [moveStagger]="60">
        @for (item of items; track item) {
          <li [moveEnter]="{ opacity: [0, 1] }">{{ item }}</li>
        }
      </ul>
    `,
    imports: [MoveStaggerDirective, MoveEnterDirective],
  })
  class StaggeredListComponent {
    items = ['a', 'b', 'c'];
  }

  afterEach(() => {
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('passes an increasing delay to each child animation', async () => {
    TestBed.configureTestingModule({
      imports: [StaggeredListComponent],
      providers: [provideMovement()],
    });

    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null);

    const fixture = TestBed.createComponent(StaggeredListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // The delay children actually receive is the contract users rely on — registering elements by
    // hand (as the other suites do) would not catch a broken token wiring. The stagger offset is
    // folded into the resolved config, not passed as a separate option.
    const delays = playSpy.mock.calls.map(
      (call) => (call[2] as { config?: { delay?: number } })?.config?.delay,
    );

    expect(delays).toHaveLength(3);
    expect(delays).toEqual([0, 60, 120]);
  });

  it('stops counting a child once it leaves the list', async () => {
    TestBed.configureTestingModule({
      imports: [StaggeredListComponent],
      providers: [provideMovement()],
    });

    const fixture = TestBed.createComponent(StaggeredListComponent);
    fixture.detectChanges();
    await fixture.whenStable();

    const stagger = fixture.debugElement
      .query(By.directive(MoveStaggerDirective))
      .injector.get(MoveStaggerDirective);
    const items = fixture.nativeElement.querySelectorAll('li') as NodeListOf<HTMLElement>;
    const last = items[2];

    fixture.componentInstance.items = ['a', 'b'];
    fixture.detectChanges();
    await fixture.whenStable();

    // ngOnDestroy unregisters it; a stale entry would inflate every sibling's delay.
    expect(stagger.getDelay(last)).toBe(0);
  });
});
