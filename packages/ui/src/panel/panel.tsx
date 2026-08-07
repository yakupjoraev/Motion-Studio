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

/** § Layout's left and right frames. A surface and nothing else; everything with an opinion goes inside. */
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

/** Not sticky: it sits outside the scrolling region, so it cannot compete with the section headers. */
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

/** `Collapsible` plus the separator and the body padding. Collapse state stays the caller's. */
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
      {/* Padding on an inner element: a padded box at `height: 0` is still 16 px tall. */}
      <div className={panelSectionContentStyles()}>{children}</div>
    </Collapsible>
  )
}
