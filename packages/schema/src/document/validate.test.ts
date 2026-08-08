import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { nodeId } from '../ids/ids'
import { doc, fakeRegistry, node, resetFactories, tree, treeId } from '../test/factories'

import type { MotionDocument } from './document.types'
import { DOCUMENT_ERROR_CODES, validateDocument, validateProps } from './validate'

const codes = (document: MotionDocument, registry?: ReturnType<typeof fakeRegistry>): string[] => {
  const result = validateDocument(document, registry === undefined ? {} : { registry })

  return result.ok ? [] : result.error.map((error) => error.code)
}

beforeEach(() => {
  resetFactories()
})

describe('a document that satisfies every invariant', () => {
  it('validates with no errors', () => {
    const document = doc(tree({ root: ['a', 'b'], a: ['c'], b: [], c: [] }), {
      rootId: treeId('root'),
    })

    expect(validateDocument(document).ok).toBe(true)
  })
})

describe('the nine invariants', () => {
  it('1 — reports a rootId that is not in nodes', () => {
    const document = doc([node({ id: nodeId('node_1') })], { rootId: nodeId('node_404') })

    expect(codes(document)).toEqual([DOCUMENT_ERROR_CODES.missingRoot])
  })

  it('2 — reports a root that has a parent', () => {
    const nodes = tree({ root: [] }).map((entry) => ({ ...entry, parentId: nodeId('node_9') }))
    const document = doc(nodes, { rootId: treeId('root') })

    expect(codes(document)).toContain(DOCUMENT_ERROR_CODES.badParent)
  })

  it('2 — reports a non-root node whose parent is missing', () => {
    const nodes = tree({ root: ['a'] })
    const orphaned = nodes.map((entry) =>
      entry.id === treeId('a') ? { ...entry, parentId: nodeId('node_gone') } : entry,
    )

    expect(codes(doc(orphaned, { rootId: treeId('root') }))).toContain(
      DOCUMENT_ERROR_CODES.badParent,
    )
  })

  it('3 — reports a child whose parentId names someone else', () => {
    const nodes = tree({ root: ['a', 'b'] })
    const mismatched = nodes.map((entry) =>
      entry.id === treeId('a') ? { ...entry, parentId: treeId('b') } : entry,
    )

    expect(codes(doc(mismatched, { rootId: treeId('root') }))).toContain(
      DOCUMENT_ERROR_CODES.parentChildMismatch,
    )
  })

  it('4 — reports a cycle', () => {
    const nodes = tree({ root: ['a'], a: ['b'], b: [] })
    const cyclic = nodes.map((entry) =>
      entry.id === treeId('b') ? { ...entry, children: [treeId('a')] } : entry,
    )

    expect(codes(doc(cyclic, { rootId: treeId('root') }))).toContain(DOCUMENT_ERROR_CODES.cycle)
  })

  it('5 — reports a node that is not reachable from the root', () => {
    const nodes = [...tree({ root: [] }), node({ id: nodeId('node_lost'), name: 'Lost' })]

    expect(codes(doc(nodes, { rootId: treeId('root') }))).toContain(DOCUMENT_ERROR_CODES.orphan)
  })

  it('6 — reports a blockId the registry does not know', () => {
    const document = doc(tree({ root: [] }), { rootId: treeId('root') })

    expect(codes(document, fakeRegistry({ section: {} }))).toContain(
      DOCUMENT_ERROR_CODES.unknownBlock,
    )
  })

  it('7 — reports props that do not parse against the block schema', () => {
    const nodes = tree({ root: [] }).map((entry) => ({ ...entry, props: { columns: 'three' } }))
    const registry = fakeRegistry({
      container: { propsSchema: z.object({ columns: z.number() }), defaults: { columns: 1 } },
    })

    expect(codes(doc(nodes, { rootId: treeId('root') }), registry)).toContain(
      DOCUMENT_ERROR_CODES.invalidProps,
    )
  })

  it('8 — reports a child sitting in a slot its parent does not declare', () => {
    const nodes = tree({ root: ['a'] }).map((entry) =>
      entry.id === treeId('a') ? { ...entry, slot: 'aside' } : entry,
    )

    expect(codes(doc(nodes, { rootId: treeId('root') }), fakeRegistry())).toContain(
      DOCUMENT_ERROR_CODES.unknownSlot,
    )
  })

  it('9 — reports a child listed twice', () => {
    const nodes = tree({ root: ['a'] }).map((entry) =>
      entry.id === treeId('root') ? { ...entry, children: [treeId('a'), treeId('a')] } : entry,
    )

    expect(codes(doc(nodes, { rootId: treeId('root') }))).toContain(
      DOCUMENT_ERROR_CODES.duplicateChild,
    )
  })
})

describe('reporting', () => {
  it('returns every violation, not the first', () => {
    const nodes = [
      ...tree({ root: ['a'] }).map((entry) =>
        entry.id === treeId('root') ? { ...entry, children: [treeId('a'), treeId('a')] } : entry,
      ),
      node({ id: nodeId('node_lost') }),
    ]

    const found = codes(doc(nodes, { rootId: treeId('root') }))

    expect(found).toContain(DOCUMENT_ERROR_CODES.duplicateChild)
    expect(found).toContain(DOCUMENT_ERROR_CODES.orphan)
  })

  it('stops after a missing root, because everything else would restate it', () => {
    const document = doc([node({ id: nodeId('node_1') })], { rootId: nodeId('node_404') })

    expect(codes(document)).toHaveLength(1)
  })

  it('names the node a violation belongs to', () => {
    const nodes = [...tree({ root: [] }), node({ id: nodeId('node_lost') })]
    const result = validateDocument(doc(nodes, { rootId: treeId('root') }))

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.error.map((error) => error.nodeId)).toContain('node_lost')
  })

  it('skips the three registry invariants when no registry is given', () => {
    const document = doc(tree({ root: [] }), { rootId: treeId('root') })

    expect(validateDocument(document).ok).toBe(true)
  })
})

describe('validateProps', () => {
  it('separates unknown blocks from invalid props, and neither is fatal', () => {
    const nodes = [
      ...tree({ root: ['a'] }).map((entry) =>
        entry.id === treeId('root') ? { ...entry, props: { columns: 'three' } } : entry,
      ),
    ].map((entry) =>
      entry.id === treeId('a') ? { ...entry, blockId: 'from-the-future' as never } : entry,
    )

    const registry = fakeRegistry({
      container: { propsSchema: z.object({ columns: z.number() }), defaults: { columns: 1 } },
    })

    const report = validateProps(doc(nodes, { rootId: treeId('root') }), registry)

    expect(report.unknownBlocks).toHaveLength(1)
    expect(report.invalidProps).toHaveLength(1)
  })
})
