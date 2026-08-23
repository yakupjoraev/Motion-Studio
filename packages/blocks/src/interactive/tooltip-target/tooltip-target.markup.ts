import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { ICON_SIZE, controlStyles } from '../interactive.styles'

import { tooltipBubbleStyles, tooltipRootStyles } from './tooltip-target.styles'
import type { TooltipTargetProps } from './tooltip-target.types'

/**
 * The bubble is always in the document and always the description target, closed. A tooltip that only
 * existed on hover would be a description a screen-reader user never gets — ADR-202.
 */
export const tooltipTargetMarkup = defineMarkup<TooltipTargetProps>(
  ({ props: { label, icon, variant, size, content, side, hidden }, id }) => {
    const bubbleId = `${id}-tooltip`

    return el('span', {
      classNames: [tooltipRootStyles({ hidden })],
      children: [
        el('button', {
          classNames: [controlStyles({ variant, size })],
          attributes: { 'aria-describedby': literal(bubbleId), type: literal('button') },
          children: children(iconMarkup({ name: icon, size: ICON_SIZE[size] }), txt(label)),
        }),
        el('span', {
          classNames: [tooltipBubbleStyles({ side, open: false })],
          attributes: {
            'data-state': literal('closed'),
            id: literal(bubbleId),
            role: literal('tooltip'),
          },
          children: [txt(content)],
        }),
      ],
    })
  },
)
