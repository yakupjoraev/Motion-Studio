import { screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { HONEYPOT_NAME } from '../honeypot'

import { WaitlistForm } from './waitlist-form'
import { waitlistFormDefinition } from './waitlist-form.definition'
import { type WaitlistValues, waitlistFormSchema } from './waitlist-form.schema'

const defaults = waitlistFormDefinition.defaults

const render = (overrides: Partial<typeof defaults> & { onSubmit?: unknown } = {}) =>
  renderBlock(waitlistFormDefinition, WaitlistForm, overrides)

const field = (): HTMLElement => screen.getByRole('textbox', { name: defaults.label })

describe('WaitlistForm', () => {
  it('validates its own defaults', () => {
    expect(() => waitlistFormSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations at its defaults', async () => {
    const { container } = render()

    await expectNoViolations(container)
  })

  it('keeps the label in the markup even while it is not drawn', () => {
    render()

    const label = screen.getByText(defaults.label)

    expect(label.tagName).toBe('LABEL')
    // A placeholder is not a label, so the element is always here and only its class changes.
    expect(label.className).toContain('sr-only')
    expect(label).toHaveAttribute('for', field().id)
  })

  it('draws the label when the author asked for it', () => {
    render({ showLabel: true })

    expect(screen.getByText(defaults.label).className).not.toContain('sr-only')
  })

  it('is two tab stops: the field, then the button', async () => {
    render()

    await userEvent.tab()
    expect(document.activeElement).toBe(field())

    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByTestId('form-submit'))

    await userEvent.tab()
    expect(document.activeElement).toBe(document.body)
  })

  it('leaves native validation off', () => {
    render()

    expect(screen.getByTestId('waitlist-form-element')).toHaveAttribute('novalidate')
  })
})

describe('WaitlistForm on an invalid submit', () => {
  it('announces the message and moves focus to the field', async () => {
    render()

    await userEvent.type(field(), 'ada@')
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByText(defaults.invalidMessage)).toHaveAttribute('role', 'alert')
    })
    expect(document.activeElement).toBe(field())
    expect(field()).toHaveAttribute('aria-invalid', 'true')
  })

  it('never calls the handler', async () => {
    const onSubmit = vi.fn()

    render({ onSubmit })

    await userEvent.click(screen.getByTestId('form-submit'))
    await waitFor(() => {
      expect(screen.getByText(defaults.invalidMessage)).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('clears the message once the address is valid', async () => {
    render()

    await userEvent.click(screen.getByTestId('form-submit'))
    await waitFor(() => {
      expect(screen.getByText(defaults.invalidMessage)).toBeInTheDocument()
    })

    await userEvent.type(field(), 'ada@example.com')

    await waitFor(() => {
      expect(screen.queryByText(defaults.invalidMessage)).toBeNull()
    })
    expect(field()).not.toHaveAttribute('aria-invalid')
  })
})

describe('WaitlistForm on a valid submit', () => {
  it('calls the handler with the address', async () => {
    const onSubmit = vi.fn<(values: WaitlistValues) => void>()

    render({ onSubmit })

    await userEvent.type(field(), 'ada@example.com')
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    expect(onSubmit.mock.calls[0]?.[0]?.email).toBe('ada@example.com')
  })

  it('replaces the row with a message that takes focus', async () => {
    render()

    await userEvent.type(field(), 'ada@example.com')
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('form-success')).toBeInTheDocument()
    })

    const panel = screen.getByTestId('form-success')

    expect(screen.queryByTestId('waitlist-form-element')).toBeNull()
    expect(panel).toHaveTextContent(defaults.successTitle)
    // `<output>` carries role=status implicitly, which is why the attribute is not on the element.
    expect(screen.getByRole('status')).toBe(panel)
    expect(document.activeElement).toBe(panel)
  })

  it('announces a handler failure through the form’s own region', async () => {
    render({
      onSubmit: () => {
        throw new Error('network')
      },
    })

    await userEvent.type(field(), 'ada@example.com')
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('form-message')).toHaveTextContent(defaults.failureMessage)
    })
    expect(screen.getByTestId('waitlist-form-element')).toBeInTheDocument()
    expect(field()).not.toHaveAttribute('aria-invalid')
  })

  it('succeeds without calling the handler when the trap is filled', async () => {
    const onSubmit = vi.fn()

    render({ onSubmit })

    await userEvent.type(field(), 'ada@example.com')

    const trap = screen.getByTestId('honeypot').querySelector('input')
    expect(trap).not.toBeNull()
    expect(trap).toHaveAttribute('name', HONEYPOT_NAME)
    await userEvent.type(trap as HTMLInputElement, 'https://example.com')

    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('form-success')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
