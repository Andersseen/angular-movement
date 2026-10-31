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
  formatTransform,
  readRenderedTransform,
  readTransformState,
  TransformState,
} from '../engines/transform-state';
import { cancelActivePlayer } from '../engines/active-player-registry';

/**
 * Experimental API — may change significantly between minor versions.
 *
 * @stability experimental
 * @experimental
 */
export type MoveDragConstraints =
  { top?: number; right?: number; bottom?: number; left?: number } | HTMLElement;

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

function readTransformStateDefault(): TransformState {
  return {
    translateX: 0,
    translateY: 0,
    scaleX: 1,
    scaleY: 1,
    rotate: 0,
    rotateX: 0,
    rotateY: 0,
  };
}

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
 * Makes the element draggable with pointer events, with optional axis lock, constraints, snap
 * points and momentum.
 *
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
    '(lostpointercapture)': 'onPointerUp($event)',
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

  /**
   * The drag's own translation, relative to {@link #origin}. This is the only place the drag's
   * displacement is stored: the element's inline `transform` is always rewritten from
   * `#origin` + this, never read back as a base, so a displacement cannot be counted twice.
   */
  #_x = 0;
  #_y = 0;
  /** The element's transform with the drag's contribution removed (the consumer's own transform). */
  #origin: TransformState = readTransformStateDefault();
  /** True from the moment a release animation starts until it settles or is superseded. */
  #releasing = false;
  /** Identifies the latest release, so a superseded one cannot write after a newer interaction. */
  #releaseToken = 0;

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

    const el = this.#host.nativeElement;

    // A release animation still in flight owns the visible position. Sample it *before* cancelling:
    // a cancelled WAAPI animation snaps back to the inline style, which would make the card jump.
    const live = this.#releasing ? readRenderedTransform(el) : null;

    this.#player?.cancel();
    // Preempt any in-flight hover/tap/focus/variants/layout animation on this element: without
    // this, a WAAPI animation still mid-flight at the instant a drag starts would later commit its
    // own final transform over whatever the drag wrote in the meantime, discarding drag movement.
    // Drag owns the transform exclusively from pointerdown forward — see "Transform ownership and
    // composition" in ARCHITECTURE.md.
    cancelActivePlayer(el);
    this.#player = null;
    this.#releasing = false;
    this.#releaseToken += 1;

    if (!live) {
      // At rest the inline transform is `origin + our displacement`; take the displacement back
      // out so the origin is the consumer's transform only.
      this.#origin = this.#deriveOrigin();
    }
    if (live) {
      // Continue from where the release animation had got to, expressed relative to the origin.
      this.#_x = this.#resolveAxisValue(live.translateX - this.#origin.translateX, 'x');
      this.#_y = this.#resolveAxisValue(live.translateY - this.#origin.translateY, 'y');
      this.#gesture = {
        scaleX: live.scaleX / (this.#origin.scaleX || 1),
        scaleY: live.scaleY / (this.#origin.scaleY || 1),
        rotate: live.rotate - this.#origin.rotate,
      };
    }

    // read bounds before we start mutating styles
    this.#dragBounds = this.resolveBounds();
    // Re-assert the exact current position so nothing moves at press time.
    this.applyTransform();

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
      // Measure the element where it sits with no drag displacement: the bounds are expressed
      // relative to that position.
      const oldTransform = this.#host.nativeElement.style.transform;
      this.#host.nativeElement.style.transform = formatTransform(this.#origin);

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
      this.#origin,
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

    // Settle the logical position first: an animation that finishes synchronously (reduced motion)
    // writes the final transform from it.
    this.#gesture = { ...NO_GESTURE };
    if (movesBack) {
      this.#_x = target.x;
      this.#_y = target.y;
    }

    this.#animateTo(current.x, current.y, toX, toY, gesture);
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
    const el = this.#host.nativeElement;
    if (!el.isConnected) return;

    // The engine composes its keyframes on top of the inline transform, so start from the origin
    // alone: the animation then carries the whole drag displacement exactly once. An identity
    // origin is written explicitly as `translate(0px, 0px)` — an empty or `none` transform would
    // make the engine animate the individual `translate` property instead and commit the
    // displacement there, a second copy `transform` would then add to.
    const originOnly = formatTransform(this.#origin);
    el.style.transform = originOnly === 'none' ? 'translate(0px, 0px)' : originOnly;

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

    const token = (this.#releaseToken += 1);
    this.#releasing = true;
    this.#player = this.#engine.play(el, frames, {
      config: { duration: 300, easing: 'ease', delay: 0, disabled: false, iterations: 1 },
      spring: this.moveSpring() ?? { stiffness: 500, damping: 30 },
      disabled: prefersReducedMotion(this.#documentRef),
      onDone: () => this.#settleRelease(token),
    });
  }

  /**
   * Replaces whatever the finished release animation committed with the canonical
   * `origin + displacement` transform. A no-op if a newer interaction took over meanwhile.
   */
  #settleRelease(token: number): void {
    if (token !== this.#releaseToken || this.#isDragging) return;
    this.#releasing = false;
    if (!this.#host.nativeElement.isConnected) return;
    this.#gesture = { ...NO_GESTURE };
    this.applyTransform();
  }

  /**
   * Splits the element's current transform into the consumer's own part and the displacement the
   * drag has already written. Translation comes from the rendered matrix when available (exact,
   * and resolves units), the rest from the inline transform.
   */
  #deriveOrigin(): TransformState {
    const el = this.#host.nativeElement;
    const state = readTransformState(el);
    const rendered = readRenderedTransform(el);
    const embedded = this.#visiblePosition(this.#_x, this.#_y);

    return {
      ...state,
      translateX: (rendered?.translateX ?? state.translateX) - embedded.x,
      translateY: (rendered?.translateY ?? state.translateY) - embedded.y,
    };
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
    this.#releaseToken += 1;
    this.#releasing = false;
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
