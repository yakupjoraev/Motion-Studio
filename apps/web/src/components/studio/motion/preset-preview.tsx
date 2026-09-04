'use client'

import {
  MotionNode,
  type MotionPreset,
  presetRegistry,
  useReducedMotion,
} from '@motion-studio/motion'
import { useMemo } from 'react'

import { specForPreset } from './apply-preset'

/**
 * The preview a card plays on hover, and it plays the **real preset** through the real applier —
 * PRODUCT.md § 2. A recorded clip would drift from the implementation the first time a parameter
 * changed, and a hand-written approximation would be a second implementation to keep in step.
 *
 * `playKey` remounts the subtree, which is how an entrance replays (see `MotionNode`'s note): an
 * entrance is what happens when an element mounts, so playing one again means mounting again.
 *
 * **The whole subtree is `pointer-events: none`, and that is load-bearing.** The card plays on focus
 * as well as on hover, so a press inside the preview focuses the button, increments `playKey` and
 * remounts the element the `mousedown` landed on — and a browser fires no `click` when that element
 * is gone by `mouseup`. Whether a card applied depended on whether the pointer happened to be over
 * the tile or over the padding around it (ADR-350). The preview is `aria-hidden` decoration; the
 * button is the only thing here a pointer has business hitting.
 */
export function PresetPreview({
  preset,
  playKey,
}: {
  readonly preset: MotionPreset
  readonly playKey: number
}) {
  const reduced = useReducedMotion()
  const motion = useMemo(() => ({ [preset.channel]: specForPreset(preset) }), [preset])

  if (reduced) {
    // A static card, not a slow one: the reduced design is a composition, not a slower animation.
    return <PreviewTile />
  }

  return (
    <MotionNode
      className="pointer-events-none"
      key={playKey}
      motion={motion}
      presets={presetRegistry}
      scale={1}
    >
      <PreviewTile />
    </MotionNode>
  )
}

function PreviewTile() {
  return (
    <span
      aria-hidden
      className="pointer-events-none block h-8 w-full rounded-xs bg-gradient-to-r from-accent/70 to-accent/20"
      data-testid="preset-preview-tile"
    />
  )
}
