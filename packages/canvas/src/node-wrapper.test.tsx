import { type NodeId, nodeId } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { NodeWrapper } from './node-wrapper'
import type { RectCache } from './rects/rect-cache'
import { RectCacheContext } from './rects/use-rect-cache'

const ID = nodeId('node_hero')

const fakeCache = () => {
  const release = vi.fn()
  const observed: Array<[NodeId, Element]> = []
  const cache: RectCache = {
    get: () => undefined,
    invalidate: () => undefined,
    refresh: () => undefined,
    observe: (id, element) => {
      observed.push([id, element])

      return release
    },
  }

  return { cache, observed, release }
}

const mount = (cache: RectCache, id: NodeId = ID) =>
  render(
    <RectCacheContext.Provider value={cache}>
      <NodeWrapper id={id}>
        <span>content</span>
      </NodeWrapper>
    </RectCacheContext.Provider>,
  )

describe('NodeWrapper', () => {
  it('carries the attribute hit testing looks for and renders what it was given', () => {
    const { cache } = fakeCache()

    mount(cache)

    expect(screen.getByText('content').parentElement).toHaveAttribute('data-node-id', ID)
  })

  it('registers its element with the cache and releases it on unmount', () => {
    const { cache, observed, release } = fakeCache()
    const { unmount } = mount(cache)

    expect(observed).toHaveLength(1)
    expect(observed[0]?.[0]).toBe(ID)
    expect(observed[0]?.[1]).toBe(screen.getByText('content').parentElement)

    unmount()

    expect(release).toHaveBeenCalledTimes(1)
  })

  it('re-registers under the new id when it is reused for another node', () => {
    const { cache, observed, release } = fakeCache()
    const other = nodeId('node_gallery')
    const { rerender } = mount(cache)

    rerender(
      <RectCacheContext.Provider value={cache}>
        <NodeWrapper id={other}>
          <span>content</span>
        </NodeWrapper>
      </RectCacheContext.Provider>,
    )

    expect(release).toHaveBeenCalledTimes(1)
    expect(observed.map(([id]) => id)).toEqual([ID, other])
  })

  it('keeps a class the caller adds beside its own', () => {
    const { cache } = fakeCache()

    render(
      <RectCacheContext.Provider value={cache}>
        <NodeWrapper className="w-full" id={ID}>
          <span>content</span>
        </NodeWrapper>
      </RectCacheContext.Provider>,
    )

    expect(screen.getByText('content').parentElement).toHaveClass('w-full')
  })
})
