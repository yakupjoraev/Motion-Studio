import { blockId } from '@motion-studio/schema'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { CardPreview } from './card-preview'

type ObserverCallback = (entries: readonly { isIntersecting: boolean }[]) => void

let observers: { callback: ObserverCallback; disconnect: () => void }[] = []

/**
 * `prompts/52` § Performance: "Previews below the fold mount lazily on intersection." The claim is
 * about a card nobody has scrolled to, so the test never intersects one and asserts that nothing
 * loaded — the negative is the whole point, and it is the one an eye cannot check.
 */
beforeEach(() => {
  observers = []

  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(callback: ObserverCallback) {
        observers.push({ callback, disconnect: () => undefined })
      }

      observe() {
        return undefined
      }

      disconnect() {
        return undefined
      }

      unobserve() {
        return undefined
      }
    },
  )
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('a card that has not been scrolled to', () => {
  it('renders its skeleton and no block', () => {
    render(
      <CardPreview
        category="effects"
        id={blockId('aurora-background')}
        props={{ tint: 'accent' }}
      />,
    )

    expect(screen.getByTestId('preview-placeholder')).toBeInTheDocument()
    expect(observers).toHaveLength(1)
  })

  it('mounts the block once it intersects', async () => {
    render(
      <CardPreview
        category="effects"
        id={blockId('aurora-background')}
        props={{ tint: 'accent' }}
      />,
    )

    observers[0]?.callback([{ isIntersecting: true }])

    await waitFor(() => {
      expect(screen.queryByTestId('preview-placeholder')).not.toBeInTheDocument()
    })
  })
})
