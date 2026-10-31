/**
 * Layout geometry for `moveLayout` (spec 021). Internal — not part of the public barrel.
 *
 * ## Coordinate model
 *
 * - **Natural box** — where the browser's layout put the element, with the element's *own*
 *   transform channels removed. This is what a FLIP animates towards and what the previous
 *   snapshot is compared against.
 * - **Visual box** — the natural box as currently painted: the element's own `translate`,
 *   `rotate`, `scale` and `transform` (inline, stylesheet or mid-animation) applied around its
 *   `transform-origin`.
 *
 * Boxes live in **scroll-adjusted space**: the viewport rect plus the scroll offset of every ancestor
 * (window included). Scrolling the page or a scroll container moves an element in the viewport
 * without changing its layout, so viewport coordinates would read it as movement and fire a
 * spurious FLIP on the next render.
 *
 * `getBoundingClientRect()` returns the *visual* box. Comparing visual boxes counts any transform
 * twice, so every measurement is converted to the natural box by inverting the element's computed
 * 2D matrix. Because the matrix is read from computed style it includes a running WAAPI animation,
 * which lets a layout change be measured mid-FLIP without cancelling anything.
 *
 * ## Supported geometry
 *
 * Own transforms: translate, scale, rotate, skew, any `transform-origin`, from inline styles,
 * stylesheets or running animations.
 *
 * Ancestor transforms: a layout host that is mid-FLIP registers itself with
 * {@link setLayoutProjecting}, and descendants undo its (translate/scale) transform when
 * measuring — otherwise every render during a parent's FLIP would read as the child having moved.
 * A transform on an ancestor that is *not* a layout host is not inverted: a constant translate
 * cancels out of a delta, a scale or rotation does not (deltas would be in scaled pixels). The
 * pixel deltas a child FLIP plays are also not corrected for a scaling parent: content inside a
 * scaling layout host is distorted while the parent is mid-FLIP. 3D transforms are not inverted
 * either: the visual box is used as measured.
 */

