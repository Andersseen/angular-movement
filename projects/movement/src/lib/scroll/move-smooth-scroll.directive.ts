import {
  Directive,
  ElementRef,
  inject,
  input,
  OnDestroy,
  OnInit,
  PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SmoothScrollService } from './smooth-scroll.service';

/**
 * Directive that enables smooth scrolling on a specific scrollable container.
 *
 * Usage:
 *   <div moveSmoothScroll [moveSmoothScrollLerp]="0.08" style="overflow-y: auto; height: 100vh">
 *     ...content...
 *   </div>
 *
 * Or use the service directly on the body/documentElement:
 *   constructor() {
 *     inject(SmoothScrollService).init({ lerp: 0.1 });
 *   }
 */
@Directive({
  selector: '[moveSmoothScroll]',
})
export class MoveSmoothScrollDirective implements OnInit, OnDestroy {
  readonly moveSmoothScrollLerp = input<number>(0.1);

  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #scroll = inject(SmoothScrollService);
  readonly #platformId = inject(PLATFORM_ID);

  ngOnInit(): void {
    if (!isPlatformBrowser(this.#platformId)) return;

    this.#scroll.init({
      lerp: this.moveSmoothScrollLerp(),
      element: this.#host.nativeElement,
    });
  }

  ngOnDestroy(): void {
    this.#scroll.destroy();
  }
}
