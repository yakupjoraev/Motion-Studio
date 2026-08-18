import { ChevronDownIcon } from '@motion-studio/icons'
import * as Collapsible from '@radix-ui/react-collapsible'
import { type ReactNode, useId } from 'react'

import type { HeadingLevel } from '../../marketing/marketing.schema'
import { SectionHeading } from '../../marketing/section-heading'
import { NavIcon } from '../nav-icon'
import { NavLink } from '../nav-link'
import { NAV_GROUP_HEADING } from '../navigation.styles'

import type { SidebarGroup as SidebarGroupShape } from './sidebar-nav.schema'
import {
  SIDEBAR_CHEVRON,
  SIDEBAR_GROUP,
  SIDEBAR_HEADING,
  SIDEBAR_LIST,
  SIDEBAR_TOOLTIP,
  SIDEBAR_TRIGGER,
  sidebarLinkStyles,
} from './sidebar-nav.styles'

export interface SidebarGroupProps {
  readonly group: SidebarGroupShape
  readonly collapsed: boolean
  readonly activeHref: string
  readonly headingLevel: HeadingLevel
}

/**
 * One labelled group of links.
 *
 * `role="group"` with `aria-labelledby` pointing at the real heading, so the column has a structure a
 * screen reader can navigate by heading *and* by group. The id comes from `useId`, because two sidebars
 * on one page would otherwise both claim `sidebar-group-0`.
 *
 * In rail mode the group is never collapsible: 64 px has nowhere to put a disclosure, and hiding links
 * behind one in a column that is already glyphs-only leaves the reader with nothing to read.
 */
export function SidebarGroup({ group, collapsed, activeHref, headingLevel }: SidebarGroupProps) {
  const headingId = useId()

  const list: ReactNode = (
    <ul className={SIDEBAR_LIST}>
      {group.items.map((item, index) => (
        <li key={`${item.label}-${index}`}>
          <NavLink
            activeHref={activeHref}
            className={sidebarLinkStyles({ collapsed })}
            href={item.href}
            variant="rail"
          >
            <NavIcon name={item.icon} />
            <span className={collapsed ? 'sr-only' : undefined}>{item.label}</span>
            {collapsed && (
              <span aria-hidden="true" className={SIDEBAR_TOOLTIP}>
                {item.label}
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  )

  if (collapsed || !group.collapsible) {
    return (
      <div
        aria-labelledby={headingId}
        className={SIDEBAR_GROUP}
        data-testid="sidebar-group"
        // biome-ignore lint/a11y/useSemanticElements: the semantic element would be <fieldset>, which is form markup — a group of links inside a nav is not a set of form controls
        role="group"
      >
        <SectionHeading
          className={collapsed ? 'sr-only' : SIDEBAR_HEADING}
          id={headingId}
          level={headingLevel}
        >
          {group.title}
        </SectionHeading>
        {list}
      </div>
    )
  }

  return (
    <Collapsible.Root asChild defaultOpen>
      <div
        aria-labelledby={headingId}
        className={SIDEBAR_GROUP}
        data-testid="sidebar-group"
        // biome-ignore lint/a11y/useSemanticElements: the semantic element would be <fieldset>, which is form markup — a group of links inside a nav is not a set of form controls
        role="group"
      >
        <SectionHeading className="m-0" id={headingId} level={headingLevel}>
          <Collapsible.Trigger className={SIDEBAR_TRIGGER} data-testid="sidebar-trigger">
            <span className={NAV_GROUP_HEADING}>{group.title}</span>
            <ChevronDownIcon aria-hidden="true" className={SIDEBAR_CHEVRON} size={14} />
          </Collapsible.Trigger>
        </SectionHeading>

        <Collapsible.Content data-testid="sidebar-content">{list}</Collapsible.Content>
      </div>
    </Collapsible.Root>
  )
}
