import { Component, PLATFORM_ID } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';
import { MoveSmoothScrollDirective } from './move-smooth-scroll.directive';
import { SmoothScrollService } from './smooth-scroll.service';

@Component({
  template: `<div moveSmoothScroll [moveSmoothScrollLerp]="lerp">content</div>`,
  imports: [MoveSmoothScrollDirective],
})
class HostComponent {
  lerp = 0.2;
}

@Component({
  template: `
    <div id="a" moveSmoothScroll>a</div>
    <div id="b" moveSmoothScroll>b</div>
  `,
  imports: [MoveSmoothScrollDirective],
})
class TwoHostsComponent {}

describe('MoveSmoothScrollDirective', () => {
  let service: SmoothScrollService;

  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockImplementation(() => 1);
    vi.spyOn(window, 'cancelAnimationFrame').mockReturnValue(undefined);

    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'browser' }],
    });
    service = TestBed.inject(SmoothScrollService);
  });

  afterEach(() => {
    service.destroy();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('initializes the service with its host element on init', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(service.isActive).toBe(true);
    expect(service.activeElement).toBe(fixture.nativeElement.querySelector('div'));
  });

  it('passes moveSmoothScrollLerp through to the service', () => {
    const initSpy = vi.spyOn(service, 'init');
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.lerp = 0.42;
    fixture.detectChanges();

    expect(initSpy).toHaveBeenCalledWith(expect.objectContaining({ lerp: 0.42 }));
  });

  it('tears down the service on destroy when it owns the active element', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    expect(service.isActive).toBe(true);

    fixture.destroy();
    expect(service.isActive).toBe(false);
    expect(service.activeElement).toBeNull();
  });

  it('does not tear down the service on destroy when a later element took ownership', () => {
    // Simulates the unsupported-but-possible case of a second [moveSmoothScroll] instance: the
    // first directive must not kill scrolling for whichever element the singleton actually owns.
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    const firstEl = fixture.nativeElement.querySelector('div') as HTMLElement;

    service.destroy();
    const otherEl = document.createElement('div');
    service.init({ element: otherEl });
    expect(service.activeElement).toBe(otherEl);

    fixture.destroy();

    expect(service.activeElement).toBe(otherEl);
    expect(service.isActive).toBe(true);
    expect(firstEl).not.toBe(otherEl);
  });

  it('does not initialize on the server', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: PLATFORM_ID, useValue: 'server' }],
    });
    service = TestBed.inject(SmoothScrollService);

    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    expect(service.isActive).toBe(false);
  });

  it('the second of two competing directives on the same host warns and stays inert', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockReturnValue(undefined);
    const fixture: ComponentFixture<TwoHostsComponent> = TestBed.createComponent(TwoHostsComponent);
    fixture.detectChanges();

    const first = fixture.nativeElement.querySelector('#a') as HTMLElement;
    expect(service.activeElement).toBe(first);
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('singleton'));
  });
});
