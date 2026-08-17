import { screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { NewsletterForm } from './newsletter-form'
import { newsletterFormDefinition as definition } from './newsletter-form.definition'
import { emailLooksValid } from './newsletter-form.schema'

const VALID = 'reader@example.test'

describe('emailLooksValid', () => {
  it('accepts an ordinary address', () => {
    expect(emailLooksValid(VALID)).toBe(true)
    expect(emailLooksValid('  reader@example.test  ')).toBe(true)
  })

  it('rejects the typos a reader can see', () => {
    expect(emailLooksValid('')).toBe(false)
    expect(emailLooksValid('reader')).toBe(false)
    expect(emailLooksValid('reader@')).toBe(false)
    expect(emailLooksValid('reader@example')).toBe(false)
    expect(emailLooksValid('@example.test')).toBe(false)
  })
})

describe('NewsletterForm — the four states', () => {
  it('starts idle with nothing to say', () => {
    renderBlock(definition, NewsletterForm)

    expect(screen.getByTestId('newsletter-field')).toHaveAttribute('data-state', 'idle')
    expect(screen.getByTestId('newsletter-message').textContent).toBe('')
    expect(screen.getByTestId('newsletter-input')).toHaveAttribute('aria-invalid', 'false')
  })

  it('holds loading while the handler has not settled, and disables the button', async () => {
    const user = userEvent.setup()
    let settle = (): void => undefined
    const onSubmit = () =>
      new Promise<void>((resolve) => {
        settle = resolve
      })

    renderBlock(definition, NewsletterForm, { onSubmit })

    await user.type(screen.getByTestId('newsletter-input'), VALID)
    await user.click(screen.getByTestId('newsletter-submit'))

    expect(screen.getByTestId('newsletter-field')).toHaveAttribute('data-state', 'loading')
    expect(screen.getByTestId('newsletter-submit')).toBeDisabled()

    settle()

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-field')).toHaveAttribute('data-state', 'success')
    })
  })

  it('says so when the handler resolves', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    renderBlock(definition, NewsletterForm, { onSubmit })

    await user.type(screen.getByTestId('newsletter-input'), VALID)
    await user.click(screen.getByTestId('newsletter-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-message')).toHaveTextContent(
        definition.defaults.successMessage,
      )
    })

    expect(onSubmit).toHaveBeenCalledWith(VALID)
  })

  it('says so when the handler rejects, without an unhandled rejection', async () => {
    const user = userEvent.setup()
    const onSubmit = () => Promise.reject(new Error('offline'))

    renderBlock(definition, NewsletterForm, { onSubmit })

    await user.type(screen.getByTestId('newsletter-input'), VALID)
    await user.click(screen.getByTestId('newsletter-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-message')).toHaveTextContent(
        definition.defaults.errorMessage,
      )
    })
  })
})

describe('NewsletterForm — validation', () => {
  it('never reaches the handler with an address it can see is wrong', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()

    renderBlock(definition, NewsletterForm, { onSubmit })

    await user.type(screen.getByTestId('newsletter-input'), 'reader')
    await user.click(screen.getByTestId('newsletter-submit'))

    expect(onSubmit).not.toHaveBeenCalled()
    expect(screen.getByTestId('newsletter-message')).toHaveTextContent(
      definition.defaults.invalidMessage,
    )
  })

  it('ties the message to the field with aria-describedby and aria-invalid', async () => {
    const user = userEvent.setup()

    renderBlock(definition, NewsletterForm)

    await user.type(screen.getByTestId('newsletter-input'), 'reader')
    await user.click(screen.getByTestId('newsletter-submit'))

    const field = screen.getByTestId('newsletter-input')

    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field.getAttribute('aria-describedby')).toBe(screen.getByTestId('newsletter-message').id)
  })

  it('announces an error assertively and a success politely', async () => {
    const user = userEvent.setup()

    renderBlock(definition, NewsletterForm)

    await user.click(screen.getByTestId('newsletter-submit'))

    expect(screen.getByTestId('newsletter-message')).toHaveAttribute('aria-live', 'assertive')

    await user.type(screen.getByTestId('newsletter-input'), VALID)
    await user.click(screen.getByTestId('newsletter-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-message')).toHaveAttribute('aria-live', 'polite')
    })
  })

  it('clears the previous verdict as soon as the address changes', async () => {
    const user = userEvent.setup()

    renderBlock(definition, NewsletterForm)

    await user.click(screen.getByTestId('newsletter-submit'))

    expect(screen.getByTestId('newsletter-field')).toHaveAttribute('data-state', 'error')

    await user.type(screen.getByTestId('newsletter-input'), 'r')

    expect(screen.getByTestId('newsletter-field')).toHaveAttribute('data-state', 'idle')
  })
})

describe('NewsletterForm — the rest', () => {
  it('is a real email field with a real label', () => {
    renderBlock(definition, NewsletterForm)

    const field = screen.getByLabelText(definition.defaults.label)

    expect(field).toHaveAttribute('type', 'email')
    expect(field).toHaveAttribute('autocomplete', 'email')
  })

  it('keeps the label in the accessibility tree when it is hidden', () => {
    renderBlock(definition, NewsletterForm, { showLabel: false })

    expect(screen.getByLabelText(definition.defaults.label)).toBeInTheDocument()
  })

  it('ships a handler that does nothing rather than pretending to work', async () => {
    const user = userEvent.setup()

    renderBlock(definition, NewsletterForm)

    await user.type(screen.getByTestId('newsletter-input'), VALID)
    await user.click(screen.getByTestId('newsletter-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('newsletter-field')).toHaveAttribute('data-state', 'success')
    })
  })

  it('says in its codegen descriptor that the handler has to be replaced', () => {
    expect(definition.codegen.notes?.join(' ')).toContain('no-op')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, NewsletterForm)

    await expectNoViolations(container)
  })
})
