import type { CSSProperties, RefObject } from 'react'

/**
 * What every sandbox target is handed.
 *
 * `initialStyle` is the sandbox's starting value as an inline style, so the **server** paints it. The
 * apply loop writes through the ref, which is a client-only act: without this the largest thing on the
 * page — a 640 × 400 gradient — appeared only after hydration, and Lighthouse measured a 3.6 s largest
 * contentful paint for a page that was otherwise done at 1.2 s.
 *
 * `applied` is the value that last validated. Only the mask sandbox reads it, and for a reason the
 * others do not have: its second panel paints the mask itself, and `mask-image` and `background-image`
 * take the same value.
 *
 * `value` and `onValueChange` are the editor's own text. Two sandboxes are more than a preview —
 * `clip-path` has draggable vertices and `transition` has a draggable curve — and both write back.
 */
export interface TargetProps {
  /** `useApplyCss` writes the property on this element and on no other. */
  readonly targetRef: RefObject<HTMLDivElement | null>
  readonly applied: string
  readonly initialStyle: CSSProperties
  readonly value: string
  onValueChange: (next: string) => void
}
