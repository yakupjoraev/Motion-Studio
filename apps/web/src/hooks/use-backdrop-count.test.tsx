import { act, render, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BACKDROP_CAP, countGlass, useBackdropCount } from './use-backdrop-count'

/**
 * jsdom implements no `backdrop-filter` at all — `getComputedStyle` returns an empty string for it
 * whatever the element carries — so the read is injected and the browser walkthrough is what proves
 * the real one. The logic under test is "how many surfaces are compositing", not "what does jsdom
 * think a filter is".
 */
const readMarked = (element: Element): string =>
  element.hasAttribute('data-glass') ? 'blur(16px)' : 'none'

function Probe() {
  const count = useBackdropCount('#stage', readMarked)

  return <output data-testid="count">{count}</output>
}

const glass = (): HTMLElement => {
  const element = document.createElement('div')

  element.setAttribute('data-glass', '')

  return element
}

describe('countGlass', () => {
  it('counts only the surfaces whose filter is set', () => {
    const root = document.createElement('div')

    root.append(glass(), glass(), document.createElement('span'))

    expect(countGlass(root, readMarked)).toBe(2)
  })

  it('counts nothing in an empty tree', () => {
    expect(countGlass(document.createElement('div'), readMarked)).toBe(0)
  })
})

describe('useBackdropCount', () => {
  beforeEach(() => {
    document.body.innerHTML = '<div id="stage"></div>'
  })

  it('reports what the canvas is compositing', async () => {
    const stage = document.querySelector('#stage') as HTMLElement

    stage.append(glass(), glass())

    const { getByTestId } = render(<Probe />)

    await waitFor(() => {
      expect(getByTestId('count').textContent).toBe('2')
    })
  })

  it('recounts when the tree changes, which is when the answer can differ', async () => {
    const stage = document.querySelector('#stage') as HTMLElement
    const { getByTestId } = render(<Probe />)

    await waitFor(() => {
      expect(getByTestId('count').textContent).toBe('0')
    })

    await act(async () => {
      for (let index = 0; index <= BACKDROP_CAP; index += 1) {
        stage.append(glass())
      }
    })

    await waitFor(() => {
      expect(Number(getByTestId('count').textContent)).toBe(BACKDROP_CAP + 1)
    })
  })

  it('reports nothing when the canvas is not mounted', () => {
    document.body.innerHTML = ''

    const { getByTestId } = render(<Probe />)

    expect(getByTestId('count').textContent).toBe('0')
  })

  it('stops observing on unmount', () => {
    const disconnect = vi.fn()
    const original = window.MutationObserver

    window.MutationObserver = class {
      observe() {
        // Nothing to record: the test is about the teardown.
      }

      disconnect = disconnect

      takeRecords() {
        return []
      }
    } as unknown as typeof MutationObserver

    const { unmount } = render(<Probe />)
    unmount()

    expect(disconnect).toHaveBeenCalled()

    window.MutationObserver = original
  })
})
