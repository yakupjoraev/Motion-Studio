import { DndContext } from '@dnd-kit/core'
import { blockId, nodeId } from '@motion-studio/schema'
import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { dragSourceId, useDraggableNode } from './use-draggable-node'

const HERO = nodeId('node_hero')

function Node({ surface = 'canvas' }: { readonly surface?: 'canvas' | 'tree' }) {
  const drag = useDraggableNode({
    nodeId: HERO,
    blockId: blockId('hero-centered'),
    nodeIds: [HERO],
    labels: ['Hero'],
    surface,
  })

  return (
    <div data-testid={`node-${surface}`} ref={drag.ref} {...drag.attributes}>
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

    const node = screen.getByTestId('node-canvas')

    expect(node).not.toHaveAttribute('role')
    expect(node).not.toHaveAttribute('tabindex')
    expect(node).toHaveAttribute('aria-roledescription', 'draggable layer')
  })

  /**
   * ADR-381, the second half: the canvas and the layers tree hold a source for the same node, and
   * dnd-kit keys its draggables by id. Under one id it kept whichever registered last, so a drag
   * begun on the canvas ended up reporting the tree row's box — measured in the browser, where a
   * keyboard drop resolved against the layers panel's coordinates. ADR-181 settled the same question
   * for zones; this is the identity a source needs for the same reason.
   */
  it('identifies a source by its surface, so two surfaces are two sources', () => {
    expect(dragSourceId('canvas', HERO)).not.toBe(dragSourceId('tree', HERO))
  })

  it('renders on both surfaces at once without either claiming the other', () => {
    render(
      <DndContext>
        <Node surface="canvas" />
        <Node surface="tree" />
      </DndContext>,
    )

    expect(screen.getByTestId('node-canvas')).toBeInTheDocument()
    expect(screen.getByTestId('node-tree')).toBeInTheDocument()
  })
})
