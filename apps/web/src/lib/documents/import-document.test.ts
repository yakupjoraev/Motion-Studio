import {
  type MotionDocument,
  blockId,
  doc,
  fakeRegistry,
  nodeId,
  serializeDocument,
  tree,
  treeId,
} from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { IMPORT_STAGES, MAX_FILE_BYTES, importDocument } from './import-document'

const registry = fakeRegistry({ container: {} })

const text = (document: MotionDocument): string => serializeDocument(document)

const clean = (): MotionDocument => doc(tree({ root: ['a', 'b'] }))

const rejectionOf = (input: string): { stage: string; title: string; detail: string } => {
  const outcome = importDocument(input, registry)

  if (outcome.ok) {
    throw new Error('expected a rejection')
  }

  return outcome.error
}

const successOf = (input: string) => {
  const outcome = importDocument(input, registry)

  if (!outcome.ok) {
    throw new Error(`expected a document, got ${outcome.error.title}`)
  }

  return outcome.value
}

describe('every stage rejects with its documented error', () => {
  it('refuses a file over the cap before it parses one', () => {
    expect(rejectionOf(' '.repeat(MAX_FILE_BYTES + 1))).toMatchObject({
      stage: IMPORT_STAGES.size,
      title: 'File too large',
    })
  })

  it('names the line of a syntax error', () => {
    expect(rejectionOf('{\n  "version": 1,\n  oops\n}')).toMatchObject({
      stage: IMPORT_STAGES.parse,
      title: 'Not valid JSON (line 3)',
    })
  })

  it('refuses a file with no version', () => {
    expect(rejectionOf('{"nodes":{}}').stage).toBe(IMPORT_STAGES.migrate)
  })

  it('says a newer version was used', () => {
    expect(rejectionOf(text({ ...clean(), version: 99 }))).toMatchObject({
      stage: IMPORT_STAGES.migrate,
      title: 'Made with a newer version',
    })
  })

  it('reports the field path of a schema failure', () => {
    const broken = { ...clean(), meta: { ...clean().meta, canvas: { width: 'wide' } } }

    expect(rejectionOf(JSON.stringify(broken))).toMatchObject({
      stage: IMPORT_STAGES.schema,
      detail: expect.stringContaining('meta.canvas.width'),
    })
  })

  it('rejects a cycle rather than guessing which edge to keep', () => {
    const cyclic = doc(tree({ root: ['a'], a: ['b'], b: ['a'] }))

    expect(rejectionOf(text(cyclic))).toMatchObject({
      stage: IMPORT_STAGES.validate,
      title: 'This document contains a loop',
    })
  })

  it('rejects a document whose root is not in it', () => {
    const rootless = { ...clean(), rootId: nodeId('node_missing') }

    expect(rejectionOf(text(rootless))).toMatchObject({
      stage: IMPORT_STAGES.validate,
      title: 'This document has no root',
    })
  })
})

describe('every repair reaches the report with a count', () => {
  it('opens a clean file with nothing to say', () => {
    expect(successOf(text(clean())).notes).toEqual([])
  })

  it('reports dropped orphans', () => {
    const nodes = tree({ root: ['a'] })
    const orphaned = doc([...nodes, ...tree({ loose: ['stray'] })])

    expect(successOf(text(orphaned)).notes).toContainEqual({
      tone: 'warning',
      count: 2,
      message: '2 orphan blocks removed',
    })
  })

  it('reports a rebuilt parent reference', () => {
    const base = doc(tree({ root: ['a'] }))
    const lying = {
      ...base,
      nodes: {
        ...base.nodes,
        [treeId('a')]: { ...base.nodes[treeId('a')], parentId: null },
      },
    } as MotionDocument

    expect(successOf(text(lying)).notes).toContainEqual({
      tone: 'warning',
      count: 1,
      message: '1 parent reference rebuilt from children',
    })
  })

  it('reports a removed reference to a missing block', () => {
    const base = doc(tree({ root: ['a'] }))
    const dangling = {
      ...base,
      nodes: {
        ...base.nodes,
        [base.rootId]: {
          ...base.nodes[base.rootId],
          children: [treeId('a'), nodeId('node_ghost')],
        },
      },
    } as MotionDocument

    expect(successOf(text(dangling)).notes).toContainEqual({
      tone: 'warning',
      count: 1,
      message: '1 reference to a missing block removed',
    })
  })

  it('reports a deduplicated child', () => {
    const base = doc(tree({ root: ['a'] }))
    const twice = {
      ...base,
      nodes: {
        ...base.nodes,
        [base.rootId]: { ...base.nodes[base.rootId], children: [treeId('a'), treeId('a')] },
      },
    } as MotionDocument

    expect(successOf(text(twice)).notes).toContainEqual({
      tone: 'warning',
      count: 1,
      message: '1 duplicate child entry removed',
    })
  })

  it('keeps a block this build does not have, and says so', () => {
    const base = doc(tree({ root: ['a'] }))
    const foreign = {
      ...base,
      nodes: {
        ...base.nodes,
        [treeId('a')]: { ...base.nodes[treeId('a')], blockId: blockId('custom-hero') },
      },
    } as MotionDocument

    const imported = successOf(text(foreign))

    expect(imported.notes).toContainEqual({
      tone: 'info',
      count: 1,
      message: '1 block is not available and renders as a placeholder',
    })
    expect(imported.document.nodes[treeId('a')]).toBeDefined()
  })

  it('removes an unsafe URL and reports it', () => {
    const base = doc(tree({ root: ['a'] }))
    const hostile = {
      ...base,
      nodes: {
        ...base.nodes,
        [treeId('a')]: {
          ...base.nodes[treeId('a')],
          props: { href: 'javascript:alert(1)' },
        },
      },
    } as MotionDocument

    const imported = successOf(text(hostile))

    expect(imported.notes).toContainEqual({
      tone: 'warning',
      count: 1,
      message: '1 unsafe value removed',
    })
    expect(imported.document.nodes[treeId('a')]?.props['href']).toBe('')
  })
})
