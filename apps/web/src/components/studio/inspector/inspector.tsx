'use client'

import { blockRegistry } from '@motion-studio/blocks'
import type { NodeId } from '@motion-studio/schema'
import { PanelHeader, ScrollArea } from '@motion-studio/ui'
import dynamic from 'next/dynamic'
import { useMemo } from 'react'

import { usePersistedSections } from '../../../hooks/use-persisted-sections'
import { useStudioStore } from '../../../store/editor-store'

import { InspectorEmpty } from './inspector-empty'
import { ResponsiveHeader } from './responsive-header'
import { useResponsiveHintVisible } from './use-responsive-edit'

/**
 * The panel's shell and its no-selection state are first-load; everything that edits a block is not.
 * A studio that has just opened has nothing selected, so the rows, the sections and the controls
 * under them are a chunk it never downloads — the contract's 250 kB budget for `/studio`.
 */
const BlockInspector = dynamic(
  () => import('./block-inspector').then((module) => module.BlockInspector),
  { loading: () => <InspectorSkeleton /> },
)

const InspectorMulti = dynamic(
  () => import('./inspector-multi').then((module) => module.InspectorMulti),
  { loading: () => <InspectorSkeleton /> },
)

/**
 * The guardrail is a chunk of its own, and it is mounted only once it has something to say: the hint
 * carries an icon pair and a button, and a studio that never triggers it never downloads them.
 */
const ResponsiveHint = dynamic(
  () => import('./responsive-hint').then((module) => module.ResponsiveHint),
  { ssr: false },
)

const InspectorSkeleton = () => (
  <div className="flex flex-col gap-2 p-3" data-testid="inspector-loading">
    <span className="h-7 w-full animate-pulse rounded-xs bg-surface-2" />
    <span className="h-7 w-full animate-pulse rounded-xs bg-surface-2" />
  </div>
)

/**
 * PRODUCT.md § 4: generated from the selected block's schema. This file routes on how much is
 * selected and does nothing else — every control below it comes from block metadata, so adding a
 * prop to a block is one change and never a change here.
 */
export function Inspector() {
  usePersistedSections()

  const hintVisible = useResponsiveHintVisible()

  const selectionKey = useStudioStore((state) => state.selection.ids.join(' '))
  const nodeIds = useMemo(
    () => (selectionKey === '' ? [] : (selectionKey.split(' ') as NodeId[])),
    [selectionKey],
  )
  const blockId = useStudioStore((state) => {
    const [id] = state.selection.ids

    return id === undefined ? null : (state.document.nodes[id]?.blockId ?? null)
  })
  const name = useStudioStore((state) => {
    const [id] = state.selection.ids

    return id === undefined ? null : (state.document.nodes[id]?.name ?? null)
  })

  const definition = blockId === null ? undefined : blockRegistry.get(blockId)

  return (
    <div className="flex h-full flex-col">
      <PanelHeader title={nodeIds.length === 1 ? (name ?? 'Inspector') : 'Inspector'} />
      {hintVisible ? <ResponsiveHint /> : null}
      <ResponsiveHeader />
      <ScrollArea className="flex-1">
        {nodeIds.length === 0 && <InspectorEmpty />}
        {nodeIds.length === 1 && definition !== undefined && (
          <BlockInspector definition={definition} nodeIds={nodeIds} />
        )}
        {nodeIds.length === 1 && definition === undefined && (
          <p className="p-3 text-foreground-muted text-xs">
            No block is registered as “{blockId}”, so there is nothing to edit.
          </p>
        )}
        {nodeIds.length > 1 && <InspectorMulti nodeIds={nodeIds} />}
      </ScrollArea>
    </div>
  )
}
