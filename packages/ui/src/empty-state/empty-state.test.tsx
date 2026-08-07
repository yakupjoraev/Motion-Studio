import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Button } from '../button/index'
import { Kbd } from '../kbd/index'
import { expectNoViolations } from '../test/axe'

import { EmptyState } from './empty-state'

describe('EmptyState', () => {
  it('renders its one sentence', () => {
    render(<EmptyState message="Drag a block to start" />)

    expect(screen.getByText('Drag a block to start')).toBeInTheDocument()
  })

  it('renders the action beside it', () => {
    render(<EmptyState message="No blocks match “xyz”" action={<Button>Clear</Button>} />)

    expect(screen.getByRole('button', { name: 'Clear' })).toBeInTheDocument()
  })

  it('renders a shortcut hint', () => {
    render(
      <EmptyState message="Drag a block to start" hint={<Kbd keys="Mod+K" platform="other" />} />,
    )

    expect(screen.getByText('Ctrl+K')).toBeInTheDocument()
  })

  it('draws no action row when there is neither an action nor a hint', () => {
    const { container } = render(<EmptyState message="Drag a block to start" />)

    expect(container.querySelectorAll('div')).toHaveLength(1)
  })

  it('carries no illustration', () => {
    // § Character: "empty states are one sentence and one action. No illustrations."
    const { container } = render(<EmptyState message="Drag a block to start" />)

    expect(container.querySelector('svg, img')).toBeNull()
  })

  it('spreads unknown props and forwards its ref', () => {
    const ref = { current: null as HTMLDivElement | null }
    render(<EmptyState ref={ref} data-testid="empty" message="Drag a block to start" />)

    expect(ref.current).toBe(screen.getByTestId('empty'))
  })

  it('is axe clean', async () => {
    const { container } = render(
      <EmptyState message="No blocks match “xyz”" action={<Button>Clear</Button>} />,
    )

    await expectNoViolations(container)
  })
})
