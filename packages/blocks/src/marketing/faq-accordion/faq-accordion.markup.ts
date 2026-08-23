import { type MarkupElement, children, defineMarkup, el, literal, txt } from '@motion-studio/schema'

import { iconMarkup } from '../../markup/icon'
import { marketingSectionMarkup } from '../marketing-section.markup'
import { HEADING_TAGS, type HeadingLevel, nextHeadingLevel } from '../marketing.schema'

import type { FaqItem } from './faq-accordion.schema'
import { faqSingleDefault } from './faq-accordion.schema'
import {
  FAQ_ANSWER,
  FAQ_CHEVRON,
  FAQ_CONTENT,
  FAQ_ITEM,
  FAQ_ROOT,
  FAQ_TRIGGER,
} from './faq-accordion.styles'
import type { FaqAccordionProps } from './faq-accordion.types'

/**
 * A disclosure row, with the state Radix would have written on the first frame: the panel is mounted
 * whichever way it starts (`forceMount`, so the exported page contains every answer), and `data-state`
 * says which one is open. What toggles it is behaviour — the React target keeps Radix, and the HTML
 * target drives the same attributes from its own script.
 */
const rowMarkup = (
  item: FaqItem,
  index: number,
  open: boolean,
  headingLevel: HeadingLevel,
  id: string,
): MarkupElement => {
  const triggerId = `${id}-trigger-${index}`
  const panelId = `${id}-panel-${index}`
  const state = open ? 'open' : 'closed'

  return el('div', {
    classNames: [FAQ_ITEM],
    attributes: { 'data-state': literal(state), 'data-orientation': literal('vertical') },
    children: [
      el(HEADING_TAGS[headingLevel], {
        classNames: ['m-0'],
        attributes: {
          'data-orientation': literal('vertical'),
          'data-state': literal(state),
        },
        children: children(
          el('button', {
            classNames: [FAQ_TRIGGER],
            attributes: {
              type: literal('button'),
              ...(open ? { 'aria-controls': literal(panelId) } : {}),
              'aria-expanded': literal(open),
              'data-state': literal(state),
              'data-orientation': literal('vertical'),
              id: literal(triggerId),
            },
            children: children(
              txt(item.question),
              iconMarkup({ name: 'chevron-down', size: 16, className: FAQ_CHEVRON }),
            ),
          }),
        ),
      }),
      el('div', {
        classNames: [FAQ_CONTENT],
        attributes: {
          'data-state': literal(state),
          id: literal(panelId),
          role: literal('region'),
          'aria-labelledby': literal(triggerId),
          'data-orientation': literal('vertical'),
        },
        children: [el('p', { classNames: [FAQ_ANSWER], children: [txt(item.answer)] })],
      }),
    ],
  })
}

export const faqAccordionMarkup = defineMarkup<FaqAccordionProps>(
  ({
    props: {
      eyebrow,
      heading,
      description,
      headingLevel,
      headingAlign,
      defaultOpen,
      items,
      hidden,
    },
    id,
  }) => {
    const openValue = faqSingleDefault(defaultOpen, items.length)

    return marketingSectionMarkup({
      copy: { eyebrow, heading, description, headingLevel, headingAlign },
      hidden,
      children: [
        el('div', {
          classNames: [FAQ_ROOT],
          attributes: { 'data-orientation': literal('vertical') },
          children: items.map((item, index) =>
            rowMarkup(
              item,
              index,
              openValue === `item-${index}`,
              nextHeadingLevel(headingLevel),
              id,
            ),
          ),
        }),
      ],
    })
  },
)
