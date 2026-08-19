import { screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { HONEYPOT_NAME } from '../honeypot'

import { ContactForm } from './contact-form'
import { contactFormDefinition } from './contact-form.definition'
import { type ContactValues, contactFormSchema } from './contact-form.schema'

const defaults = contactFormDefinition.defaults

const render = (overrides: Partial<typeof defaults> & { onSubmit?: unknown } = {}) =>
  renderBlock(contactFormDefinition, ContactForm, overrides)

/*
 * By accessible name rather than by `getByLabelText`: every field here is required, and the label element's text
 * content therefore carries the `aria-hidden` "(required)" marking. The name computation skips it — which is the
 * whole point of that marking — and `getByLabelText` does not, because it matches the label's text.
 */
const control = (label: string): HTMLElement => screen.getByRole('textbox', { name: label })

const fill = async (values: { name?: string; email?: string; message?: string }) => {
  if (values.name !== undefined) {
    await userEvent.type(control(defaults.name.label), values.name)
  }

  if (values.email !== undefined) {
    await userEvent.type(control(defaults.email.label), values.email)
  }

  if (values.message !== undefined) {
    await userEvent.type(control(defaults.message.label), values.message)
  }
}

const VALID = {
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'We are launching a docs site next month and need a landing page for it.',
}

describe('ContactForm', () => {
  it('validates its own defaults', () => {
    expect(() => contactFormSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations at its defaults', async () => {
    const { container } = render()

    await expectNoViolations(container)
  })

  it('has no axe violations with every field invalid', async () => {
    const { container } = render()

    await userEvent.click(screen.getByTestId('form-submit'))
    await waitFor(() => {
      expect(screen.getAllByRole('alert').filter((one) => one.textContent !== '')).toHaveLength(3)
    })

    await expectNoViolations(container)
  })

  it('renders three labelled fields and a submit', () => {
    render()

    expect(control(defaults.name.label)).toBeInTheDocument()
    expect(control(defaults.email.label)).toBeInTheDocument()
    expect(control(defaults.message.label).tagName).toBe('TEXTAREA')
    expect(screen.getByTestId('form-submit')).toHaveTextContent(defaults.submitLabel)
  })

  it('marks all three fields required, in the label text and with aria-required', () => {
    render()

    expect(screen.getAllByTestId('field-required')).toHaveLength(3)
    for (const label of [defaults.name.label, defaults.email.label, defaults.message.label]) {
      expect(control(label)).toHaveAttribute('aria-required', 'true')
    }
  })

  it('leaves native validation off, so the browser’s bubble never competes with the messages', () => {
    render()

    expect(screen.getByTestId('contact-form-element')).toHaveAttribute('novalidate')
  })
})

describe('ContactForm on an invalid submit', () => {
  it('moves focus to the first invalid field', async () => {
    render()

    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(document.activeElement).toBe(control(defaults.name.label))
    })
  })

  it('moves focus to the first field that is still invalid, not always the first field', async () => {
    render()

    await fill({ name: VALID.name })
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(document.activeElement).toBe(control(defaults.email.label))
    })
  })

  it('announces each field’s error through that field’s own alert', async () => {
    render()

    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByText(defaults.name.error)).toHaveAttribute('role', 'alert')
    })
    expect(screen.getByText(defaults.email.error)).toHaveAttribute('role', 'alert')
    expect(screen.getByText(defaults.message.error)).toHaveAttribute('role', 'alert')
  })

  it('marks the invalid fields and only those', async () => {
    render()

    await fill({ name: VALID.name })
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(control(defaults.email.label)).toHaveAttribute('aria-invalid', 'true')
    })
    expect(control(defaults.name.label)).not.toHaveAttribute('aria-invalid')
  })

  it('says what to do rather than what went wrong', async () => {
    render()

    await fill({ email: 'ada@' })
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByText(defaults.email.error)).toBeInTheDocument()
    })
    expect(defaults.email.error).toMatch(/^Enter/)
  })

  it('clears a field’s message once the reader has fixed it', async () => {
    render()

    await userEvent.click(screen.getByTestId('form-submit'))
    await waitFor(() => {
      expect(screen.getByText(defaults.email.error)).toBeInTheDocument()
    })

    await fill({ email: VALID.email })

    await waitFor(() => {
      expect(screen.queryByText(defaults.email.error)).toBeNull()
    })
    expect(control(defaults.email.label)).not.toHaveAttribute('aria-invalid')
  })

  it('never calls the handler', async () => {
    const onSubmit = vi.fn()

    render({ onSubmit })

    await userEvent.click(screen.getByTestId('form-submit'))
    await waitFor(() => {
      expect(screen.getByText(defaults.name.error)).toBeInTheDocument()
    })

    expect(onSubmit).not.toHaveBeenCalled()
  })
})

