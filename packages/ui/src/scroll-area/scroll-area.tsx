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
 * Radix ScrollArea with overlay scrollbars. Radix owns the measurement and the drag; this file owns the
 * 8 px gutter, the thumb and when the bar shows.
 *
 * Overlay rather than native: a native scrollbar takes a column out of the panel when the content happens to
 * overflow, so a 320 px inspector is 320 px wide until it is not. The chrome's widths are fixed by § Layout
 * and cannot depend on how much the user has in a section.
 *
 * `type="hover"` is Radix's, and it keeps the viewport scrollable by wheel, keyboard and touch even while the
 * bar is invisible — the bar is a report, not the mechanism.
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
