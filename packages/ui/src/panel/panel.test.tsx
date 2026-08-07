import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { expectNoViolations } from '../test/axe'

import { Panel, PanelHeader, PanelSection } from './panel'

describe('Panel', () => {
  it('renders its children', () => {
    render(<Panel>contents</Panel>)

    expect(screen.getByText('contents')).toBeInTheDocument()
  })

  it.each([
    ['left', 'border-r'],
    ['right', 'border-l'],
  ] as const)('draws the %s panel’s hairline on the edge facing the canvas', (side, edge) => {
    const { container } = render(<Panel side={side}>contents</Panel>)

    expect(container.firstElementChild?.className).toContain(edge)
  })

  it('stays flat, because depth comes from value and not from elevation', () => {
    // § Character: "no shadows in the panels".
    const { container } = render(<Panel>contents</Panel>)

    expect(container.firstElementChild?.className).not.toContain('shadow')
  })

  it('sets no width of its own', () => {
    // § Layout gives panels a range, and the width is dragged and persisted by the app.
    const { container } = render(<Panel>contents</Panel>)

    expect(container.firstElementChild?.className).not.toMatch(/\bw-/)
  })

  it('spreads unknown props and forwards its ref', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(
      <Panel ref={ref} data-testid="left">
        contents
      </Panel>,
    )

    expect(ref.current).toBe(screen.getByTestId('left'))
  })
})

describe('PanelHeader', () => {
  it('renders its title and its action', () => {
    render(<PanelHeader title="Inspector" action={<button type="button">Close</button>} />)

    expect(screen.getByText('Inspector')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument()
  })

  it('takes the tab strip’s height, because one band holds either', () => {
    const { container } = render(<PanelHeader title="Inspector" />)

    expect(container.firstElementChild?.className).toContain('h-[36px]')
  })

  it('does not stick, so it cannot compete with the section headers that do', () => {
    const { container } = render(<PanelHeader title="Inspector" />)

    expect(container.firstElementChild?.className).not.toContain('sticky')
  })

  it('forwards its ref', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<PanelHeader ref={ref} title="Inspector" />)

    expect(ref.current).not.toBeNull()
  })
})

describe('PanelSection', () => {
  it('renders a collapsed section by default', () => {
    render(<PanelSection title="Layout">rows</PanelSection>)

    expect(screen.getByRole('button', { name: /Layout/ })).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens on click', async () => {
    render(<PanelSection title="Layout">rows</PanelSection>)

    await userEvent.click(screen.getByRole('button', { name: /Layout/ }))

    expect(screen.getByText('rows')).toBeVisible()
  })

  it('hands collapse state to the caller, because persistence is the app’s', async () => {
    const onOpenChange = vi.fn()
    render(
      <PanelSection title="Layout" onOpenChange={onOpenChange}>
        rows
      </PanelSection>,
    )

    await userEvent.click(screen.getByRole('button', { name: /Layout/ }))

    expect(onOpenChange).toHaveBeenCalledWith(true)
  })

  it('puts the reset action in the header rather than in the trigger', async () => {
    const reset = vi.fn()
    render(
      <PanelSection
        title="Layout"
        action={
          <button type="button" onClick={reset}>
            Reset Layout
          </button>
        }
      >
        rows
      </PanelSection>,
    )

    await userEvent.click(screen.getByRole('button', { name: 'Reset Layout' }))

    expect(reset).toHaveBeenCalledTimes(1)
    // Pressing the reset must not toggle the section on its way through.
    expect(screen.getByRole('button', { expanded: false })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  })

  it('pads an element inside the collapsing box, never the box itself', () => {
    /*
     * The height animation moves `height` and leaves `padding` alone, so a padded collapsing box stops at
     * 16 px rather than at 0 and the section never actually closes.
     */
    render(
      <PanelSection title="Layout" defaultOpen>
        rows
      </PanelSection>,
    )

    const box = document.querySelector('[data-ms-collapsible]')

    expect(box?.className).not.toMatch(/\bp-/)
    expect(box?.firstElementChild?.className).toContain('p-2')
  })

  it('separates sections with a hairline, and does not trail one after the last', () => {
    render(
      <>
        <PanelSection title="Layout">rows</PanelSection>
        <PanelSection title="Effects">rows</PanelSection>
      </>,
    )

    for (const trigger of screen.getAllByRole('button')) {
      expect(trigger.closest('[class*="border-b"]')?.className).toContain('last:border-b-0')
    }
  })

  it('is axe clean inside a panel', async () => {
    const { container } = render(
      <Panel>
        <PanelHeader title="Inspector" />
        <PanelSection title="Layout" defaultOpen>
          rows
        </PanelSection>
      </Panel>,
    )

    await expectNoViolations(container)
  })
})
