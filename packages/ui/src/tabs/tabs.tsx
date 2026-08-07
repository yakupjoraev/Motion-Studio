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

/** One `layoutId` span slides between tabs — § Timing calls the indicator a layout animation. */
export const Tabs = forwardRef<HTMLDivElement, TabsProps>(function Tabs(
  { value, defaultValue, onValueChange, items, className, ...aria },
  ref,
) {
  // Radix keeps the uncontrolled selection in a context this component does not subscribe to, so the
  // underline needs its own copy or it never leaves the tab it started on.
  const [uncontrolled, setUncontrolled] = useState(defaultValue)
  const active = value ?? uncontrolled

  const handleValueChange = (next: string): void => {
    setUncontrolled(next)
    onValueChange?.(next)
  }

  // `exactOptionalPropertyTypes`: an explicit `undefined` makes Radix treat the control as uncontrolled.
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
