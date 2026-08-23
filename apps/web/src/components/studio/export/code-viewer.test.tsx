import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CodeViewer, MAX_LINES, languageOf } from './code-viewer'

const file = { path: 'app/page.tsx', contents: 'const answer = 42 // ok\nexport {}\n' }

/** One statement and its newline, repeated to build a file with a known line count. */
const LINE = 'const x = 1\n'

describe('languageOf', () => {
  it('reads the language off the extension and falls back to plain text', () => {
    expect(languageOf('app/page.tsx')).toBe('tsx')
    expect(languageOf('postcss.config.mjs')).toBe('js')
    expect(languageOf('README.md')).toBe('plain')
  })
})

describe('CodeViewer', () => {
  it('is a labelled region the keyboard can reach, because it scrolls', async () => {
    render(<CodeViewer file={file} onCopy={vi.fn()} ready />)

    const region = await screen.findByRole('region', { name: /app\/page\.tsx/ })

    expect(region).toHaveAttribute('tabindex', '0')
  })

  it('numbers the lines', async () => {
    render(<CodeViewer file={file} onCopy={vi.fn()} ready />)

    await screen.findByRole('region', { name: /app\/page\.tsx/ })

    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  it('highlights with the tokeniser once its chunk has landed', async () => {
    render(<CodeViewer file={file} onCopy={vi.fn()} ready />)

    // `const` is a keyword and `42` is a number: two spans, not one line of plain text.
    await waitFor(() => expect(screen.getByText('const')).toBeInTheDocument())

    expect(screen.getByText('42')).toBeInTheDocument()
  })

  it('confirms a copy and then gets out of the way', async () => {
    const user = userEvent.setup()
    const onCopy = vi.fn()

    render(<CodeViewer file={file} onCopy={onCopy} ready />)

    await user.click(screen.getByRole('button', { name: 'Copy' }))

    expect(onCopy).toHaveBeenCalledWith(file)
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()

    // Real timers: the confirmation is 1.2 s, and the highlighter's own chunk resolves on a
    // macrotask that fake timers hold, which is a slower way to learn the same thing.
    await waitFor(() => expect(screen.getByRole('button', { name: 'Copy' })).toBeInTheDocument(), {
      timeout: 2_000,
    })
  })

  it('truncates a file past its limit, and says so', async () => {
    const long = { path: 'big.ts', contents: LINE.repeat(24) }

    render(<CodeViewer file={long} maxLines={20} onCopy={vi.fn()} ready />)

    const note = await screen.findByTestId('export-truncated')

    expect(note).toHaveTextContent('first 20 of 25 lines')
    expect(screen.queryByText('21')).not.toBeInTheDocument()
  })

  it('defaults its limit to the two thousand lines the panel is judged on', () => {
    expect(MAX_LINES).toBe(2_000)
  })
  it('shows the file’s own shape while Prettier is still on it', () => {
    render(<CodeViewer file={file} onCopy={vi.fn()} ready={false} />)

    expect(screen.getByTestId('export-viewer-skeleton')).toBeInTheDocument()
    expect(screen.queryByTestId('export-code-viewer')).not.toBeInTheDocument()
  })

  it('asks for a file rather than rendering an empty frame', () => {
    render(<CodeViewer file={null} onCopy={vi.fn()} ready />)

    expect(screen.getByTestId('export-viewer-empty')).toBeInTheDocument()
  })
})
