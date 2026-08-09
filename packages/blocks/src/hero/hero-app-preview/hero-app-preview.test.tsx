import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { HeroAppPreview } from './hero-app-preview'
import { heroAppPreviewDefinition } from './hero-app-preview.definition'
import { heroAppPreviewSchema } from './hero-app-preview.schema'

const definition = heroAppPreviewDefinition

const SHOT = { image: { src: '/studio.png', alt: 'The Motion Studio editor' } } as const

describe('HeroAppPreview', () => {
  it('renders exactly one h1', () => {
    renderBlock(definition, HeroAppPreview)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('reserves the image box and asks for it early', () => {
    renderBlock(definition, HeroAppPreview, SHOT)

    const image = screen.getByTestId('hero-preview-image')

    expect(image).toHaveAttribute('width', String(definition.defaults.imageWidth))
    expect(image).toHaveAttribute('height', String(definition.defaults.imageHeight))
    expect(image).toHaveAttribute('sizes')
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('alt', SHOT.image.alt)
  })

  it('carries the tilt as variables, so the angle is a value rather than a class', () => {
    renderBlock(definition, HeroAppPreview, { tiltX: 5, tiltY: -9, perspective: 900 })

    const tilt = screen.getByTestId('hero-preview-tilt')

    expect(tilt.style.getPropertyValue('--ms-tilt-x')).toBe('5deg')
    expect(tilt.style.getPropertyValue('--ms-tilt-y')).toBe('-9deg')
    expect(tilt.style.getPropertyValue('--ms-tilt-perspective')).toBe('900px')
  })

  it('refuses a tilt past the limit its control offers', () => {
    expect(() => heroAppPreviewSchema.parse({ tiltX: 45 })).toThrow()
  })

  it('renders a window in surface tokens when there is no screenshot yet', () => {
    renderBlock(definition, HeroAppPreview)

    expect(screen.queryByTestId('hero-preview-image')).toBeNull()
    expect(screen.getByTestId('hero-preview-placeholder')).toHaveAttribute('aria-hidden', 'true')
  })

  it('keeps the glow decorative, empty and after the plate', () => {
    renderBlock(definition, HeroAppPreview, SHOT)

    const glow = screen.getByTestId('hero-preview-glow')
    const tilt = screen.getByTestId('hero-preview-tilt')

    expect(glow).toHaveAttribute('aria-hidden', 'true')
    expect(glow).toBeEmptyDOMElement()
    expect(tilt.compareDocumentPosition(glow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('offers the hover tilt without turning it on', () => {
    expect(definition.capabilities.supportsMotion).toContain('hover')
    expect(definition.defaultMotion.hover).toBeUndefined()
  })

  it('validates its own defaults', () => {
    expect(() => heroAppPreviewSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, HeroAppPreview, SHOT)

    await expectNoViolations(container)
  })
})
