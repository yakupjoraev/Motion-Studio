import { act, render, renderHook, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { fakeScene } from '../test/scene'

import {
  ANNOUNCE_DEBOUNCE_MS,
  SelectionAnnouncer,
  describeEnter,
  describeExit,
  describeSelection,
  useAnnouncer,
} from './selection-announcer'

const build = () =>
  fakeScene({
    root: { children: ['hero', 'gallery'], name: 'Page' },
    hero: { children: ['heading', 'body'], name: 'Hero' },
    heading: { name: 'Heading' },
    body: { name: 'Body' },
    gallery: { children: [], name: 'Gallery' },
  })

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('describeSelection', () => {
  it('names the node and where it sits, which is the whole point on a canvas', () => {
    const fake = build()

    fake.selection.select([fake.id('body')], 'replace')

    expect(describeSelection(fake.scene, fake.rootId)).toBe('Body selected. 2 of 2 in Hero.')
  })

  it('counts a multi-selection instead of listing it', () => {
    const fake = build()

    fake.selection.select([fake.id('hero'), fake.id('gallery')], 'replace')

    expect(describeSelection(fake.scene, fake.rootId)).toBe('2 blocks selected.')
  })

  it('says so when nothing is selected', () => {
    const fake = build()

    expect(describeSelection(fake.scene, fake.rootId)).toBe('Selection cleared.')
  })

  it('falls back to the bare name for a node with no place in the tree', () => {
    const fake = build()

    fake.selection.select([fake.rootId], 'replace')

    expect(describeSelection(fake.scene, fake.rootId)).toBe('Page selected.')
  })

  it('reports a selected id the scene has forgotten as cleared', () => {
    const fake = build()

    fake.selection.select([fake.id('missing')], 'replace')

    expect(describeSelection(fake.scene, fake.rootId)).toBe('Selection cleared.')
  })
})

describe('describeEnter and describeExit', () => {
  it('counts what is inside, in blocks', () => {
    const fake = build()

    expect(describeEnter(fake.scene, fake.id('hero'))).toBe('Entered Hero. 2 blocks inside.')
    expect(describeEnter(fake.scene, fake.id('gallery'))).toBe('Entered Gallery. 0 blocks inside.')
  })

  it('uses the singular for one child', () => {
    const fake = fakeScene({
      root: { children: ['a'] },
      a: { children: ['b'], name: 'Row' },
      b: {},
    })

    expect(describeEnter(fake.scene, fake.id('a'))).toBe('Entered Row. 1 block inside.')
  })

  it('names what was left', () => {
    const fake = build()

    expect(describeExit(fake.scene, fake.id('hero'))).toBe('Exited Hero.')
    expect(describeExit(fake.scene, null)).toBe('Exited.')
  })

  it('does not invent a name for a node that is gone', () => {
    const fake = build()

    expect(describeEnter(fake.scene, fake.id('missing'))).toBe('Entered container.')
    expect(describeExit(fake.scene, fake.id('missing'))).toBe('Exited Canvas.')
  })
})

describe('useAnnouncer', () => {
  it('announces once for a burst, 150 ms after the last of it', () => {
    const { result } = renderHook(() => useAnnouncer())

    render(<SelectionAnnouncer announcer={result.current} />)

    const region = screen.getByRole('status')

    act(() => {
      result.current.announce('Heading selected.')
      result.current.announce('Body selected.')
      vi.advanceTimersByTime(ANNOUNCE_DEBOUNCE_MS - 1)
    })

    expect(region).toHaveTextContent('')

    act(() => {
      vi.advanceTimersByTime(1)
    })

    expect(region).toHaveTextContent('Body selected.')
  })

  it('is polite and atomic, so a partial string is never read out', () => {
    const { result } = renderHook(() => useAnnouncer())

    render(<SelectionAnnouncer announcer={result.current} />)

    const region = screen.getByRole('status')

    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('aria-atomic', 'true')
  })

  it('drops a pending announcement when the canvas unmounts', () => {
    const { result, unmount } = renderHook(() => useAnnouncer())

    act(() => {
      result.current.announce('Body selected.')
    })

    unmount()

    expect(() => {
      act(() => {
        vi.advanceTimersByTime(ANNOUNCE_DEBOUNCE_MS)
      })
    }).not.toThrow()
  })
})
