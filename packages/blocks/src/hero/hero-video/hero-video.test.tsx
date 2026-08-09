import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { HeroVideo } from './hero-video'
import { heroVideoDefinition } from './hero-video.definition'
import { heroVideoNeedsCaptions, heroVideoSchema } from './hero-video.schema'

const definition = heroVideoDefinition

const FOOTAGE = { src: '/tour.mp4', poster: '/tour.jpg' } as const

/**
 * jsdom implements no media pipeline, so `play` is the seam. Spying on the prototype keeps the test
 * inside the type system — there is no cast anywhere, which the contract's § 1.1 requires.
 */
const spyOnPlay = () =>
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())

/** Reduced motion, the way the block reads it: the resolved value of `--ms-reduced-motion`. */
const emulateReducedMotion = () =>
  vi.spyOn(CSSStyleDeclaration.prototype, 'getPropertyValue').mockReturnValue('0')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('HeroVideo', () => {
  it('renders exactly one h1', () => {
    renderBlock(definition, HeroVideo)

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
  })

  it('never carries the autoplay attribute, so the first paint is the poster', () => {
    spyOnPlay()
    renderBlock(definition, HeroVideo, FOOTAGE)

    const video = screen.getByTestId('hero-video-element')

    expect(video).toHaveAttribute('poster', '/tour.jpg')
    expect(video).toHaveAttribute('preload', 'metadata')
    expect(video.hasAttribute('autoplay')).toBe(false)
  })

  it('starts playback itself when motion is allowed', () => {
    const play = spyOnPlay()

    renderBlock(definition, HeroVideo, FOOTAGE)

    expect(play).toHaveBeenCalledTimes(1)
  })

  it('shows the poster and does not play when reduced motion is asked for', () => {
    const play = spyOnPlay()

    emulateReducedMotion()
    renderBlock(definition, HeroVideo, FOOTAGE)

    expect(play).not.toHaveBeenCalled()
    expect(screen.getByTestId('hero-video-element')).toHaveAttribute('poster', '/tour.jpg')
  })

  it('renders a captions track when it is given one', () => {
    spyOnPlay()
    const { container } = renderBlock(definition, HeroVideo, {
      ...FOOTAGE,
      captions: '/tour.vtt',
      decorative: false,
    })

    expect(container.querySelector('track')).toHaveAttribute('kind', 'captions')
  })

  it('reports footage that carries information and has no captions', () => {
    expect(heroVideoNeedsCaptions({ src: '/t.mp4', captions: '', decorative: false })).toBe(true)
    expect(heroVideoNeedsCaptions({ src: '/t.mp4', captions: '/t.vtt', decorative: false })).toBe(
      false,
    )
    expect(heroVideoNeedsCaptions({ src: '/t.mp4', captions: '', decorative: true })).toBe(false)
    expect(heroVideoNeedsCaptions({ src: '', captions: '', decorative: false })).toBe(false)
  })

  it('is still a finished hero with no footage at all, and drops the scrim there is nothing to scrim', () => {
    renderBlock(definition, HeroVideo)

    expect(screen.queryByTestId('hero-video-element')).toBeNull()
    expect(screen.getByTestId('hero-video-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('hero-video-scrim')).toBeNull()
  })

  it('scrims the footage once there is any', () => {
    spyOnPlay()
    renderBlock(definition, HeroVideo, FOOTAGE)

    expect(screen.getByTestId('hero-video-scrim').className).toContain('from-surface-0/95')
  })

  it('keeps the backdrop after the text in DOM order', () => {
    spyOnPlay()
    renderBlock(definition, HeroVideo, FOOTAGE)

    const heading = screen.getByRole('heading', { level: 1 })
    const backdrop = screen.getByTestId('hero-video-backdrop')

    expect(
      heading.compareDocumentPosition(backdrop) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy()
  })

  it('validates its own defaults', () => {
    expect(() => heroVideoSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    spyOnPlay()
    const { container } = renderBlock(definition, HeroVideo, {
      ...FOOTAGE,
      captions: '/tour.vtt',
      decorative: false,
    })

    await expectNoViolations(container)
  })
})
