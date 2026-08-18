import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { SidebarNav } from './sidebar-nav'
import { sidebarNavDefinition as definition } from './sidebar-nav.definition'

const groups = definition.defaults.groups

describe('SidebarNav', () => {
  it('is one labelled navigation landmark', () => {
    renderBlock(definition, SidebarNav)

    const landmarks = screen.getAllByRole('navigation')

    expect(landmarks).toHaveLength(1)
    expect(landmarks[0]).toHaveAccessibleName(definition.defaults.ariaLabel)
  })

  it('names every group by its own heading', () => {
    renderBlock(definition, SidebarNav)

    const found = screen.getAllByRole('group')

    expect(found).toHaveLength(groups.length)

    for (const [index, group] of found.entries()) {
      expect(group).toHaveAccessibleName(requireAt(groups, index).title)
    }
  })

  it('puts the group headings at the level the document asked for', () => {
    renderBlock(definition, SidebarNav, { headingLevel: 4 })

    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(groups.length)
  })

  it('marks the current item with aria-current and not with colour alone', () => {
    const href = requireAt(requireAt(groups, 0).items, 1).href

    renderBlock(definition, SidebarNav, { activeHref: href })

    const current = screen
      .getAllByTestId('nav-link')
      .filter((link) => link.getAttribute('href') === href)

    expect(current).toHaveLength(1)
    expect(requireAt(current, 0)).toHaveAttribute('aria-current', 'page')
    expect(requireAt(current, 0).className).toContain('font-medium')
  })

  it('reports the disclosure state on a collapsible group and toggles from the keyboard', async () => {
    const user = userEvent.setup()

    renderBlock(definition, SidebarNav)

    const trigger = requireAt(screen.getAllByTestId('sidebar-trigger'), 0)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')

    trigger.focus()
    await user.keyboard(' ')

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('takes the closed group out of the tab order rather than merely hiding it', async () => {
    const user = userEvent.setup()

    renderBlock(definition, SidebarNav)

    const trigger = requireAt(screen.getAllByTestId('sidebar-trigger'), 0)
    const before = screen.getAllByTestId('nav-link').length

    await user.click(trigger)

    expect(screen.getAllByTestId('nav-link').length).toBeLessThan(before)
  })

  it('keeps every accessible name in rail mode', () => {
    renderBlock(definition, SidebarNav, { collapsed: true })

    const labels = groups.flatMap((group) => group.items.map((item) => item.label))

    for (const label of labels) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument()
    }
  })

  it('shows the rail label on focus as well as on hover, and hides it from the reader', () => {
    renderBlock(definition, SidebarNav, { collapsed: true })

    const tooltip = requireAt(
      screen.getAllByText(requireAt(requireAt(groups, 0).items, 0).label, { selector: 'span' }),
      1,
    )

    expect(tooltip).toHaveAttribute('aria-hidden', 'true')
    expect(tooltip.className).toContain('group-focus-visible/nav:block')
    expect(tooltip.className).toContain('group-hover/nav:block')
  })

  it('ignores the collapsible flag in rail mode', () => {
    renderBlock(definition, SidebarNav, { collapsed: true })

    expect(screen.queryAllByTestId('sidebar-trigger')).toHaveLength(0)
    expect(screen.getAllByRole('group')).toHaveLength(groups.length)
  })

  it('ships no entrance for the user to remove', () => {
    expect(definition.defaultMotion).toEqual({})
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, SidebarNav)

    await expectNoViolations(container)
  })

  it('has no axe violations in rail mode', async () => {
    const { container } = renderBlock(definition, SidebarNav, { collapsed: true })

    await expectNoViolations(container)
  })
})
