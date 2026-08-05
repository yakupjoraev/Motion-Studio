import type { ReactElement, ReactNode } from 'react'

import type { IconComponent, IconProps } from './icon.types'

/**
 * The one place the icon contract lives — `DESIGN_SYSTEM.md` § Iconography: a 20 × 20 grid, 1.5 px stroke,
 * `currentColor`, round caps and joins, no fill.
 *
 * The geometry and the stroke contract are applied **after** the caller's props, so an icon cannot be
 * turned into a 24 × 18 filled shape by accident. Everything else — `className`, `onClick`, `data-*`,
 * `style` — passes straight through.
 *
 * Accessibility follows the prompt's rule: an icon is decorative and its container carries the accessible
 * name, so `aria-hidden="true"` is the default. A caller that does need a labelled icon passes
 * `aria-label` (or `aria-labelledby`), and that removes `aria-hidden` and adds `role="img"` here rather
 * than at 89 call sites.
 */
export function createIcon(name: string, children: ReactNode): IconComponent {
  function Icon({ size = 16, strokeWidth = 1.5, ...rest }: IconProps): ReactElement {
    const labelled = rest['aria-label'] !== undefined || rest['aria-labelledby'] !== undefined

    return (
      <svg
        {...rest}
        width={size}
        height={size}
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        role={labelled ? 'img' : undefined}
        aria-hidden={labelled ? undefined : true}
        focusable="false"
      >
        {children}
      </svg>
    )
  }

  Icon.displayName = name

  return Icon
}
