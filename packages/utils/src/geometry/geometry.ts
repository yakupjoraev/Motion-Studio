/**
 * Space-agnostic on purpose: the same helpers serve marquee selection (screen space) and drop
 * resolution (canvas space). Branding belongs where the space is known, which is `packages/canvas`.
 *
 * A `DOMRect` is assignable to this without conversion, which is what lets the rect cache in
 * `CANVAS.md` § Rect intersection store `getBoundingClientRect` results directly. See ADR-011.
 */
export interface Rect {
  readonly x: number
  readonly y: number
  readonly width: number
  readonly height: number
}

export interface Point {
  readonly x: number
  readonly y: number
}

/**
 * Overlap of the open interiors. Touching edges do not count, so two adjacent siblings do not
 * intersect — which is what the marquee needs, or dragging a band up to a node's left edge would
 * already select it.
 *
 * A consequence worth knowing: a zero-size rect behaves as a point. Strictly inside intersects, on
 * the boundary does not.
 */
export function intersects(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height
}

/** True when `inner` lies wholly within `outer`. A rect contains itself. */
export function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  )
}

/** The smallest rect covering both. */
export function union(a: Rect, b: Rect): Rect {
  const x = Math.min(a.x, b.x)
  const y = Math.min(a.y, b.y)

  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  }
}

export function center(rect: Rect): Point {
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 }
}

/**
 * Grows the rect by `amount` on every side, so the width and height each gain twice it. A negative
 * amount shrinks; the result is not clamped, because a selection outline inset past its own size is
 * a caller bug worth seeing rather than silently flattening to zero.
 */
export function expand(rect: Rect, amount: number): Rect {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2,
  }
}
