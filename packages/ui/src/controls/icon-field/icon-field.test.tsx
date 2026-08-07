import { ICON_NAMES } from '@motion-studio/icons'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { IconField } from './icon-field'
import { searchIcons } from './icon-search'

import type { IconFieldProps } from './icon-field.types'

const Fixture = (props: Partial<IconFieldProps>): ReactElement => (
  <IconField
    label="Icon"
    value="check"
    onChange={() => undefined}
    onCommit={() => undefined}
    {...props}
  />
)

const trigger = (): HTMLElement => screen.getByRole('button', { name: /^Icon,/ })

describe('searchIcons', () => {
  it('returns everything for an empty query', () => {
    expect(searchIcons(ICON_NAMES, '  ')).toBe(ICON_NAMES)
  })

  it('matches a word anywhere in a kebab-case name', () => {
    expect(searchIcons(ICON_NAMES, 'left')).toContain('align-left')
  })

  it('matches a prefix of the whole name', () => {
    expect(searchIcons(ICON_NAMES, 'align')).toContain('align-left')
  })

  it('does not match the middle of a word, which would return a third of the set', () => {
    expect(searchIcons(ICON_NAMES, 'eft')).toEqual([])
  })

  it('ignores case', () => {
    expect(searchIcons(ICON_NAMES, 'CHECK')).toContain('check')
  })
})

describe('IconField', () => {
  it('names the trigger with the icon it holds', () => {
    render(<Fixture />)

    expect(trigger()).toHaveAccessibleName('Icon, Check')
  })

  it('says None when there is no icon', () => {
    render(<Fixture value="" />)

    expect(trigger()).toHaveAccessibleName('Icon, None')
  })

  it('opens a searchable list', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.click(trigger())

    expect(screen.getByRole('searchbox', { name: 'Search icon' })).toBeInTheDocument()
    expect(screen.getByRole('listbox', { name: 'Icon' })).toBeInTheDocument()
  })

  it('filters as it is typed and says how many matched', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.click(trigger())
    await user.type(screen.getByRole('searchbox', { name: 'Search icon' }), 'align')

    const matches = searchIcons(ICON_NAMES, 'align').length

    expect(screen.getByText(`${matches} icons match`)).toBeInTheDocument()
    // One extra option is the "no icon" entry, which the search does not remove.
    expect(screen.getAllByRole('option')).toHaveLength(matches + 1)
  })

  it('marks the selected icon', async () => {
    const user = userEvent.setup()

    render(<Fixture />)
    await user.click(trigger())

    expect(screen.getByRole('option', { name: 'Check' })).toHaveAttribute('aria-selected', 'true')
  })

  it('picks an icon', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'Align left' }))

    expect(onCommit).toHaveBeenCalledWith('align-left')
  })

  it('clears the icon', async () => {
    const user = userEvent.setup()
    const onCommit = vi.fn()

    render(<Fixture onCommit={onCommit} />)
    await user.click(trigger())
    await user.click(screen.getByRole('option', { name: 'None' }))

    expect(onCommit).toHaveBeenCalledWith('')
  })

  it('offers only the names the caller narrowed it to', async () => {
    const user = userEvent.setup()

    render(<Fixture names={['check', 'copy']} />)
    await user.click(trigger())

    expect(screen.getAllByRole('option')).toHaveLength(3)
  })

  it('says Mixed across a disagreeing selection', () => {
    render(<Fixture mixed />)

    expect(trigger()).toHaveAccessibleName('Icon, Mixed')
  })

  it('does not open when disabled', async () => {
    const user = userEvent.setup()

    render(<Fixture disabled />)
    await user.click(trigger())

    expect(screen.queryByRole('listbox')).toBeNull()
  })

  it('has no axe violations closed', async () => {
    const { container } = render(<Fixture />)

    await expectNoViolations(container)
  })

  it('has no axe violations open', async () => {
    const user = userEvent.setup()
    const { baseElement } = render(<Fixture names={['check', 'copy']} />)

    await user.click(trigger())

    await expectNoViolations(baseElement)
  })
})
