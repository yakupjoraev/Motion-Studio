import { screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { ButtonGroup } from './button-group'
import { buttonGroupDefinition as definition } from './button-group.definition'
import { multipleDefault, singleDefault } from './button-group.schema'

const THREE = [
  { label: 'Day', icon: '' },
  { label: 'Week', icon: '' },
  { label: 'Month', icon: '' },
]

describe('the uncontrolled default', () => {
  it('names the item at the index, and nothing outside the list', () => {
    expect(singleDefault(1, 3)).toBe('item-1')
    expect(singleDefault(-1, 3)).toBeUndefined()
    expect(singleDefault(5, 3)).toBeUndefined()
  })

  it('wraps the same answer in an array for multiple mode', () => {
    expect(multipleDefault(0, 3)).toEqual(['item-0'])
    expect(multipleDefault(-1, 3)).toEqual([])
  })
})

describe('ButtonGroup', () => {
  it('is a labelled radiogroup in single mode', () => {
    renderBlock(definition, ButtonGroup, { items: THREE })

    const group = screen.getByRole('radiogroup', { name: definition.defaults.ariaLabel })

    expect(group).toBeInTheDocument()
    expect(screen.getAllByRole('radio')).toHaveLength(3)
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'true')
  })

  it('is a toolbar of pressed buttons in multiple mode', () => {
    renderBlock(definition, ButtonGroup, { items: THREE, mode: 'multiple' })

    expect(screen.getByRole('toolbar', { name: definition.defaults.ariaLabel })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('starts with nothing selected at −1', () => {
    renderBlock(definition, ButtonGroup, { items: THREE, defaultSelected: -1 })

    for (const item of screen.getAllByRole('radio')) {
      expect(item).toHaveAttribute('aria-checked', 'false')
    }
  })

  it('is one tab stop, with the arrow keys moving between the choices', async () => {
    renderBlock(definition, ButtonGroup, { items: THREE })

    await userEvent.tab()

    expect(screen.getByRole('radio', { name: 'Day' })).toHaveFocus()

    await userEvent.keyboard('{ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Week' })).toHaveFocus()

    await userEvent.tab()

    expect(document.body).toHaveFocus()
  })

  /*
   * The ARIA radio pattern, and the reason this block uses Radix Radio Group rather than Toggle Group for
   * single selection — ADR-208. Toggle Group moves focus and leaves the selection where it was.
   *
   * The key is pressed and released as two events rather than through `keyboard('{ArrowRight}')`, because
   * that shorthand wraps the pair in one `act` and Radix's mechanism runs between them: the keydown marks
   * an arrow as held, the focus move fires `focusin`, and the item clicks itself only while the mark is
   * still there. A browser dispatches those in exactly this order; the shorthand does not.
   */
  it('checks the choice the arrow keys move to, not just focuses it', async () => {
    renderBlock(definition, ButtonGroup, { items: THREE })

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight>}')

    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByRole('radio', { name: 'Day' })).toHaveAttribute('aria-checked', 'false')

    await userEvent.keyboard('{/ArrowRight}')

    expect(screen.getByRole('radio', { name: 'Week' })).toHaveAttribute('aria-checked', 'true')
  })

  /** Multiple mode is a toolbar: the arrows move, and pressing is the separate action. */
  it('moves without pressing in multiple mode', async () => {
    renderBlock(definition, ButtonGroup, { items: THREE, mode: 'multiple', defaultSelected: -1 })

    await userEvent.tab()
    await userEvent.keyboard('{ArrowRight>}')

    expect(screen.getByRole('button', { name: 'Week' })).toHaveFocus()
    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'false')

    await userEvent.keyboard('{/ArrowRight}')
    await userEvent.keyboard(' ')

    expect(screen.getByRole('button', { name: 'Week' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('selects more than one in multiple mode', async () => {
    renderBlock(definition, ButtonGroup, { items: THREE, mode: 'multiple' })

    await userEvent.click(screen.getByRole('button', { name: 'Month' }))

    expect(screen.getByRole('button', { name: 'Day' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Month' })).toHaveAttribute('aria-pressed', 'true')
  })

  /* ADR-206's neighbour: the selection lives in Radix, so nothing this block re-renders can reset it. */
  it('keeps its selection when an unrelated prop changes', async () => {
    const view = renderBlock(definition, ButtonGroup, { items: THREE })

    await userEvent.click(screen.getByRole('radio', { name: 'Month' }))

    view.rerender(
      <ButtonGroup
        {...definition.propsSchema.parse({ items: THREE, ariaLabel: 'Range', look: 'segmented' })}
      />,
    )

    expect(screen.getByRole('radio', { name: 'Month' })).toHaveAttribute('aria-checked', 'true')
  })

  /*
   * One class list for two primitives: `data-state` is `checked` on a Radio Group item and `on` on a Toggle
   * Group item, so both selectors are written out — ADR-208. This asserts the pair rather than the comment.
   */
  it.each([
    ['single', 'checked', 'data-[state=checked]:bg-accent'] as const,
    ['multiple', 'on', 'data-[state=on]:bg-accent'] as const,
  ])('carries the selected state as a surface and a weight in %s mode', (mode, state, selector) => {
    renderBlock(definition, ButtonGroup, { items: THREE, mode })

    const first = requireAt(screen.getAllByTestId('button-group-item'), 0)

    expect(first.className).toContain(selector)
    expect(first.className).toContain(`data-[state=${state}]:font-semibold`)
    expect(first).toHaveAttribute('data-state', state)
  })

  it('hides itself with the responsive visibility class', () => {
    renderBlock(definition, ButtonGroup, { hidden: true })

    expect(screen.getByTestId('button-group').className).toContain('hidden')
  })

  it('validates its own defaults', () => {
    expect(() => definition.propsSchema.parse(definition.defaults)).not.toThrow()
  })

  it.each(['single', 'multiple'] as const)('has no axe violations in %s mode', async (mode) => {
    const { container } = renderBlock(definition, ButtonGroup, { items: THREE, mode })

    await expectNoViolations(container)
  })
})
