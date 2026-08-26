import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MoveTextDirective } from './move-text.directive';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

function mockIntersectionObserver(isIntersecting = true): void {
  class MockIO {
    constructor(private cb: IntersectionObserverCallback) {
      setTimeout(() => {
        cb(
          [
            {
              isIntersecting,
              target: document.createElement('div'),
              boundingClientRect: {} as DOMRectReadOnly,
              intersectionRatio: isIntersecting ? 1 : 0,
              intersectionRect: {} as DOMRectReadOnly,
              rootBounds: null,
              time: Date.now(),
            } as IntersectionObserverEntry,
          ],
          this as unknown as IntersectionObserver,
        );
      }, 0);
    }
    observe = vi.fn();
    disconnect = vi.fn();
  }
  vi.stubGlobal('IntersectionObserver', MockIO);
}

@Component({
  selector: 'move-text-char-host',
  template: `<div moveText="fade-up" [moveTextSplit]="'chars'">Hello</div>`,
  imports: [MoveTextDirective],
})
class TestHostComponent {}

describe('MoveTextDirective', () => {
  let fixture: ComponentFixture<TestHostComponent>;

  beforeEach(() => {
    mockIntersectionObserver(true);
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    fixture = TestBed.createComponent(TestHostComponent);
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
  });

  it('should split text into character spans', async () => {
    // Wait for Promise.resolve().then in ngOnInit + IO callback
    await new Promise((r) => setTimeout(r, 50));
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('div');
    const spans = el.querySelectorAll('span[aria-hidden="true"]');
    expect(spans.length).toBe(5); // H,e,l,l,o
    expect(el.getAttribute('aria-label')).toBe('Hello');
  });

  it('should play animation when intersecting', async () => {
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play').mockReturnValue(null as unknown as AnimationControls);

    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 50));
    fixture.detectChanges();

    expect(playSpy).toHaveBeenCalledTimes(5); // 5 characters
  });

  it('does not create an IntersectionObserver after being destroyed mid-effect', async () => {
    let observeCalls = 0;

    class TrackingMockIO {
      observe = vi.fn(() => {
        observeCalls += 1;
      });
      disconnect = vi.fn();
    }
    vi.stubGlobal('IntersectionObserver', TrackingMockIO);

    // Build and destroy synchronously, in the same tick: the constructor effect's deferred
    // Promise.resolve().then() continuation is still queued, not yet run, when destroy() fires.
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement()],
    });
    const raceFixture = TestBed.createComponent(TestHostComponent);
    raceFixture.detectChanges();
    raceFixture.destroy();

    // Flush the microtask queue: the continuation runs now, after ngOnDestroy already fired.
    await Promise.resolve();
    await Promise.resolve();

    expect(observeCalls).toBe(0);
  });

  it('does not animate spans when MOVEMENT_CONFIG.disabled is true', async () => {
    TestBed.resetTestingModule();
    mockIntersectionObserver(true);
    TestBed.configureTestingModule({
      imports: [TestHostComponent],
      providers: [provideMovement({ disabled: true })],
    });
    const disabledFixture = TestBed.createComponent(TestHostComponent);
    const engine = TestBed.inject(AnimationEngine);
    const playSpy = vi.spyOn(engine, 'play');

    disabledFixture.detectChanges();
    await new Promise((r) => setTimeout(r, 50));
    disabledFixture.detectChanges();

    expect(playSpy).toHaveBeenCalled();
    for (const call of playSpy.mock.calls) {
      expect(call[2]?.disabled).toBe(true);
    }
  });
});

describe('MoveTextDirective word split', () => {
  @Component({
    selector: 'move-text-word-host',
    template: `<div moveText="fade-up" [moveTextSplit]="'words'">Hello world</div>`,
    imports: [MoveTextDirective],
  })
  class WordHostComponent {}

  it('should split text into word spans', async () => {
    mockIntersectionObserver(true);
    TestBed.configureTestingModule({
      imports: [WordHostComponent],
      providers: [provideMovement()],
    });
    const fixture = TestBed.createComponent(WordHostComponent);
    fixture.detectChanges();
    await new Promise((r) => setTimeout(r, 50));
    fixture.detectChanges();

    const el = fixture.nativeElement.querySelector('div');
    const spans = el.querySelectorAll('span[aria-hidden="true"]');
    expect(spans.length).toBe(2); // Hello, world
  });
});
