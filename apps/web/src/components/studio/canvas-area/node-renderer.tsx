'use client'

import { EffectStack, blockRegistry, renderRegistry } from '@motion-studio/blocks'
import { NodeWrapper } from '@motion-studio/canvas'
import { selectors } from '@motion-studio/editor'
import type { BreakpointId, NodeId } from '@motion-studio/schema'
import { type ComponentType, type ReactNode, Suspense, memo, useCallback, useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { NodeErrorBoundary } from './node-error-boundary'
import { NodeMotion } from './node-motion'

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

  if (node === undefined || node.hidden) {
    return null
  }

  const definition = blockRegistry.get(node.blockId)
  const Component = renderRegistry[node.blockId] as
    | ComponentType<Record<string, unknown>>
    | undefined

  if (definition === undefined || Component === undefined) {
    return (
      <NodeWrapper id={id}>
        <UnknownBlock blockId={node.blockId} name={node.name} />
      </NodeWrapper>
    )
  }

  // ADR-104: the schema is what fills in what the node does not store, so the renderer, the
  // inspector and the exporter all resolve a prop the same way.
  const parsed = definition.propsSchema.safeParse(node.props)

  const children: ReactNode = node.children.map((child) => (
    <NodeRenderer breakpoint={breakpoint} id={child} key={child} />
  ))

  return (
    <NodeWrapper id={id}>
      {/* The node's effects are siblings of its markup, never a wrapper around it: a block must not
          learn that it has any, which is what keeps its export honest. */}
      <EffectStack effects={node.effects} registry={blockRegistry} />
      <NodeErrorBoundary blockId={node.blockId} nodeName={node.name}>
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
