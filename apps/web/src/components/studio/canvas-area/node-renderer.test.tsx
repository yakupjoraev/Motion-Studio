import { RectCacheContext, createRectCache } from '@motion-studio/canvas'
import { commands } from '@motion-studio/editor'
import { type NodeId, blockId, createEmptyDocument, nodeId } from '@motion-studio/schema'
import { act, render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { useStudioStore } from '../../../store/editor-store'

import { NodeRenderer } from './node-renderer'

/** Counts the renders React actually performed, per block, and lets one of them throw on demand. */
const renders: Record<string, number> = {}
const broken = { heading: false }

vi.mock('@motion-studio/blocks', async () => {
  const actual =
    await vi.importActual<typeof import('@motion-studio/blocks')>('@motion-studio/blocks')

  const counted = Object.fromEntries(
    Object.entries(actual.renderRegistry).map(([id, Component]) => [
      id,
      (props: Record<string, unknown>) => {
        renders[id] = (renders[id] ?? 0) + 1

        if (id === 'heading' && broken.heading) {
          throw new Error('heading exploded')
        }

        const Block = Component as ComponentType<Record<string, unknown>>

        return <Block {...props} />
      },
    ]),
  )

  return { ...actual, renderRegistry: counted }
})

let counter = 0

const nextId = (): NodeId => {
  counter += 1

  return nodeId(`node_t${counter}`)
}

const root = (): NodeId => useStudioStore.getState().document.rootId

const insert = (parentId: NodeId, block: string): NodeId => {
  const id = nextId()

  act(() => {
    useStudioStore.getState().dispatch(
      commands.insertBlock({
        blockId: blockId(block),
        parentId,
        index: 0,
        slot: 'children',
        id,
      }),
    )
  })

  return id
}

const mount = () =>
  render(
    <RectCacheContext.Provider value={createRectCache()}>
      <NodeRenderer id={root()} />
    </RectCacheContext.Provider>,
  )

beforeEach(() => {
  broken.heading = false

  for (const key of Object.keys(renders)) {
    delete renders[key]
  }

  act(() => {
    useStudioStore.getState().replaceDocument(createEmptyDocument({ ids: () => nextId() }))
  })
})

describe('NodeRenderer', () => {
  it('renders a nested container → section → heading', () => {
    const section = insert(root(), 'section')

    insert(section, 'heading')
    mount()

    const heading = screen.getByRole('heading')

    expect(heading).toHaveTextContent('Heading')
    expect(heading.closest('section')).not.toBeNull()
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(3)
  })

  it('fills a node’s missing props from the block schema — ADR-104', () => {
    mount()

    // The root container stores `props: {}`, so every class on it is the schema's own defaults.
    const rendered = document.querySelector(`[data-node-id="${root()}"] > div`)

    expect(rendered?.className).toContain('flex-col')
    expect(rendered?.className).toContain('gap-4')
  })

  it('re-renders only the node that changed', () => {
    const section = insert(root(), 'section')
    const heading = insert(section, 'heading')

    mount()

    // One render each on mount: the root container, the section, the heading.
    expect({ ...renders }).toEqual({ container: 1, section: 1, heading: 1 })

    act(() => {
      useStudioStore
        .getState()
        .dispatch(commands.setProp({ nodeId: heading, path: 'text', value: 'Pricing' }))
    })

    expect(screen.getByRole('heading')).toHaveTextContent('Pricing')
    // The edit is one prop of one node, so exactly one component ran again.
    expect({ ...renders }).toEqual({ container: 1, section: 1, heading: 2 })
  })

  it('keeps the rest of the canvas alive when a block throws', () => {
    const section = insert(root(), 'section')

    insert(section, 'heading')
    broken.heading = true
    vi.spyOn(console, 'error').mockImplementation(() => undefined)

    mount()

    expect(screen.getByTestId('node-error')).toHaveTextContent('heading exploded')
    // The section around it and the document itself both survive.
    expect(document.querySelector(`[data-node-id="${section}"]`)).not.toBeNull()
    expect(Object.keys(useStudioStore.getState().document.nodes)).toHaveLength(3)
  })

  it('says so when the registry has no such block', () => {
    const section = insert(root(), 'section')

    act(() => {
      const document = useStudioStore.getState().document
      const node = document.nodes[section]

      if (node === undefined) {
        throw new Error('the fixture did not insert')
      }

      useStudioStore.getState().replaceDocument({
        ...document,
        nodes: { ...document.nodes, [section]: { ...node, blockId: blockId('never-shipped') } },
      })
    })

    mount()

    expect(screen.getByTestId('unknown-block')).toHaveTextContent('never-shipped')
  })

  it('renders nothing for a hidden node and keeps its siblings', () => {
    const heading = insert(root(), 'heading')

    insert(root(), 'section')

    act(() => {
      useStudioStore.getState().dispatch(commands.setVisibility({ ids: [heading], hidden: true }))
    })

    mount()

    expect(screen.queryByRole('heading')).not.toBeInTheDocument()
    expect(document.querySelectorAll('[data-node-id]')).toHaveLength(2)
  })
})
