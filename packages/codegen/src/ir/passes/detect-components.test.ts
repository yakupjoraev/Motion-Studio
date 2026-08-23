import type { MotionDocument } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { resolveOptions } from '../../options.types'
import { fixtureRegistry } from '../../test/blocks'
import { document, fullLanding, nestedContainers, repeatedSubtrees } from '../../test/documents'
import { fixtureMarkup } from '../../test/markup'
import { type Boundaries, detectComponents } from './detect-components'

const detect = (source: MotionDocument, overrides = {}): Boundaries =>
  detectComponents({
    document: source,
    registry: fixtureRegistry(),
    markup: fixtureMarkup,
    options: resolveOptions(overrides),
    root: source.rootId,
  })

const sources = (boundaries: Boundaries): readonly string[] =>
  boundaries.units.map((unit) => String(unit.source))

describe('rule 1 — the root', () => {
  it('is the entry component', () => {
    const units = detect(fullLanding()).units

    expect(units[0]).toMatchObject({ kind: 'entry', source: 'node_root' })
  })
})

describe('rule 2 — section-category children of the root', () => {
  it('gives a component to each of them', () => {
    const boundaries = detect(fullLanding())
    const sections = boundaries.units.filter((unit) => unit.kind === 'section')

    expect(sections.map((unit) => String(unit.source))).toEqual([
      'node_nav',
      'node_hero',
      'node_pricing',
    ])
  })

  it('inlines a child whose category is not a section', () => {
    expect(sources(detect(fullLanding()))).not.toContain('node_faq')
    expect(sources(detect(fullLanding()))).not.toContain('node_media')
  })

  it('inlines a section-category node that is not a direct child of the root', () => {
    const nested = document({
      id: 'node_root',
      block: 'page',
      children: [
        {
          id: 'node_wrap',
          block: 'section',
          children: [{ id: 'node_hero', block: 'hero', props: { padding: 'md' } }],
        },
      ],
    })

    expect(sources(detect(nested))).toEqual(['node_root'])
  })
})

describe('rule 3 — repeated subtrees', () => {
  it('turns three identical cards into one component with three usages', () => {
    const extracted = detect(repeatedSubtrees()).units.filter((unit) => unit.kind === 'extracted')

    expect(extracted).toHaveLength(1)
    expect(extracted[0]?.instances).toEqual(['node_a', 'node_b', 'node_c'])
  })

  it('leaves out the card whose structure differs', () => {
    const extracted = detect(repeatedSubtrees()).units.filter((unit) => unit.kind === 'extracted')

    expect(extracted[0]?.instances).not.toContain('node_d')
  })

  it('extracts two cards that differ only in text, with the differing props', () => {
    const two = document({
      id: 'node_root',
      block: 'page',
      children: [
        {
          id: 'node_wrap',
          block: 'section',
          props: { padding: 'md' },
          children: [
            { id: 'node_a', block: 'plan-card', props: { plan: 'Starter', price: 0 } },
            { id: 'node_b', block: 'plan-card', props: { plan: 'Pro', price: 0 } },
          ],
        },
      ],
    })
    const extracted = detect(two).units.filter((unit) => unit.kind === 'extracted')

    expect(extracted[0]?.propNames).toEqual(['plan'])
  })

  it('refuses to extract two nodes that differ in a prop a class rule reads — ADR-228', () => {
    const modes = document({
      id: 'node_root',
      block: 'page',
      children: [
        { id: 'node_a', block: 'grid', props: { mode: 'explicit' } },
        { id: 'node_b', block: 'grid', props: { mode: 'auto-fit' } },
      ],
    })

    expect(detect(modes).units.filter((unit) => unit.kind === 'extracted')).toEqual([])
  })

  it('extracts the outer subtree rather than the repeated card inside it', () => {
    const card = (id: string) => ({ id, block: 'plan-card', props: { plan: 'Pro' } })
    const band = (id: string, a: string, b: string) => ({
      id,
      block: 'section',
      props: { padding: 'md' },
      children: [card(a), card(b)],
    })
    const nested = document({
      id: 'node_root',
      block: 'page',
      children: [band('node_one', 'node_a', 'node_b'), band('node_two', 'node_c', 'node_d')],
    })
    const extracted = detect(nested).units.filter((unit) => unit.kind === 'extracted')

    expect(extracted).toHaveLength(1)
    expect(extracted[0]?.instances).toEqual(['node_one', 'node_two'])
  })

  it('finds nothing to extract in a tree with no repetition', () => {
    expect(sources(detect(nestedContainers()))).toEqual(['node_root'])
  })
})

