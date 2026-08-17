import { blockId, nodeId } from '@motion-studio/schema'
import { describe, expect, it } from 'vitest'

import { nodeZone } from './node-drop-zone'

const ID = nodeId('node_1')

const base = {
  id: ID,
  blockId: blockId('section'),
  props: {},
  childIds: [],
  locked: false,
  disabled: false,
}

describe('nodeZone', () => {
  it('registers the block’s first slot on the canvas surface', () => {
    expect(nodeZone(base)).toEqual({
      parentId: ID,
      slot: 'children',
      orientation: 'vertical',
      label: 'Section',
      childIds: [],
      surface: 'canvas',
      disabled: false,
    })
  })

  it('takes the orientation from the slot, which reads the node’s own props — ADR-130', () => {
    const grid = { ...base, blockId: blockId('grid'), props: { columns: 3 } }

    expect(nodeZone(grid).orientation).toBe('grid')
  })

  it('is disabled for a block that holds no children', () => {
    const heading = { ...base, blockId: blockId('heading') }

    expect(nodeZone(heading).disabled).toBe(true)
  })

  it('stays a zone when the node is locked, so the drop can say why', () => {
    const locked = nodeZone({ ...base, locked: true })

    expect(locked.disabled).toBe(true)
    expect(locked.parentId).toBe(ID)
  })

  it('registers nothing for a comparison frame', () => {
    expect(nodeZone({ ...base, disabled: true }).disabled).toBe(true)
  })
})
