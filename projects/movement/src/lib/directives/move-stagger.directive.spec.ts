import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
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
