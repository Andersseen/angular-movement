import { Directive, ElementRef, inject, input, OnDestroy, output } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MoveSpring } from '../presets/presets.types';

import {
  booleanAttribute,
  numberAttribute,
  prefersReducedMotion,
  validateDragElastic,
} from './move-animation.utils';
import { AnimationEngine } from '../engines/animation-engine.service';
import { AnimationControls } from '../engines/animation-controls';
import {
  applyComposedTransform,
  readTransformState,
  resetTransformToBase,
  TransformState,
} from '../engines/transform-state';

export type MoveDragConstraints =
  | { top?: number; right?: number; bottom?: number; left?: number }
  | HTMLElement;
export type MoveDragAxis = boolean | '' | 'x' | 'y';

export interface MoveDragSnapPoint {
  x: number;
  y: number;
}

export interface MoveDragEvent {
  x: number;
  y: number;
  deltaX: number;
  deltaY: number;
  pointerEvent: PointerEvent;
}

/**
 * Experimental API — may change significantly between minor versions.
 *
 * @stability experimental
 * @experimental
 */
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
  readonly moveDrag = input<MoveDragAxis, unknown>(true, {
    transform: (value) => {
      if (value === '' || value === true) return true;
      if (value === false || value === 'false') return false;
      if (value === 'x' || value === 'y') return value;
      return true;
    },
  });
  readonly moveDragConstraints = input<MoveDragConstraints | undefined>(undefined);
  readonly moveDragElastic = input<number, unknown>(0.5, { transform: numberAttribute });
  readonly moveDragMomentum = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly moveDragSnapToOrigin = input<boolean, unknown>(false, { transform: booleanAttribute });
  readonly moveDragSnapPoints = input<readonly MoveDragSnapPoint[] | undefined>(undefined);
  readonly moveSpring = input<MoveSpring | undefined>(undefined);

  readonly moveDragStart = output<MoveDragEvent>();
  readonly moveDragMove = output<MoveDragEvent>();
  readonly moveDragEnd = output<MoveDragEvent>();

  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);

  #isDragging = false;
  #pointerId: number | null = null;
  #startX = 0;
  #startY = 0;
  #lastClientX = 0;
  #lastClientY = 0;
  #lastMoveTime = 0;
  #velocityX = 0;
  #velocityY = 0;

  #_x = 0;
  #_y = 0;
  #baseTransform: TransformState | null = null;

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
    // read bounds and base transform cleanly before we start mutating styles
    this.#dragBounds = this.resolveBounds();
    this.#baseTransform = readTransformState(this.#host.nativeElement);

    this.#startX = e.clientX - this.#_x;
    this.#startY = e.clientY - this.#_y;
    this.#lastClientX = e.clientX;
    this.#lastClientY = e.clientY;
    this.#lastMoveTime = e.timeStamp || performance.now();
    this.#velocityX = 0;
    this.#velocityY = 0;

    // Prevent text selection while dragging
    this.#host.nativeElement.style.touchAction = 'none';
    this.#host.nativeElement.style.userSelect = 'none';
    this.moveDragStart.emit(this.#createDragEvent(e, 0, 0));
  }

  onPointerMove(e: PointerEvent) {
    if (!this.#isDragging || e.pointerId !== this.#pointerId) return;
    if (!this.#host.nativeElement.isConnected) {
      this.onPointerUp(e);
      return;
    }

    const now = e.timeStamp || performance.now();
    const dt = Math.max(1, now - this.#lastMoveTime);
    const deltaClientX = e.clientX - this.#lastClientX;
    const deltaClientY = e.clientY - this.#lastClientY;
    this.#velocityX = deltaClientX / dt;
    this.#velocityY = deltaClientY / dt;
    this.#lastClientX = e.clientX;
    this.#lastClientY = e.clientY;
    this.#lastMoveTime = now;

    const previousX = this.#_x;
    const previousY = this.#_y;

    this.#_x = this.#resolveAxisValue(e.clientX - this.#startX, 'x');
    this.#_y = this.#resolveAxisValue(e.clientY - this.#startY, 'y');

    this.applyTransform();
    this.moveDragMove.emit(this.#createDragEvent(e, this.#_x - previousX, this.#_y - previousY));
  }

  onPointerUp(e: PointerEvent) {
    if (!this.#isDragging || e.pointerId !== this.#pointerId) return;
    this.#isDragging = false;
    if (typeof this.#host.nativeElement.releasePointerCapture === 'function') {
      try {
        this.#host.nativeElement.releasePointerCapture(e.pointerId);
      } catch {
        // Element may already be detached
      }
    }
    this.#pointerId = null;

    if (this.#host.nativeElement.isConnected) {
      this.#host.nativeElement.style.touchAction = '';
      this.#host.nativeElement.style.userSelect = '';
      this.moveDragEnd.emit(this.#createDragEvent(e, 0, 0));
      this.finishDrag();
    }
  }

  private resolveBounds() {
    const constraints = this.moveDragConstraints();
    if (!constraints) return null;

    if (constraints instanceof HTMLElement) {
      const oldTransform = this.#host.nativeElement.style.transform;
      this.#host.nativeElement.style.transform = '';

      const elRect = this.#host.nativeElement.getBoundingClientRect();
      const containerRect = constraints.getBoundingClientRect();

      this.#host.nativeElement.style.transform = oldTransform;

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
    const { x, y } = this.#visiblePosition(this.#_x, this.#_y);
    applyComposedTransform(
      this.#host.nativeElement,
      { translateX: x, translateY: y },
      this.#baseTransform ?? undefined,
    );
  }

  private finishDrag() {
    const projectedX = this.moveDragMomentum() ? this.#_x + this.#velocityX * 180 : this.#_x;
    const projectedY = this.moveDragMomentum() ? this.#_y + this.#velocityY * 180 : this.#_y;

    const target = this.#resolveTarget(projectedX, projectedY);

    if (target.x !== this.#_x || target.y !== this.#_y) {
      const current = this.#visiblePosition(this.#_x, this.#_y);
      this.#animateTo(current.x, current.y, target.x, target.y);

      this.#_x = target.x;
      this.#_y = target.y;
    }
  }

  #resolveTarget(x: number, y: number): { x: number; y: number } {
    let targetX = this.#resolveAxisValue(x, 'x');
    let targetY = this.#resolveAxisValue(y, 'y');

    if (this.moveDragSnapToOrigin()) {
      targetX = this.#resolveAxisValue(0, 'x');
      targetY = this.#resolveAxisValue(0, 'y');
    } else {
      const snapPoint = this.#nearestSnapPoint(targetX, targetY);

      if (snapPoint) {
        targetX = snapPoint.x;
        targetY = snapPoint.y;
      }
    }

    if (this.#dragBounds) {
      targetX = this.#clampToBounds(targetX, 'x');
      targetY = this.#clampToBounds(targetY, 'y');
    }

    return { x: targetX, y: targetY };
  }

  #nearestSnapPoint(x: number, y: number): { x: number; y: number } | null {
    const snapPoints = this.moveDragSnapPoints();
    if (!snapPoints?.length) return null;

    let nearest: { x: number; y: number } | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;

    for (const point of snapPoints) {
      const candidateX = this.#resolveAxisValue(point.x, 'x');
      const candidateY = this.#resolveAxisValue(point.y, 'y');
      const dx = candidateX - x;
      const dy = candidateY - y;
      const distance = dx * dx + dy * dy;

      if (distance < nearestDistance) {
        nearest = { x: candidateX, y: candidateY };
        nearestDistance = distance;
      }
    }

    return nearest;
  }

  #visiblePosition(x: number, y: number): { x: number; y: number } {
    if (!this.#dragBounds) return { x, y };

    const elastic = validateDragElastic(this.moveDragElastic());

    let visibleX = x;
    let visibleY = y;

    if (this.#dragBounds.left !== undefined && visibleX < this.#dragBounds.left) {
      visibleX = this.#dragBounds.left - (this.#dragBounds.left - visibleX) * elastic;
    } else if (this.#dragBounds.right !== undefined && visibleX > this.#dragBounds.right) {
      visibleX = this.#dragBounds.right + (visibleX - this.#dragBounds.right) * elastic;
    }

    if (this.#dragBounds.top !== undefined && visibleY < this.#dragBounds.top) {
      visibleY = this.#dragBounds.top - (this.#dragBounds.top - visibleY) * elastic;
    } else if (this.#dragBounds.bottom !== undefined && visibleY > this.#dragBounds.bottom) {
      visibleY = this.#dragBounds.bottom + (visibleY - this.#dragBounds.bottom) * elastic;
    }

    return { x: visibleX, y: visibleY };
  }

  #clampToBounds(value: number, axis: 'x' | 'y'): number {
    if (!this.#dragBounds) return value;

    const min = axis === 'x' ? this.#dragBounds.left : this.#dragBounds.top;
    const max = axis === 'x' ? this.#dragBounds.right : this.#dragBounds.bottom;

    if (min !== undefined && value < min) return min;
    if (max !== undefined && value > max) return max;
    return value;
  }

  #resolveAxisValue(value: number, axis: 'x' | 'y'): number {
    const drag = this.moveDrag();
    if (drag === 'x' && axis === 'y') return 0;
    if (drag === 'y' && axis === 'x') return 0;
    return value;
  }

  #animateTo(fromX: number, fromY: number, toX: number, toY: number): void {
    if (!this.#host.nativeElement.isConnected) return;

    // Reset the inline transform to the base state so the engine animates the
    // drag delta exactly once instead of composing it on top of itself.
    if (this.#baseTransform) {
      resetTransformToBase(this.#host.nativeElement, this.#baseTransform);
    }

    this.#player = this.#engine.play(
      this.#host.nativeElement,
      {
        x: [fromX, toX],
        y: [fromY, toY],
      },
      {
        config: { duration: 300, easing: 'ease', delay: 0, disabled: false, iterations: 1 },
        spring: this.moveSpring() ?? { stiffness: 500, damping: 30 },
        disabled: prefersReducedMotion(this.#documentRef),
      },
    );
  }

  #createDragEvent(e: PointerEvent, deltaX: number, deltaY: number): MoveDragEvent {
    return {
      x: this.#_x,
      y: this.#_y,
      deltaX,
      deltaY,
      pointerEvent: e,
    };
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
