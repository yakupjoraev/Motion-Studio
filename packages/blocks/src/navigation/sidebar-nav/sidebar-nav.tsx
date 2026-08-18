import { SidebarGroup } from './sidebar-group'
import { sidebarNavStyles } from './sidebar-nav.styles'
import type { SidebarNavProps } from './sidebar-nav.types'

/**
 * A vertical navigation column: labelled groups, one level of links, and a 64 px rail mode.
 *
 * The active item is `aria-current="page"` plus a weight change and a rule down its left edge. Colour is
 * never the carrier — ACCESSIBILITY.md § Non-negotiables 4 — and `NavLink` is where that is decided for
 * the whole category.
 */
export function SidebarNav({
  groups,
  collapsed,
  headingLevel,
  activeHref,
  ariaLabel,
  hidden,
}: SidebarNavProps) {
  return (
    <nav
      aria-label={ariaLabel}
      className={sidebarNavStyles({ collapsed, hidden })}
      data-collapsed={collapsed}
      data-testid="sidebar-nav"
    >
      {groups.map((group, index) => (
        <SidebarGroup
          activeHref={activeHref}
          collapsed={collapsed}
          group={group}
          headingLevel={headingLevel}
          key={`${group.title}-${index}`}
        />
      ))}
    </nav>
  )
}