describe('ContactForm on a valid submit', () => {
  it('calls the handler with the values the reader typed', async () => {
    const onSubmit = vi.fn<(values: ContactValues) => void>()

    render({ onSubmit })

    await fill(VALID)
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1)
    })
    expect(onSubmit.mock.calls[0]?.[0]).toMatchObject(VALID)
  })

  it('replaces the form with a message that takes focus', async () => {
    render()

    await fill(VALID)
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('form-success')).toBeInTheDocument()
    })

    const panel = screen.getByTestId('form-success')

    expect(screen.queryByTestId('contact-form-element')).toBeNull()
    expect(panel).toHaveTextContent(defaults.successTitle)
    // `<output>` carries role=status implicitly, which is why the attribute is not on the element.
    expect(screen.getByRole('status')).toBe(panel)
    expect(document.activeElement).toBe(panel)
  })

  it('takes focus without adding a tab stop', async () => {
    render()

    await fill(VALID)
    await userEvent.click(screen.getByTestId('form-submit'))
    await waitFor(() => {
      expect(screen.getByTestId('form-success')).toBeInTheDocument()
    })

    expect(screen.getByTestId('form-success')).toHaveAttribute('tabindex', '-1')
  })

  it('announces a handler failure through the form’s own region, not a field’s error', async () => {
    render({
      onSubmit: () => {
        throw new Error('network')
      },
    })

    await fill(VALID)
    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('form-message')).toHaveTextContent(defaults.failureMessage)
    })

    const region = screen.getByTestId('form-message')

    expect(region).toHaveAttribute('aria-live', 'assertive')
    expect(screen.getByTestId('contact-form-element')).toBeInTheDocument()
    // No field of theirs is wrong, so none is marked.
    expect(control(defaults.email.label)).not.toHaveAttribute('aria-invalid')
  })
})

describe('ContactForm honeypot', () => {
  it('keeps a real, submittable input off-screen rather than removing it from the layout', () => {
    render()

    const trap = screen.getByTestId('honeypot')
    const input = trap.querySelector('input')

    // Off-screen, not `display: none`: a bot that reads the stylesheet skips a field it can see is hidden.
    expect(trap.className).not.toMatch(/(^|\s)hidden(\s|$)/)
    expect(trap.className).not.toContain('sr-only')
    expect(trap.className).toContain('-left-[9999px]')
    expect(input).toHaveAttribute('name', HONEYPOT_NAME)
    expect(input).toHaveAttribute('autocomplete', 'off')
  })

  it('keeps it out of the accessibility tree and out of the tab order', async () => {
    render()

    expect(screen.getByTestId('honeypot')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByTestId('honeypot').querySelector('input')).toHaveAttribute('tabindex', '-1')

    for (const label of [defaults.name.label, defaults.email.label, defaults.message.label]) {
      await userEvent.tab()
      expect(document.activeElement).toBe(control(label))
    }

    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByTestId('form-submit'))
  })

  it('succeeds without calling the handler when the trap is filled', async () => {
    const onSubmit = vi.fn()

    render({ onSubmit })

    await fill(VALID)

    const trap = screen.getByTestId('honeypot').querySelector('input')
    expect(trap).not.toBeNull()
    await userEvent.type(trap as HTMLInputElement, 'https://example.com')

    await userEvent.click(screen.getByTestId('form-submit'))

    await waitFor(() => {
      expect(screen.getByTestId('form-success')).toBeInTheDocument()
    })
    // Telling a bot it failed teaches it what to change.
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