/** The four numbers a FLIP needs. A `DOMRect` satisfies it. */
export interface LayoutBox {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

/** An element's own 2D transform, expressed about its transform origin. */
export interface LayoutTransform {
  matrix: DOMMatrix;
  /** Transform origin in px, relative to the element's own top-left corner. */
  originX: number;
  originY: number;
}

export interface LayoutMeasurement {
  /** The natural box. */
  box: LayoutBox;
  /** The own transform that was inverted, or `null` when it is the identity or unsupported. */
  transform: LayoutTransform | null;
}

const EPSILON = 1e-6;

function parseLength(token: string | undefined, basis: number): number {
  if (!token) return 0;
  const value = parseFloat(token);
  if (Number.isNaN(value)) return 0;
  return token.endsWith('%') ? (value / 100) * basis : value;
}

/**
 * Reads the element's own 2D transform from computed style, or `null` for the identity.
 * Returns `'unsupported'` for 3D transforms and axis-form rotations.
 */
function readOwnTransform(
  el: HTMLElement,
  css: CSSStyleDeclaration,
  Matrix: typeof DOMMatrix,
): LayoutTransform | 'unsupported' | null {
  const translate = css.translate;
  const rotate = css.rotate;
  const scale = css.scale;
  const transform = css.transform;

  const hasTranslate = !!translate && translate !== 'none';
  const hasRotate = !!rotate && rotate !== 'none';
  const hasScale = !!scale && scale !== 'none';
  const hasTransform = !!transform && transform !== 'none';
  if (!hasTranslate && !hasRotate && !hasScale && !hasTransform) return null;

  const matrix = new Matrix();

  if (hasTranslate) {
    const [x, y, z] = translate.split(/\s+/);
    if (z !== undefined && parseFloat(z) !== 0) return 'unsupported';
    matrix.translateSelf(parseLength(x, el.offsetWidth), parseLength(y, el.offsetHeight));
  }

  if (hasRotate) {
    // `rotate: x 45deg` / `rotate: 1 1 0 45deg` rotate around an axis: 3D.
    if (!/^-?[\d.]+(deg|rad|grad|turn)$/.test(rotate)) return 'unsupported';
    matrix.rotateSelf(0, 0, toDegrees(rotate));
  }

  if (hasScale) {
    const [x, y, z] = scale.split(/\s+/).map(parseFloat);
    if (z !== undefined && z !== 1) return 'unsupported';
    matrix.scaleSelf(x, y ?? x);
  }

  if (hasTransform) {
    let own: DOMMatrix;
    try {
      own = new Matrix(transform);
    } catch {
      return 'unsupported';
    }
    if (!own.is2D) return 'unsupported';
    matrix.multiplySelf(own);
  }

  const [ox, oy] = css.transformOrigin.split(/\s+/);
  return {
    matrix,
    originX: parseLength(ox, el.offsetWidth),
    originY: parseLength(oy, el.offsetHeight),
  };
}

function toDegrees(angle: string): number {
  const value = parseFloat(angle);
  if (angle.endsWith('grad')) return value * 0.9;
  if (angle.endsWith('turn')) return value * 360;
  if (angle.endsWith('rad')) return (value * 180) / Math.PI;
  return value;
}

/** Maps a point of the element's own (untransformed) box into the transformed box's space. */
function mapPoint(t: LayoutTransform, x: number, y: number): [number, number] {
  const { matrix: m, originX, originY } = t;
  const dx = x - originX;
  const dy = y - originY;
  return [originX + m.a * dx + m.c * dy + m.e, originY + m.b * dx + m.d * dy + m.f];
}

function isAxisAligned(m: DOMMatrix): boolean {
  return Math.abs(m.b) < EPSILON && Math.abs(m.c) < EPSILON;
}

/**
 * Measures the host's natural box in viewport coordinates.
 *
 * Returns `null` for a disconnected or zero-sized element — there is nothing to animate.
 * Without `DOMMatrix` (non-browser test environments) it falls back to clearing the inline
 * `transform` around the read, which is exact for the inline-only case.
 */
export function measureLayout(el: HTMLElement): LayoutMeasurement | null {
  if (typeof el.getBoundingClientRect !== 'function') return null;

  const view = el.ownerDocument?.defaultView;
  if (
    !view ||
    typeof (view as Window & { DOMMatrix?: unknown }).DOMMatrix !== 'function' ||
    typeof view.getComputedStyle !== 'function'
  ) {
    return measureWithInlineReset(el);
  }

  let rect: LayoutBox = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return null;

  let x = 0;
  let y = 0;
  for (let node = el.parentElement; node; node = node.parentElement) {
    x += node.scrollLeft;
    y += node.scrollTop;
    if (projecting.has(node)) {
      // Undo ancestors before the element's own transform: that transform is in the element's
      // local pixels, which a scaling ancestor stretches. Innermost first, so each step stays in
      // the frame its own ancestors are still applied in.
      const ancestor = measureOwn(node as HTMLElement, node.getBoundingClientRect(), view);
      if (ancestor?.transform) rect = undoAncestor(rect, ancestor);
    }
  }

  const measured = measureOwn(el, rect, view);
  if (!measured) return null;
  const { box } = measured;
  return {
    box: { left: box.left + x, top: box.top + y, width: box.width, height: box.height },
    transform: measured.transform,
  };
}

/** Layout hosts currently mid-FLIP: their transform is not their descendants' movement. */
const projecting = new WeakSet<Element>();

/** Marks (or unmarks) `el` as a layout host whose in-flight transform descendants must undo. */
export function setLayoutProjecting(el: Element, on: boolean): void {
  if (on) projecting.add(el);
  else projecting.delete(el);
}

/**
 * Re-expresses `box`, painted inside `ancestor`'s transformed frame, as it would be with that
 * ancestor's own transform removed. The inverse of {@link mapPoint} applied to the corner, and of
 * the linear part applied to the size.
 */
function undoAncestor(
  box: LayoutBox,
  ancestor: { box: LayoutBox; transform: LayoutTransform | null },
): LayoutBox {
  const t = ancestor.transform;
  if (!t) return box;

  const inverse = t.matrix.inverse();
  const natural = ancestor.box;
  const [px, py] = [box.left - natural.left - t.originX, box.top - natural.top - t.originY];
  const left = natural.left + t.originX + inverse.a * px + inverse.c * py + inverse.e;
  const top = natural.top + t.originY + inverse.b * px + inverse.d * py + inverse.f;
  return {
    left,
    top,
    width: box.width * Math.abs(inverse.a),
    height: box.height * Math.abs(inverse.d),
  };
}

/** One element's box with only its *own* transform removed, in unscrolled viewport coordinates. */
function measureOwn(el: HTMLElement, rect: LayoutBox, view: Window): LayoutMeasurement | null {
  if (rect.width === 0 || rect.height === 0) return null;

  const own = readOwnTransform(
    el,
    view.getComputedStyle(el),
    (view as Window & { DOMMatrix: typeof DOMMatrix }).DOMMatrix,
  );
  if (own === null || own === 'unsupported') {
    return {
      box: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
      transform: null,
    };
  }

  const m = own.matrix;
  let width: number;
  let height: number;
  if (isAxisAligned(m)) {
    width = rect.width / Math.abs(m.a || 1);
    height = rect.height / Math.abs(m.d || 1);
  } else {
    // A rotated or skewed bounding box no longer encodes the element's size.
    width = el.offsetWidth || rect.width;
    height = el.offsetHeight || rect.height;
  }

  // visualCentre = naturalTopLeft + map(own, centre)  =>  solve for naturalTopLeft.
  const [cx, cy] = mapPoint(own, width / 2, height / 2);
  return {
    box: {
      left: rect.left + rect.width / 2 - cx,
      top: rect.top + rect.height / 2 - cy,
      width,
      height,
    },
    transform: own,
  };
}

function measureWithInlineReset(el: HTMLElement): LayoutMeasurement | null {
  const inline = el.style.transform;
  if (inline) el.style.transform = '';
  const rect = el.getBoundingClientRect();
  if (inline) el.style.transform = inline;
  if (rect.width === 0 || rect.height === 0) return null;
  let x = 0;
  let y = 0;
  for (let node = el.parentElement; node; node = node.parentElement) {
    x += node.scrollLeft;
    y += node.scrollTop;
  }
  return {
    box: { left: rect.left + x, top: rect.top + y, width: rect.width, height: rect.height },
    transform: null,
  };
}

/**
 * Where `natural` is painted under `transform`: the bounding box of its transformed corners.
 * With no transform the box is returned unchanged.
 */
export function projectBox(natural: LayoutBox, transform: LayoutTransform | null): LayoutBox {
  if (!transform) return natural;

  const { width: w, height: h } = natural;
  const corners = [mapPoint(transform, 0, 0), mapPoint(transform, w, 0)];
  corners.push(mapPoint(transform, 0, h), mapPoint(transform, w, h));

  const xs = corners.map((c) => c[0]);
  const ys = corners.map((c) => c[1]);
  const left = Math.min(...xs);
  const top = Math.min(...ys);
  return {
    left: natural.left + left,
    top: natural.top + top,
    width: Math.max(...xs) - left,
    height: Math.max(...ys) - top,
  };
}
