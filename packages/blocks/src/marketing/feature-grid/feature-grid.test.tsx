import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { FeatureGrid } from './feature-grid'
import { featureGridDefinition as definition } from './feature-grid.definition'

describe('FeatureGrid', () => {
  /*
   * ADR-357. Both arrangements are the block's own markup, so what is asserted is the pair of
   * differences a user would see: the track scrolls and is keyboard-reachable, the stack does neither.
   */
  describe('the narrow arrangement', () => {
    it('makes a keyboard-reachable swipe track when it is a slider', () => {
      renderBlock(definition, FeatureGrid, { narrow: 'slider' })

      const list = screen.getByRole('list')

      expect(list).toHaveAttribute('tabindex', '0')
      expect(list.className).toContain('snap-x')
      // Full-bleed: the track leaves the section's gutter so a card runs off the edge.
      expect(list.className).toContain('-mx-6')
      // And it is a grid again as soon as the band can hold one.
      expect(list.className).toContain('@min-[640px]/frame:grid')
    })

    it('is a plain single column when it is a stack', () => {
      renderBlock(definition, FeatureGrid, { narrow: 'stack' })

      const list = screen.getByRole('list')

      expect(list).not.toHaveAttribute('tabindex')
      expect(list.className).toContain('grid-cols-1')
      expect(list.className).not.toContain('snap-x')
      expect(list.className).not.toContain('-mx-6')
    })

    it('defaults to the slider, which is what a phone gets without anyone choosing', () => {
      expect(definition.defaults.narrow).toBe('slider')
    })
  })

  it('renders one cell per feature', () => {
    renderBlock(definition, FeatureGrid)

    expect(screen.getAllByTestId('feature-cell')).toHaveLength(definition.defaults.items.length)
  })

  it('announces the cells as a list', () => {
    renderBlock(definition, FeatureGrid)

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(definition.defaults.items.length)
  })

  it('puts cell titles one level below the section header', () => {
    renderBlock(definition, FeatureGrid, { headingLevel: 2 })

    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(definition.defaults.heading)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(
      definition.defaults.items.length,
    )
  })

  it('stops the cell titles at h6 rather than skipping past it', () => {
    renderBlock(definition, FeatureGrid, { headingLevel: 6 })

    expect(screen.getAllByRole('heading', { level: 6 })).toHaveLength(
      definition.defaults.items.length + 1,
    )
  })

  it('drops the header entirely when all three copy fields are empty', () => {
    renderBlock(definition, FeatureGrid, { eyebrow: '', heading: '', description: '' })

    expect(screen.queryByRole('heading', { level: 2 })).toBeNull()
  })

  it('gives every cell its own container-query scope', () => {
    renderBlock(definition, FeatureGrid)

    for (const item of screen.getAllByRole('listitem')) {
      expect(item.className).toContain('@container')
    }
  })

  it('paints a card only when the treatment asks for one', () => {
    const { unmount } = renderBlock(definition, FeatureGrid, { treatment: 'plain' })

    expect(screen.getAllByTestId('feature-cell')[0]?.className).not.toContain('bg-surface-1')
    unmount()

    renderBlock(definition, FeatureGrid, { treatment: 'card' })

    expect(screen.getAllByTestId('feature-cell')[0]?.className).toContain('bg-surface-1')
  })

  it('drops the icons without leaving their plates behind', () => {
    renderBlock(definition, FeatureGrid, { showIcons: false })

    expect(document.querySelectorAll('svg')).toHaveLength(0)
  })

  it('renders nothing for an icon name the registry does not know', () => {
    renderBlock(definition, FeatureGrid, {
      items: [{ icon: 'not-an-icon', title: 'Title', body: 'Body' }],
    })

    expect(screen.getByTestId('feature-cell')).toBeInTheDocument()
    expect(document.querySelectorAll('svg')).toHaveLength(0)
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, FeatureGrid)

    await expectNoViolations(container)
  })
})
