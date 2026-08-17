import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../../test/axe'

import { controlLabelProps } from './control-labels'
import { ControlRow } from './control-row'

import type { ControlSlotProps } from './control-row.types'

/** A `div`-based composite, because that is the case `htmlFor` cannot serve on its own. */
const Composite = (slot: ControlSlotProps): ReactElement => (
  <div
    id={slot.id}
    role="group"
    tabIndex={-1}
    data-testid="composite"
    aria-describedby={slot.describedBy}
    data-mixed={slot.mixed ? '' : undefined}
    {...controlLabelProps('Radius', slot.labelledBy)}
  />
)

const reset = (): HTMLElement => screen.getByRole('button', { name: 'Reset Radius' })

describe('ControlRow', () => {
  it('names the control it hosts with its own label', () => {
    render(<ControlRow label="Radius">{Composite}</ControlRow>)

    expect(screen.getByTestId('composite')).toHaveAccessibleName('Radius')
  })

  it('links the label to the control it hosts', () => {
    render(<ControlRow label="Radius">{Composite}</ControlRow>)

    expect(screen.getByText('Radius')).toHaveAttribute(
      'for',
      screen.getByTestId('composite').getAttribute('id'),
    )
  })

  it('focuses a composite control when its label is clicked', async () => {
    const user = userEvent.setup()

    render(<ControlRow label="Radius">{Composite}</ControlRow>)
    await user.click(screen.getByText('Radius'))

    expect(screen.getByTestId('composite')).toHaveFocus()
  })

  it('puts the marker in the gutter and its words on the control', () => {
    render(
      <ControlRow
        description="Overridden at Medium"
        indicator={<span data-testid="marker" />}
        label="Radius"
        modified
        onReset={() => undefined}
      >
        {Composite}
      </ControlRow>,
    )

    // ADR-161: the visible marker and the description a screen reader hears are one call, so they
    // cannot disagree.
    expect(screen.getByTestId('marker')).toBeInTheDocument()
    expect(screen.getByTestId('composite')).toHaveAccessibleDescription('Overridden at Medium')
  })

  it('offers the reset affordance without a marker when the value merely differs', () => {
    render(
      <ControlRow label="Radius" modified onReset={() => undefined}>
        {Composite}
      </ControlRow>,
    )

    expect(screen.queryByTestId('marker')).toBeNull()
    expect(screen.getByTestId('composite')).not.toHaveAccessibleDescription()
    expect(reset()).toBeEnabled()
  })

  it('passes the mixed state down to the control', () => {
    render(
      <ControlRow label="Radius" mixed>
        {Composite}
      </ControlRow>,
    )

    expect(screen.getByTestId('composite')).toHaveAttribute('data-mixed')
  })

  it('resets on demand', async () => {
    const user = userEvent.setup()
    const onReset = vi.fn()

    render(
      <ControlRow label="Radius" modified onReset={onReset}>
        {Composite}
      </ControlRow>,
    )
    await user.click(reset())

    expect(onReset).toHaveBeenCalledTimes(1)
  })

  it('keeps the reset affordance out of the tab order while there is nothing to reset', () => {
    render(
      <ControlRow label="Radius" onReset={() => undefined}>
        {Composite}
      </ControlRow>,
    )

    expect(reset()).toBeDisabled()
    expect(reset()).toHaveAttribute('tabindex', '-1')
  })

  it('cannot be reset when the caller offers no handler', () => {
    render(
      <ControlRow label="Radius" modified>
        {Composite}
      </ControlRow>,
    )

    expect(reset()).toBeDisabled()
  })

  it('has no axe violations in any of the three states', async () => {
    const { container } = render(
      <>
        <ControlRow
          description="Overridden at Medium"
          indicator={<span />}
          label="Radius"
          modified
          onReset={() => undefined}
        >
          {(slot) => <Composite {...slot} />}
        </ControlRow>
        <ControlRow label="Padding" modified onReset={() => undefined}>
          {(slot) => (
            <div id={slot.id} role="group" tabIndex={-1} aria-labelledby={slot.labelledBy} />
          )}
        </ControlRow>
        <ControlRow label="Gap" mixed>
          {(slot) => (
            <div id={slot.id} role="group" tabIndex={-1} aria-labelledby={slot.labelledBy} />
          )}
        </ControlRow>
      </>,
    )

    await expectNoViolations(container)
  })
})

describe('controlLabelProps', () => {
  it('names a control by the row label when it has one', () => {
    expect(controlLabelProps('Radius', 'row-label')).toEqual({ 'aria-labelledby': 'row-label' })
  })

  it('falls back to naming itself', () => {
    expect(controlLabelProps('Radius')).toEqual({ 'aria-label': 'Radius' })
  })
})
