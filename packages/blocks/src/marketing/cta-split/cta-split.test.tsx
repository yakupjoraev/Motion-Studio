import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { CtaSplit } from './cta-split'
import { ctaSplitDefinition as definition } from './cta-split.definition'

describe('CtaSplit', () => {
  it('shows the form on one side by default', () => {
    renderBlock(definition, CtaSplit)

    expect(screen.getByTestId('newsletter-field')).toBeInTheDocument()
    expect(screen.queryByTestId('cta-split-actions')).toBeNull()
  })

  it('shows buttons instead when asked', () => {
    renderBlock(definition, CtaSplit, { side: 'buttons' })

    expect(screen.getByTestId('cta-split-actions')).toBeInTheDocument()
    expect(screen.getAllByTestId('action-button')).toHaveLength(definition.defaults.actions.length)
    expect(screen.queryByTestId('newsletter-field')).toBeNull()
  })

  it('runs the same field newsletter-form ships, handler and all', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    renderBlock(definition, CtaSplit, { onSubmit })

    await user.type(screen.getByTestId('newsletter-input'), 'reader@example.test')
    await user.click(screen.getByTestId('newsletter-submit'))

    expect(onSubmit).toHaveBeenCalledWith('reader@example.test')
  })

  it('validates the address the same way, with the same wiring', async () => {
    const user = userEvent.setup()

    renderBlock(definition, CtaSplit)

    await user.click(screen.getByTestId('newsletter-submit'))

    const field = screen.getByTestId('newsletter-input')

    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field.getAttribute('aria-describedby')).toBe(screen.getByTestId('newsletter-message').id)
  })

  it('puts the copy before the form in reading order', () => {
    renderBlock(definition, CtaSplit)

    const heading = screen.getByRole('heading')
    const field = screen.getByTestId('newsletter-field')

    expect(
      heading.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeGreaterThan(0)
  })

  it('paints the panel from the surface prop', () => {
    renderBlock(definition, CtaSplit, { surface: 'glass' })

    expect(screen.getByTestId('cta-split-panel').className).toContain('ms-glass')
  })

  it('carries the codegen note about the handler', () => {
    expect(definition.codegen.notes?.join(' ')).toContain('no-op')
  })

  it('has no axe violations with the form', async () => {
    const { container } = renderBlock(definition, CtaSplit)

    await expectNoViolations(container)
  })

  it('has no axe violations with buttons', async () => {
    const { container } = renderBlock(definition, CtaSplit, { side: 'buttons' })

    await expectNoViolations(container)
  })
})
