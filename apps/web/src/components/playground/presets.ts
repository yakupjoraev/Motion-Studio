import type { PlaygroundProperty } from './properties'

/**
 * PLAYGROUND.md § Presets, transcribed. Each one is a starting point rather than a finished answer,
 * which is why they are short enough to read in the editor and edit in place.
 *
 * `swatch` is the CSS the button paints itself with. It is `aria-hidden` in the panel — the name is
 * the accessible one, and a gradient is not a label.
 */
export interface Preset {
  readonly name: string
  readonly value: string
  /** A declaration list for the little square beside the name. Decorative. */
  readonly swatch: string
}

import { BACKGROUND_PRESETS } from './presets.background'
import { FILTER_PRESETS } from './presets.filter'
import { MASK_PRESETS } from './presets.mask'
import { SHADOW_PRESETS } from './presets.shadow'
import { TRANSFORM_PRESETS } from './presets.transform'

/** The eight sandboxes' starting points, one group of properties per file. */
export const PRESETS: Readonly<Record<PlaygroundProperty, readonly Preset[]>> = {
  ...BACKGROUND_PRESETS,
  ...SHADOW_PRESETS,
  ...FILTER_PRESETS,
  ...MASK_PRESETS,
  ...TRANSFORM_PRESETS,
}
