import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MoveHoverDirective } from './move-hover.directive';
import { provideMovement } from '../providers/provide-movement';

@Component({
  template: `<div [moveWhileHover]="{ scale: [1, 1.1] }">Hover Me</div>`,
  imports: [MoveHoverDirective]
})
class TestHostComponent {}

describe('MoveHoverDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()]
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveHoverDirective));
  });

  it('should create and attach the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('should handle enter and leave events natively through host bindings', () => {
    const directiveInstance = debugElement.injector.get(MoveHoverDirective);
    
    // Default state
    expect((directiveInstance as any).isHovered).toBe(false);

    // Simulate mouseenter native host binding
    debugElement.triggerEventHandler('mouseenter', null);
    expect((directiveInstance as any).isHovered).toBe(true);

    // Simulate mouseleave
    debugElement.triggerEventHandler('mouseleave', null);
    expect((directiveInstance as any).isHovered).toBe(false);
  });
});
