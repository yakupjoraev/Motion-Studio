import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'
import { requireAt } from '../../test/require-at'

import { FeatureSplit } from './feature-split'
import { featureSplitDefinition as definition } from './feature-split.definition'
import { rowIsReversed } from './feature-split.schema'

describe('rowIsReversed', () => {
  it('alternates down the section when alternation is on', () => {
    expect(rowIsReversed(0, true, false)).toBe(false)
    expect(rowIsReversed(1, true, false)).toBe(true)
    expect(rowIsReversed(2, true, false)).toBe(false)
  })

  it('flips one row against the rhythm rather than breaking it', () => {
    expect(rowIsReversed(0, true, true)).toBe(true)
    expect(rowIsReversed(1, true, true)).toBe(false)
  })

  it('follows the row alone when alternation is off', () => {
    expect(rowIsReversed(3, false, false)).toBe(false)
    expect(rowIsReversed(3, false, true)).toBe(true)
  })
})

describe('FeatureSplit', () => {
  it('renders one row per entry', () => {
    renderBlock(definition, FeatureSplit)

    expect(screen.getAllByTestId('feature-split-row')).toHaveLength(definition.defaults.rows.length)
  })

  it('moves the picture with order rather than with the DOM', () => {
    renderBlock(definition, FeatureSplit)

    const [first, second] = screen.getAllByTestId('feature-split-media')

    expect(first?.parentElement?.className).not.toContain('order-first')
    expect(second?.parentElement?.className).toContain('@min-[1024px]/frame:order-first')
  })

  it('keeps the copy before the picture in reading order on a reversed row', () => {
    renderBlock(definition, FeatureSplit)

    const row = requireAt(screen.getAllByTestId('feature-split-row'), 1)
    const heading = row.querySelector('h3')
    const media = row.querySelector('[data-testid="feature-split-media"]')

    expect(heading).not.toBeNull()
    expect(media).not.toBeNull()
    expect(
      heading === null || media === null
        ? 0
        : heading.compareDocumentPosition(media) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeGreaterThan(0)
  })

  it('requests the first picture eagerly and the rest lazily', () => {
    renderBlock(definition, FeatureSplit, {
      rows: definition.defaults.rows.map((row) => ({
        ...row,
        media: { ...row.media, src: 'https://example.test/shot.png', alt: 'A screenshot' },
      })),
    })

    const images = screen.getAllByTestId('media-image')

    expect(images[0]).toHaveAttribute('loading', 'eager')
    expect(images[0]).toHaveAttribute('fetchpriority', 'high')
    expect(images[1]).toHaveAttribute('loading', 'lazy')
  })

  it('draws the plate at its ratio when there is no picture yet', () => {
    renderBlock(definition, FeatureSplit)

    expect(screen.getAllByTestId('media-empty')).toHaveLength(definition.defaults.rows.length)
  })

  it('reserves the box with width, height and a real sizes value', () => {
    renderBlock(definition, FeatureSplit, {
      rows: [
        {
          ...requireAt(definition.defaults.rows, 0),
          media: {
            src: 'https://example.test/shot.png',
            alt: '',
            width: 1600,
            height: 1000,
            sizes: '(min-width: 1024px) 50vw, 100vw',
          },
        },
      ],
    })

    const image = screen.getByTestId('media-image')

    expect(image).toHaveAttribute('width', '1600')
    expect(image).toHaveAttribute('height', '1000')
    expect(image).toHaveAttribute('sizes', '(min-width: 1024px) 50vw, 100vw')
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, FeatureSplit)

    await expectNoViolations(container)
  })
})
