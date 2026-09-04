'use client'

import type { NodeId } from '@motion-studio/schema'
import { useEffect } from 'react'

import type { CanvasScene } from '../canvas.types'

import { type Announcer, describeSelection, useAnnouncer } from './selection-announcer'

/**
 * Every selection change, whatever made it — ACCESSIBILITY.md § Canvas asks for a live region "on
 * every change", and the three gesture paths that announce for themselves are not every change: the
 * layers tree, an insert from the palette and an undo all write the selection through the store and
 * used to arrive in silence (ADR-326).
 *
 * The announcer is returned as well, because the gesture paths still announce the sentence they have
 * more context for — a marquee says what it caught, not what is selected now.
 */
export function useSelectionAnnouncements(scene: CanvasScene, rootId: NodeId): Announcer {
  const announcer = useAnnouncer()

  useEffect(() => {
    let previous = scene.selectedIds().join(',')

    return scene.subscribe(() => {
      const current = scene.selectedIds().join(',')

      if (current === previous) {
        return
      }

      previous = current
      announcer.announce(describeSelection(scene, rootId))
    })
  }, [announcer, rootId, scene])

  return announcer
}
