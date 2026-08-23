import { children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'

import { BADGE_DOT, BADGE_ICON_PX, badgeIconStyles, badgeStyles } from './badge.styles'
import type { BadgeProps } from './badge.types'

export const badgeMarkup = defineMarkup<BadgeProps>(
  ({ props: { label, variant, size, dot, icon, hidden } }) =>
    el('span', {
      classNames: [badgeStyles({ variant, size, hidden })],
      children: children(
        dot &&
          el('span', { classNames: [BADGE_DOT], attributes: { 'aria-hidden': literal(true) } }),
        iconMarkup({ name: icon, size: BADGE_ICON_PX[size], className: badgeIconStyles({ size }) }),
        txt(label),
      ),
    }),
)
