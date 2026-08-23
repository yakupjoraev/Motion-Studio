import {
  MARQUEE_CLASS,
  MARQUEE_CSS,
  MARQUEE_PAUSABLE_CLASS,
  type MarqueeDirection,
  marqueeCssVars,
} from '@motion-studio/motion/marquee'
import { type MarkupChild, type MarkupElement, el, literal, txt } from '@motion-studio/schema'
import { cn } from '@motion-studio/utils'

export interface MarqueeRowMarkupInput {
  readonly direction: MarqueeDirection
  readonly duration: number
  readonly pauseOnHover: boolean
  readonly gapClass?: string
  readonly children: readonly MarkupChild[]
}

/** The preset's keyframes, emitted once per block — the same text `MarqueeStyles` renders. */
export const marqueeStylesMarkup = (): MarkupElement =>
  el('style', { children: [txt(MARQUEE_CSS)] })

/**
 * One scrolling row. The track holds the content twice and travels exactly −50 %, which is what makes
 * the loop seamless — the arithmetic is the preset's, and the export carries it as it stands.
 */
export function marqueeRowMarkup({
  direction,
  duration,
  pauseOnHover,
  gapClass = 'gap-6',
  children,
}: MarqueeRowMarkupInput): MarkupElement {
  const copy = () =>
    el('div', { classNames: [cn('flex min-w-full shrink-0 items-stretch', gapClass)], children })

  return el('div', {
    classNames: [
      cn(MARQUEE_CLASS, pauseOnHover && MARQUEE_PAUSABLE_CLASS, gapClass, 'items-stretch'),
    ],
    attributes: { 'data-direction': literal(direction) },
    cssVars: marqueeCssVars({ duration, direction }),
    children: [
      copy(),
      // The second copy is the first one again, so a reader hears the row once.
      el('div', {
        classNames: ['contents'],
        attributes: { 'aria-hidden': literal('true') },
        children: [copy()],
      }),
    ],
  })
}
