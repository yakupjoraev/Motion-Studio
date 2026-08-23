import { ChevronDownIcon } from '@motion-studio/icons'
import * as RadixAccordion from '@radix-ui/react-accordion'
import type { ReactNode } from 'react'

import type { HeadingLevel } from '../../marketing/marketing.schema'
import { HEADING_TAGS } from '../../marketing/marketing.schema'
import { ControlIcon } from '../control-icon'
import type { PanelItem } from '../interactive.schema'
import { PanelContent } from '../panel-content'

import type { AccordionLook } from './accordion.schema'
import {
  ACCORDION_CHEVRON,
  ACCORDION_CONTENT,
  ACCORDION_LABEL,
  ACCORDION_TRIGGER,
  accordionItemStyles,
} from './accordion.styles'

export interface AccordionRowProps {
  readonly item: PanelItem
  readonly value: string
  readonly look: AccordionLook
  readonly headingLevel: HeadingLevel
  /** The block dropped into this panel, if the host supplied one. */
  readonly child: ReactNode
}

/**
 * One disclosure.
 *
 * `Accordion.Header` renders an `<h3>` by default and the level has to follow the page around it, so the tag
 * comes from the prop through `HEADING_TAGS` rather than from string concatenation at render time. `asChild`
 * lets the heading be the element the document asked for while Radix keeps the button inside it — the
 * structure a screen reader reads as "heading, button, collapsed".
 */
export function AccordionRow({ item, value, look, headingLevel, child }: AccordionRowProps) {
  const Heading = HEADING_TAGS[headingLevel]

  return (
    <RadixAccordion.Item
      className={accordionItemStyles({ look })}
      data-testid="accordion-item"
      value={value}
    >
      <RadixAccordion.Header asChild>
        <Heading className="m-0 font-medium text-md">
          <RadixAccordion.Trigger className={ACCORDION_TRIGGER} data-testid="accordion-trigger">
            <span className={ACCORDION_LABEL}>
              <ControlIcon name={item.icon} size={16} />
              <span className="truncate">{item.label}</span>
            </span>
            <ChevronDownIcon aria-hidden="true" className={ACCORDION_CHEVRON} size={16} />
          </RadixAccordion.Trigger>
        </Heading>
      </RadixAccordion.Header>

      <RadixAccordion.Content
        className={ACCORDION_CONTENT}
        data-testid="accordion-content"
        forceMount
      >
        <PanelContent body={item.body} child={child} />
      </RadixAccordion.Content>
    </RadixAccordion.Item>
  )
}
