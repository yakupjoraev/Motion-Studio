import { blockRegistry } from '@motion-studio/blocks/registry'
import { REDUCED_MOTION_QUERY } from '@motion-studio/motion'
import { blockId, fakeRegistry, fixtureBlockId } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import { beforeAll, describe, expect, it, vi } from 'vitest'

import { BlockThumbnail } from './block-thumbnail'

/**
 * The reduced-motion query is opened once per process and never reopened — that is the single
 * subscription ANIMATION_SYSTEM.md § Reduced motion requires — so a file that wants it on stubs
 * `matchMedia` before the first render and stays that way. The full-motion path is covered where the
 * default stub applies, in `blocks-tab.test.tsx`.
 */
beforeAll(() => {
  vi.stubGlobal(
    'matchMedia',
    (query: string): MediaQueryList =>
      ({
        matches: query === REDUCED_MOTION_QUERY,
        media: query,
        onchange: null,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
        addListener: () => undefined,
        removeListener: () => undefined,
        dispatchEvent: () => false,
      }) as MediaQueryList,
  )
})

const SECTION = blockRegistry.require(blockId('section'))

describe('BlockThumbnail', () => {
  it('creates no video element under a reduced-motion preference, hovered or not', () => {
    const { container } = render(<BlockThumbnail definition={SECTION} hovered />)

    expect(container.querySelector('video')).toBeNull()
    expect(screen.getByRole('presentation')).toBeInTheDocument()
  })

  it('draws the generated still for the block, at the size it was generated at', () => {
    render(<BlockThumbnail definition={SECTION} hovered={false} />)

    const image = screen.getByRole('presentation')

    expect(image).toHaveAttribute('width', '320')
    expect(image).toHaveAttribute('height', '200')
    expect(image.getAttribute('src')).toContain('section')
  })

  it('falls back to the block icon rather than a broken image when no thumbnail exists', () => {
    const registry = fakeRegistry({
      'no-thumbnail': { name: 'No Thumbnail', icon: 'card', category: 'layout' },
    })

    render(
      <BlockThumbnail
        definition={registry.require(fixtureBlockId('no-thumbnail'))}
        hovered={false}
      />,
    )

    expect(screen.getByTestId('block-thumbnail-placeholder')).toBeInTheDocument()
    expect(screen.queryByRole('presentation')).toBeNull()
  })
})
