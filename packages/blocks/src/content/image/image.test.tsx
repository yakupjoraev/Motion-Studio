import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Image } from './image'
import { imageDefinition } from './image.definition'
import { imageNeedsAlt, imageSchema } from './image.schema'

const definition = imageDefinition

const PHOTO = { src: '/studio.png', alt: 'The Motion Studio canvas' } as const

describe('image schema', () => {
  /** Prompt 26's rule: missing fails, empty parses, and empty is what the warning chip reads. */
  it('fails to parse without an alt decision', () => {
    expect(imageSchema.safeParse({ src: '/a.png' }).success).toBe(false)
  })

  it('parses an empty alt, because decorative is a legal answer', () => {
    expect(imageSchema.safeParse({ src: '/a.png', alt: '' }).success).toBe(true)
  })

  it('flags an image that has a source and no description', () => {
    expect(imageNeedsAlt({ src: '/a.png', alt: '' })).toBe(true)
    expect(imageNeedsAlt({ src: '/a.png', alt: 'A canvas' })).toBe(false)
    expect(imageNeedsAlt({ src: '', alt: '' })).toBe(false)
  })
})

describe('Image', () => {
  it('reserves the box and carries a real sizes value', () => {
    renderBlock(definition, Image, PHOTO)

    const image = screen.getByTestId('image-element')

    expect(image).toHaveAttribute('width', String(definition.defaults.width))
    expect(image).toHaveAttribute('height', String(definition.defaults.height))
    expect(image).toHaveAttribute('sizes', '100vw')
  })

  it('lazily loads by default and eagerly above the fold', () => {
    const { unmount } = renderBlock(definition, Image, PHOTO)

    expect(screen.getByTestId('image-element')).toHaveAttribute('loading', 'lazy')
    unmount()

    renderBlock(definition, Image, { ...PHOTO, priority: true })

    const priority = screen.getByTestId('image-element')

    expect(priority).toHaveAttribute('loading', 'eager')
    expect(priority).toHaveAttribute('fetchpriority', 'high')
  })

  it('renders a plate rather than collapsing when there is no file yet', () => {
    renderBlock(definition, Image)

    expect(screen.queryByTestId('image-element')).toBeNull()
    expect(screen.getByTestId('image-empty')).toBeInTheDocument()
  })

  it('renders the caption beside the image rather than in place of the alt', () => {
    const { container } = renderBlock(definition, Image, {
      ...PHOTO,
      caption: 'Mid-edit, with the inspector open',
    })

    expect(container.querySelector('figcaption')).toHaveTextContent('Mid-edit')
    expect(screen.getByTestId('image-element')).toHaveAttribute('alt', PHOTO.alt)
  })

  it('tells the exporter which element the Next target needs', () => {
    expect(definition.codegen.tag).toBe('img')
    expect(definition.codegen.imports?.[0]?.from).toBe('next/image')
  })

  it('validates its own defaults', () => {
    expect(() => imageSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Image, PHOTO)

    await expectNoViolations(container)
  })
})
