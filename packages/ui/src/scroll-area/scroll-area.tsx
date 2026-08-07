import { cn } from '@motion-studio/utils'
import * as RadixScrollArea from '@radix-ui/react-scroll-area'
import { forwardRef } from 'react'

import {
  scrollAreaRootStyles,
  scrollAreaScrollbarStyles,
  scrollAreaThumbStyles,
  scrollAreaViewportStyles,
} from './scroll-area.styles'

import type { ScrollAreaProps } from './scroll-area.types'

/**
 * Overlay rather than native: a native bar takes a column out of the panel when the content overflows, and
 * § Layout fixes the panel widths. A hidden bar still scrolls by wheel, key and touch.
 */
export const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
  { children, orientation = 'both', scrollbars = 'hover', className, viewportClassName, ...rest },
  ref,
) {
  const showsVertical = orientation !== 'horizontal'
  const showsHorizontal = orientation !== 'vertical'

  return (
    <RadixScrollArea.Root
      ref={ref}
      type={scrollbars === 'always' ? 'always' : 'hover'}
      className={cn(scrollAreaRootStyles(), className)}
      {...rest}
    >
      <RadixScrollArea.Viewport className={cn(scrollAreaViewportStyles(), viewportClassName)}>
        {children}
      </RadixScrollArea.Viewport>

      {showsVertical ? (
        <RadixScrollArea.Scrollbar
          orientation="vertical"
          className={scrollAreaScrollbarStyles({ orientation: 'vertical', scrollbars })}
        >
          <RadixScrollArea.Thumb className={scrollAreaThumbStyles()} />
        </RadixScrollArea.Scrollbar>
      ) : null}

      {showsHorizontal ? (
        <RadixScrollArea.Scrollbar
          orientation="horizontal"
          className={scrollAreaScrollbarStyles({ orientation: 'horizontal', scrollbars })}
        >
          <RadixScrollArea.Thumb className={scrollAreaThumbStyles()} />
        </RadixScrollArea.Scrollbar>
      ) : null}

      <RadixScrollArea.Corner />
    </RadixScrollArea.Root>
  )
})
