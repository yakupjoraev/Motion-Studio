import type { ReactNode } from 'react'

import { TimelineMarker } from './timeline-marker'
import {
  type TimelineItem as Item,
  type TimelineMarkerKind,
  type TimelineOrientation,
  dateText,
} from './timeline.schema'
import {
  TIMELINE_BODY,
  TIMELINE_DATE,
  TIMELINE_TITLE,
  contentStyles,
  timelineItemStyles,
} from './timeline.styles'

export interface TimelineItemProps {
  readonly item: Item
  readonly step: number
  readonly marker: TimelineMarkerKind
  readonly orientation: TimelineOrientation
  readonly last: boolean
  /** The block dropped into this step, if the host supplied one — ADR-206. */
  readonly child: ReactNode
}

/**
 * One step: a marker on the rail, a date, a title, and either the block dropped into it or the step's own text.
 *
 * The `<time>` element carries the machine-readable value and the visible label separately, which is the whole
 * point of the element: "March" is what the reader sees and `2026-03` is what a parser gets. A step with no
 * date renders no `<time>` at all rather than an empty one.
 */
export function TimelineItem({ item, step, marker, orientation, last, child }: TimelineItemProps) {
  const label = dateText(item)

  return (
    <li className={timelineItemStyles({ orientation })} data-testid="timeline-item">
      <TimelineMarker
        icon={item.icon}
        kind={marker}
        last={last}
        orientation={orientation}
        step={step}
      />

      <div className={contentStyles({ orientation })}>
        {label !== '' &&
          (item.date === '' ? (
            <p className={TIMELINE_DATE}>{label}</p>
          ) : (
            <time className={TIMELINE_DATE} dateTime={item.date}>
              {label}
            </time>
          ))}

        <p className={TIMELINE_TITLE}>{item.title}</p>

        {child ?? (item.body === '' ? null : <p className={TIMELINE_BODY}>{item.body}</p>)}
      </div>
    </li>
  )
}
