import { Directive, ElementRef, inject, input, OnDestroy, output } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { MoveKeyframes, MoveSpring } from '../presets/presets.types';
import { MOVEMENT_CONFIG } from '../tokens/movement.tokens';

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

/**
 * Experimental API — may change significantly between minor versions.
 *
 * @stability experimental
 * @experimental
 */
export type MoveDragConstraints =
  | { top?: number; right?: number; bottom?: number; left?: number }
  | HTMLElement;

/**
 * Experimental API — may change significantly between minor versions.
 *
 * @stability experimental
 * @experimental
 */
export type MoveDragAxis = boolean | '' | 'x' | 'y';

/**
 * Experimental API — may change significantly between minor versions.
 *
 * @stability experimental
 * @experimental
 */
export interface MoveDragSnapPoint {
  x: number;
  y: number;
}

/** The transform channels `whileDrag` may drive. Translate stays owned by the drag itself. */
interface DragGesture {
  scaleX: number;
  scaleY: number;
  rotate: number;
}

const NO_GESTURE: DragGesture = { scaleX: 1, scaleY: 1, rotate: 0 };

/**
 * Experimental API — may change significantly between minor versions.
 *
 * @stability experimental
 * @experimental
 */
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
  /**
   * State held while a drag is active, e.g. `{ scale: [1, 1.05] }` — the "lift the card" gesture.
   * Only transform channels are supported; the drag owns translate.
   */
  readonly moveWhileDrag = input<MoveKeyframes | undefined>(undefined);

  readonly moveDragStart = output<MoveDragEvent>();
  readonly moveDragMove = output<MoveDragEvent>();
  readonly moveDragEnd = output<MoveDragEvent>();

  readonly #documentRef = inject(DOCUMENT);
  readonly #host = inject(ElementRef<HTMLElement>);
  readonly #engine = inject(AnimationEngine);
  readonly #defaults = inject(MOVEMENT_CONFIG);

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

  #gesture: DragGesture = { ...NO_GESTURE };
  #gestureRaf: number | null = null;

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
    this.#tweenGesture(this.#resolveGestureTarget());
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

  /**
   * The single transform write while a drag is active.
   *
   * The `whileDrag` channels ride along in the same composed write rather than going through the
   * engine, because the engine would become a second writer of `transform` and the two would
   * clobber each other every pointermove.
   */
  private applyTransform() {
    const { x, y } = this.#visiblePosition(this.#_x, this.#_y);
    applyComposedTransform(
      this.#host.nativeElement,
      {
        translateX: x,
        translateY: y,
        scaleX: this.#gesture.scaleX,
        scaleY: this.#gesture.scaleY,
        rotate: this.#gesture.rotate,
      },
      this.#baseTransform ?? undefined,
    );
  }

  /** Final values of the `whileDrag` keyframes; anything absent stays at identity. */
  #resolveGestureTarget(): DragGesture {
    const frames = this.moveWhileDrag();
    if (!frames) return { ...NO_GESTURE };

    const last = (values: readonly (number | string)[] | undefined): number | undefined =>
      values && values.length > 0 ? Number(values[values.length - 1]) : undefined;

    const uniform = last(frames.scale);

    return {
      scaleX: uniform ?? last(frames.scaleX) ?? 1,
      scaleY: uniform ?? last(frames.scaleY) ?? 1,
      rotate: last(frames.rotate) ?? 0,
    };
  }

  #stopGestureTween(): void {
    if (this.#gestureRaf !== null && typeof cancelAnimationFrame === 'function') {
      cancelAnimationFrame(this.#gestureRaf);
    }
    this.#gestureRaf = null;
  }

  #tweenGesture(to: DragGesture): void {
    this.#stopGestureTween();

    const from = { ...this.#gesture };
    const unchanged =
      from.scaleX === to.scaleX && from.scaleY === to.scaleY && from.rotate === to.rotate;
    if (unchanged) return;

    const reduced = prefersReducedMotion(this.#documentRef);
    if (reduced || typeof requestAnimationFrame !== 'function') {
      this.#gesture = { ...to };
      this.applyTransform();
      return;
    }

    const duration = Math.max(1, this.#defaults.duration);
    const start = performance.now();

    const tick = (now: number) => {
      const linear = Math.min(1, (now - start) / duration);
      // ease-out cubic: the lift should settle rather than arrive at full speed
      const p = 1 - Math.pow(1 - linear, 3);

      this.#gesture = {
        scaleX: from.scaleX + (to.scaleX - from.scaleX) * p,
        scaleY: from.scaleY + (to.scaleY - from.scaleY) * p,
        rotate: from.rotate + (to.rotate - from.rotate) * p,
      };
      this.applyTransform();

      this.#gestureRaf = linear < 1 ? requestAnimationFrame(tick) : null;
    };

    this.#gestureRaf = requestAnimationFrame(tick);
  }

  private finishDrag() {
    // Hand the transform back to the engine in one piece: the RAF tween must not keep writing
    // while the engine animates the same property.
    this.#stopGestureTween();

    const projectedX = this.moveDragMomentum() ? this.#_x + this.#velocityX * 180 : this.#_x;
    const projectedY = this.moveDragMomentum() ? this.#_y + this.#velocityY * 180 : this.#_y;

    const target = this.#resolveTarget(projectedX, projectedY);
    const gesture = this.#gesture;

    const movesBack = target.x !== this.#_x || target.y !== this.#_y;
    const releasesGesture = gesture.scaleX !== 1 || gesture.scaleY !== 1 || gesture.rotate !== 0;

    if (!movesBack && !releasesGesture) return;

    const current = this.#visiblePosition(this.#_x, this.#_y);
    const toX = movesBack ? target.x : current.x;
    const toY = movesBack ? target.y : current.y;

    this.#animateTo(current.x, current.y, toX, toY, gesture);
    this.#gesture = { ...NO_GESTURE };

    if (movesBack) {
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

  #animateTo(
    fromX: number,
    fromY: number,
    toX: number,
    toY: number,
    gesture: DragGesture = NO_GESTURE,
  ): void {
    if (!this.#host.nativeElement.isConnected) return;

    // Reset the inline transform to the base state so the engine animates the
    // drag delta exactly once instead of composing it on top of itself.
    if (this.#baseTransform) {
      resetTransformToBase(this.#host.nativeElement, this.#baseTransform);
    }

    const frames: MoveKeyframes = {
      x: [fromX, toX],
      y: [fromY, toY],
    };

    // Releasing the whileDrag state travels in the same play, so scale and translate settle
    // together instead of through two competing writers.
    if (gesture.scaleX !== 1 || gesture.scaleY !== 1) {
      frames.scaleX = [gesture.scaleX, 1];
      frames.scaleY = [gesture.scaleY, 1];
    }
    if (gesture.rotate !== 0) {
      frames.rotate = [gesture.rotate, 0];
    }

    this.#player = this.#engine.play(this.#host.nativeElement, frames, {
      config: { duration: 300, easing: 'ease', delay: 0, disabled: false, iterations: 1 },
      spring: this.moveSpring() ?? { stiffness: 500, damping: 30 },
      disabled: prefersReducedMotion(this.#documentRef),
    });
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
    this.#stopGestureTween();
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
