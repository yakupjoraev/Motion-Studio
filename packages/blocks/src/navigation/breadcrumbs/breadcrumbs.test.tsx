import { screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'
import type { NavLink } from '../navigation.schema'

import { overflowLabel } from './breadcrumb-overflow'
import { Breadcrumbs } from './breadcrumbs'
import { breadcrumbsDefinition as definition } from './breadcrumbs.definition'
import { collapseBreadcrumbs } from './breadcrumbs.schema'

const trail = (count: number): NavLink[] =>
  Array.from({ length: count }, (_unused, index) => ({
    label: `Level ${index + 1}`,
    href: `#level-${index + 1}`,
  }))

describe('collapseBreadcrumbs', () => {
  it('draws everything when the trail fits', () => {
    const slots = collapseBreadcrumbs(trail(4), 4)

    expect(slots).toHaveLength(4)
    expect(slots.every((slot) => slot.kind === 'crumb')).toBe(true)
  })

  it('keeps the first crumb and the tail, and folds the middle', () => {
    const slots = collapseBreadcrumbs(trail(7), 4)

    expect(slots.map((slot) => slot.kind)).toEqual(['crumb', 'overflow', 'crumb', 'crumb', 'crumb'])

    const overflow = requireAt(slots, 1)

    expect(overflow.kind === 'overflow' ? overflow.hidden.map((one) => one.label) : []).toEqual([
      'Level 2',
      'Level 3',
      'Level 4',
    ])
  })

  it('marks only the real last item as last, collapsed or not', () => {
    for (const slots of [collapseBreadcrumbs(trail(3), 4), collapseBreadcrumbs(trail(7), 4)]) {
      const lasts = slots.filter((slot) => slot.kind === 'crumb' && slot.last)

      expect(lasts).toHaveLength(1)
      expect(lasts[0]?.kind === 'crumb' ? lasts[0].item.label : '').toBe(
        `Level ${slots.length === 3 ? 3 : 7}`,
      )
    }
  })
})

describe('Breadcrumbs', () => {
  it('is one labelled navigation landmark holding an ordered list', () => {
    renderBlock(definition, Breadcrumbs)

    const landmarks = screen.getAllByRole('navigation')

    expect(landmarks).toHaveLength(1)
    expect(landmarks[0]).toHaveAccessibleName('Breadcrumb')
    expect(screen.getByRole('list').tagName).toBe('OL')
  })

  it('makes the last crumb the current page and not a link', () => {
    renderBlock(definition, Breadcrumbs)

    const last = requireAt(definition.defaults.items, definition.defaults.items.length - 1)
    const current = screen.getByTestId('breadcrumb-current')

    expect(current).toHaveTextContent(last.label)
    expect(current).toHaveAttribute('aria-current', 'page')
    expect(current.tagName).toBe('SPAN')
    expect(screen.queryByRole('link', { name: last.label })).toBeNull()
  })

  it('hides the separators from the reader', () => {
    const { container } = renderBlock(definition, Breadcrumbs, { separator: 'slash' })

    const separators = container.querySelectorAll('[aria-hidden="true"]')

    expect(separators.length).toBe(definition.defaults.items.length - 1)
  })

  it('names the overflow trigger with a count rather than with "more"', () => {
    renderBlock(definition, Breadcrumbs, { items: trail(7), maxVisible: 4 })

    expect(screen.getByTestId('breadcrumb-overflow-trigger')).toHaveAccessibleName(overflowLabel(3))
  })

  it('opens the overflow menu from the keyboard and lists what it hid', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Breadcrumbs, { items: trail(7), maxVisible: 4 })

    const trigger = screen.getByTestId('breadcrumb-overflow-trigger')

    trigger.focus()
    await user.keyboard('{Enter}')

    const menu = await screen.findByTestId('breadcrumb-overflow-menu')

    expect(menu.querySelectorAll('a')).toHaveLength(3)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('moves through the overflow menu with the arrow keys', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Breadcrumbs, { items: trail(7), maxVisible: 4 })

    const trigger = screen.getByTestId('breadcrumb-overflow-trigger')

    trigger.focus()
    await user.keyboard('{Enter}')
    await screen.findByTestId('breadcrumb-overflow-menu')
    await user.keyboard('{ArrowDown}')

    expect(document.activeElement).toHaveTextContent('Level 3')
  })

  it('closes the overflow menu on Escape and returns focus to the trigger', async () => {
    const user = userEvent.setup()

    renderBlock(definition, Breadcrumbs, { items: trail(7), maxVisible: 4 })

    const trigger = screen.getByTestId('breadcrumb-overflow-trigger')

    trigger.focus()
    await user.keyboard('{Enter}')
    await screen.findByTestId('breadcrumb-overflow-menu')
    await user.keyboard('{Escape}')

    await waitFor(() => {
      expect(screen.queryByTestId('breadcrumb-overflow-menu')).toBeNull()
    })
    expect(document.activeElement).toBe(trigger)
  })

  it('renders no JSON-LD in the canvas, whatever the prop says', () => {
    renderBlock(definition, Breadcrumbs, { jsonLd: true })

    expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(0)
  })

  it('leaves the BreadcrumbList to the export, and says which prop turns it on', () => {
    expect(definition.codegen.structuredData).toEqual({
      type: 'BreadcrumbList',
      enabledBy: 'jsonLd',
    })
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Breadcrumbs)

    await expectNoViolations(container)
  })

  it('has no axe violations when the middle is collapsed', async () => {
    const { container } = renderBlock(definition, Breadcrumbs, {
      items: trail(7),
      maxVisible: 4,
    })

    await expectNoViolations(container)
  })
})
