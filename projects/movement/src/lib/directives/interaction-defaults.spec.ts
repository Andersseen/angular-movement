import { Component, Directive, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { vi } from 'vitest';
import { MoveHoverDirective } from './move-hover.directive';
import { MoveTapDirective } from './move-tap.directive';
import { resolveMoveFrames } from './move-animation.utils';
import { provideMovement } from '../providers/provide-movement';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

/**
 * `moveWhileHover` defaults to `lift` and `moveWhileTap` to `press`. A required input could not be
 * left unexposed by a `hostDirectives` composition (NG2019), and exposing it made every use site
 * bind it again (NG8008) — these components would not compile if either input were required.
 */

/** App-level composition: lift + press with no per-use configuration. */
@Directive({
  selector: '[moveTestInteractive]',
  hostDirectives: [
    { directive: MoveHoverDirective, inputs: ['moveDisabled'] },
    { directive: MoveTapDirective, inputs: ['moveDisabled'] },
  ],
})
class InteractiveDirective {}

/** Composition that exposes the preset so a use site may override it, but need not. */
@Directive({
  selector: '[moveTestOverridable]',
  hostDirectives: [{ directive: MoveHoverDirective, inputs: ['moveWhileHover'] }],
})
class OverridableDirective {}

@Component({
  template: `
    <button data-id="bare" moveWhileHover moveWhileTap>Bare</button>
    <button data-id="composed" moveTestInteractive [moveDisabled]="disabled()">Composed</button>
    <button data-id="exposed-default" moveTestOverridable>Default</button>
    <button data-id="exposed-override" moveTestOverridable moveWhileHover="pulse">Override</button>
    <button data-id="unbound" [moveWhileHover]="unset()">Unbound</button>
  `,
  imports: [MoveHoverDirective, MoveTapDirective, InteractiveDirective, OverridableDirective],
})
class HostComponent {
  readonly disabled = signal(false);
  readonly unset = signal<undefined>(undefined);
}

describe('interaction directive defaults', () => {
  let playSpy: ReturnType<typeof vi.spyOn>;

  function setup() {
    TestBed.configureTestingModule({ imports: [HostComponent], providers: [provideMovement()] });
    const fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
    playSpy = vi
      .spyOn(TestBed.inject(AnimationEngine), 'play')
      .mockReturnValue(null as unknown as AnimationControls);
    return fixture;
  }

  function element(fixture: ReturnType<typeof setup>, id: string) {
    return fixture.debugElement.query(By.css(`[data-id="${id}"]`));
  }

  const lift = resolveMoveFrames('lift', 'enter');
  const press = resolveMoveFrames('press', 'enter');

  it('a bare moveWhileHover lifts and a bare moveWhileTap presses', () => {
    const fixture = setup();
    const button = element(fixture, 'bare');

    expect(button.injector.get(MoveHoverDirective).moveWhileHover()).toBe('lift');
    expect(button.injector.get(MoveTapDirective).moveWhileTap()).toBe('press');

    button.triggerEventHandler('pointerenter', { pointerType: 'mouse' });
    expect(playSpy).toHaveBeenLastCalledWith(button.nativeElement, lift, expect.anything());

    button.triggerEventHandler('pointerdown', {});
    expect(playSpy).toHaveBeenLastCalledWith(button.nativeElement, press, expect.anything());
  });

  it('composes through hostDirectives without exposing the preset inputs', () => {
    const fixture = setup();
    const button = element(fixture, 'composed');

    button.triggerEventHandler('pointerenter', { pointerType: 'mouse' });
    expect(playSpy).toHaveBeenLastCalledWith(button.nativeElement, lift, expect.anything());

    button.triggerEventHandler('pointerdown', {});
    expect(playSpy).toHaveBeenLastCalledWith(button.nativeElement, press, expect.anything());
  });

  it('forwards moveDisabled to both host directives', () => {
    const fixture = setup();
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    playSpy.mockClear();
    const button = element(fixture, 'composed');

    button.triggerEventHandler('pointerenter', { pointerType: 'mouse' });
    button.triggerEventHandler('pointerdown', {});

    expect(playSpy).not.toHaveBeenCalled();
  });

  it('an exposed preset input is optional at the use site and still overridable', () => {
    const fixture = setup();

    expect(
      element(fixture, 'exposed-default').injector.get(MoveHoverDirective).moveWhileHover(),
    ).toBe('lift');
    expect(
      element(fixture, 'exposed-override').injector.get(MoveHoverDirective).moveWhileHover(),
    ).toBe('pulse');
  });

  it('falls back to the default when bound to undefined', () => {
    const fixture = setup();

    expect(element(fixture, 'unbound').injector.get(MoveHoverDirective).moveWhileHover()).toBe(
      'lift',
    );
  });
});
