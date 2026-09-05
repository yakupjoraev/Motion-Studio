import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { createShortcutRegistry } from './registry'
import { ShortcutSheet } from './shortcut-sheet'

interface Ctx {
  readonly hasSelection: boolean
}

const registry = createShortcutRegistry<Ctx>([
  { id: 'undo', keys: 'mod+z', label: 'Undo', group: 'Global', scope: 'global', run: vi.fn() },
  {
    id: 'palette',
    keys: 'mod+k',
    label: 'Command palette',
    group: 'Global',
    scope: 'global',
    keywords: ['search', 'run'],
    run: vi.fn(),
  },
  {
    id: 'duplicate',
    keys: 'mod+d',
    label: 'Duplicate',
    group: 'Editing',
    scope: 'canvas',
    when: (ctx) => ctx.hasSelection,
    run: vi.fn(),
  },
])

const search = () => screen.getByLabelText('Search shortcuts')

describe('ShortcutSheet', () => {
  it('renders every shortcut, grouped, with platform-correct keys', () => {
    render(<ShortcutSheet context={{ hasSelection: true }} platform="mac" registry={registry} />)

    expect(screen.getByRole('heading', { name: 'Global' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Editing' })).toBeInTheDocument()
    expect(screen.getAllByTestId('shortcut-row')).toHaveLength(3)

    const undo = screen.getByText('Undo').closest('li')
    expect(within(undo as HTMLElement).getByTestId('shortcut-keys')).toHaveTextContent('⌘Z')
  })

  it('greys out a shortcut whose when() currently fails', () => {
    render(<ShortcutSheet context={{ hasSelection: false }} platform="other" registry={registry} />)

    const duplicate = screen.getByText('Duplicate').closest('li')

    expect(duplicate).toHaveAttribute('data-available', 'false')
    expect(duplicate).toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByText('Undo').closest('li')).toHaveAttribute('data-available', 'true')
  })

  it('searches labels, groups, keywords and the displayed keys', () => {
    render(<ShortcutSheet context={{ hasSelection: true }} platform="other" registry={registry} />)

    fireEvent.change(search(), { target: { value: 'search' } })
    expect(screen.getAllByTestId('shortcut-row')).toHaveLength(1)
    expect(screen.getByText('Command palette')).toBeInTheDocument()

    fireEvent.change(search(), { target: { value: 'ctrl+d' } })
    expect(screen.getByText('Duplicate')).toBeInTheDocument()

    fireEvent.change(search(), { target: { value: 'editing' } })
    expect(screen.getAllByTestId('shortcut-row')).toHaveLength(1)
  })

  it('says so when nothing matches', () => {
    render(<ShortcutSheet context={{ hasSelection: true }} platform="other" registry={registry} />)

    fireEvent.change(search(), { target: { value: 'xyzzy' } })

    expect(screen.queryAllByTestId('shortcut-row')).toHaveLength(0)
    expect(screen.getByText(/No shortcut matches/)).toBeInTheDocument()
  })

  /**
   * The registry stays English — SHORTCUTS.md is checked against it — so a second language is a
   * table the caller hands over. Searching has to follow the labels on screen: a reader who types
   * what they can see and gets nothing concludes the sheet is broken.
   */
  it('shows the labels and groups the caller translates, and searches them', () => {
    const copy = {
      search: 'Поиск сочетаний',
      searchPlaceholder: 'отменить…',
      empty: 'Ничего не найдено по «{query}».',
      labels: { Undo: 'Отменить', Duplicate: 'Дублировать' },
      groups: { Global: 'Глобальные' },
    }

    render(
      <ShortcutSheet
        context={{ hasSelection: true }}
        copy={copy}
        platform="other"
        registry={registry}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Глобальные' })).toBeInTheDocument()
    expect(screen.getByText('Отменить')).toBeInTheDocument()
    // Untranslated entries keep the registry's own English rather than showing a key.
    expect(screen.getByText('Command palette')).toBeInTheDocument()

    const russian = screen.getByLabelText('Поиск сочетаний')

    fireEvent.change(russian, { target: { value: 'Дублировать' } })
    expect(screen.getAllByTestId('shortcut-row')).toHaveLength(1)

    fireEvent.change(russian, { target: { value: 'xyzzy' } })
    expect(screen.getByText('Ничего не найдено по «xyzzy».')).toBeInTheDocument()
  })
})
