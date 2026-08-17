'use client'

import * as Accordion from '@radix-ui/react-accordion'

import { MarketingSection } from '../marketing-section'
import { nextHeadingLevel } from '../marketing.schema'

import { faqItemValue, faqMultipleDefault, faqSingleDefault } from './faq-accordion.schema'
import { FAQ_ROOT } from './faq-accordion.styles'
import type { FaqAccordionProps } from './faq-accordion.types'
import { FaqRow } from './faq-row'

/**
 * Questions and answers on a Radix Accordion.
 *
 * Radix owns the keyboard and the ARIA: Tab between triggers, Space or Enter to toggle, arrow keys to move
 * between them, `aria-expanded` and `aria-controls` wired both ways. Reimplementing that is the mistake
 * every hand-rolled accordion makes, and it is why TECH_STACK.md § Radix UI names this primitive.
 *
 * **The JSON-LD is not here.** Prompt 38 requires `FAQPage` structured data to be generated in codegen,
 * and the codegen descriptor says so (ADR-185): a `<script type="application/ld+json">` inside an artboard
 * would be markup the user can neither see nor select, and it would travel into a screenshot of their page.
 */
export function FaqAccordion({
  eyebrow,
  heading,
  description,
  headingLevel,
  headingAlign,
  mode,
  defaultOpen,
  items,
  hidden,
}: FaqAccordionProps) {
  const copy = { eyebrow, heading, description, headingLevel, headingAlign }
  const rows = items.map((item, index) => (
    <FaqRow
      headingLevel={nextHeadingLevel(headingLevel)}
      item={item}
      key={`${item.question}-${index}`}
      value={faqItemValue(index)}
    />
  ))

  // Two roots rather than one with a widened prop: Radix types `type` as a discriminant, and `defaultValue`
  // is a string for one and an array for the other. Collapsing them would need a cast the contract forbids.
  return (
    <MarketingSection copy={copy} hidden={hidden} testId="faq-accordion">
      {mode === 'multiple' ? (
        <Accordion.Root
          className={FAQ_ROOT}
          data-testid="faq-root"
          defaultValue={faqMultipleDefault(defaultOpen, items.length)}
          type="multiple"
        >
          {rows}
        </Accordion.Root>
      ) : (
        <Accordion.Root
          className={FAQ_ROOT}
          // A single-mode accordion with no way to close the open panel is a panel the reader is stuck in.
          collapsible
          data-testid="faq-root"
          defaultValue={faqSingleDefault(defaultOpen, items.length)}
          type="single"
        >
          {rows}
        </Accordion.Root>
      )}
    </MarketingSection>
  )
}
