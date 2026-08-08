import { describe, expect, it } from 'vitest'

import { fakeScene } from '../test/scene'

import { type HitContext, nodeIdsFromElements, resolveHit } from './hit-test'

/**
 * Page
 * ├─ hero        (container)
 * │  ├─ heading
 * │  └─ locked-box (locked)
 * │     └─ caption
 * ├─ gallery
 * │  └─ tile
 * └─ ghost       (hidden)
 */
const build = (isolationId: string | null = null) => {
  const fake = fakeScene({
    root: { children: ['hero', 'gallery', 'ghost'] },
    hero: { children: ['heading', 'locked-box'] },
    heading: {},
    'locked-box': { children: ['caption'], locked: true },
    caption: {},
    gallery: { children: ['tile'] },
    tile: {},
    ghost: { hidden: true },
  })

  const context: HitContext = {
    rootId: fake.rootId,
    isolationId: isolationId === null ? null : fake.id(isolationId),
    node: (id) => fake.scene.node(id),
  }

  return { fake, context }
}

/** `elementsFromPoint` order: deepest first, then every ancestor above it. */
const stack = (fake: ReturnType<typeof build>['fake'], names: readonly string[]) =>
  names.map(fake.id)

describe('nodeIdsFromElements', () => {
  it('keeps only the elements that carry a node id, in the order given', () => {
    const withId = (id: string): Element => {
      const element = document.createElement('div')

      element.setAttribute('data-node-id', id)

      return element
    }

    const ids = nodeIdsFromElements([
      withId('node_a'),
      document.createElement('span'),
      withId('node_b'),
    ])

    expect(ids).toEqual(['node_a', 'node_b'])
  })
})

describe('resolveHit', () => {
  it('lifts a nested node to the top-level container it lives in', () => {
    const { fake, context } = build()

    expect(resolveHit(stack(fake, ['heading', 'hero', 'root']), context)).toBe(fake.id('hero'))
  })

  it('returns the deepest node under the cursor with Alt', () => {
    const { fake, context } = build()

    expect(resolveHit(stack(fake, ['heading', 'hero', 'root']), context, { deep: true })).toBe(
      fake.id('heading'),
    )
  })

  it('selects the child once the container has been entered', () => {
    const { fake, context } = build('hero')

    expect(resolveHit(stack(fake, ['heading', 'hero', 'root']), context)).toBe(fake.id('heading'))
  })

  it('lifts against the root for a candidate outside the isolated container', () => {
    const { fake, context } = build('hero')

    expect(resolveHit(stack(fake, ['tile', 'gallery', 'root']), context)).toBe(fake.id('gallery'))
  })

  it('returns nothing for the level container itself, so the press can start a marquee', () => {
    const { fake, context } = build('hero')

    expect(resolveHit(stack(fake, ['hero', 'root']), context)).toBeNull()
  })

  it('returns nothing for the root, which is empty artboard', () => {
    const { fake, context } = build()

    expect(resolveHit(stack(fake, ['root']), context)).toBeNull()
    expect(resolveHit(stack(fake, ['root']), context, { deep: true })).toBeNull()
  })

  it('skips a locked node and everything under it, so clicks fall through', () => {
    const { fake, context } = build('hero')

    expect(resolveHit(stack(fake, ['caption', 'locked-box', 'hero', 'root']), context)).toBeNull()
    expect(
      resolveHit(stack(fake, ['caption', 'locked-box', 'hero', 'root']), context, { deep: true }),
    ).toBe(fake.id('caption'))
  })

  it('skips a hidden node', () => {
    const { fake, context } = build()

    expect(resolveHit(stack(fake, ['ghost', 'root']), context)).toBeNull()
  })

  it('takes the next candidate when the first one is blocked', () => {
    const { fake, context } = build()

    expect(resolveHit(stack(fake, ['ghost', 'tile', 'gallery', 'root']), context)).toBe(
      fake.id('gallery'),
    )
  })

  it('returns nothing for an id the scene does not know', () => {
    const { fake, context } = build()

    expect(resolveHit([fake.id('missing')], context)).toBeNull()
  })

  it('stops on a parent cycle rather than looping', () => {
    const fake = fakeScene({ root: { children: ['a'] }, a: { children: ['b'] }, b: {} })
    const cyclic: HitContext = {
      rootId: fake.rootId,
      isolationId: null,
      node: (id) =>
        id === fake.id('a')
          ? { parentId: fake.id('b'), name: 'a', children: [], locked: false, hidden: false }
          : fake.scene.node(id),
    }

    expect(resolveHit([fake.id('a')], cyclic)).toBeNull()
  })
})
