import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { Accordion } from './accordion'
import { accordionDefinition as definition } from './accordion.definition'
import { multipleOpen, singleOpen } from './accordion.schema'

const labels = definition.defaults.items.map((item) => item.label)
const first = requireAt(labels, 0)
const second = requireAt(labels, 1)

const trigger = (name: string): HTMLElement => screen.getByRole('button', { name })

describe('the uncontrolled open state', () => {
  it('names the row at the index and nothing outside the list', () => {
    expect(singleOpen(1, 3)).toBe('panel-1')
    expect(singleOpen(-1, 3)).toBeUndefined()
    expect(singleOpen(7, 3)).toBeUndefined()
  })

  it('wraps the same answer in an array for multiple mode', () => {
    expect(multipleOpen(2, 3)).toEqual(['panel-2'])
    expect(multipleOpen(-1, 3)).toEqual([])
  })
})

describe('Accordion', () => {
  it('is a heading holding a button per row', () => {
    renderBlock(definition, Accordion)

    const headings = screen.getAllByRole('heading', { level: definition.defaults.headingLevel })

    expect(headings).toHaveLength(labels.length)
    expect(headings.every((heading) => heading.querySelector('button') !== null)).toBe(true)
  })

  it('prints the heading level it is given rather than Radix’s default', () => {
    renderBlock(definition, Accordion, { headingLevel: 4 })

    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(labels.length)
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
  })

  it('opens the row it is told to and wires it both ways', () => {
    renderBlock(definition, Accordion)

    const open = trigger(first)
    const panel = screen.getByRole('region')

    expect(open).toHaveAttribute('aria-expanded', 'true')
    expect(open.getAttribute('aria-controls')).toBe(panel.id)
    expect(panel.getAttribute('aria-labelledby')).toBe(open.id)
  })

  it('starts with everything closed at −1', () => {
    renderBlock(definition, Accordion, { defaultOpen: -1 })

    for (const label of labels) {
      expect(trigger(label)).toHaveAttribute('aria-expanded', 'false')
    }
    expect(screen.queryAllByRole('region')).toHaveLength(0)
  })

  describe('single mode', () => {
    it('closes the previous row when another opens', async () => {
      renderBlock(definition, Accordion)

      await userEvent.click(trigger(second))

      expect(trigger(second)).toHaveAttribute('aria-expanded', 'true')
      expect(trigger(first)).toHaveAttribute('aria-expanded', 'false')
    })

    it('closes the open row, so the reader is never stuck in it', async () => {
      renderBlock(definition, Accordion)

      await userEvent.click(trigger(first))

      expect(trigger(first)).toHaveAttribute('aria-expanded', 'false')
    })
  })

  it('leaves both rows open in multiple mode', async () => {
    renderBlock(definition, Accordion, { mode: 'multiple' })

    await userEvent.click(trigger(second))

    expect(trigger(first)).toHaveAttribute('aria-expanded', 'true')
    expect(trigger(second)).toHaveAttribute('aria-expanded', 'true')
  })

  describe('the keyboard', () => {
    it('toggles on Space and on Enter', async () => {
      renderBlock(definition, Accordion, { defaultOpen: -1 })

      await userEvent.tab()
      await userEvent.keyboard(' ')

      expect(trigger(first)).toHaveAttribute('aria-expanded', 'true')

      await userEvent.keyboard('{Enter}')

      expect(trigger(first)).toHaveAttribute('aria-expanded', 'false')
    })

    it('moves between the triggers with the arrow keys, and Home and End', async () => {
      renderBlock(definition, Accordion, { defaultOpen: -1 })

      await userEvent.tab()
      await userEvent.keyboard('{ArrowDown}')

      expect(trigger(second)).toHaveFocus()

      await userEvent.keyboard('{End}')

      expect(trigger(requireAt(labels, labels.length - 1))).toHaveFocus()

      await userEvent.keyboard('{Home}')

      expect(trigger(first)).toHaveFocus()
    })
  })

  it('keeps the open row when an unrelated prop changes', async () => {
    const view = renderBlock(definition, Accordion)

    await userEvent.click(trigger(second))

    view.rerender(<Accordion {...definition.propsSchema.parse({ look: 'cards' })} />)

    expect(trigger(second)).toHaveAttribute('aria-expanded', 'true')
  })

  describe('the panels', () => {
    it('render their own text when nothing was dropped in them', () => {
      renderBlock(definition, Accordion)

      expect(screen.getByRole('region').textContent).toBe(
        requireAt(definition.defaults.items, 0).body,
      )
    })

    it('let a child win over the text, per index', () => {
      renderBlock(definition, Accordion, {
        children: <div data-testid="dropped">dropped block</div>,
      })

      expect(screen.getByTestId('dropped')).toBeInTheDocument()
      expect(screen.getByRole('region').textContent).toBe('dropped block')
    })
  })

  it('hides itself with the responsive visibility class', () => {
    renderBlock(definition, Accordion, { hidden: true })

    expect(screen.getByTestId('accordion').className).toContain('hidden')
  })

  it('has no axe violations in either mode or either look', async () => {
    for (const mode of ['single', 'multiple'] as const) {
      for (const look of ['list', 'cards'] as const) {
        const { container } = renderBlock(definition, Accordion, { mode, look })

        await expectNoViolations(container)
      }
    }
  })
})
