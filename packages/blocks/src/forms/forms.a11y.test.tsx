import type { RenderResult } from '@testing-library/react'
import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { beforeAll, describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../test/render-block'
import { requireAt } from '../test/require-at'

import { CheckboxField } from './checkbox-field/checkbox-field'
import { checkboxFieldDefinition } from './checkbox-field/checkbox-field.definition'
import { ContactForm } from './contact-form/contact-form'
import { contactFormDefinition } from './contact-form/contact-form.definition'
import { definitions } from './definitions'
import { InputField } from './input-field/input-field'
import { inputFieldDefinition } from './input-field/input-field.definition'
import { SelectField } from './select-field/select-field'
import { selectFieldDefinition } from './select-field/select-field.definition'
import { WaitlistForm } from './waitlist-form/waitlist-form'
import { waitlistFormDefinition } from './waitlist-form/waitlist-form.definition'

/**
 * The category's own gate: the wiring prompt 41 specifies, asserted for **every** block that renders a field
 * rather than block by block. This is the file that makes the structure a contract instead of five coincidences.
 *
 * The cases are written out rather than derived from `components`, for the reason the interactive category's gate
 * gives: deriving them would need a cast from the render registry's `ComponentType<never>` back to each block's
 * props, and § 1 of the contract has no room for one.
 */
interface Case {
  readonly id: string
  /** How many tab stops the block adds at its defaults. */
  readonly tabStops: number
  readonly render: (invalid: boolean) => RenderResult
}

const INVALID = 'Enter something we can use.'

const CASES: readonly Case[] = [
  {
    id: 'input-field',
    tabStops: 1,
    render: (invalid) =>
      renderBlock(inputFieldDefinition, InputField, invalid ? { error: INVALID } : {}),
  },
  {
    id: 'select-field',
    tabStops: 1,
    render: (invalid) =>
      renderBlock(selectFieldDefinition, SelectField, invalid ? { error: INVALID } : {}),
  },
  {
    id: 'checkbox-field',
    // One stop per checkbox: a checkbox group is not a radio group and does not rove.
    tabStops: checkboxFieldDefinition.defaults.choices.length,
    render: (invalid) =>
      renderBlock(checkboxFieldDefinition, CheckboxField, invalid ? { error: INVALID } : {}),
  },
  {
    id: 'contact-form',
    // Three fields and the submit. The honeypot is not a stop, which is the point of it.
    tabStops: 4,
    render: () => renderBlock(contactFormDefinition, ContactForm),
  },
  {
    id: 'waitlist-form',
    tabStops: 2,
    render: () => renderBlock(waitlistFormDefinition, WaitlistForm),
  },
]

/** Radix Select measures and scrolls its list when it opens; jsdom implements none of the three methods. */
beforeAll(() => {
  Element.prototype.scrollIntoView = () => undefined
  Element.prototype.hasPointerCapture = () => false
  Element.prototype.releasePointerCapture = () => undefined
})

describe.each(CASES.map((one) => [one.id, one] as const))('%s', (id, subject) => {
  it('has no axe violations at its defaults', async () => {
    const { container } = subject.render(false)

    await expectNoViolations(container)
  })

  it('renders a label element for every control, never a placeholder in its place', () => {
    const { container } = subject.render(false)

    const labels = [...container.querySelectorAll('label'), ...container.querySelectorAll('legend')]

    expect(labels.length, id).toBeGreaterThan(0)
    for (const label of labels) {
      expect(label.textContent?.trim().length, `${id}: empty label`).toBeGreaterThan(0)
    }
  })

  it('points every label at a control that exists', () => {
    const { container } = subject.render(false)

    for (const label of container.querySelectorAll('label[for]')) {
      const target = label.getAttribute('for') ?? ''

      expect(document.getElementById(target), `${id}: ${target}`).not.toBeNull()
    }
  })

  it('describes its control by ids that are all in the document', () => {
    const { container } = subject.render(false)

    const described = [...container.querySelectorAll('[aria-describedby]')]

    expect(described.length, id).toBeGreaterThan(0)
    for (const element of described) {
      for (const reference of (element.getAttribute('aria-describedby') ?? '').split(' ')) {
        expect(document.getElementById(reference), `${id}: ${reference}`).not.toBeNull()
      }
    }
  })

  it('keeps an alert in the DOM before it has anything to say', () => {
    subject.render(false)

    const alerts = screen.getAllByTestId('field-error')

    expect(alerts.length, id).toBeGreaterThan(0)
    for (const alert of alerts) {
      expect(alert, id).toHaveAttribute('role', 'alert')
      expect(alert.textContent, id).toBe('')
    }
  })

  it('leaves aria-invalid off while it is valid', () => {
    const { container } = subject.render(false)

    expect(container.querySelectorAll('[aria-invalid]'), id).toHaveLength(0)
  })

  it('reaches the end of its own tab order and lets the page continue', async () => {
    subject.render(false)

    for (let stop = 0; stop < subject.tabStops; stop += 1) {
      await userEvent.tab()
      expect(document.activeElement, `${id}: stop ${stop + 1}`).not.toBe(document.body)
    }

    await userEvent.tab()

    expect(document.activeElement, id).toBe(document.body)
  })

  it('draws its focus ring on the control rather than inheriting one', () => {
    const { container } = subject.render(false)

    const focusable = [
      ...container.querySelectorAll('input:not([tabindex="-1"])'),
      ...container.querySelectorAll('textarea'),
      ...container.querySelectorAll('button'),
    ]

    expect(focusable.length, id).toBeGreaterThan(0)
    for (const control of focusable) {
      expect(control.className, `${id}: ${control.outerHTML.slice(0, 80)}`).toContain(
        'focus-visible:outline',
      )
    }
  })
})

/** The three field blocks carry their error as a prop, which is what lets the invalid half be asserted here. */
const FIELD_CASES = CASES.filter((one) => !one.id.endsWith('-form'))

describe.each(FIELD_CASES.map((one) => [one.id, one] as const))(
  '%s when invalid',
  (id, subject) => {
    it('has no axe violations', async () => {
      const { container } = subject.render(true)

      await expectNoViolations(container)
    })

    it('announces the message through an alert', () => {
      subject.render(true)

      expect(screen.getByRole('alert'), id).toHaveTextContent(INVALID)
    })

    it('marks the control invalid, and only then', () => {
      const { container } = subject.render(true)

      expect(container.querySelectorAll('[aria-invalid="true"]').length, id).toBeGreaterThan(0)
    })

    it('lists the hint before the error in the description', () => {
      const { container } = subject.render(true)

      const described = requireAt([...container.querySelectorAll('[aria-describedby]')], 0)
      const [first, second] = (described.getAttribute('aria-describedby') ?? '').split(' ')

      expect(document.getElementById(first ?? ''), id).toBe(screen.getByTestId('field-hint'))
      expect(document.getElementById(second ?? ''), id).toBe(screen.getByTestId('field-error'))
    })
  },
)

/**
 * The three field blocks, each as two thunks rather than as a tuple of definition and component.
 *
 * A tuple would widen the three definitions into a union and `renderBlock` would no longer be able to match a
 * definition to its own props — the compiler's whole contribution here. Two thunks per block keep every call
 * concrete, and § 1 of the contract has no room for the cast that would have papered over it.
 */
const FIELD_BLOCKS: readonly {
  readonly id: string
  readonly twice: () => void
  readonly required: () => RenderResult
}[] = [
  {
    id: 'input-field',
    twice: () => {
      renderBlock(inputFieldDefinition, InputField, { label: 'First' })
      renderBlock(inputFieldDefinition, InputField, { label: 'Second' })
    },
    required: () => renderBlock(inputFieldDefinition, InputField, { required: true }),
  },
  {
    id: 'select-field',
    twice: () => {
      renderBlock(selectFieldDefinition, SelectField, { label: 'First' })
      renderBlock(selectFieldDefinition, SelectField, { label: 'Second' })
    },
    required: () => renderBlock(selectFieldDefinition, SelectField, { required: true }),
  },
  {
    id: 'checkbox-field',
    twice: () => {
      renderBlock(checkboxFieldDefinition, CheckboxField, { label: 'First' })
      renderBlock(checkboxFieldDefinition, CheckboxField, { label: 'Second' })
    },
    required: () => renderBlock(checkboxFieldDefinition, CheckboxField, { required: true }),
  },
]

describe.each(FIELD_BLOCKS.map((one) => [one.id, one] as const))(
  'two instances of %s on one page',
  (id, subject) => {
    it('generates distinct ids for both', () => {
      // The `useId` requirement, and the reason it is one: an author will place the same block twice.
      subject.twice()

      const controls = screen.getAllByTestId('field-control')
      const described = controls.map((control) => control.getAttribute('aria-describedby'))

      expect(controls.length, id).toBe(2)
      expect(new Set(described).size, id).toBe(2)

      /*
       * Every id in the document is its own, which is the assertion that holds for all three: the choice group's
       * control is a `<fieldset>` and carries no id of its own, while each of its choices does.
       */
      const generated = [...document.querySelectorAll('[id]')].map((element) => element.id)

      expect(generated.length, id).toBeGreaterThan(2)
      expect(new Set(generated).size, id).toBe(generated.length)

      for (const element of controls) {
        for (const reference of (element.getAttribute('aria-describedby') ?? '').split(' ')) {
          expect(document.getElementById(reference), `${id}: ${reference}`).not.toBeNull()
        }
      }
    })

    it('marks the requirement in the label text and with an attribute, each exactly once', () => {
      const { container } = subject.required()

      const mark = screen.getByTestId('field-required')

      expect(mark, id).toHaveTextContent('(required)')
      // `aria-hidden`, so the requirement is announced by the attribute rather than twice.
      expect(mark, id).toHaveAttribute('aria-hidden', 'true')
      expect(container.querySelectorAll('[aria-required="true"]').length, id).toBeGreaterThan(0)
    })
  },
)

describe('the category as a whole', () => {
  it('says something about its wiring, per block', () => {
    for (const definition of Object.values(definitions)) {
      expect(definition.category, definition.id).toBe('forms')
      expect(definition.a11y.notes.length, definition.id).toBeGreaterThanOrEqual(5)
      expect(
        definition.a11y.notes.some((note) =>
          /aria-describedby|aria-invalid|aria-required|role="alert"|label|focus/i.test(note),
        ),
        definition.id,
      ).toBe(true)
    }
  })
})
