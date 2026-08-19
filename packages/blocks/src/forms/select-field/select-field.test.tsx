import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { SelectField } from './select-field'
import { selectFieldDefinition } from './select-field.definition'
import { selectFieldSchema, startingValue } from './select-field.schema'

const defaults = selectFieldDefinition.defaults

const render = (overrides: Partial<typeof defaults> = {}) =>
  renderBlock(selectFieldDefinition, SelectField, overrides)

/**
 * Radix Select measures and scrolls its list when it opens, and jsdom implements none of the three methods it
 * reaches for. Stubbed here rather than in the shared setup file: one block needs them, and a global stub would
 * hide a missing method from every other test in the package.
 */
beforeAll(() => {
  Element.prototype.scrollIntoView = () => undefined
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => undefined
})

describe('SelectField', () => {
  it('validates its own defaults', () => {
    expect(() => selectFieldSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations, valid or invalid', async () => {
    const valid = render()
    await expectNoViolations(valid.container)
    valid.unmount()

    const invalid = render({ required: true, error: 'Choose an export target.' })
    await expectNoViolations(invalid.container)
  })

  it('names the trigger by its label and its current value', () => {
    render({ defaultValue: 'next' })

    // A `<label for>` is not part of a button's name computation, so `aria-labelledby` carries both halves.
    expect(screen.getByTestId('field-control')).toHaveAccessibleName(
      `${defaults.label} ${requireAt(defaults.options, 1).label}`,
    )
  })

  it('names the trigger by its label and the placeholder before a choice is made', () => {
    render()

    expect(screen.getByTestId('field-control')).toHaveAccessibleName(
      `${defaults.label} ${defaults.placeholder}`,
    )
  })

  it('still reaches the control when the label is clicked', async () => {
    render()

    await userEvent.click(screen.getByText(defaults.label))

    // The htmlFor does its job: the click lands on the trigger, which opens the list the way a select should.
    expect(screen.getByTestId('field-control')).toHaveAttribute('aria-expanded', 'true')
  })

  it('carries the same wiring the text field does', () => {
    render({ required: true, error: 'Choose an export target.' })

    const trigger = screen.getByTestId('field-control')
    const [hintId, errorId] = (trigger.getAttribute('aria-describedby') ?? '').split(' ')

    expect(document.getElementById(hintId ?? '')).toBe(screen.getByTestId('field-hint'))
    expect(document.getElementById(errorId ?? '')).toBe(screen.getByTestId('field-error'))
    expect(trigger).toHaveAttribute('aria-invalid', 'true')
    expect(trigger).toHaveAttribute('aria-required', 'true')
  })

  it('leaves aria-invalid off while the field is valid', () => {
    render()

    expect(screen.getByTestId('field-control')).not.toHaveAttribute('aria-invalid')
  })

  it('opens from the keyboard and offers every option', async () => {
    render()

    await userEvent.tab()
    expect(document.activeElement).toBe(screen.getByTestId('field-control'))

    await userEvent.keyboard('{Enter}')

    const options = await screen.findAllByRole('option')

    expect(options).toHaveLength(defaults.options.length)
    for (const [index, option] of defaults.options.entries()) {
      expect(requireAt(options, index)).toHaveTextContent(option.label)
    }
  })

  it('chooses an option from the keyboard and returns focus to the trigger', async () => {
    render()

    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await screen.findAllByRole('option')
    await userEvent.keyboard('{ArrowDown}{Enter}')

    const trigger = screen.getByTestId('field-control')

    expect(trigger).toHaveTextContent(requireAt(defaults.options, 1).label)
    expect(document.activeElement).toBe(trigger)
  })

  it('gives two instances on one page distinct ids', () => {
    renderBlock(selectFieldDefinition, SelectField, { label: 'Primary target' })
    renderBlock(selectFieldDefinition, SelectField, { label: 'Fallback target' })

    const [first, second] = screen.getAllByTestId('field-control')

    expect(first?.id).not.toBe(second?.id)
    expect(first).toHaveAccessibleName(`Primary target ${defaults.placeholder}`)
    expect(second).toHaveAccessibleName(`Fallback target ${defaults.placeholder}`)
  })
})

describe('startingValue', () => {
  it('ignores a value no option carries, so the trigger keeps its placeholder', () => {
    expect(startingValue('svelte', defaults.options)).toBeUndefined()
    expect(startingValue('', defaults.options)).toBeUndefined()
  })

  it('accepts a value an option carries', () => {
    expect(startingValue('html', defaults.options)).toBe('html')
  })
})
