import { cva } from 'class-variance-authority'

/** The rows, stacked. `gap-6` between them, which is the gap inside a row too — one rhythm, two axes. */
export const MARQUEE_ROWS = 'flex flex-col gap-6'

/**
 * A row's frame, shared by both marquee blocks: `ms-marquee-row` in `blocks.css` carries the edge mask and
 * the reduced-motion fallback, and `overflow-hidden` is what keeps a track wider than the page from
 * widening the page.
 *
 * Here rather than in either block, for the reason `marketing.schema.ts` gives about shared bounds: a
 * `logo-cloud` reaching into `testimonial-marquee` for a class would pull that block's whole component
 * graph — a testimonial card and all — into a row of logos.
 */
export const marqueeRowStyles = cva('w-full overflow-hidden', {
  variants: {
    fadeEdges: { true: 'ms-marquee-row', false: '' },
  },
})
