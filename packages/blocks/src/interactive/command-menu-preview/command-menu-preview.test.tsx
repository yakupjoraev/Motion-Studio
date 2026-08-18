import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { CommandMenuPreview } from './command-menu-preview'
import { commandMenuPreviewDefinition as definition } from './command-menu-preview.definition'
import { groupCommands } from './command-menu-preview.schema'

const defaults = definition.defaults

describe('groupCommands', () => {
  it('folds consecutive rows with the same group into one section', () => {
    const groups = groupCommands([
      { label: 'A', icon: '', hint: '', group: 'One' },
      { label: 'B', icon: '', hint: '', group: 'One' },
      { label: 'C', icon: '', hint: '', group: 'Two' },
    ])

    expect(groups.map((group) => group.label)).toEqual(['One', 'Two'])
    expect(requireAt(groups, 0).commands).toHaveLength(2)
  })

  it('starts a new section when the group comes back later, because order is the author’s', () => {
    const groups = groupCommands([
      { label: 'A', icon: '', hint: '', group: 'One' },
      { label: 'B', icon: '', hint: '', group: 'Two' },
      { label: 'C', icon: '', hint: '', group: 'One' },
    ])

    expect(groups).toHaveLength(3)
  })
})

describe('CommandMenuPreview', () => {
  /* The central requirement: a fake widget announced as a real one is worse than a picture. */
  it('hides the panel from assistive technology', () => {
    renderBlock(definition, CommandMenuPreview)

    expect(screen.getByTestId('command-panel')).toHaveAttribute('aria-hidden', 'true')
  })

  it('offers a text alternative in its place', () => {
    renderBlock(definition, CommandMenuPreview)

    const alternative = screen.getByTestId('command-menu-alt')

    expect(alternative).toHaveTextContent(defaults.alt)
    expect(alternative.className).toContain('sr-only')
    expect(alternative.closest('[aria-hidden="true"]')).toBeNull()
  })

  it('exposes no control at all: no button, no input, no option', () => {
    renderBlock(definition, CommandMenuPreview)

    expect(screen.queryByRole('button')).toBeNull()
    expect(screen.queryByRole('textbox')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
    expect(screen.queryByRole('option')).toBeNull()
    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('is not a tab stop, so a keyboard user passes straight over it', async () => {
    renderBlock(definition, CommandMenuPreview)

    await userEvent.tab()

    expect(document.body).toHaveFocus()
  })

  it('draws a row per command and a heading per group', () => {
    renderBlock(definition, CommandMenuPreview)

    expect(screen.getAllByTestId('command-row')).toHaveLength(defaults.commands.length)
    expect(screen.getByText('Editor')).toBeInTheDocument()
    expect(screen.getByText('Motion')).toBeInTheDocument()
  })

  it('marks the first row as the highlighted one, so it does not look unloaded', () => {
    renderBlock(definition, CommandMenuPreview)

    const rows = screen.getAllByTestId('command-row')

    expect(requireAt(rows, 0).className).toContain('bg-surface-2')
    expect(requireAt(rows, 1).className).not.toContain('bg-surface-2')
  })

  it('draws shortcuts as keycaps and omits them when there are none', () => {
    renderBlock(definition, CommandMenuPreview)

    const caps = screen.getByTestId('command-panel').querySelectorAll('kbd')
    const withHints = defaults.commands.filter((command) => command.hint !== '')

    expect(caps).toHaveLength(withHints.length)
    expect(requireAt([...caps], 0).textContent).toBe(requireAt(withHints, 0).hint)
  })

  it('takes the theme’s glass recipe rather than a blur of its own', () => {
    renderBlock(definition, CommandMenuPreview, { glass: true })

    expect(screen.getByTestId('command-panel').className).toContain('ms-glass')
  })

  it('hides itself with the responsive visibility class', () => {
    renderBlock(definition, CommandMenuPreview, { hidden: true })

    expect(screen.getByTestId('command-menu-preview').className).toContain('hidden')
  })

  it('validates its own defaults', () => {
    expect(() => definition.propsSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, CommandMenuPreview)

    await expectNoViolations(container)
  })
})
