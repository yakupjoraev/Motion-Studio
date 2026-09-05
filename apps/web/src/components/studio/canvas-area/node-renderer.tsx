'use client'

import { EffectStack, blockRegistry, renderRegistry } from '@motion-studio/blocks'
import { NodeWrapper } from '@motion-studio/canvas'
import { selectors } from '@motion-studio/editor'
import {
  type BreakpointId,
  type NodeId,
  type UnknownProps,
  blockId,
  escapeHatchStyle,
} from '@motion-studio/schema'
import {
  type CSSProperties,
  type ComponentType,
  type ReactNode,
  Suspense,
  memo,
  useCallback,
  useMemo,
} from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { useNodeDropZone } from './node-drop-zone'
import { NodeErrorBoundary } from './node-error-boundary'
import { NodeMotion } from './node-motion'
import { useNodeDrag } from './use-node-drag'

/** A node that is not in the document still has to call the same hooks; nothing is registered for it. */
const EMPTY_BLOCK = blockId('container')
const EMPTY_PROPS: UnknownProps = {}
const EMPTY_CHILDREN: readonly NodeId[] = []

/**
 * CANVAS.md § Node rendering, as written. Each renderer subscribes to **its own node only**, so
 * editing node 7 re-renders node 7; `memo` on `id` keeps a parent's re-render from cascading into
 * children that did not change.
 */
export interface NodeRendererProps {
  readonly id: NodeId
  /** ADR-163. Absent means the breakpoint being edited; a comparison frame passes its own. */
  readonly breakpoint?: BreakpointId | undefined
}

export const NodeRenderer = memo(function NodeRenderer({ id, breakpoint }: NodeRendererProps) {
  const select = useMemo(() => selectors.selectResolvedNode(id, breakpoint), [breakpoint, id])
  const node = useStudioStore(useCallback((state) => select(state), [select]))

  /*
   * The drop zone is registered for the edited canvas only. A comparison frame renders the same node
   * ids at another breakpoint (ADR-163), and two zones under one id would leave dnd-kit holding
   * whichever mounted last — a drop aimed at the canvas landing against a frame beside it.
   */
  const zone = useNodeDropZone({
    id,
    blockId: node?.blockId ?? EMPTY_BLOCK,
    props: node?.props ?? EMPTY_PROPS,
    childIds: node?.children ?? EMPTY_CHILDREN,
    locked: node?.locked ?? true,
    disabled: breakpoint !== undefined,
  })

  // ADR-359. Same element, the other half of the gesture: this node as a drag source.
  const drag = useNodeDrag({
    id,
    blockId: node?.blockId ?? EMPTY_BLOCK,
    locked: node?.locked ?? true,
    hidden: node?.hidden ?? true,
    disabled: breakpoint !== undefined,
  })

  if (node === undefined || node.hidden) {
    return null
  }

  const definition = blockRegistry.get(node.blockId)
  const Component = renderRegistry[node.blockId] as
    | ComponentType<Record<string, unknown>>
    | undefined

  if (definition === undefined || Component === undefined) {
    return (
      <NodeWrapper drag={drag} dropRef={zone.ref} id={id}>
        <UnknownBlock blockId={node.blockId} name={node.name} />
      </NodeWrapper>
    )
  }

  // ADR-104: the schema is what fills in what the node does not store, so the renderer, the
  // inspector and the exporter all resolve a prop the same way.
  const parsed = definition.propsSchema.safeParse(node.props)

  // ADR-274: the escape hatch is the node's, so it rides the wrapper the rect cache already calls
  // this node's box, and the block stays a function of its own props.
  const escapeHatch: CSSProperties = { ...escapeHatchStyle(node.props, definition.capabilities) }

  const children: ReactNode = node.children.map((child) => (
    <NodeRenderer breakpoint={breakpoint} id={child} key={child} />
  ))

  return (
    <NodeWrapper drag={drag} dropRef={zone.ref} id={id} style={escapeHatch}>
      {/* The node's effects are siblings of its markup, never a wrapper around it: a block must not
          learn that it has any, which is what keeps its export honest. */}
      <EffectStack effects={node.effects} registry={blockRegistry} />
      <NodeErrorBoundary
        blockId={node.blockId}
        defaults={definition.defaults as Record<string, unknown>}
        nodeId={id}
        nodeName={node.name}
      >
        {parsed.success ? (
          // The boundary is per node and so is this: a suspending node inside a tree-wide boundary
          // would unmount every sibling's DOM while it loaded.
          <Suspense fallback={<NodeSkeleton />}>
            {/* Inside the boundary, so a preset that throws takes the node's card and not the
                canvas; outside the block, so the block never learns that it animates. */}
            <NodeMotion motion={node.motion}>
              <Component {...(parsed.data as Record<string, unknown>)}>{children}</Component>
            </NodeMotion>
          </Suspense>
        ) : (
          <InvalidProps blockId={node.blockId} message={parsed.error.issues[0]?.message ?? ''} />
        )}
      </NodeErrorBoundary>
    </NodeWrapper>
  )
})

/** A block the registry does not know. The node stays in the document; only its picture is missing. */
function UnknownBlock({ blockId, name }: { readonly blockId: string; readonly name: string }) {
  return (
    <div
      className="rounded-sm border border-border border-dashed p-3 text-foreground-muted text-xs"
      data-testid="unknown-block"
    >
      {name} — no block registered as “{blockId}”
    </div>
  )
}

function InvalidProps({
  blockId,
  message,
}: { readonly blockId: string; readonly message: string }) {
  return (
    <div
      className="rounded-sm border border-warning/40 bg-warning-muted/30 p-3 text-xs"
      data-testid="invalid-props"
      role="alert"
    >
      <span className="font-medium text-warning">{blockId} has props it cannot use</span>
      <span className="block text-foreground-muted">{message}</span>
    </div>
  )
}

/** A fixed size, so a lazy block loading in does not move the layout under the pointer. */
function NodeSkeleton() {
  return (
    <div
      className="h-24 w-full animate-pulse rounded-sm bg-surface-2"
      data-testid="node-skeleton"
    />
  )
}
