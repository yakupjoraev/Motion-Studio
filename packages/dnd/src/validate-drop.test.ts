import {
  type BlockDefinition,
  type Node,
  type SlotDefinition,
  blockId,
  fakeRegistry,
  fixtureBlockId,
  node,
  resetFactories,
} from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { build, dropRegistry, id } from './test/drop'
import { validateDrop } from './validate-drop'

const registry = dropRegistry()

const slot = (overrides: Partial<SlotDefinition> = {}): SlotDefinition => ({
  name: 'children',
  label: 'Content',
  accepts: '*',
  minChildren: 0,
  maxChildren: null,
  ...overrides,
})

const dragged = (): BlockDefinition => registry.require(blockId('heading'))

const verdict = (
  parent: Node,
  definition: SlotDefinition,
  draggedNodeIds: readonly string[] = [],
) =>
  validateDrop({
    document: build({ root: ['a'] }, { blocks: { root: 'page' } }),
    registry,
    parent,
    slot: definition,
    dragged: dragged(),
    draggedNodeIds: draggedNodeIds.map((name) => id(name)),
  })

beforeEach(() => {
  resetFactories()
})

describe('validateDrop', () => {
  it('accepts an open slot', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'page' } })
    const parent = document.nodes[id('root')] as Node

    expect(verdict(parent, slot())).toEqual({ ok: true })
  })

  it('names the block a predicate slot turned down', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'page' } })
    const parent = document.nodes[id('root')] as Node
    const result = verdict(parent, slot({ accepts: () => false }))

    expect(result).toEqual({ ok: false, reason: 'root does not accept heading' })
  })

  it('says so when a slot accepts nothing at all', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'page' } })
    const parent = document.nodes[id('root')] as Node

    expect(verdict(parent, slot({ accepts: [], label: 'Links' }))).toEqual({
      ok: false,
      reason: 'root accepts nothing in links',
    })
  })

  it('lists the blocks when the accepted ones do not share a category', () => {
    const mixed = fakeRegistry({
      heading: { category: 'content', slots: [] },
      hero: { category: 'hero', slots: [] },
      page: {},
    })
    const document = build({ root: ['a'] }, { blocks: { root: 'page' } })
    const parent = document.nodes[id('root')] as Node
    const result = validateDrop({
      document,
      registry: mixed,
      parent,
      slot: slot({ accepts: [fixtureBlockId('hero'), fixtureBlockId('page')] }),
      dragged: mixed.require(blockId('heading')),
      draggedNodeIds: [],
    })

    expect(result).toEqual({ ok: false, reason: 'root only accepts hero, page' })
  })

  it('counts a bounded slot in the singular when it holds one', () => {
    const document = build({ root: ['a'] }, { blocks: { root: 'page' } })
    const parent = document.nodes[id('root')] as Node
    const result = validateDrop({
      document,
      registry,
      parent,
      slot: slot({ maxChildren: 1, label: 'Cards' }),
      dragged: dragged(),
      draggedNodeIds: [],
    })

    expect(result).toEqual({ ok: false, reason: 'root accepts up to 1 card' })
  })

  it('reports a full slot that declares no maximum as full rather than as a number', () => {
    // `slotHasRoom` only refuses when there is a maximum, so an unbounded slot never reaches this —
    // the sentence exists so the type has no unreachable arm, and the test says which one it is.
    const parent = node({ id: id('root'), name: 'root' })

    expect(verdict(parent, slot({ maxChildren: null }))).toEqual({ ok: true })
  })

  it('refuses a locked parent before it looks at anything else', () => {
    const parent = node({ id: id('root'), name: 'root', locked: true, hidden: true })

    expect(verdict(parent, slot())).toEqual({ ok: false, reason: 'Layer is locked' })
  })

  it('refuses a hidden parent', () => {
    const parent = node({ id: id('root'), name: 'root', hidden: true })

    expect(verdict(parent, slot())).toEqual({ ok: false, reason: 'Layer is hidden' })
  })

  it('refuses the node that is being dragged', () => {
    const parent = node({ id: id('root'), name: 'root' })

    expect(verdict(parent, slot(), ['root'])).toEqual({
      ok: false,
      reason: 'Cannot drop into itself',
    })
  })
})
