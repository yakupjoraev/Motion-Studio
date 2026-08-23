import { type MarkupElement, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { HEADING_TAGS, type HeadingLevel } from '../../marketing/marketing.schema'
import { iconMarkup } from '../../markup/icon'
import type { PanelItem } from '../interactive.schema'
import { panelContentMarkup } from '../panel-content.markup'

import { accordionValue, multipleOpen, singleOpen } from './accordion.schema'
import type { AccordionLook } from './accordion.schema'
import {
  ACCORDION_CHEVRON,
  ACCORDION_CONTENT,
  ACCORDION_LABEL,
  ACCORDION_TRIGGER,
  accordionItemStyles,
  accordionRootStyles,
} from './accordion.styles'
import type { AccordionProps } from './accordion.types'

const rowMarkup = (
  item: PanelItem,
  index: number,
  open: boolean,
  look: AccordionLook,
  headingLevel: HeadingLevel,
  id: string,
): MarkupElement => {
  const triggerId = `${id}-trigger-${index}`
  const panelId = `${id}-panel-${index}`
  const state = open ? 'open' : 'closed'

  return el('div', {
    classNames: [accordionItemStyles({ look })],
    attributes: { 'data-state': literal(state), 'data-orientation': literal('vertical') },
    children: [
      el(HEADING_TAGS[headingLevel], {
        classNames: ['m-0 font-medium text-md'],
        attributes: {
          'data-orientation': literal('vertical'),
          'data-state': literal(state),
        },
        children: [
          el('button', {
            classNames: [ACCORDION_TRIGGER],
            attributes: {
              type: literal('button'),
              ...(open ? { 'aria-controls': literal(panelId) } : {}),
              'aria-expanded': literal(open),
              'data-state': literal(state),
              'data-orientation': literal('vertical'),
              id: literal(triggerId),
            },
            children: children(
              el('span', {
                classNames: [ACCORDION_LABEL],
                children: children(
                  iconMarkup({ name: item.icon, size: 16 }),
                  el('span', { classNames: ['truncate'], children: [txt(item.label)] }),
                ),
              }),
              iconMarkup({ name: 'chevron-down', size: 16, className: ACCORDION_CHEVRON }),
            ),
          }),
        ],
      }),
      el('div', {
        classNames: [ACCORDION_CONTENT],
        attributes: {
          'data-state': literal(state),
          id: literal(panelId),
          role: literal('region'),
          'aria-labelledby': literal(triggerId),
          'data-orientation': literal('vertical'),
        },
        children: panelContentMarkup(item.body, index),
      }),
    ],
  })
}

export const accordionMarkup = defineMarkup<AccordionProps>(
  ({ props: { items, mode, look, defaultOpen, headingLevel, ariaLabel, hidden }, id }) => {
    const open =
      mode === 'multiple'
        ? new Set(multipleOpen(defaultOpen, items.length))
        : new Set([singleOpen(defaultOpen, items.length)])

    return el('div', {
      classNames: [accordionRootStyles({ look, hidden })],
      attributes: {
        'aria-label': literal(ariaLabel),
        'data-orientation': literal('vertical'),
      },
      children: items.map((item, index) =>
        rowMarkup(item, index, open.has(accordionValue(index)), look, headingLevel, id),
      ),
    })
  },
)
