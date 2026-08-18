import { act, fireEvent, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { TooltipTarget } from './tooltip-target'
import { tooltipTargetDefinition as definition } from './tooltip-target.definition'

const defaults = definition.defaults

const trigger = (): HTMLElement => screen.getByTestId('tooltip-trigger')
const bubble = (): HTMLElement => screen.getByTestId('tooltip-bubble')

afterEach(() => {
  vi.useRealTimers()
})

describe('TooltipTarget', () => {
  it('puts the description on the control itself', () => {
    renderBlock(definition, TooltipTarget)

    expect(trigger()).toHaveAccessibleName(defaults.label)
    expect(trigger()).toHaveAccessibleDescription(defaults.content)
  })

  /* ADR-202: a bubble that mounted on hover is a description a screen-reader user never receives. */
  it('keeps the bubble in the accessibility tree while it is not showing', () => {
    renderBlock(definition, TooltipTarget)

    expect(bubble()).toHaveAttribute('data-state', 'closed')
    expect(bubble()).toBeInTheDocument()
    expect(bubble()).not.toHaveAttribute('hidden')
    expect(bubble().className).toContain('opacity-0')
  })

  it('shows on focus, without the hover delay', async () => {
    renderBlock(definition, TooltipTarget)

    await userEvent.tab()

    expect(trigger()).toHaveFocus()
    expect(bubble()).toHaveAttribute('data-state', 'open')
  })

  it('hides again when focus leaves', async () => {
    renderBlock(definition, TooltipTarget)

    await userEvent.tab()
    await userEvent.tab()

    expect(bubble()).toHaveAttribute('data-state', 'closed')
  })

  /*
   * `fireEvent` rather than `userEvent` for this one: `userEvent` awaits its own timers between steps, and with
   * fake timers installed the pair deadlock. The event under test is a single `pointerenter`, so dispatching it
   * directly is both the smaller tool and the exact thing a browser sends.
   */
  it('waits out the delay before showing on hover', () => {
    vi.useFakeTimers()
    renderBlock(definition, TooltipTarget, { delay: 300 })

    act(() => {
      fireEvent.pointerEnter(screen.getByTestId('tooltip-target'))
    })

    expect(bubble()).toHaveAttribute('data-state', 'closed')

    act(() => {
      vi.advanceTimersByTime(300)
    })

    expect(bubble()).toHaveAttribute('data-state', 'open')
  })

  it('shows at once when the delay is zero', async () => {
    renderBlock(definition, TooltipTarget, { delay: 0 })

    await userEvent.hover(screen.getByTestId('tooltip-target'))

    expect(bubble()).toHaveAttribute('data-state', 'open')
  })

  it('hides when the pointer leaves', async () => {
    renderBlock(definition, TooltipTarget, { delay: 0 })

    await userEvent.hover(screen.getByTestId('tooltip-target'))
    await userEvent.unhover(screen.getByTestId('tooltip-target'))

    expect(bubble()).toHaveAttribute('data-state', 'closed')
  })

  describe('WCAG 1.4.13', () => {
    it('dismisses on Escape without the pointer moving', async () => {
      renderBlock(definition, TooltipTarget, { delay: 0 })

      await userEvent.hover(screen.getByTestId('tooltip-target'))
      await userEvent.keyboard('{Escape}')

      expect(bubble()).toHaveAttribute('data-state', 'closed')
    })

    it('is hoverable: the bubble is inside the element the pointer is over', async () => {
      renderBlock(definition, TooltipTarget, { delay: 0 })

      await userEvent.hover(screen.getByTestId('tooltip-target'))

      expect(screen.getByTestId('tooltip-target')).toContainElement(bubble())
      expect(bubble().className).not.toContain('pointer-events-none')
    })

    it('is persistent: nothing hides it on a timer', async () => {
      renderBlock(definition, TooltipTarget, { delay: 0 })

      await userEvent.hover(screen.getByTestId('tooltip-target'))

      vi.useFakeTimers()
      act(() => {
        vi.advanceTimersByTime(30_000)
      })

      expect(bubble()).toHaveAttribute('data-state', 'open')
    })
  })

  it.each([
    ['top', 'bottom-full'],
    ['right', 'left-full'],
    ['bottom', 'top-full'],
    ['left', 'right-full'],
  ] as const)('places the bubble on the %s', (side, placement) => {
    renderBlock(definition, TooltipTarget, { side })

    expect(bubble().className).toContain(placement)
  })

  it('draws nothing for an icon name the registry does not know', () => {
    renderBlock(definition, TooltipTarget, { icon: 'not-an-icon' })

    expect(trigger().querySelector('svg')).toBeNull()
  })

  it('hides itself with the responsive visibility class', () => {
    renderBlock(definition, TooltipTarget, { hidden: true })

    expect(screen.getByTestId('tooltip-target').className).toContain('hidden')
  })

  it('has no axe violations, showing or not', async () => {
    const closed = renderBlock(definition, TooltipTarget)

    await expectNoViolations(closed.container)

    const open = renderBlock(definition, TooltipTarget, { delay: 0 })

    await userEvent.hover(screen.getAllByTestId('tooltip-target')[1] as HTMLElement)
    await expectNoViolations(open.container)
  })
})
