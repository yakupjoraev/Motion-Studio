import { type MarkupElement, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { panelContentMarkup } from '../../interactive/panel-content.markup'
import { iconMarkup } from '../../markup/icon'

import type { TimelineItem, TimelineMarkerKind, TimelineOrientation } from './timeline.schema'
import { dateText } from './timeline.schema'
import {
  MARKER,
  MARKER_DOT,
  TIMELINE_BODY,
  TIMELINE_DATE,
  TIMELINE_TITLE,
  contentStyles,
  markerRailStyles,
  railStyles,
  timelineFrameStyles,
  timelineItemStyles,
  timelineListStyles,
} from './timeline.styles'
import type { TimelineProps } from './timeline.types'

/** The marker and the rail after it. Both are furniture: the step is named by its title. */
const markerMarkup = (
  kind: TimelineMarkerKind,
  icon: string,
  step: number,
  orientation: TimelineOrientation,
  last: boolean,
): MarkupElement =>
  el('div', {
    classNames: [markerRailStyles({ orientation })],
    children: children(
      el('span', {
        classNames: [MARKER],
        attributes: { 'aria-hidden': literal('true') },
        children: children(
          kind === 'dot' && el('span', { classNames: [MARKER_DOT] }),
          kind === 'number' && txt(String(step)),
          kind === 'icon' ? iconMarkup({ name: icon, size: 14 }) : undefined,
        ),
      }),
      !last &&
        el('span', {
          classNames: [railStyles({ orientation })],
          attributes: { 'aria-hidden': literal('true') },
        }),
    ),
  })

const itemMarkup = (
  item: TimelineItem,
  index: number,
  marker: TimelineMarkerKind,
  orientation: TimelineOrientation,
  last: boolean,
): MarkupElement => {
  const label = dateText(item)

  return el('li', {
    classNames: [timelineItemStyles({ orientation })],
    children: [
      markerMarkup(marker, item.icon, index + 1, orientation, last),
      el('div', {
        classNames: [contentStyles({ orientation })],
        children: children(
          label !== '' &&
            (item.date === ''
              ? el('p', { classNames: [TIMELINE_DATE], children: [txt(label)] })
              : el('time', {
                  classNames: [TIMELINE_DATE],
                  attributes: { dateTime: literal(item.date) },
                  children: [txt(label)],
                })),
          el('p', { classNames: [TIMELINE_TITLE], children: [txt(item.title)] }),
          ...panelContentMarkup(item.body, index, TIMELINE_BODY),
        ),
      }),
    ],
  })
}

export const timelineMarkup = defineMarkup<TimelineProps>(
  ({ props: { items, orientation, marker, regionLabel, hidden } }) => {
    const list = el('ol', {
      classNames: [timelineListStyles({ orientation })],
      children: items.map((item, index) =>
        itemMarkup(item, index, marker, orientation, index === items.length - 1),
      ),
    })

    return orientation === 'vertical'
      ? el('div', {
          classNames: [timelineFrameStyles({ orientation, hidden })],
          children: [list],
        })
      : el('section', {
          classNames: [timelineFrameStyles({ orientation, hidden })],
          attributes: { 'aria-label': literal(regionLabel), tabIndex: literal(0) },
          children: [list],
        })
  },
)
