import { Directive, ElementRef, inject } from '@angular/core';

/**
 * Pointer spotlight for landing tiles: writes the pointer position into `--spot-x` / `--spot-y`
 * so the `.spotlight` styles can paint a soft glow that follows it. Pointer events only fire in
 * the browser, so this needs no platform guard; touch never hovers, so it stays inert there.
 */
@Directive({
  selector: '[appSpotlight]',
  host: {
    class: 'spotlight',
    '(pointermove)': 'track($event)',
  },
})
export class SpotlightDirective {
  readonly #host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected track(event: PointerEvent): void {
    if (event.pointerType === 'touch') return;
    const el = this.#host.nativeElement;
    const rect = el.getBoundingClientRect();
    el.style.setProperty('--spot-x', `${event.clientX - rect.left}px`);
    el.style.setProperty('--spot-y', `${event.clientY - rect.top}px`);
  }
}
