import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { parseTemplate } from '@angular/compiler';
import { DemoContainer } from './demo-container';

// These examples are generated from the same state emitted to each route's animation.
describe('DemoContainer source and defaults', () => {
  function create() {
    TestBed.configureTestingModule({ imports: [DemoContainer], providers: [provideRouter([])] });
    const fixture = TestBed.createComponent(DemoContainer);
    fixture.componentRef.setInput('title', 'moveEnter');
    fixture.componentRef.setInput('description', 'Enter preview');
    fixture.componentRef.setInput('directive', 'moveEnter');
    fixture.detectChanges();
    return fixture;
  }

  it('updates source and emitted state together, then restores configured defaults', () => {
    const fixture = create();
    const demo = fixture.componentInstance;
    const emitted = vi.fn();
    demo.stateChange.subscribe(emitted);
    demo['updateDuration'](850);
    expect(demo.sourceFiles()[0].code).toContain('moveDuration="850ms"');
    expect(emitted).toHaveBeenLastCalledWith(expect.objectContaining({ duration: 850 }));
    expect(parseTemplate(demo.sourceFiles()[0].code, 'demo.html').errors).toBeNull();
    expect(demo.sourceFiles()[1].code).toContain(
      "import { MoveEnterDirective } from 'angular-movement'",
    );
    demo['resetDefaults']();
    expect(demo.duration()).toBe(300);
    expect(emitted).toHaveBeenLastCalledWith(expect.objectContaining({ duration: 300 }));
  });

  it('resets all custom controls without resetting settings on replay', () => {
    const fixture = create();
    fixture.componentRef.setInput('initialDuration', 700);
    fixture.componentRef.setInput('controls', {
      customControls: [{ id: 'axis', type: 'select', value: 'x' }],
    });
    const demo = fixture.componentInstance;
    demo['updateCustomValue']('axis', 'y');
    demo['resetDefaults']();
    expect(demo.duration()).toBe(700);
    expect(demo.customValues()).toEqual({ axis: 'x' });
  });
});
