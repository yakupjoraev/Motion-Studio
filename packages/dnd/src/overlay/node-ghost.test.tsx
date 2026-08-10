import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { BlockCardPreview } from './block-card-preview'
import { NodeGhost } from './node-ghost'

describe('NodeGhost', () => {
  it('names the node when one is moving', () => {
    render(<NodeGhost count={1} labels={['Aurora hero']} />)

    expect(screen.getByTestId('layer-count')).toHaveTextContent('Aurora hero')
    expect(screen.queryByTestId('ghost-stack-back')).toBeNull()
  })

  it('counts them and stacks the outline when several are', () => {
    render(<NodeGhost count={3} labels={['Aurora hero', 'Section', 'Grid']} />)

    expect(screen.getByTestId('layer-count')).toHaveTextContent('3 layers')
    expect(screen.getByTestId('ghost-stack-back')).toBeInTheDocument()
  })

  it('falls back to a generic name when the host sent none', () => {
    render(<NodeGhost count={1} labels={[]} />)

    expect(screen.getByTestId('layer-count')).toHaveTextContent('Layer')
  })

  it('is an outline and not a rendered block', () => {
    render(<NodeGhost count={1} labels={['Aurora hero']} />)

    expect(screen.getByTestId('node-ghost').className).toContain('ring-accent')
  })
})

describe('BlockCardPreview', () => {
  it('shows the card at 90 % with a lift', () => {
    render(<BlockCardPreview label="Aurora hero, marketing block" />)

    const card = screen.getByTestId('block-card-preview')

    expect(card).toHaveTextContent('Aurora hero, marketing block')
    expect(card.className).toContain('opacity-90')
    expect(card.className).toContain('shadow-lg')
  })
})
