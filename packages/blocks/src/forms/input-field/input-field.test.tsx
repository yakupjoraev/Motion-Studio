import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { InputField } from './input-field'
import { inputFieldDefinition } from './input-field.definition'
import { inputFieldSchema } from './input-field.schema'

const defaults = inputFieldDefinition.defaults

const render = (overrides: Partial<typeof defaults> = {}) =>
  renderBlock(inputFieldDefinition, InputField, overrides)

describe('InputField', () => {
  it('validates its own defaults', () => {
    expect(() => inputFieldSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations, valid or invalid', async () => {
    const valid = render()
    await expectNoViolations(valid.container)
    valid.unmount()

    const invalid = render({ required: true, error: 'Enter a valid email address.' })
    await expectNoViolations(invalid.container)
  })

  it('associates the label with the control', () => {
    render()

    const control = screen.getByLabelText(defaults.label)

    expect(control).toBe(screen.getByTestId('field-control'))
    expect(control.tagName).toBe('INPUT')
  })

  it('focuses the control when the label is clicked', async () => {
    render()

    await userEvent.click(screen.getByText(defaults.label))

    expect(document.activeElement).toBe(screen.getByTestId('field-control'))
  })

  it('renders a textarea with the same wiring in multiline mode', () => {
    render({ multiline: true })

    const control = screen.getByLabelText(defaults.label)

    expect(control.tagName).toBe('TEXTAREA')
    expect(control).toHaveAttribute('aria-describedby')
  })
})

describe('InputField wiring', () => {
  it('describes the field by its hint and then its error, in that order', () => {
    render({ error: 'Enter a valid email address.' })

    const control = screen.getByTestId('field-control')
    const [hintId, errorId] = (control.getAttribute('aria-describedby') ?? '').split(' ')

    expect(document.getElementById(hintId ?? '')).toBe(screen.getByTestId('field-hint'))
    expect(document.getElementById(errorId ?? '')).toBe(screen.getByTestId('field-error'))
  })

  it('names only ids that are in the document', () => {
    render({ hint: '' })

    const control = screen.getByTestId('field-control')
    const ids = (control.getAttribute('aria-describedby') ?? '').split(' ')

    expect(screen.queryByTestId('field-hint')).toBeNull()
    for (const id of ids) {
      expect(document.getElementById(id), id).not.toBeNull()
    }
  })

  it('keeps the error element in the DOM while the field is valid', () => {
    render()

    const error = screen.getByTestId('field-error')

    // A role="alert" inserted at the same moment as its text is a region most screen readers do not read.
    expect(error).toHaveAttribute('role', 'alert')
    expect(error.textContent).toBe('')
  })

  it('announces the error through the alert once it has text', () => {
    render({ error: 'Enter a valid email address.' })

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email address.')
  })

  it('sets aria-invalid only when the field is actually invalid', () => {
    const { unmount } = render()
    expect(screen.getByTestId('field-control')).not.toHaveAttribute('aria-invalid')
    unmount()

    render({ error: 'Enter a valid email address.' })
    expect(screen.getByTestId('field-control')).toHaveAttribute('aria-invalid', 'true')
  })

  it('marks a required field in its label text and with aria-required', () => {
    render({ required: true })

    expect(screen.getByTestId('field-required')).toHaveTextContent('(required)')
    expect(screen.getByTestId('field-control')).toHaveAttribute('aria-required', 'true')
  })

  it('keeps the requirement out of the accessible name, so it is announced once', () => {
    render({ required: true })

    /*
     * The accessible name is the label alone: the visible marking is `aria-hidden`, so it is skipped by the
     * name computation and `aria-required` is the only place the state is announced from.
     *
     * `getByLabelText` would fail here and that is not a defect — it matches the label element's whole text
     * content, `aria-hidden` included, which is not what a screen reader computes.
     */
    expect(screen.getByTestId('field-control')).toHaveAccessibleName(defaults.label)
    expect(screen.getByTestId('field-required')).toHaveAttribute('aria-hidden', 'true')
  })

  it('leaves aria-required off a field that is not required', () => {
    render()

    expect(screen.getByTestId('field-control')).not.toHaveAttribute('aria-required')
    expect(screen.queryByTestId('field-required')).toBeNull()
  })

  it('gives two instances on one page distinct ids', () => {
    const props = inputFieldSchema.parse({})

    renderBlock(inputFieldDefinition, InputField, { label: 'Work email' })
    renderBlock(inputFieldDefinition, InputField, { label: 'Personal email' })

    const [first, second] = screen.getAllByTestId('field-control')

    expect(props.label.length).toBeGreaterThan(0)
    expect(first?.id).not.toBe(second?.id)
    expect(first?.getAttribute('aria-describedby')).not.toBe(
      second?.getAttribute('aria-describedby'),
    )
    expect(screen.getByLabelText('Work email')).toBe(first)
    expect(screen.getByLabelText('Personal email')).toBe(second)
  })

  it('carries the autofill token, and drops the attribute when the author cleared it', () => {
    const { unmount } = render()
    expect(screen.getByTestId('field-control')).toHaveAttribute('autocomplete', 'email')
    unmount()

    render({ autoComplete: '' })
    expect(screen.getByTestId('field-control')).not.toHaveAttribute('autocomplete')
  })

  it('leaves native validation off, so the browser’s own bubble never competes with the message', () => {
    render({ required: true })

    expect(screen.getByTestId('field-control')).not.toHaveAttribute('required')
  })
})
