import { panelChildren } from '../../interactive/panel-content'

import { TimelineItem } from './timeline-item'
import { timelineFrameStyles, timelineListStyles } from './timeline.styles'
import type { TimelineProps } from './timeline.types'

/**
 * A sequence of steps, vertical or horizontal.
 *
 * An `<ol>` because the order is the meaning — a screen reader says "list, 4 items" and gives each step its
 * position, which is why the numbered marker is `aria-hidden`: the position is already in the structure.
 *
 * Horizontal mode is a scroll-snap strip inside a labelled region with `tabindex="0"`, so a keyboard reader can
 * reach it and move through it with the arrow keys. Vertical mode adds no tab stop at all, because it scrolls
 * with the page.
 *
 * Children fill the steps positionally and each step falls back to its own text — ADR-206, because a thumbnail
 * render passes no children.
 */
export function Timeline({
  items,
  orientation,
  marker,
  regionLabel,
  hidden,
  children,
}: TimelineProps) {
  const panels = panelChildren(children)

  const list = (
    <ol className={timelineListStyles({ orientation })} data-testid="timeline-list">
      {items.map((item, index) => (
        <TimelineItem
          child={panels[index]}
          item={item}
          key={`${item.title}-${index}`}
          last={index === items.length - 1}
          marker={marker}
          orientation={orientation}
          step={index + 1}
        />
      ))}
    </ol>
  )

  if (orientation === 'vertical') {
    return (
      <div className={timelineFrameStyles({ orientation, hidden })} data-testid="timeline">
        {list}
      </div>
    )
  }

  return (
    /*
     * `tabIndex` on the region is deliberate and is not a keyboard trap, for the reason the table's scroller
     * gives: a box that scrolls but cannot take focus cannot be scrolled without a pointer.
     */
    <section
      aria-label={regionLabel}
      className={timelineFrameStyles({ orientation, hidden })}
      data-testid="timeline"
      // biome-ignore lint/a11y/noNoninteractiveTabindex: a scrollable region has to be focusable, or it cannot be scrolled without a pointer
      tabIndex={0}
    >
      {list}
    </section>
  )
}
