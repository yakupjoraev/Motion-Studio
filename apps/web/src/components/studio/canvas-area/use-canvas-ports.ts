'use client'

import { blockRegistry } from '@motion-studio/blocks'
import type {
  CanvasMenuAction,
  CanvasMenuPort,
  CanvasMotionPort,
  CanvasResizePort,
  CanvasScene,
  CanvasSelectionPort,
} from '@motion-studio/canvas'
import { commands } from '@motion-studio/editor'
import { resolveResponsiveProps } from '@motion-studio/schema'
import { useMemo } from 'react'

import { useStudioStore } from '../../../store/editor-store'

import { menuAvailability, runMenuAction } from './menu-actions'
import { motionPlayback } from './motion-playback'
import { nodeSpacing } from './node-spacing'

export interface CanvasPorts {
  readonly scene: CanvasScene
  readonly selection: CanvasSelectionPort
  readonly menu: CanvasMenuPort
  readonly resize: CanvasResizePort
  readonly motion: CanvasMotionPort
}

/**
 * The two seams the canvas is built on, filled in with the real store. Every port reads
 * `getState()` inside the call rather than closing over a snapshot, so the objects are built once
 * and the canvas never re-renders because a port changed identity.
 */
export function useCanvasPorts(): CanvasPorts {
  return useMemo<CanvasPorts>(() => {
    const state = () => useStudioStore.getState()

    return {
      scene: {
        node(id) {
          const node = state().document.nodes[id]

          return node === undefined
            ? undefined
            : {
                parentId: node.parentId,
                name: node.name,
                children: node.children,
                locked: node.locked,
                hidden: node.hidden,
              }
        },
        isolationId: () => state().selection.isolationId,
        selectedIds: () => state().selection.ids,
        version: () => state().version,
        spacing(id) {
          const node = state().document.nodes[id]

          return node === undefined
            ? undefined
            : nodeSpacing(resolveResponsiveProps(node, state().viewport.breakpoint))
        },
        subscribe: (listener) => useStudioStore.subscribe(listener),
      },

      selection: {
        select: (ids, mode) => state().select(ids, mode),
        clear: () => state().clearSelection(),
        enter: (id) => state().enterNode(id),
        exit: () => state().exitNode(),
        hover: (id) => state().setHover(id),
        // ADR-105: the intent arrives and stops here. There is no property a 1 px displacement
        // corresponds to until a block declares a position.
        nudge: () => undefined,
      },

      menu: {
        unavailable: (action: CanvasMenuAction) => menuAvailability(state(), action),
        run: (action: CanvasMenuAction) => runMenuAction(useStudioStore, action),
      },

      resize: {
        // ADR-108: the registry is what knows whether a block holds a size, and it is the host that
        // can read it.
        resizable(id) {
          const node = state().document.nodes[id]

          return node === undefined
            ? false
            : (blockRegistry.get(node.blockId)?.capabilities.resizable ?? false)
        },

        commit(id, size) {
          state().dispatchBatch(
            [
              commands.setProp({ nodeId: id, path: 'width', value: Math.round(size.width) }),
              commands.setProp({ nodeId: id, path: 'height', value: Math.round(size.height) }),
            ],
            'Resize block',
          )
        },
      },

      motion: {
        paused: () => state().viewport.motionPaused,
        setPaused: (paused) => {
          if (paused !== state().viewport.motionPaused) {
            state().toggleMotionPaused()
          }
        },
        // Remounting the motion wrappers is the replay: an entrance is what happens when an element
        // mounts, so there is no "play again" on a variant already at its destination.
        replay: () => motionPlayback.replay(),
      },
    }
  }, [])
}
