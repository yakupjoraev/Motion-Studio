import { beforeEach, describe, expect, it } from 'vitest'
import { z } from 'zod'

import { nodeId } from '../ids/ids'
import { doc, fakeRegistry, node, resetFactories, tree, treeId } from '../test/factories'

import type { MotionDocument } from './document.types'
import { REPAIR_KINDS, repairDocument } from './repair'
import { validateDocument } from './validate'
import { DOCUMENT_ERROR_CODES } from './validate.errors'

const repaired = (document: MotionDocument, registry?: ReturnType<typeof fakeRegistry>) => {
  const result = repairDocument(document, registry === undefined ? {} : { registry })

  if (!result.ok) {
    throw new Error(`Expected a repair, got a rejection: ${result.error[0]?.code}`)
  }

  return result.value
}

beforeEach(() => {
  resetFactories()
})

describe('the repair table', () => {
  it('drops an orphan and reports it', () => {
    const nodes = [...tree({ root: [] }), node({ id: nodeId('node_lost'), name: 'Lost' })]
    const outcome = repaired(doc(nodes, { rootId: treeId('root') }))

    expect(Object.keys(outcome.document.nodes)).toEqual(['node_root'])
    expect(outcome.repairs).toContainEqual(
      expect.objectContaining({ kind: REPAIR_KINDS.droppedOrphan, nodeIds: ['node_lost'] }),
    )
  })

  it('removes a child reference that points at nothing', () => {
    const nodes = tree({ root: [] }).map((entry) => ({ ...entry, children: [nodeId('node_gone')] }))
    const outcome = repaired(doc(nodes, { rootId: treeId('root') }))

    expect(outcome.document.nodes[treeId('root')]?.children).toEqual([])
    expect(outcome.repairs.map((repair) => repair.kind)).toContain(REPAIR_KINDS.removedMissingChild)
  })

  it('trusts children and rebuilds a disagreeing parentId', () => {
    const nodes = tree({ root: ['a', 'b'] }).map((entry) =>
      entry.id === treeId('a') ? { ...entry, parentId: treeId('b') } : entry,
    )
    const outcome = repaired(doc(nodes, { rootId: treeId('root') }))

    expect(outcome.document.nodes[treeId('a')]?.parentId).toBe(treeId('root'))
    expect(outcome.repairs.map((repair) => repair.kind)).toContain(REPAIR_KINDS.rebuiltParent)
  })

  it('deduplicates a child listed twice', () => {
    const nodes = tree({ root: ['a'] }).map((entry) =>
      entry.id === treeId('root') ? { ...entry, children: [treeId('a'), treeId('a')] } : entry,
    )
    const outcome = repaired(doc(nodes, { rootId: treeId('root') }))

    expect(outcome.document.nodes[treeId('root')]?.children).toEqual(['node_a'])
    expect(outcome.repairs.map((repair) => repair.kind)).toContain(
      REPAIR_KINDS.deduplicatedChildren,
    )
  })

  it('keeps a node whose block is unknown, so the canvas can draw a placeholder', () => {
    const outcome = repaired(
      doc(tree({ root: [] }), { rootId: treeId('root') }),
      fakeRegistry({ section: {} }),
    )

    expect(outcome.document.nodes[treeId('root')]).toBeDefined()
    expect(outcome.repairs.map((repair) => repair.kind)).toContain(REPAIR_KINDS.unknownBlock)
  })

  it('merges invalid props over the block defaults, keeping the valid keys', () => {
    const nodes = tree({ root: [] }).map((entry) => ({
      ...entry,
      props: { columns: 'three', gap: 24 },
    }))

    const registry = fakeRegistry({
      container: {
        propsSchema: z.object({ columns: z.number(), gap: z.number() }),
        defaults: { columns: 1, gap: 16 },
      },
    })

    const outcome = repaired(doc(nodes, { rootId: treeId('root') }), registry)

    expect(outcome.document.nodes[treeId('root')]?.props).toEqual({ columns: 1, gap: 24 })
    expect(outcome.repairs.map((repair) => repair.kind)).toContain(REPAIR_KINDS.mergedProps)
  })

  it('leaves a healthy document alone and reports nothing', () => {
    const document = doc(tree({ root: ['a'] }), { rootId: treeId('root') })
    const outcome = repaired(document)

    expect(outcome.repairs).toEqual([])
    expect(outcome.document).toEqual(document)
  })

  it('produces a document that then validates', () => {
    const nodes = [
      ...tree({ root: ['a'] }).map((entry) =>
        entry.id === treeId('root')
          ? { ...entry, children: [treeId('a'), treeId('a'), nodeId('node_gone')] }
          : entry,
      ),
      node({ id: nodeId('node_lost') }),
    ]

    const outcome = repaired(doc(nodes, { rootId: treeId('root') }))

    expect(validateDocument(outcome.document).ok).toBe(true)
  })
})

describe('the two rejections', () => {
  it('refuses a cycle rather than guessing which edge to cut', () => {
    const nodes = tree({ root: ['a'], a: ['b'], b: [] }).map((entry) =>
      entry.id === treeId('b') ? { ...entry, children: [treeId('a')] } : entry,
    )

    const result = repairDocument(doc(nodes, { rootId: treeId('root') }))

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.error.map((error) => error.code)).toEqual([
      DOCUMENT_ERROR_CODES.cycle,
    ])
  })

  it('refuses a document with no root', () => {
    const result = repairDocument(
      doc([node({ id: nodeId('node_1') })], { rootId: nodeId('node_404') }),
    )

    expect(result.ok).toBe(false)
    expect(result.ok ? [] : result.error.map((error) => error.code)).toEqual([
      DOCUMENT_ERROR_CODES.missingRoot,
    ])
  })
})

describe('reporting', () => {
  it('counts the nodes each repair touched, which is what the import dialog shows', () => {
    const nodes = [
      ...tree({ root: [] }),
      node({ id: nodeId('node_x') }),
      node({ id: nodeId('node_y') }),
    ]

    const outcome = repaired(doc(nodes, { rootId: treeId('root') }))
    const dropped = outcome.repairs.find((repair) => repair.kind === REPAIR_KINDS.droppedOrphan)

    expect(dropped?.nodeIds).toHaveLength(2)
  })

  it('skips the block-level rows when no registry is given', () => {
    const outcome = repaired(doc(tree({ root: [] }), { rootId: treeId('root') }))

    expect(outcome.repairs).toEqual([])
  })
})
