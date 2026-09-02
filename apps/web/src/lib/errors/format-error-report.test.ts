import { beforeEach, describe, expect, it } from 'vitest'

import { recordCommand, recordGesture, resetErrorContext } from './error-context'
import { formatErrorReport } from './format-error-report'

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

/**
 * A document whose every string is a phrase that must not reach a report: a heading a user has not
 * published, a price, a customer's name, an internal URL.
 */
const document = {
  nodes: {
    node_root: { id: 'node_root', blockId: 'section', props: { heading: 'Acme Q3 launch' } },
    node_a3f2: {
      id: 'node_a3f2',
      blockId: 'pricing-table',
      props: { plans: [{ price: '$4,900', contact: 'priya@acme.example' }] },
    },
  },
  theme: { id: 'midnight' },
} as unknown as Parameters<typeof formatErrorReport>[0]['document']

type Input = Parameters<typeof formatErrorReport>[0]

/*
 * Spread over a base rather than `Partial<Input>` merged in: `exactOptionalPropertyTypes` treats an
 * explicit `undefined` as a different thing from an absent key, and every override here means the
 * absent key.
 */
const report = (over: Partial<Input> = {}): string =>
  formatErrorReport({
    error: new TypeError("Cannot read properties of undefined (reading 'map')"),
    appVersion: '1.0.0',
    userAgent: CHROME,
    document,
    ...over,
  } as Input)

describe('formatErrorReport', () => {
  beforeEach(() => {
    resetErrorContext()
  })

  it('leads with the product and the error, in that order', () => {
    const lines = report().split('\n')

    expect(lines[0]).toBe('Motion Studio 1.0.0')
    expect(lines[1]).toBe("TypeError: Cannot read properties of undefined (reading 'map')")
  })

  it('names the block and node when the boundary knows them', () => {
    const text = report({
      code: 'NODE_PROPS_INVALID',
      blockId: 'pricing-table',
      nodeId: 'node_a3f2',
    })

    expect(text).toContain('Code: NODE_PROPS_INVALID')
    expect(text).toContain('Block: pricing-table')
    expect(text).toContain('Node: node_a3f2')
  })

  it('omits the lines it has no answer for rather than printing empty ones', () => {
    const text = report()

    expect(text).not.toContain('Block:')
    expect(text).not.toContain('Node:')
    expect(text).not.toMatch(/^\s*Code:/m)
  })

  /**
   * The field the prompt calls the one that turns unreproducible reports into reproducible ones.
   */
  it('carries the last command and the last gesture', () => {
    recordGesture('click Export')
    recordCommand('setProp plans[2].price')

    const text = report()

    expect(text).toContain('Action: setProp plans[2].price')
    expect(text).toContain('Gesture: click Export')
  })

  it('says so plainly when nothing was recorded', () => {
    const text = report()

    expect(text).toContain('Action: none recorded')
    expect(text).toContain('Gesture: none recorded')
  })

  it('shortens the user agent to a browser and a platform', () => {
    expect(report()).toContain('Browser: Chrome 121 / Windows')
  })

  it('names Safari by its version rather than by its WebKit build', () => {
    const safari =
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'

    expect(report({ userAgent: safari })).toContain('Browser: Safari 17 / macOS')
  })

  it('describes the document as counts and a theme, and nothing else', () => {
    expect(report()).toContain('Document: 2 nodes, theme midnight')
  })

  /** The whole point of the module, asserted on a document made of things that must not leak. */
  it('leaks no document content', () => {
    const text = report({ blockId: 'pricing-table', nodeId: 'node_a3f2' })

    for (const secret of ['Acme Q3 launch', '$4,900', 'priya@acme.example']) {
      expect(text).not.toContain(secret)
    }
  })

  it('keeps the stack, which is the part a developer reads', () => {
    expect(report()).toContain('format-error-report.test.ts')
  })

  it('reports a thrown non-error without pretending it has a stack', () => {
    const text = report({ error: 'the worker died' })

    expect(text).toContain('Error: the worker died')
    expect(text).toContain('(no stack)')
  })

  it('says the document is unavailable when the store is the thing that broke', () => {
    expect(report({ document: null })).toContain('Document: not available')
  })
})
