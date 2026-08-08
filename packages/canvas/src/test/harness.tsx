import { type NodeId, nodeId } from '@motion-studio/schema'
import { type RenderResult, render } from '@testing-library/react'
import { vi } from 'vitest'

import { Canvas, type CanvasProps } from '../canvas'
import { NodeWrapper } from '../node-wrapper'

import type { FakeScene } from './scene'

/** Renders the fake tree through the real `NodeWrapper`, which is what hit testing reads. */
function renderTree(fake: FakeScene, id: NodeId): React.ReactNode {
  const node = fake.scene.node(id)

  return (
    <NodeWrapper id={id} key={id}>
      <span>{node?.name}</span>
      {node?.children.map((child) => renderTree(fake, child))}
    </NodeWrapper>
  )
}

export interface CanvasHarnessOptions extends Partial<CanvasProps> {
  readonly onRender?: (() => void) | undefined
}

export function renderCanvas(fake: FakeScene, options: CanvasHarnessOptions = {}): RenderResult {
  const { onRender, ...props } = options

  function Host(hostProps: { readonly children: React.ReactNode }) {
    onRender?.()

    return hostProps.children
  }

  const view = render(
    <Host>
      <Canvas
        artboardWidth={1440}
        renderNode={(id) => renderTree(fake, id)}
        rootId={fake.rootId}
        scene={fake.scene}
        selection={fake.selection}
        {...props}
      />
    </Host>,
  )

  return view
}

/**
 * jsdom has no layout, so `elementsFromPoint` is handed the stack it would have found: the element
 * named, then every ancestor of it that carries a node id, deepest first.
 */
export function pointAt(name: string | null): void {
  if (name === null) {
    vi.spyOn(document, 'elementsFromPoint').mockReturnValue([])

    return
  }

  const target = document.querySelector(`[data-node-id="${nodeId(`node_${name}`)}"]`)
  const stack: Element[] = []
  let current: Element | null = target

  while (current !== null) {
    if (current.hasAttribute('data-node-id')) {
      stack.push(current)
    }

    current = current.parentElement
  }

  vi.spyOn(document, 'elementsFromPoint').mockReturnValue(stack)
}

/** Gives every wrapper a box, since jsdom reports zeros for all of them. */
export function layoutNodes(boxes: Record<string, DOMRect | Omit<DOMRect, 'toJSON'>>): void {
  for (const [name, box] of Object.entries(boxes)) {
    const element = document.querySelector(`[data-node-id="${nodeId(`node_${name}`)}"]`)

    if (element !== null) {
      element.getBoundingClientRect = () => box as DOMRect
    }
  }
}