describe('rule 2b — a client boundary loose on the page — ADR-230', () => {
  it('gives the interactive block its own component', () => {
    const units = detect(fullLanding()).units.filter((unit) => unit.kind === 'client')

    expect(units.map((unit) => String(unit.source))).toEqual(['node_toggle'])
  })

  it('leaves it inlined when a section already encloses it', () => {
    const inside = document({
      id: 'node_root',
      block: 'page',
      children: [
        {
          id: 'node_nav',
          block: 'nav',
          children: [{ id: 'node_toggle', block: 'toggle' }],
        },
      ],
    })

    expect(sources(detect(inside))).toEqual(['node_root', 'node_nav'])
  })

  it('reads the condition rather than the category: a carousel with no controls inlines', () => {
    const quiet = document({
      id: 'node_root',
      block: 'page',
      children: [{ id: 'node_car', block: 'carousel', props: { arrows: false } }],
    })
    const loud = document({
      id: 'node_root',
      block: 'page',
      children: [{ id: 'node_car', block: 'carousel', props: { arrows: true } }],
    })

    expect(sources(detect(quiet))).toEqual(['node_root'])
    expect(sources(detect(loud))).toEqual(['node_root', 'node_car'])
  })
})

describe('the options', () => {
  it('collapses every boundary under singleFile', () => {
    expect(sources(detect(fullLanding(), { singleFile: true }))).toEqual(['node_root'])
  })

  it('does not extract differing instances when props are not being extracted', () => {
    const extracted = detect(repeatedSubtrees(), { extractProps: false }).units.filter(
      (unit) => unit.kind === 'extracted',
    )

    expect(extracted).toEqual([])
  })

  it('still extracts identical instances when props are not being extracted', () => {
    const twins = document({
      id: 'node_root',
      block: 'page',
      children: [
        {
          id: 'node_wrap',
          block: 'section',
          props: { padding: 'md' },
          children: [
            { id: 'node_a', block: 'plan-card', props: { plan: 'Pro' } },
            { id: 'node_b', block: 'plan-card', props: { plan: 'Pro' } },
          ],
        },
      ],
    })
    const extracted = detect(twins, { extractProps: false }).units.filter(
      (unit) => unit.kind === 'extracted',
    )

    expect(extracted).toHaveLength(1)
  })
})

describe('a hidden layer', () => {
  it('is not on the page, so it is not a boundary', () => {
    const withHidden = document({
      id: 'node_root',
      block: 'page',
      children: [
        { id: 'node_hero', block: 'hero', props: { padding: 'md' }, hidden: true },
        { id: 'node_nav', block: 'nav', props: {} },
      ],
    })

    expect(sources(detect(withHidden))).toEqual(['node_root', 'node_nav'])
  })

  it('takes its subtree with it, so a repeat inside it is not extracted', () => {
    const withHidden = document({
      id: 'node_root',
      block: 'page',
      children: [
        {
          id: 'node_wrap',
          block: 'section',
          hidden: true,
          children: [
            { id: 'node_a', block: 'plan-card', props: { plan: 'Pro' } },
            { id: 'node_b', block: 'plan-card', props: { plan: 'Pro' } },
          ],
        },
      ],
    })

    expect(sources(detect(withHidden))).toEqual(['node_root'])
  })
})

describe('the boundary maps', () => {
  it('point every instance at the unit it prints as', () => {
    const boundaries = detect(repeatedSubtrees())

    expect(boundaries.referenceOf.get('node_b' as never)?.source).toBe('node_a')
    expect(boundaries.unitOf.get('node_b' as never)).toBeUndefined()
  })
})
