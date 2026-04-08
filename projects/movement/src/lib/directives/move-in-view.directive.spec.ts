import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveInViewDirective } from './move-in-view.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<div [moveInView]="'fade-up'" [moveInViewOnce]="true">In View</div>`,
  imports: [MoveInViewDirective],
})
class TestHostComponent {}

describe('MoveInViewDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;
  let debugElement: DebugElement;
  let engine: AnimationEngine;
  let playSpy: ReturnType<typeof vi.spyOn>;
  let capturedCallback: IntersectionObserverCallback;
  let mockObserve: ReturnType<typeof vi.fn>;
  let mockDisconnect: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    capturedCallback = () => {
      //no-op
    };
    mockObserve = vi.fn();
    mockDisconnect = vi.fn();

    // Use a class-based mock so `new IntersectionObserver(...)` works correctly
    class MockIntersectionObserver {
      constructor(cb: IntersectionObserverCallback) {
        capturedCallback = cb;
      }
      observe = mockObserve;
      disconnect = mockDisconnect;
    }

    vi.stubGlobal('IntersectionObserver', MockIntersectionObserver);

    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
    debugElement = fixture.debugElement.query(By.directive(MoveInViewDirective));
    engine = TestBed.inject(AnimationEngine);
    playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('should create and attach the directive', () => {
    expect(debugElement).toBeTruthy();
  });

  it('creates an IntersectionObserver and starts observing the host element', () => {
    expect(mockObserve).toHaveBeenCalledWith(debugElement.nativeElement);
  });

  it('sets initial invisible styles on the host before intersection', () => {
    // fade-up initial state: opacity 0
    expect(debugElement.nativeElement.style.opacity).toBe('0');
  });

  it('plays animation when the element enters the viewport', () => {
    capturedCallback(
      [{ isIntersecting: true, target: debugElement.nativeElement } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('disconnects the observer after animation when moveInViewOnce is true', () => {
    capturedCallback(
      [{ isIntersecting: true, target: debugElement.nativeElement } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );

    expect(mockDisconnect).toHaveBeenCalledTimes(1);
  });

  it('does not play animation twice for the same intersection (once guard)', () => {
    const entry = {
      isIntersecting: true,
      target: debugElement.nativeElement,
    } as IntersectionObserverEntry;

    capturedCallback([entry], {} as IntersectionObserver);
    capturedCallback([entry], {} as IntersectionObserver); // second call should be ignored
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('does not play animation when not intersecting', () => {
    capturedCallback(
      [
        {
          isIntersecting: false,
          target: debugElement.nativeElement,
        } as IntersectionObserverEntry,
      ],
      {} as IntersectionObserver,
    );
    expect(playSpy).not.toHaveBeenCalled();
  });

  it('cleans up observer on destroy', () => {
    fixture.destroy();
    expect(mockDisconnect).toHaveBeenCalled();
  });
});
