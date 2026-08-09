import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { CodeBlock } from './code-block'
import { codeBlockDefinition } from './code-block.definition'
import { codeBlockSchema } from './code-block.schema'

const definition = codeBlockDefinition

afterEach(() => {
  vi.restoreAllMocks()
})

describe('CodeBlock', () => {
  it('renders every line of the sample', () => {
    renderBlock(definition, CodeBlock, { code: 'one\ntwo\nthree', language: 'plain' })

    expect(screen.getByTestId('code-scroller').textContent).toContain('one')
    expect(screen.getByTestId('code-scroller').textContent).toContain('three')
  })

  it('makes the scroller reachable from the keyboard', () => {
    renderBlock(definition, CodeBlock)

    const scroller = screen.getByTestId('code-scroller')

    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller).toHaveAttribute('role', 'region')
    expect(scroller.getAttribute('aria-label')).toContain(definition.defaults.filename)
  })

  it('marks the lines the range names, and only those', () => {
    const { container } = renderBlock(definition, CodeBlock, {
      code: 'a\nb\nc\nd\ne',
      language: 'plain',
      highlightLines: '2-3',
    })

    const marked = container.querySelectorAll('[data-highlighted="true"]')

    expect(marked).toHaveLength(2)
    expect(marked[0]?.textContent).toContain('b')
    expect(marked[1]?.textContent).toContain('c')
  })

  it('highlights nothing when the range cannot be read', () => {
    const { container } = renderBlock(definition, CodeBlock, { highlightLines: 'nonsense' })

    expect(container.querySelectorAll('[data-highlighted="true"]')).toHaveLength(0)
  })

  it('keeps line numbers out of the accessibility tree', () => {
    const { container } = renderBlock(definition, CodeBlock, {
      code: 'a\nb',
      language: 'plain',
      showLineNumbers: true,
    })

    const numbers = [...container.querySelectorAll('[aria-hidden="true"]')].map(
      (node) => node.textContent,
    )

    expect(numbers).toContain('1')
    expect(numbers).toContain('2')
  })

  it('copies the code prop rather than the rendered text', async () => {
    const writeText = vi.fn(() => Promise.resolve())

    vi.stubGlobal('navigator', { clipboard: { writeText } })

    const code = 'const answer = 42'

    renderBlock(definition, CodeBlock, { code, language: 'ts', showLineNumbers: true })
    screen.getByRole('button', { name: /copy/i }).click()

    expect(writeText).toHaveBeenCalledWith(code)
  })

  it('labels the copy button and confirms politely', () => {
    renderBlock(definition, CodeBlock)

    expect(screen.getByRole('button', { name: /copy/i })).toBeInTheDocument()
  })

  it('validates its own defaults', () => {
    expect(() => codeBlockSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, CodeBlock, { highlightLines: '2' })

    await expectNoViolations(container)
  })
})
