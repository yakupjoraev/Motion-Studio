'use client'

import * as RadixAccordion from '@radix-ui/react-accordion'

import { panelChildren } from '../panel-content'

import { AccordionRow } from './accordion-row'
import { accordionValue, multipleOpen, singleOpen } from './accordion.schema'
import { accordionRootStyles } from './accordion.styles'
import type { AccordionProps } from './accordion.types'

/**
 * A generic disclosure list on Radix Accordion, and generic is what separates it from `faq-accordion`: that
 * one is a question and an answer with `FAQPage` structured data behind it, this one takes **blocks** in its
 * panels and a label per row.
 *
 * Radix owns the keyboard and the ARIA: `Space` or `Enter` to toggle, arrows between the triggers, `Home` and
 * `End`, and `aria-expanded` and `aria-controls` wired in both directions.
 *
 * The open state lives in Radix — uncontrolled — so editing a label in the inspector cannot close a panel the
 * reader opened.
 */
export function Accordion({
  items,
  mode,
  look,
  defaultOpen,
  headingLevel,
  ariaLabel,
  hidden,
  children,
}: AccordionProps) {
  const panels = panelChildren(children)
  const rows = items.map((item, index) => (
    <AccordionRow
      child={panels[index]}
      headingLevel={headingLevel}
      item={item}
      key={`${item.label}-${index}`}
      look={look}
      value={accordionValue(index)}
    />
  ))

  const shared = {
    'aria-label': ariaLabel,
    className: accordionRootStyles({ look, hidden }),
    'data-testid': 'accordion',
  }

  // Two roots rather than one with a widened prop, for the reason `faq-accordion` gives: Radix types `type`
  // as a discriminant, and `defaultValue` is a string for one mode and an array for the other.
  if (mode === 'multiple') {
    return (
      <RadixAccordion.Root
        {...shared}
        defaultValue={[...multipleOpen(defaultOpen, items.length)]}
        type="multiple"
      >
        {rows}
      </RadixAccordion.Root>
    )
  }

  const initial = singleOpen(defaultOpen, items.length)

  return (
    <RadixAccordion.Root
      {...shared}
      // A single-mode accordion with no way to close the open panel is a panel the reader is stuck in.
      collapsible
      type="single"
      {...(initial === undefined ? {} : { defaultValue: initial })}
    >
      {rows}
    </RadixAccordion.Root>
  )
}
