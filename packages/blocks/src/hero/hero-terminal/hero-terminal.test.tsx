import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { HeroTerminal } from './hero-terminal'
import { heroTerminalDefinition } from './hero-terminal.definition'
import { heroTerminalSchema } from './hero-terminal.schema'

const definition = heroTerminalDefinition

describe('HeroTerminal', () => {
  it('renders exactly one h1', () => {
    renderBlock(definition, HeroTerminal)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('renders every line as real text before any animation runs', () => {
    renderBlock(definition, HeroTerminal)

    const body = screen.getByTestId('hero-terminal-body')

    for (const line of definition.defaults.lines) {
      expect(body).toHaveTextContent(line.text)
    }
  })

  it('takes the sigil from the line kind rather than from the text', () => {
    renderBlock(definition, HeroTerminal, {
      lines: [
        { text: 'pnpm build', kind: 'prompt' },
        { text: 'ENOENT: no such file', kind: 'error' },
      ],
    })

    const body = screen.getByTestId('hero-terminal-body')

    expect(body.textContent).toContain('$ pnpm build')
    expect(body.textContent).toContain('! ENOENT: no such file')
  })

  it('separates an error line by more than its colour', () => {
    renderBlock(definition, HeroTerminal, {
      lines: [{ text: 'failed', kind: 'error' }],
    })

    const line = screen.getByTestId('hero-terminal-body').querySelector('span')

    expect(line?.className).toContain('text-danger')
    expect(line?.textContent).toContain('!')
  })

  it('keeps the furniture out of the accessibility tree', () => {
    const { container } = renderBlock(definition, HeroTerminal)

    expect(screen.getByTestId('terminal-caret')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelectorAll('.bg-danger')).toHaveLength(1)
  })

  it('drops the lights when only a title bar is asked for', () => {
    const { container } = renderBlock(definition, HeroTerminal, { chrome: 'title' })

    expect(container.querySelectorAll('.bg-danger')).toHaveLength(0)
    expect(screen.getByText(definition.defaults.title)).toBeInTheDocument()
  })

  it('declares the typing as a preset reference rather than animating by hand', () => {
    expect(definition.defaultMotion.continuous?.presetId).toBe('typewriter')
    expect(definition.capabilities.supportsMotion).toContain('continuous')
  })

  it('validates its own defaults', () => {
    expect(() => heroTerminalSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, HeroTerminal)

    await expectNoViolations(container)
  })
})
