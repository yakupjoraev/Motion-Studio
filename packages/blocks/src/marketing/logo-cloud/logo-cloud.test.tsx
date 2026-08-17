import { MARQUEE_CLASS } from '@motion-studio/motion'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { LogoCloud } from './logo-cloud'
import { logoCloudDefinition as definition } from './logo-cloud.definition'
import { logoAlt } from './logo-cloud.schema'

describe('logoAlt', () => {
  it('falls back to the company name rather than to an empty string', () => {
    expect(logoAlt({ label: 'Northwind', src: 'x.svg', alt: '' })).toBe('Northwind')
  })

  it('prefers an alt the user wrote', () => {
    expect(logoAlt({ label: 'Northwind', src: 'x.svg', alt: 'Northwind logo' })).toBe(
      'Northwind logo',
    )
  })
})

describe('LogoCloud — grid', () => {
  it('lists every mark', () => {
    renderBlock(definition, LogoCloud)

    expect(screen.getByRole('list')).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(definition.defaults.logos.length)
  })

  it('sets the name as a word-mark until a file arrives', () => {
    renderBlock(definition, LogoCloud)

    expect(screen.getAllByTestId('logo-word')).toHaveLength(definition.defaults.logos.length)
    expect(screen.queryByTestId('logo-image')).toBeNull()
  })

  it('describes a mark that is an image', () => {
    renderBlock(definition, LogoCloud, {
      logos: [{ label: 'Northwind', src: 'https://example.test/nw.svg', alt: '' }],
    })

    expect(screen.getByTestId('logo-image')).toHaveAttribute('alt', 'Northwind')
  })

  it('normalises by height, not by width', () => {
    renderBlock(definition, LogoCloud, {
      logos: [{ label: 'Northwind', src: 'https://example.test/nw.svg', alt: '' }],
    })

    const className = screen.getByTestId('logo-image').className

    expect(className).toContain('max-h-8')
    expect(className).toContain('w-auto')
    expect(className).toContain('object-contain')
  })

  it('greys the marks until hovered, and stops when told to', () => {
    const { unmount } = renderBlock(definition, LogoCloud)

    expect(screen.getAllByTestId('logo-word')[0]?.className).toContain('text-foreground-subtle')
    unmount()

    renderBlock(definition, LogoCloud, { grayscale: false })

    expect(screen.getAllByTestId('logo-word')[0]?.className).not.toContain('text-foreground-subtle')
  })
})

describe('LogoCloud — marquee', () => {
  it('uses the preset rather than an animation of its own', () => {
    renderBlock(definition, LogoCloud, { mode: 'marquee' })

    expect(screen.getByTestId('marquee-track').className).toContain(MARQUEE_CLASS)
    expect(screen.getByTestId('marquee-styles')).toBeInTheDocument()
  })

  it('reads every mark once', () => {
    renderBlock(definition, LogoCloud, {
      mode: 'marquee',
      logos: [{ label: 'Northwind', src: '', alt: '' }],
    })

    const copies = screen.getByTestId('marquee-track').children

    expect(copies).toHaveLength(2)
    expect(copies[1]?.getAttribute('aria-hidden')).toBe('true')
  })

  it('has no grid in marquee mode and no track in grid mode', () => {
    const { unmount } = renderBlock(definition, LogoCloud, { mode: 'marquee' })

    expect(screen.queryByRole('list')).toBeNull()
    unmount()

    renderBlock(definition, LogoCloud, { mode: 'grid' })

    expect(screen.queryByTestId('marquee-track')).toBeNull()
  })
})

describe('LogoCloud — accessibility', () => {
  it('has no axe violations as a grid', async () => {
    const { container } = renderBlock(definition, LogoCloud)

    await expectNoViolations(container)
  })

  it('has no axe violations as a marquee', async () => {
    const { container } = renderBlock(definition, LogoCloud, { mode: 'marquee' })

    await expectNoViolations(container)
  })
})
