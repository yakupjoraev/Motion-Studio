import { commands } from '@motion-studio/editor'
import { type NodeId, blockId, createEmptyDocument, nodeId } from '@motion-studio/schema'
import { beforeEach, describe, expect, it } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { menuAvailability, runMenuAction } from './menu-actions'

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_m${counter}`)
}

const state = () => useStudioStore.getState()
const root = (): NodeId => state().document.rootId

const insert = (parentId: NodeId, block: string): NodeId => {
  const id = nextId()

  state().dispatch(
    commands.insertBlock({ blockId: blockId(block), parentId, index: 0, slot: 'children', id }),
  )

  return id
}

beforeEach(() => {
  state().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
  state().clearSelection()
  state().setBreakpoint('base')
})

describe('menuAvailability', () => {
  it('asks for a selection before it offers to act on one', () => {
    expect(menuAvailability(state(), 'duplicate')).toBe('Select a block first')
    expect(menuAvailability(state(), 'copy')).toBe('Select a block first')
  })

  it('says what the clipboard is missing', () => {
    expect(menuAvailability(state(), 'paste')).toBe('Clipboard is empty')
    expect(menuAvailability(state(), 'pasteStyle')).toBe('Copy a block’s style first')
  })

  it('refuses to unwrap a block with no children, and names it', () => {
    const heading = insert(root(), 'heading')

    state().select([heading])

    expect(menuAvailability(state(), 'unwrap')).toContain('has no children')
  })

  it('offers unwrap once the block has children', () => {
    const section = insert(root(), 'section')

    insert(section, 'heading')
    state().select([section])

    expect(menuAvailability(state(), 'unwrap')).toBeUndefined()
  })

  it('offers duplicate and delete on a selected block, and not on the page', () => {
    const section = insert(root(), 'section')

    state().select([section])

    expect(menuAvailability(state(), 'duplicate')).toBeUndefined()

    state().select([root()])

    expect(menuAvailability(state(), 'delete')).toBe('The page itself cannot be')
  })

  it('offers reset overrides only where there are overrides', () => {
    const section = insert(root(), 'section')

    state().select([section])
    state().setBreakpoint('lg')

    expect(menuAvailability(state(), 'resetOverrides')).toBe('No overrides at this breakpoint')

    state().dispatch(
      commands.setResponsiveProp({
        nodeId: section,
        breakpoint: 'lg',
        path: 'padding',
        value: 'sm',
      }),
    )

    expect(menuAvailability(state(), 'resetOverrides')).toBeUndefined()
  })

  it('says which prompt the one unbuilt item is waiting for — ADR-098', () => {
    expect(menuAvailability(state(), 'addMotion')).toContain('motion engine')
  })

  it('offers Copy React with a selection and not without one', () => {
    expect(menuAvailability(state(), 'copyReact')).toBe('Select a block first')

    state().select([insert(root(), 'section')])

    expect(menuAvailability(state(), 'copyReact')).toBeUndefined()
  })
})

describe('runMenuAction', () => {
  it('duplicates the selection', () => {
    const section = insert(root(), 'section')

    state().select([section])
    runMenuAction(useStudioStore, 'duplicate')

    expect(state().document.nodes[root()]?.children).toHaveLength(2)
  })

  it('deletes the selection', () => {
    const section = insert(root(), 'section')

    state().select([section])
    runMenuAction(useStudioStore, 'delete')

    expect(state().document.nodes[section]).toBeUndefined()
  })

  it('moves a block among its siblings', () => {
    const first = insert(root(), 'section')
    const second = insert(root(), 'heading')

    // `insertBlock` puts each at index 0, so the order is [second, first].
    state().select([second])
    runMenuAction(useStudioStore, 'sendBackward')

    expect(state().document.nodes[root()]?.children).toEqual([second, first])

    runMenuAction(useStudioStore, 'bringForward')

    expect(state().document.nodes[root()]?.children).toEqual([first, second])
  })

  it('wraps a selection in a container and unwraps it again', () => {
    const heading = insert(root(), 'heading')

    state().select([heading])
    runMenuAction(useStudioStore, 'wrap')

    const wrapper = state().document.nodes[heading]?.parentId

    expect(wrapper).not.toBe(root())

    state().select([wrapper as NodeId])
    runMenuAction(useStudioStore, 'unwrap')

    expect(state().document.nodes[heading]?.parentId).toBe(root())
  })

  it('clears every override at the current breakpoint', () => {
    const section = insert(root(), 'section')

    state().setBreakpoint('lg')
    state().dispatch(
      commands.setResponsiveProp({
        nodeId: section,
        breakpoint: 'lg',
        path: 'padding',
        value: 'sm',
      }),
    )
    state().select([section])
    runMenuAction(useStudioStore, 'resetOverrides')

    expect(state().document.nodes[section]?.responsive['lg']).toBeUndefined()
  })

  it('does nothing for the item that is only a reason', () => {
    const before = state().version

    runMenuAction(useStudioStore, 'addMotion')

    expect(state().version).toBe(before)
  })

  /** Copy React reads the document and writes to the clipboard; it must not edit anything. */
  it('leaves the document alone when it copies React', () => {
    const before = state().version

    runMenuAction(useStudioStore, 'copyReact')

    expect(state().version).toBe(before)
  })
})
