import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockInstance, vi } from 'vitest';
import { MoveEnterDirective } from './move-enter.directive';
import { MoveAnimateDirective } from './move-animate.directive';
import { MoveInViewDirective } from './move-in-view.directive';
import { MovePreset } from '../presets/presets.types';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

@Component({
  template: `<div [moveEnter]="preset()"></div>`,
  imports: [MoveEnterDirective],
})
class EnterHost {
  readonly preset = signal<MovePreset>('fade-up');
}

@Component({
  template: `<div [moveEnter]="{ opacity: [0, end()] }"></div>`,
  imports: [MoveEnterDirective],
})
class EnterLiteralHost {
  readonly end = signal(1);
  readonly unrelated = signal(0);
}

@Component({
  template: `<div [move]="preset()" [moveDisabled]="disabled()"></div>`,
  imports: [MoveAnimateDirective],
})
class AnimateHost {
  readonly preset = signal<MovePreset>('fade-up');
  readonly disabled = signal(true);
}

@Component({
  template: `<div [moveInView]="preset()"></div>`,
  imports: [MoveInViewDirective],
})
class InViewHost {
  readonly preset = signal<MovePreset>('fade-up');
}

async function render<T>(host: new () => T): Promise<ComponentFixture<T>> {
  const fixture = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return fixture;
}

function oneShotWarnings(warn: MockInstance<typeof console.warn>): unknown[][] {
  return warn.mock.calls.filter((call) => String(call[0]).includes('is one-shot'));
}

describe('one-shot directives warn in dev mode when an input changes after playing', () => {
  let warn: MockInstance<typeof console.warn>;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideMovement()] });
    vi.spyOn(TestBed.inject(AnimationEngine), 'play').mockReturnValue(
      null as unknown as AnimationControls,
    );
    warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        observe = vi.fn();
        disconnect = vi.fn();
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('moveEnter warns once, naming the directive', async () => {
    const fixture = await render(EnterHost);
    expect(oneShotWarnings(warn)).toHaveLength(0);

    fixture.componentInstance.preset.set('zoom-in');
    fixture.detectChanges();
    fixture.componentInstance.preset.set('fade-down');
    fixture.detectChanges();

    const warnings = oneShotWarnings(warn);
    expect(warnings).toHaveLength(1);
    expect(String(warnings[0][0])).toContain('[moveEnter]');
  });

  it('moveEnter does not warn while the value stays the same', async () => {
    const fixture = await render(EnterLiteralHost);
    fixture.componentInstance.unrelated.set(1);
    fixture.detectChanges();
    expect(oneShotWarnings(warn)).toHaveLength(0);

    fixture.componentInstance.end.set(0.5);
    fixture.detectChanges();
    expect(oneShotWarnings(warn)).toHaveLength(1);
  });

  it('moveAnimate warns for the entrance but not for moveDisabled, which the exit reads', async () => {
    const fixture = await render(AnimateHost);

    fixture.componentInstance.disabled.set(false);
    fixture.detectChanges();
    expect(oneShotWarnings(warn)).toHaveLength(0);

    fixture.componentInstance.preset.set('zoom-in');
    fixture.detectChanges();
    expect(oneShotWarnings(warn)).toHaveLength(1);
  });

  it('moveInView warns once the preset has been resolved', async () => {
    const fixture = await render(InViewHost);

    fixture.componentInstance.preset.set('zoom-in');
    fixture.detectChanges();
    expect(oneShotWarnings(warn)).toHaveLength(1);
  });
});
