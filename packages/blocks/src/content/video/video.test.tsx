import { screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { expectNoViolations, renderBlock } from '../../test/render-block'

import { Video } from './video'
import { videoDefinition } from './video.definition'
import { effectiveMuted, videoNeedsCaptions, videoSchema } from './video.schema'

const definition = videoDefinition

const FOOTAGE = { src: '/export.mp4', poster: '/export.jpg' } as const

const spyOnPlay = () =>
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockImplementation(() => Promise.resolve())

const emulateReducedMotion = () =>
  vi.spyOn(CSSStyleDeclaration.prototype, 'getPropertyValue').mockReturnValue('0')

afterEach(() => {
  vi.restoreAllMocks()
})

describe('video rules', () => {
  it('reports footage that carries information and has no captions', () => {
    expect(videoNeedsCaptions({ src: '/a.mp4', captions: '', decorative: false })).toBe(true)
    expect(videoNeedsCaptions({ src: '/a.mp4', captions: '/a.vtt', decorative: false })).toBe(false)
    expect(videoNeedsCaptions({ src: '/a.mp4', captions: '', decorative: true })).toBe(false)
  })

  it('forces muted under autoplay', () => {
    expect(effectiveMuted({ autoplay: true, muted: false })).toBe(true)
    expect(effectiveMuted({ autoplay: false, muted: false })).toBe(false)
  })
})

describe('Video', () => {
  it('never carries the autoplay attribute', () => {
    spyOnPlay()
    renderBlock(definition, Video, { ...FOOTAGE, autoplay: true })

    const video = screen.getByTestId('video-element')

    expect(video.hasAttribute('autoplay')).toBe(false)
    expect(video).toHaveAttribute('poster', '/export.jpg')
  })

  it('starts playback itself when autoplay is on and motion is allowed', () => {
    const play = spyOnPlay()

    renderBlock(definition, Video, { ...FOOTAGE, autoplay: true })

    expect(play).toHaveBeenCalledTimes(1)
  })

  it('does not start under reduced motion', () => {
    const play = spyOnPlay()

    emulateReducedMotion()
    renderBlock(definition, Video, { ...FOOTAGE, autoplay: true })

    expect(play).not.toHaveBeenCalled()
  })

  it('leaves a controlled video alone, because pressing play is motion somebody asked for', () => {
    const play = spyOnPlay()

    renderBlock(definition, Video, FOOTAGE)

    expect(play).not.toHaveBeenCalled()
    expect(screen.getByTestId('video-element')).toHaveAttribute('controls')
  })

  it('renders a captions track when it is given one', () => {
    const { container } = renderBlock(definition, Video, { ...FOOTAGE, captions: '/export.vtt' })

    expect(container.querySelector('track')).toHaveAttribute('kind', 'captions')
  })

  it('renders a plate rather than collapsing with no file', () => {
    renderBlock(definition, Video)

    expect(screen.queryByTestId('video-element')).toBeNull()
    expect(screen.getByTestId('video-empty')).toBeInTheDocument()
  })

  it('validates its own defaults', () => {
    expect(() => videoSchema.parse(definition.defaults)).not.toThrow()
  })

  it('has no axe violations', async () => {
    const { container } = renderBlock(definition, Video, {
      ...FOOTAGE,
      captions: '/export.vtt',
      caption: 'Export, end to end',
    })

    await expectNoViolations(container)
  })
})
