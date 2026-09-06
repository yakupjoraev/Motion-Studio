import { DndContext } from '@dnd-kit/core'
import { blockId, nodeId } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { useDraggableNode } from './use-draggable-node'

const HERO = nodeId('node_hero')

function Node() {
  const drag = useDraggableNode({
    nodeId: HERO,
    blockId: blockId('hero-centered'),
    nodeIds: [HERO],
    labels: ['Hero'],
  })

  return (
    <div data-testid="node" ref={drag.ref} {...drag.attributes}>
      <button type="button">Buy</button>
    </div>
  )
}

/**
 * The contract ADR-376 settled: the role and the tab order belong to the surface, and this hook hands
 * out neither. dnd-kit's defaults — `role="button"`, `tabIndex={0}` — fit a palette card and made a
 * canvas node a control wrapping the block's own controls.
 */
describe('useDraggableNode', () => {
  it('hands out the drag’s own attributes and neither a role nor a tab order', () => {
    render(
      <DndContext>
        <Node />
      </DndContext>,
    )

    const node = screen.getByTestId('node')

    expect(node).not.toHaveAttribute('role')
    expect(node).not.toHaveAttribute('tabindex')
    expect(node).toHaveAttribute('aria-roledescription', 'draggable layer')
  })
})
