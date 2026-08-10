'use client'

import { useSyncExternalStore } from 'react'

import { CellIndicator } from './cell-indicator'
import { FillIndicator } from './fill-indicator'
import type { IndicatorHandle, IndicatorKind } from './indicator-handle'
import { LineIndicator } from './line-indicator'
import { RejectIndicator } from './reject-indicator'

export interface DropIndicatorLayerProps {
  readonly handle: IndicatorHandle
}

const NONE = (): IndicatorKind => 'none'
const NO_REASON = (): string | null => null

/**
 * One element per kind, and the element is moved by the handle rather than by props: crossing a
 * midpoint swaps the element, moving between midpoints does not touch React at all.
 */
export function DropIndicatorLayer({ handle }: DropIndicatorLayerProps) {
  const kind = useSyncExternalStore(handle.subscribe, handle.kind, NONE)
  const reason = useSyncExternalStore(handle.subscribe, handle.reason, NO_REASON)

  switch (kind) {
    case 'line':
      return <LineIndicator attach={handle.attach} />
    case 'fill':
      return <FillIndicator attach={handle.attach} />
    case 'cell':
      return <CellIndicator attach={handle.attach} />
    case 'reject':
      return <RejectIndicator attach={handle.attach} reason={reason ?? ''} />
    default:
      return null
  }
}
