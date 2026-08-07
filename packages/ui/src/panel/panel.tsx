import { cn } from '@motion-studio/utils'
import { type ReactElement, forwardRef } from 'react'

import { Collapsible } from '../collapsible/index'

import {
  panelHeaderStyles,
  panelSectionContentStyles,
  panelSectionStyles,
  panelStyles,
} from './panel.styles'

import type { PanelHeaderProps, PanelProps, PanelSectionProps } from './panel.types'

/**
 * The left and right panel frames of § Layout. A column that clips its own overflow, with one hairline on the
 * edge facing the canvas — the panel's job is to be a surface, and everything with an opinion goes inside it.
 */
export const Panel = forwardRef<HTMLDivElement, PanelProps>(function Panel(
  { side = 'left', children, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn(panelStyles({ side }), className)} {...rest}>
      {children}
    </div>
  )
})

/**
 * The panel's title row. Not sticky: it is outside the scrolling region, which is what keeps it visible
 * without competing with the section headers, which are sticky and do scroll.
 */
export const PanelHeader = forwardRef<HTMLDivElement, PanelHeaderProps>(function PanelHeader(
  { title, action, className, ...rest },
  ref,
) {
  return (
    <div ref={ref} className={cn(panelHeaderStyles(), className)} {...rest}>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {action}
    </div>
  )
})

/**
 * A collapsible section of an inspector — § Section headers. `Collapsible` supplies the header, the chevron,
 * the height animation and the ARIA; this adds the separator between sections and the body padding, so a
 * caller drops control rows in without measuring anything.
 *
 * Collapse state stays the caller's. § Section headers wants it persisted per section, and `ui` writing to
 * `localStorage` would mean two panels on one page fighting over the same key.
 */
export function PanelSection({
  title,
  children,
  action,
  open,
  defaultOpen,
  onOpenChange,
  className,
}: PanelSectionProps): ReactElement {
  // `exactOptionalPropertyTypes`: omit an absent prop rather than passing `undefined`.
  const stateProps = {
    ...(open === undefined ? {} : { open }),
    ...(defaultOpen === undefined ? {} : { defaultOpen }),
    ...(onOpenChange === undefined ? {} : { onOpenChange }),
    ...(action === undefined ? {} : { action }),
  }

  return (
    <Collapsible trigger={title} className={cn(panelSectionStyles(), className)} {...stateProps}>
      {/*
       * The padding goes on an inner element, never on the collapsing one. Height animates; padding does
       * not — a padded box at `height: 0` is still 16 px tall, and the section would never close.
       */}
      <div className={panelSectionContentStyles()}>{children}</div>
    </Collapsible>
  )
}
