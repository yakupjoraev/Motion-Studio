import { type NodeId, blockId, nodeId } from '@motion-studio/schema'
import type { Rect } from '@motion-studio/utils'
import { type RenderResult, render } from '@testing-library/react'
import { vi } from 'vitest'

import type { DropTarget, DropTargetResolver, DropZone, ZoneRectSource } from '../dnd.types'
import type { PlacementChild } from '../drop-placement'
import { DndProvider } from '../provider'
import { useDraggableBlock } from '../use-draggable-block'
import { useDraggableNode } from '../use-draggable-node'
import { useDropZone } from '../use-drop-zone'

export const ROOT = nodeId('node_root')
export const HERO = nodeId('node_hero')
export const INNER = nodeId('node_inner')

export const rect = (x: number, y: number, width: number, height: number): Rect => ({
  x,
  y,
  width,
  height,
})

/** Live geometry per zone, as the collision detector asks for it — one question, answered from a map. */
export function fakeRects(entries: Readonly<Record<string, Rect>>): ZoneRectSource {
  return {
    get: (zone: DropZone): Rect | undefined => entries[zone.parentId],
  }
}

/** The same for a zone's children, which is what a keyboard step counts positions against. */
export function fakeSiblings(
  entries: Readonly<Record<string, Rect>>,
): (zone: DropZone) => readonly PlacementChild[] {
  return (zone) =>
    zone.childIds.flatMap((id) => {
      const box = entries[id]

      return box === undefined ? [] : [{ id, rect: box }]
    })
}

export const zone = (overrides: Partial<DropZone> = {}): DropZone => ({
  parentId: ROOT,
  slot: 'children',
  orientation: 'vertical',
  label: 'Section',
  childIds: [HERO],
  surface: 'canvas',
  ...overrides,
})

/** Accepts everything at index 1, which is enough for the pipeline to be observable. */
export const acceptAt =
  (index: number): DropTargetResolver =>
  (attempt) => ({
    parentId: attempt.zone.parentId,
    slot: attempt.zone.slot,
    index,
    orientation: attempt.zone.orientation,
    indicator: { kind: 'line', rect: rect(0, 0, 100, 1), axis: 'y' },
  })

export const rejectWith =
  (reason: string): DropTargetResolver =>
  (attempt) => ({
    parentId: attempt.zone.parentId,
    slot: attempt.zone.slot,
    index: 0,
    orientation: attempt.zone.orientation,
    indicator: { kind: 'reject', rect: rect(0, 0, 100, 100), reason },
  })

function PaletteCard() {
  const { attributes, listeners, ref } = useDraggableBlock({
    blockId: blockId('hero-aurora'),
    label: 'Aurora hero, marketing block',
  })

  return (
    <button data-testid="palette-card" ref={ref} type="button" {...attributes} {...listeners}>
      Aurora hero
    </button>
  )
}

function CanvasNode({
  ids,
  labels,
}: { readonly ids: readonly NodeId[]; readonly labels: readonly string[] }) {
  const first = ids[0] ?? HERO
  const { attributes, listeners, ref } = useDraggableNode({
    surface: 'canvas',
    nodeId: first,
    blockId: blockId('hero-aurora'),
    nodeIds: ids,
    labels,
  })

  return (
    <button data-testid="canvas-node" ref={ref} type="button" {...attributes} {...listeners}>
      Hero
    </button>
  )
}

function Zone({ testId, ...options }: DropZone & { readonly testId: string }) {
  const { ref } = useDropZone(options)

  return <div data-testid={testId} ref={ref} />
}

export interface HarnessOptions {
  readonly resolveTarget?: DropTargetResolver
  readonly onDrop?: (target: DropTarget, payload: unknown) => void
  readonly rects?: Readonly<Record<string, Rect>>
  readonly zones?: readonly DropZone[]
  readonly nodeIds?: readonly NodeId[]
  readonly labels?: readonly string[]
  readonly zoom?: number
  readonly gridSize?: number
  /** Boxes for a zone's children, keyed by node id — the geometry a surface would supply. */
  readonly siblings?: Readonly<Record<string, Rect>>
}

export function renderDnd(options: HarnessOptions = {}): RenderResult & {
  readonly onDrop: ReturnType<typeof vi.fn>
} {
  const onDrop = vi.fn(options.onDrop)
  const zones = options.zones ?? [zone()]

  const view = render(
    <DndProvider
      gridSize={() => options.gridSize ?? 8}
      onDrop={onDrop}
      rects={fakeRects(options.rects ?? { [ROOT]: rect(0, 0, 400, 400) })}
      resolveTarget={options.resolveTarget ?? acceptAt(1)}
      siblings={fakeSiblings(options.siblings ?? {})}
      zoom={() => options.zoom ?? 1}
    >
      <PaletteCard />
      <CanvasNode ids={options.nodeIds ?? [HERO]} labels={options.labels ?? ['Hero']} />
      {zones.map((entry, index) => (
        <Zone key={`${entry.parentId}/${entry.slot}`} testId={`zone-${index}`} {...entry} />
      ))}
    </DndProvider>,
  )

  return { ...view, onDrop }
}
