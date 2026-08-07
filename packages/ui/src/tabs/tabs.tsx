import { cn } from '@motion-studio/utils'
import * as RadixTabs from '@radix-ui/react-tabs'
import { motion } from 'motion/react'
import { forwardRef, useState } from 'react'

import {
  tabsContentStyles,
  tabsIndicatorStyles,
  tabsListStyles,
  tabsRootStyles,
  tabsTriggerStyles,
} from './tabs.styles'

import type { TabsProps } from './tabs.types'

/**
 * Radix Tabs with the panel tab strip's styling. Radix owns `role="tablist"`, the roving tabindex
 * § Focus and keyboard requires, and the arrow-key navigation; this file owns the strip, the underline and
 * the timing.
 *
 * The underline is one `motion.span` with a `layoutId`, so it slides between tabs instead of one border
 * fading out while another fades in — § Timing calls the tab indicator a layout animation at 200 ms
 * `standard`, and the two are not the same thing to look at.
 */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { value, defaultValue, onValueChange, items, className, ...aria },
  ref,
) {
  /*
   * A copy of the selection, for the same reason `Segmented` keeps one: the underline is rendered from a
   * value this component holds, and Radix keeps the uncontrolled selection in a context this component does
   * not subscribe to. Without the copy the underline never leaves the tab it started on.
   */
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const active = value ?? uncontrolled

  const handleValueChange = (next: string): void => {
    setUncontrolled(next)
    onValueChange?.(next)
  }

  // `exactOptionalPropertyTypes`: an absent prop is omitted, never passed as `undefined`.
  const rootProps = {
    ...(value === undefined ? {} : { value }),
    ...(defaultValue === undefined ? {} : { defaultValue }),
  }

  return (
    <RadixTabs.Root
      ref={ref}
      orientation="horizontal"
      className={cn(tabsRootStyles(), className)}
      onValueChange={handleValueChange}
      {...rootProps}
    >
      <RadixTabs.List className={tabsListStyles()} {...aria}>
        {items.map((item) => (
          <RadixTabs.Trigger
            key={item.value}
            value={item.value}
            {...(item.disabled === undefined ? {} : { disabled: item.disabled })}
            className={tabsTriggerStyles({ active: item.value === active })}
          >
            {item.icon}
            {item.label}
            {item.value === active ? (
              <motion.span
                layoutId="ms-tabs-indicator"
                className={tabsIndicatorStyles()}
                transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              />
            ) : null}
          </RadixTabs.Trigger>
        ))}
      </RadixTabs.List>

      {items.map((item) =>
        item.content === undefined ? null : (
          <RadixTabs.Content key={item.value} value={item.value} className={tabsContentStyles()}>
            {item.content}
          </RadixTabs.Content>
        ),
      )}
    </RadixTabs.Root>
  )
})
