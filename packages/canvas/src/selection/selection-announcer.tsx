'use client'

import type { NodeId } from '@motion-studio/schema'
import { type RefObject, useEffect, useMemo, useRef } from 'react'

import type { CanvasScene } from '../canvas.types'

/** ACCESSIBILITY.md § Canvas. Long enough that holding an arrow key produces one announcement. */
export const ANNOUNCE_DEBOUNCE_MS = 150

const blocks = (count: number): string => `${count} ${count === 1 ? 'block' : 'blocks'}`

const nameOf = (scene: CanvasScene, id: NodeId | null): string =>
  (id === null ? undefined : scene.node(id)?.name) ?? 'Canvas'

/**
 * "Hero selected. 2 of 6 in Page." — the position matters as much as the name, because on a canvas
 * a screen-reader user has no other way to know where in the section they have landed.
 */
export function describeSelection(scene: CanvasScene, rootId: NodeId): string {
  const ids = scene.selectedIds()
  const only = ids[0]

  if (only === undefined) {
    return 'Selection cleared.'
  }

  if (ids.length > 1) {
    return `${blocks(ids.length)} selected.`
  }

  const node = scene.node(only)

  if (node === undefined) {
    return 'Selection cleared.'
  }

  const parentId = node.parentId ?? rootId
  const siblings = scene.node(parentId)?.children ?? []
  const index = siblings.indexOf(only)

  if (index === -1) {
    return `${node.name} selected.`
  }

  return `${node.name} selected. ${index + 1} of ${siblings.length} in ${nameOf(scene, parentId)}.`
}

export function describeEnter(scene: CanvasScene, id: NodeId): string {
  const node = scene.node(id)

  return node === undefined
    ? 'Entered container.'
    : `Entered ${node.name}. ${blocks(node.children.length)} inside.`
}

export function describeExit(scene: CanvasScene, id: NodeId | null): string {
  return id === null ? 'Exited.' : `Exited ${nameOf(scene, id)}.`
}

export interface Announcer {
  readonly ref: RefObject<HTMLOutputElement | null>
  announce(message: string): void
}

/**
 * The region's text is written to the DOM rather than held in state: an announcement is not content
 * anything renders from, and putting it in state would re-render the canvas on every arrow key.
 */
export function useAnnouncer(): Announcer {
  const ref = useRef<HTMLOutputElement | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(
    () => () => {
      if (timer.current !== null) {
        clearTimeout(timer.current)
      }
    },
    [],
  )

  return useMemo<Announcer>(
    () => ({
      ref,
      announce(message) {
        if (timer.current !== null) {
          clearTimeout(timer.current)
        }

        timer.current = setTimeout(() => {
          timer.current = null

          if (ref.current !== null) {
            ref.current.textContent = message
          }
        }, ANNOUNCE_DEBOUNCE_MS)
      },
    }),
    [],
  )
}

export interface SelectionAnnouncerProps {
  readonly announcer: Announcer
}

/**
 * An `<output>` rather than a `div` with `role="status"`: the element carries that role implicitly,
 * so `getByRole('status')` and every screen reader see the same thing without the explicit attribute
 * ACCESSIBILITY.md § Canvas writes out.
 */
export function SelectionAnnouncer({ announcer }: SelectionAnnouncerProps) {
  return (
    <output
      aria-atomic="true"
      aria-live="polite"
      className="sr-only"
      data-testid="canvas-announcer"
      ref={announcer.ref}
    />
  )
}
