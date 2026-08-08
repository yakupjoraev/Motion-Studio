import type { EffectId } from '../ids/ids'

export type { EffectId }

/** The CSS `mix-blend-mode` values an effect layer is allowed to use. */
export const BLEND_MODES = [
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
] as const

export type BlendMode = (typeof BLEND_MODES)[number]

/**
 * COMPONENT_LIBRARY.md § Effects: an effect attaches to a node rather than replacing it, and a node
 * can carry several in order. `id` identifies the instance so the inspector's stack editor can
 * reorder and remove without touching the others; `effectId` names the catalogue entry.
 */
export interface EffectInstance {
  readonly id: string
  readonly effectId: EffectId
  readonly params: Readonly<Record<string, unknown>>
  readonly layer: 'behind' | 'front'
  readonly blendMode: BlendMode
  readonly opacity: number
}
