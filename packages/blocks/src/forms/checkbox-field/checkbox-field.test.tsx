import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { CheckboxField } from './checkbox-field'
import { checkboxFieldDefinition } from './checkbox-field.definition'
import { checkboxFieldSchema, startingChoice } from './checkbox-field.schema'

const defaults = checkboxFieldDefinition.defaults

const render = (overrides: Partial<typeof defaults> = {}) =>
  renderBlock(checkboxFieldDefinition, CheckboxField, overrides)

const RADIOS = defaults.choices.map((choice) => ({ ...choice, checked: false }))

describe('CheckboxField', () => {
  it('validates its own defaults', () => {
    expect(() => checkboxFieldSchema.parse(defaults)).not.toThrow()
  })

  it('has no axe violations in either mode, valid or invalid', async () => {
    for (const overrides of [
      {},
      { required: true, error: 'Choose at least one topic.' },
      { mode: 'radio' as const },
      { mode: 'radio' as const, required: true, error: 'Choose one.' },
    ]) {
      const { container, unmount } = render(overrides)

      await expectNoViolations(container)
      unmount()
    }
  })

  it('groups the choices under a legend that is the question', () => {
    render()

    expect(screen.getByRole('group', { name: defaults.label })).toBe(
      screen.getByTestId('field-control'),
    )
    expect(screen.getAllByRole('checkbox')).toHaveLength(defaults.choices.length)
  })

  it('renders radios rather than checkboxes in radio mode', () => {
    render({ mode: 'radio', choices: RADIOS })

    expect(screen.getAllByRole('radio')).toHaveLength(RADIOS.length)
    expect(screen.queryAllByRole('checkbox')).toHaveLength(0)
  })

  it('labels every choice, and the label reaches its own box', async () => {
    render()

    for (const choice of defaults.choices) {
      expect(screen.getByRole('checkbox', { name: choice.label })).toBeInTheDocument()
    }

    const first = requireAt(defaults.choices, 1)

    await userEvent.click(screen.getByText(first.label))
    expect(screen.getByRole('checkbox', { name: first.label })).toBeChecked()
  })

  it('starts the choices the author checked in the checked state', () => {
    render()

    for (const choice of defaults.choices) {
      const box = screen.getByRole('checkbox', { name: choice.label })

      if (choice.checked) {
        expect(box).toBeChecked()
      } else {
        expect(box).not.toBeChecked()
      }
    }
  })

  it('takes only the first checked choice in radio mode', () => {
    const choices = defaults.choices.map((choice) => ({ ...choice, checked: true }))

    render({ mode: 'radio', choices })

    expect(
      screen.getAllByRole('radio').filter((radio) => (radio as HTMLInputElement).checked),
    ).toHaveLength(1)
    expect(screen.getByRole('radio', { name: requireAt(choices, 0).label })).toBeChecked()
  })

  it('gives a radio group one tab stop and moves within it by arrow', async () => {
    render({ mode: 'radio', choices: RADIOS })

    await userEvent.tab()
    expect(document.activeElement).toBe(
      screen.getByRole('radio', { name: requireAt(RADIOS, 0).label }),
    )

    await userEvent.keyboard('{ArrowDown}')
    const second = screen.getByRole('radio', { name: requireAt(RADIOS, 1).label })
    expect(document.activeElement).toBe(second)
    // The arrow checks as well as moves, which is the native behaviour a reimplementation tends to lose.
    expect(second).toBeChecked()

    await userEvent.tab()
    expect(document.activeElement).toBe(document.body)
  })

  it('gives every checkbox its own tab stop', async () => {
    render()

    for (const choice of defaults.choices) {
      await userEvent.tab()
      expect(document.activeElement).toBe(screen.getByRole('checkbox', { name: choice.label }))
    }
  })
})

describe('CheckboxField wiring', () => {
  it('describes the group by its hint and then its error', () => {
    render({ error: 'Choose at least one topic.' })

    const group = screen.getByTestId('field-control')
    const [hintId, errorId] = (group.getAttribute('aria-describedby') ?? '').split(' ')

    expect(document.getElementById(hintId ?? '')).toBe(screen.getByTestId('field-hint'))
    expect(document.getElementById(errorId ?? '')).toBe(screen.getByTestId('field-error'))
  })

  it('keeps the error element in the DOM while the group is valid', () => {
    render()

    expect(screen.getByTestId('field-error')).toHaveAttribute('role', 'alert')
    expect(screen.getByTestId('field-error').textContent).toBe('')
  })

  it('sets aria-invalid on the group only when it is actually invalid', () => {
    const { unmount } = render()
    expect(screen.getByTestId('field-control')).not.toHaveAttribute('aria-invalid')
    unmount()

    render({ error: 'Choose at least one topic.' })
    expect(screen.getByTestId('field-control')).toHaveAttribute('aria-invalid', 'true')
  })

  it('marks a required group in its legend and on every input', () => {
    render({ required: true })

    expect(screen.getByTestId('field-required')).toHaveTextContent('(required)')
    for (const box of screen.getAllByRole('checkbox')) {
      expect(box).toHaveAttribute('aria-required', 'true')
    }
    // The legend's marking is aria-hidden, so the group's name stays the question alone.
    expect(screen.getByRole('group', { name: defaults.label })).toBeInTheDocument()
  })

  it('points a choice’s own hint at that choice rather than at the group', () => {
    render()

    const withHint = requireAt(defaults.choices, 0)
    const box = screen.getByRole('checkbox', { name: withHint.label })
    const described = box.getAttribute('aria-describedby') ?? ''

    expect(document.getElementById(described)).toHaveTextContent(withHint.hint)
    expect(
      screen.getByRole('checkbox', { name: requireAt(defaults.choices, 1).label }),
    ).not.toHaveAttribute('aria-describedby')
  })

  it('gives two instances on one page distinct choice ids', () => {
    renderBlock(checkboxFieldDefinition, CheckboxField, { label: 'Topics', name: 'topics' })
    renderBlock(checkboxFieldDefinition, CheckboxField, { label: 'Other topics', name: 'other' })

    const ids = screen.getAllByTestId('choice-input').map((input) => input.id)

    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('startingChoice', () => {
  it('answers nothing for a checkbox group, where every choice carries its own state', () => {
    expect(startingChoice('checkbox', defaults.choices)).toBeUndefined()
  })

  it('takes the first checked choice for a radio group', () => {
    expect(startingChoice('radio', defaults.choices)).toBe(requireAt(defaults.choices, 0).value)
    expect(startingChoice('radio', RADIOS)).toBeUndefined()
  })
})
