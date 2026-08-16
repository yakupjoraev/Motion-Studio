import { blockRegistry } from '@motion-studio/blocks'
import { type EditorStore, commands } from '@motion-studio/editor'
import type { MotionPreset } from '@motion-studio/motion'
import type { MotionChannel, MotionSpec, MotionTrigger, NodeId } from '@motion-studio/schema'

/**
 * The default trigger for a channel. ANIMATION_SYSTEM.md pairs each channel with the event that
 * starts it, and a preset applied from a card has to arrive with one — `motionSpecSchema` rejects a
 * spec without it, and a panel that produced an invalid spec would fail on reload rather than on the
 * click that caused it.
 */
const TRIGGERS: Readonly<Record<MotionChannel, MotionTrigger>> = {
  entrance: { kind: 'inView', amount: 0.3, once: true, margin: '0px' },
  scroll: { kind: 'scrollProgress', start: 'top bottom', end: 'bottom top' },
  hover: { kind: 'hover' },
  press: { kind: 'press' },
  cursor: { kind: 'pointerMove', within: 'element' },
  continuous: { kind: 'always' },
  exit: { kind: 'mount' },
}

export const specForPreset = (preset: MotionPreset): MotionSpec => ({
  presetId: preset.id,
  channel: preset.channel,
  trigger: TRIGGERS[preset.channel],
  params: preset.defaults,
})

/** Which of the selected nodes can take this preset — a block declares the channels it supports. */
export function targetsFor(store: EditorStore, channel: MotionChannel): readonly NodeId[] {
  const state = store.getState()

  return state.selection.ids.filter((id) => {
    const node = state.document.nodes[id]
    const definition = node === undefined ? undefined : blockRegistry.get(node.blockId)

    return definition?.capabilities.supportsMotion.includes(channel) === true
  })
}

/**
 * Applying is a command, so it undoes — PRODUCT.md § 2. One batch for the whole selection, so a
 * preset applied to five sections is one entry in the history rather than five.
 */
export function applyPreset(store: EditorStore, preset: MotionPreset): void {
  const targets = targetsFor(store, preset.channel)

  if (targets.length === 0) {
    return
  }

  const spec = specForPreset(preset)

  store.getState().dispatchBatch(
    targets.map((nodeId) => commands.setMotion({ nodeId, spec })),
    `Apply ${preset.name}`,
  )
}

/** Removing the channel is the same command in reverse, and undoes the same way. */
export function clearChannel(store: EditorStore, channel: MotionChannel): void {
  const ids = store.getState().selection.ids

  if (ids.length === 0) {
    return
  }

  store.getState().dispatchBatch(
    ids.map((nodeId) => commands.clearMotion({ nodeId, channel })),
    `Clear ${channel} motion`,
  )
}
