import { Directive, ElementRef, inject, input, OnDestroy } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MoveSpring } from '../presets/presets.types';

import { prefersReducedMotion, validateDragElastic } from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';

export type MoveDragConstraints =
  | { top?: number; right?: number; bottom?: number; left?: number }
  | HTMLElement;

@Directive({
  selector: '[moveDrag]',
  host: {
    '(pointerdown)': 'onPointerDown($event)',
    '(pointermove)': 'onPointerMove($event)',
    '(pointerup)': 'onPointerUp($event)',
    '(pointercancel)': 'onPointerUp($event)',
  },
})
export class MoveDragDirective implements OnDestroy {
  readonly moveDrag = input<boolean | ''>(true);
  readonly moveDragConstraints = input<MoveDragConstraints | undefined>(undefined);
  readonly moveDragElastic = input<number>(0.5);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);

  #isDragging = false;
  #pointerId: number | null = null;
  #startX = 0;
  #startY = 0;

  #_x = 0;
  #_y = 0;

  #dragBounds: { top?: number; right?: number; bottom?: number; left?: number } | null = null;
  #player: AnimationControls | null = null;

  onPointerDown(e: PointerEvent) {
    if (this.moveDrag() === false || e.button !== 0) return;
    this.#isDragging = true;
    this.#pointerId = e.pointerId;
    if (typeof this.#host.nativeElement.setPointerCapture === 'function') {
      this.#host.nativeElement.setPointerCapture(e.pointerId);
    }

    this.#player?.cancel();
    // read bounds cleanly before next render
    this.#dragBounds = this.resolveBounds();

    this.#startX = e.clientX - this.#_x;
    this.#startY = e.clientY - this.#_y;

    // Prevent text selection while dragging
    this.#host.nativeElement.style.touchAction = 'none';
    this.#host.nativeElement.style.userSelect = 'none';
  }

  onPointerMove(e: PointerEvent) {
    if (!this.#isDragging || e.pointerId !== this.#pointerId) return;

    this.#_x = e.clientX - this.#startX;
    this.#_y = e.clientY - this.#startY;

    this.applyTransform();
  }

  onPointerUp(e: PointerEvent) {
    if (!this.#isDragging || e.pointerId !== this.#pointerId) return;
    this.#isDragging = false;
    if (typeof this.#host.nativeElement.releasePointerCapture === 'function') {
      this.#host.nativeElement.releasePointerCapture(e.pointerId);
    }
    this.#pointerId = null;

    this.#host.nativeElement.style.touchAction = '';
    this.#host.nativeElement.style.userSelect = '';

    this.snapBackIfNeeded();
  }

  private resolveBounds() {
    const constraints = this.moveDragConstraints();
    if (!constraints) return null;

    if (constraints instanceof HTMLElement) {
      const oldTranslate = this.#host.nativeElement.style.translate;
      this.#host.nativeElement.style.translate = 'none';

      const elRect = this.#host.nativeElement.getBoundingClientRect();
      const containerRect = constraints.getBoundingClientRect();

      this.#host.nativeElement.style.translate = oldTranslate;

      return {
        left: containerRect.left - elRect.left,
        right: containerRect.right - elRect.right,
        top: containerRect.top - elRect.top,
        bottom: containerRect.bottom - elRect.bottom,
      };
    }

    return constraints;
  }

  private applyTransform() {
    let x = this.#_x;
    let y = this.#_y;

    if (this.#dragBounds) {
      const elastic = validateDragElastic(this.moveDragElastic());

      if (this.#dragBounds.left !== undefined && x < this.#dragBounds.left) {
        x = this.#dragBounds.left - (this.#dragBounds.left - x) * elastic;
      } else if (this.#dragBounds.right !== undefined && x > this.#dragBounds.right) {
        x = this.#dragBounds.right + (x - this.#dragBounds.right) * elastic;
      }

      if (this.#dragBounds.top !== undefined && y < this.#dragBounds.top) {
        y = this.#dragBounds.top - (this.#dragBounds.top - y) * elastic;
      } else if (this.#dragBounds.bottom !== undefined && y > this.#dragBounds.bottom) {
        y = this.#dragBounds.bottom + (y - this.#dragBounds.bottom) * elastic;
      }
    }

    this.#host.nativeElement.style.translate = `${x}px ${y}px`;
  }

  private snapBackIfNeeded() {
    if (!this.#dragBounds) return;

    // We base the snap on the current logical _x, _y, calculating the nearest valid position.
    let targetX = this.#_x;
    let targetY = this.#_y;

    if (this.#dragBounds.left !== undefined && targetX < this.#dragBounds.left)
      targetX = this.#dragBounds.left;
    if (this.#dragBounds.right !== undefined && targetX > this.#dragBounds.right)
      targetX = this.#dragBounds.right;
    if (this.#dragBounds.top !== undefined && targetY < this.#dragBounds.top)
      targetY = this.#dragBounds.top;
    if (this.#dragBounds.bottom !== undefined && targetY > this.#dragBounds.bottom)
      targetY = this.#dragBounds.bottom;

    if (targetX !== this.#_x || targetY !== this.#_y) {
      // Find the currently visible coordinates (which include elasticity)
      let currentVisX = this.#_x;
      let currentVisY = this.#_y;

      const elastic = validateDragElastic(this.moveDragElastic());
      if (this.#dragBounds.left !== undefined && this.#_x < this.#dragBounds.left) {
        currentVisX = this.#dragBounds.left - (this.#dragBounds.left - this.#_x) * elastic;
      } else if (this.#dragBounds.right !== undefined && this.#_x > this.#dragBounds.right) {
        currentVisX = this.#dragBounds.right + (this.#_x - this.#dragBounds.right) * elastic;
      }
      if (this.#dragBounds.top !== undefined && this.#_y < this.#dragBounds.top) {
        currentVisY = this.#dragBounds.top - (this.#dragBounds.top - this.#_y) * elastic;
      } else if (this.#dragBounds.bottom !== undefined && this.#_y > this.#dragBounds.bottom) {
        currentVisY = this.#dragBounds.bottom + (this.#_y - this.#dragBounds.bottom) * elastic;
      }

      this.#player = this.#engine.play(
        this.#host.nativeElement,
        {
          x: [currentVisX, targetX],
          y: [currentVisY, targetY],
        },
        {
          config: { duration: 300, easing: 'ease', delay: 0, disabled: false },
          spring: this.moveSpring() ?? { stiffness: 500, damping: 30 },
          disabled: prefersReducedMotion(this.#documentRef),
        },
      );

      this.#_x = targetX;
      this.#_y = targetY;
    }
  }

  ngOnDestroy(): void {
    if (this.#pointerId !== null) {
      try {
        if (typeof this.#host.nativeElement.releasePointerCapture === 'function') {
          this.#host.nativeElement.releasePointerCapture(this.#pointerId);
        }
      } catch {
        // Element may already be detached
      }
      this.#pointerId = null;
    }
    this.#host.nativeElement.style.touchAction = '';
    this.#host.nativeElement.style.userSelect = '';
    this.#player?.cancel();
  }
}
