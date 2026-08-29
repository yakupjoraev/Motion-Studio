import { ESCAPE_HATCH_PROP, createEmptyDocument, nodeId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { useStudioStore } from './editor-store'
import { connectEscapeHatch, readTarget } from './escape-hatch-bridge'
import { escapeHatchPort } from './escape-hatch-port'

const ROOT = nodeId('node_root')
const state = () => useStudioStore.getState()
const cssOf = (): unknown => state().document.nodes[ROOT]?.props[ESCAPE_HATCH_PROP]

beforeEach(() => {
  state().replaceDocument(createEmptyDocument({ ids: () => ROOT }))
  state().select([ROOT])
  connectEscapeHatch()
})

describe('what the studio publishes', () => {
  it('summarises the one selected node', () => {
    const target = escapeHatchPort.snapshot()

    expect(target?.nodeId).toBe(ROOT)
    expect(target?.properties).toContain('box-shadow')
  })

  it('publishes nothing for an empty or multiple selection', () => {
    state().select([])

    expect(escapeHatchPort.snapshot()).toBeUndefined()
  })

  it('has no answer for a node that is not in the document', () => {
    expect(readTarget(state().document, [nodeId('node_missing')])).toBeUndefined()
  })
})

describe('writing a value to the selection', () => {
  it('lands on the node’s css prop as one undoable command', () => {
    escapeHatchPort.write('box-shadow', '0 8px 24px black')

    expect(cssOf()).toBe('box-shadow: 0 8px 24px black')

    state().undo()

    expect(cssOf()).toBeUndefined()
  })

  it('replaces the same property and keeps the others', () => {
    escapeHatchPort.write('box-shadow', '0 8px 24px black')
    escapeHatchPort.write('clip-path', 'circle(40%)')
    escapeHatchPort.write('box-shadow', '0 1px 2px black')

    expect(cssOf()).toBe('clip-path: circle(40%);\nbox-shadow: 0 1px 2px black')
  })

  it('refuses a property the block does not accept', () => {
    escapeHatchPort.publish({
      nodeId: ROOT,
      nodeName: 'Root',
      blockName: 'Container',
      properties: ['box-shadow'],
      css: '',
    })
    escapeHatchPort.write('behavior', 'url(#evil)')

    expect(cssOf()).toBeUndefined()
  })

  it('reports that nothing happened when no studio has connected a writer', () => {
    escapeHatchPort.publish(undefined)

    expect(escapeHatchPort.write('box-shadow', '0 1px 2px black')).toBe(false)
  })
})
