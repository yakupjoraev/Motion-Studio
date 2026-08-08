import { nodeId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { createRectCache } from './rect-cache'

interface FakeObserver extends ResizeObserver {
  readonly observed: Element[]
  fire(): void
}

const frames: Array<() => void> = []

const schedule = (callback: () => void): number => frames.push(callback)

const cancel = (handle: number): void => {
  frames[handle - 1] = () => undefined
}

const runFrame = (): void => {
  const pending = [...frames]

  frames.length = 0

  for (const callback of pending) {
    callback()
  }
}

let observers: FakeObserver[] = []

const createObserver = (callback: ResizeObserverCallback): ResizeObserver => {
  const observed: Element[] = []
  const observer: FakeObserver = {
    observed,
    observe: (element: Element) => observed.push(element),
    unobserve: (element: Element) => {
      const index = observed.indexOf(element)

      if (index !== -1) {
        observed.splice(index, 1)
      }
    },
    disconnect: () => {
      observed.length = 0
    },
    fire: () => callback([], observer),
  }

  observers.push(observer)

  return observer
}

const boxes = (count: number): HTMLElement[] =>
  Array.from({ length: count }, (_, index) => {
    const element = document.createElement('div')

    element.getBoundingClientRect = vi.fn(
      () => ({ x: index * 10, y: 0, width: 10, height: 10 }) as DOMRect,
    )

    return element
  })

const cacheWithFakes = () => createRectCache({ schedule, cancel, createObserver })

beforeEach(() => {
  frames.length = 0
  observers = []
})

describe('createRectCache', () => {
  it('builds one observer for every node, not one each', () => {
    const cache = cacheWithFakes()
    const elements = boxes(20)

    for (const [index, element] of elements.entries()) {
      cache.observe(nodeId(`node_${index}`), element)
    }

    expect(observers).toHaveLength(1)
    expect(observers[0]?.observed).toHaveLength(20)
  })

  it('reads every rect once per frame however often refresh is called', () => {
    const cache = cacheWithFakes()
    const elements = boxes(3)

    for (const [index, element] of elements.entries()) {
      cache.observe(nodeId(`node_${index}`), element)
    }

    runFrame()

    for (const element of elements) {
      expect(element.getBoundingClientRect).toHaveBeenCalledTimes(1)
    }

    cache.refresh()
    cache.refresh()
    cache.refresh()
    runFrame()

    for (const element of elements) {
      expect(element.getBoundingClientRect).toHaveBeenCalledTimes(2)
    }
  })

  it('serves rects from the map, and get never reads layout', () => {
    const cache = cacheWithFakes()
    const [element] = boxes(1)
    const id = nodeId('node_1')

    if (element === undefined) {
      throw new Error('fixture')
    }

    cache.observe(id, element)
    runFrame()

    expect(cache.get(id)).toEqual({ x: 0, y: 0, width: 10, height: 10 })

    cache.invalidate(id)

    expect(cache.get(id)).toBeUndefined()
    expect(element.getBoundingClientRect).toHaveBeenCalledTimes(1)
  })

  it('drops every rect when invalidated without an id', () => {
    const cache = cacheWithFakes()
    const elements = boxes(2)

    elements.forEach((element, index) => cache.observe(nodeId(`node_${index}`), element))
    runFrame()
    cache.invalidate()

    expect(cache.get(nodeId('node_0'))).toBeUndefined()
    expect(cache.get(nodeId('node_1'))).toBeUndefined()
  })

  it('re-reads the whole set when the observer fires, because a resize moves siblings', () => {
    const cache = cacheWithFakes()
    const elements = boxes(2)

    elements.forEach((element, index) => cache.observe(nodeId(`node_${index}`), element))
    runFrame()
    observers[0]?.fire()
    runFrame()

    for (const element of elements) {
      expect(element.getBoundingClientRect).toHaveBeenCalledTimes(2)
    }
  })

  it('forgets a node when its wrapper unmounts', () => {
    const cache = cacheWithFakes()
    const [element] = boxes(1)
    const id = nodeId('node_1')

    if (element === undefined) {
      throw new Error('fixture')
    }

    const release = cache.observe(id, element)

    runFrame()
    release()

    expect(cache.get(id)).toBeUndefined()
    expect(observers[0]?.observed).toHaveLength(0)
  })

  it('cancels a pending frame on dispose and builds a fresh observer afterwards', () => {
    const cache = cacheWithFakes()
    const [element] = boxes(1)

    if (element === undefined) {
      throw new Error('fixture')
    }

    cache.observe(nodeId('node_1'), element)
    cache.dispose()
    runFrame()

    expect(element.getBoundingClientRect).not.toHaveBeenCalled()

    cache.observe(nodeId('node_1'), element)

    expect(observers).toHaveLength(2)
  })

  it('works without a ResizeObserver, which is what a server render has', () => {
    const cache = createRectCache({ schedule, cancel, createObserver: () => null })
    const [element] = boxes(1)
    const id = nodeId('node_1')

    if (element === undefined) {
      throw new Error('fixture')
    }

    cache.observe(id, element)
    runFrame()

    expect(cache.get(id)).toEqual({ x: 0, y: 0, width: 10, height: 10 })
  })
})
