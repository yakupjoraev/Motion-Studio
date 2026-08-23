import type { ExportFile } from '@motion-studio/codegen'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { FileTree, formatSize } from './file-tree'

const FILES: readonly ExportFile[] = [
  { path: 'app/page.tsx', contents: 'a'.repeat(1_200) },
  { path: 'app/layout.tsx', contents: 'b'.repeat(400) },
  { path: 'package.json', contents: '{}' },
]

/** The virtualizer measures the scroll element, and jsdom reports every box as zero. */
beforeAll(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 320 })
  Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 320 })
})

const view = (overrides: Partial<Parameters<typeof FileTree>[0]> = {}) =>
  render(
    <FileTree
      files={FILES}
      formatted={FILES.map((file) => file.path)}
      onCopy={vi.fn()}
      onSelect={vi.fn()}
      pending={false}
      selected="app/page.tsx"
      {...overrides}
    />,
  )

describe('formatSize', () => {
  it('reads a small file in bytes and everything else in kB', () => {
    expect(formatSize(2)).toBe('2 B')
    expect(formatSize(1_234)).toBe('1.2 kB')
  })
})

describe('FileTree', () => {
  it('is a tree whose rows say how many of how many they are', () => {
    view()

    const rows = screen.getAllByRole('treeitem')

    expect(screen.getByRole('tree', { name: 'Generated files' })).toBeInTheDocument()
    expect(rows[0]).toHaveAttribute('aria-setsize', '3')
    expect(rows[0]).toHaveAttribute('aria-posinset', '1')
    expect(rows[0]).toHaveAttribute('aria-selected', 'true')
  })

  it('shows the file count and the total', () => {
    view()

    expect(screen.getByText('3 · 1.6 kB')).toBeInTheDocument()
  })

  it('selects with the arrow keys from the row that has the tab stop', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()

    view({ onSelect })

    await user.tab()
    await user.keyboard('{ArrowDown}')

    expect(onSelect).toHaveBeenCalledWith('app/layout.tsx')
  })

  it('copies one file without selecting it', async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()
    const onSelect = vi.fn()

    view({ onCopy, onSelect })

    await user.click(screen.getByRole('button', { name: 'Copy package.json' }))

    expect(onCopy).toHaveBeenCalledWith(FILES[2])
    expect(onSelect).not.toHaveBeenCalled()
  })

  it('shows a skeleton where a size will be until the file is formatted', () => {
    view({ formatted: ['package.json'] })

    expect(screen.getByText('2 B')).toBeInTheDocument()
    expect(screen.queryByText('1.2 kB')).not.toBeInTheDocument()
  })

  it('reads as "not yet" while the pipeline is still running', () => {
    view({ files: [], formatted: [], pending: true })

    expect(screen.getByTestId('export-files-pending')).toBeInTheDocument()
  })
})
