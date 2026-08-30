import { markupRegistry } from '@motion-studio/blocks/markup'
import { blockRegistry } from '@motion-studio/blocks/registry'
import { buildIR, printReact, resolveOptions } from '@motion-studio/codegen'
import { presetRegistry } from '@motion-studio/motion'
import { blockId, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { blockDocument, printBlockSource } from './block-source'

const aurora = blockId('aurora-background')

/**
 * `prompts/52`: "Source shown equals `codegen` output for the same props (assert equality, not a
 * snapshot)." A snapshot would record whatever the page happens to show; this runs the exporter
 * beside it and compares, so the two cannot drift without the test saying so.
 */
describe('the source the gallery shows', () => {
  it('is byte-for-byte what the exporter prints for the same document', () => {
    const props = blockRegistry.require(aurora).defaults
    const options = resolveOptions({ target: 'react', scope: 'selection', includeTheme: false })

    const ir = buildIR({
      document: blockDocument(aurora, props),
      registry: blockRegistry,
      presets: presetRegistry,
      markup: markupRegistry,
      options,
      selection: nodeId('node_preview'),
    })
    const expected = printReact({ ir, options })
    const entry = ir.components.find((component) => component.name === ir.entry)?.fileName
    const file = expected.files.find((one) => one.path === entry)

    expect(printBlockSource(aurora, props).contents).toBe(file?.contents)
  })

  it('changes when a prop changes, and only then', () => {
    const definition = blockRegistry.require(aurora)
    const defaults = definition.propsSchema.parse(definition.defaults)

    const first = printBlockSource(aurora, defaults)
    const again = printBlockSource(aurora, defaults)
    const tuned = printBlockSource(aurora, { ...defaults, blur: 32 })

    expect(again.contents).toBe(first.contents)
    expect(tuned.contents).not.toBe(first.contents)
    expect(tuned.contents).toContain('32')
  })

  it('prints every block in the catalogue without throwing', () => {
    for (const definition of blockRegistry.list()) {
      const props = definition.propsSchema.parse(definition.defaults)

      expect(() => printBlockSource(definition.id, props), `${definition.id} prints`).not.toThrow()
    }
  })

  it('builds a one-node document rooted at the block itself', () => {
    const document = blockDocument(aurora, blockRegistry.require(aurora).defaults)

    expect(Object.keys(document.nodes)).toHaveLength(1)
    expect(document.nodes[document.rootId]?.blockId).toBe(aurora)
  })
})
