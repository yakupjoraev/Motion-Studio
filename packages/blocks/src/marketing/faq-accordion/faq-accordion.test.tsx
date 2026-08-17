import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { FaqAccordion } from './faq-accordion'
import { faqAccordionDefinition as definition } from './faq-accordion.definition'
import { faqMultipleDefault, faqSingleDefault } from './faq-accordion.schema'

describe('faq default value', () => {
  it('names the item that starts open', () => {
    expect(faqSingleDefault(0, 4)).toBe('item-0')
    expect(faqMultipleDefault(2, 4)).toEqual(['item-2'])
  })

  it('opens nothing for an index outside the list', () => {
    expect(faqSingleDefault(-1, 4)).toBe('')
    expect(faqSingleDefault(9, 4)).toBe('')
    expect(faqMultipleDefault(-1, 4)).toEqual([])
  })
})

describe('FaqAccordion', () => {
  it('renders one row per question', () => {
    renderBlock(definition, FaqAccordion)

    expect(screen.getAllByTestId('faq-item')).toHaveLength(definition.defaults.items.length)
  })

  it('puts each question in a heading one level below the section header', () => {
    renderBlock(definition, FaqAccordion, { headingLevel: 2 })

    const questions = screen.getAllByRole('heading', { level: 3 })

    expect(questions).toHaveLength(definition.defaults.items.length)
    expect(questions[0]?.querySelector('button')).not.toBeNull()
  })

  it('opens the panel the document asked for and leaves the rest closed', () => {
    renderBlock(definition, FaqAccordion, { defaultOpen: 0 })

    const triggers = screen.getAllByTestId('faq-trigger')

    expect(triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(triggers[1]).toHaveAttribute('aria-expanded', 'false')
  })

  it('starts everything closed when told to', () => {
    renderBlock(definition, FaqAccordion, { defaultOpen: -1 })

    for (const trigger of screen.getAllByTestId('faq-trigger')) {
      expect(trigger).toHaveAttribute('aria-expanded', 'false')
    }
  })

  it('toggles from the keyboard', async () => {
    const user = userEvent.setup()

    renderBlock(definition, FaqAccordion, { defaultOpen: -1 })

    await user.tab()
    await user.keyboard(' ')

    expect(requireAt(screen.getAllByTestId('faq-trigger'), 0)).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('moves between questions with the arrow keys, which is Radix doing it', async () => {
    const user = userEvent.setup()

    renderBlock(definition, FaqAccordion, { defaultOpen: -1 })

    await user.tab()
    await user.keyboard('{ArrowDown}')

    expect(document.activeElement).toBe(requireAt(screen.getAllByTestId('faq-trigger'), 1))
  })

  it('closes the open panel in single mode rather than trapping the reader', async () => {
    const user = userEvent.setup()

    renderBlock(definition, FaqAccordion, { defaultOpen: 0 })

    await user.click(requireAt(screen.getAllByTestId('faq-trigger'), 0))

    expect(requireAt(screen.getAllByTestId('faq-trigger'), 0)).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('holds two panels open at once in multiple mode', async () => {
    const user = userEvent.setup()

    renderBlock(definition, FaqAccordion, { mode: 'multiple', defaultOpen: 0 })

    await user.click(requireAt(screen.getAllByTestId('faq-trigger'), 1))

    const triggers = screen.getAllByTestId('faq-trigger')

    expect(triggers[0]).toHaveAttribute('aria-expanded', 'true')
    expect(triggers[1]).toHaveAttribute('aria-expanded', 'true')
  })

  it('ties each trigger to its panel both ways', () => {
    renderBlock(definition, FaqAccordion, { defaultOpen: 0 })

    const trigger = requireAt(screen.getAllByTestId('faq-trigger'), 0)
    const panelId = trigger.getAttribute('aria-controls')

    expect(panelId).not.toBeNull()
    expect(document.getElementById(panelId ?? '')?.getAttribute('aria-labelledby')).toBe(trigger.id)
  })

  it('renders no JSON-LD in the canvas, whatever the prop says', () => {
    renderBlock(definition, FaqAccordion, { jsonLd: true })

    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0)
  })

  it('leaves the JSON-LD to the export, and says which prop turns it on', () => {
    expect(definition.codegen.structuredData).toEqual({ type: 'FAQPage', enabledBy: 'jsonLd' })
  })

  it('declares the dependency the export has to install', () => {
    expect(definition.codegen.dependencies).toHaveProperty('@radix-ui/react-accordion')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, FaqAccordion)

    await expectNoViolations(container)
  })
})
