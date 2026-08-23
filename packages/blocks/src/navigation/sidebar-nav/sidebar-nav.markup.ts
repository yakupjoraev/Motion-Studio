import { defineMarkup, el, literal } from '@motion-studio/schema'

import { sidebarGroupMarkup } from './sidebar-group.markup'
import { sidebarNavStyles } from './sidebar-nav.styles'
import type { SidebarNavProps } from './sidebar-nav.types'

export const sidebarNavMarkup = defineMarkup<SidebarNavProps>(
  ({ props: { groups, collapsed, headingLevel, activeHref, ariaLabel, hidden }, id }) =>
    el('nav', {
      classNames: [sidebarNavStyles({ collapsed, hidden })],
      attributes: {
        'aria-label': literal(ariaLabel),
        'data-collapsed': literal(collapsed),
      },
      children: groups.map((group, index) =>
        sidebarGroupMarkup({
          activeHref,
          collapsed,
          group,
          headingLevel,
          id: `${id}-group-${index}`,
        }),
      ),
    }),
)
