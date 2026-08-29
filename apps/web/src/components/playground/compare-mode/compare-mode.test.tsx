import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { CompareTabs } from './compare-tabs'
import { CompareTarget } from './compare-target'

describe('the compare tabs', () => {
  it('offers only the switch while the split is off', () => {
    render(
      <CompareTabs
        enabled={false}
        onEnabledChange={vi.fn()}
        side="a"
        onSideChange={vi.fn()}
        onSwap={vi.fn()}
      />,
    )

    expect(screen.getByRole('switch', { name: 'Compare two values' })).not.toBeChecked()
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument()
  })

  it('announces which half the editor is editing', () => {
    render(
      <CompareTabs
        enabled
        onEnabledChange={vi.fn()}
        side="b"
        onSideChange={vi.fn()}
        onSwap={vi.fn()}
      />,
    )

    expect(screen.getByTestId('compare-announcement')).toHaveTextContent(
      'Editing B, the right half.',
    )
  })

  it('swaps on the button', async () => {
    const user = userEvent.setup()
    const onSwap = vi.fn()

    render(
      <CompareTabs
        enabled
        onEnabledChange={vi.fn()}
        side="a"
        onSideChange={vi.fn()}
        onSwap={onSwap}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Swap A and B' }))

    expect(onSwap).toHaveBeenCalledTimes(1)
  })

  it('leaves the keys alone while the split is off', async () => {
    const user = userEvent.setup()
    const onSwap = vi.fn()

    render(
      <CompareTabs
        enabled={false}
        onEnabledChange={vi.fn()}
        side="a"
        onSideChange={vi.fn()}
        onSwap={onSwap}
      />,
    )
    await user.keyboard('{Meta>}{Shift>}s{/Shift}{/Meta}')

    expect(onSwap).not.toHaveBeenCalled()
  })
})

describe('the split target', () => {
  it('renders both values, each clipped to its own half', () => {
    render(<CompareTarget a={<span>left</span>} b={<span>right</span>} />)

    expect(screen.getByTestId('compare-a')).toHaveStyle({ clipPath: 'inset(0 50% 0 0)' })
    expect(screen.getByTestId('compare-b')).toHaveStyle({ clipPath: 'inset(0 0 0 50%)' })
    expect(screen.getByText('left')).toBeInTheDocument()
    expect(screen.getByText('right')).toBeInTheDocument()
  })
})
