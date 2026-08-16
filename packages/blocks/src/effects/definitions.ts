import { auroraBackgroundDefinition } from './aurora-background/aurora-background.definition'
import { beamsDefinition } from './beams/beams.definition'
import { borderBeamDefinition } from './border-beam/border-beam.definition'
import { dotGridDefinition } from './dot-grid/dot-grid.definition'
import { glowDefinition } from './glow/glow.definition'
import { grainOverlayDefinition } from './grain-overlay/grain-overlay.definition'
import { gridLinesDefinition } from './grid-lines/grid-lines.definition'
import { meshGradientDefinition } from './mesh-gradient/mesh-gradient.definition'
import { noiseOverlayDefinition } from './noise-overlay/noise-overlay.definition'
import { particlesDefinition } from './particles/particles.definition'
import { scanlinesDefinition } from './scanlines/scanlines.definition'
import { shineDefinition } from './shine/shine.definition'
import { spotlightDefinition } from './spotlight/spotlight.definition'

/**
 * Metadata only, reached through each block's `.definition` file — one React import in this graph
 * would stop `codegen` running under `node` (ADR-107).
 *
 * COMPONENT_LIBRARY.md § Catalogue order, which is the order the palette groups them in.
 */
export const definitions = {
  'aurora-background': auroraBackgroundDefinition,
  'mesh-gradient': meshGradientDefinition,
  'noise-overlay': noiseOverlayDefinition,
  'grain-overlay': grainOverlayDefinition,
  'dot-grid': dotGridDefinition,
  'grid-lines': gridLinesDefinition,
  spotlight: spotlightDefinition,
  beams: beamsDefinition,
  glow: glowDefinition,
  'border-beam': borderBeamDefinition,
  shine: shineDefinition,
  particles: particlesDefinition,
  scanlines: scanlinesDefinition,
} as const
