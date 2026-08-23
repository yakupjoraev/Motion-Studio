import { ChevronDownIcon } from '@motion-studio/icons'
import * as Accordion from '@radix-ui/react-accordion'

import type { HeadingLevel } from '../marketing.schema'

import type { FaqItem } from './faq-accordion.schema'
import { FAQ_ANSWER, FAQ_CHEVRON, FAQ_CONTENT, FAQ_ITEM, FAQ_TRIGGER } from './faq-accordion.styles'

export interface FaqRowProps {
  readonly item: FaqItem
  readonly value: string
  readonly headingLevel: HeadingLevel
}

/**
 * One question and its answer.
 *
 * `Accordion.Header` renders an `<h3>` by default, and the level has to follow the section's own — a FAQ
 * under an `h3` header would otherwise skip to `h3` again. `asChild` lets the heading be the element the
 * document asked for while Radix keeps the button inside it, which is the structure a screen reader reads
 * as "heading, button, collapsed".
 */
export function FaqRow({ item, value, headingLevel }: FaqRowProps) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3' | 'h4' | 'h5' | 'h6'

  return (
    <Accordion.Item className={FAQ_ITEM} data-testid="faq-item" value={value}>
      <Accordion.Header asChild>
        <Heading className="m-0">
          <Accordion.Trigger className={FAQ_TRIGGER} data-testid="faq-trigger">
            {item.question}
            <ChevronDownIcon aria-hidden="true" className={FAQ_CHEVRON} size={16} />
          </Accordion.Trigger>
        </Heading>
      </Accordion.Header>

      <Accordion.Content className={FAQ_CONTENT} data-testid="faq-content" forceMount>
        <p className={FAQ_ANSWER}>{item.answer}</p>
      </Accordion.Content>
    </Accordion.Item>
  )
}
