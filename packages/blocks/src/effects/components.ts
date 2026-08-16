import { lazy } from 'react'

import { AuroraBackground } from './aurora-background/aurora-background'
import { Beams } from './beams/beams'
import { BorderBeam } from './border-beam/border-beam'
import { DotGrid } from './dot-grid/dot-grid'
import { Glow } from './glow/glow'
import { GrainOverlay } from './grain-overlay/grain-overlay'
import { GridLines } from './grid-lines/grid-lines'
import { NoiseOverlay } from './noise-overlay/noise-overlay'
import { Scanlines } from './scanlines/scanlines'
import { Shine } from './shine/shine'
import { Spotlight } from './spotlight/spotlight'

/**
 * The two heavy ones are loaded on demand — COMPONENT_LIBRARY.md § Lazy loading names both. They are
 * the only effects that pay for themselves in element count (`particles`) or in paint area
 * (`mesh-gradient`), and the studio's first-load budget is 250 kB.
 */
const MeshGradient = lazy(async () => {
  const module = await import('./mesh-gradient/mesh-gradient')

  return { default: module.MeshGradient }
})

const Particles = lazy(async () => {
  const module = await import('./particles/particles')

  return { default: module.Particles }
})

export const components = {
  'aurora-background': AuroraBackground,
  'mesh-gradient': MeshGradient,
  'noise-overlay': NoiseOverlay,
  'grain-overlay': GrainOverlay,
  'dot-grid': DotGrid,
  'grid-lines': GridLines,
  spotlight: Spotlight,
  beams: Beams,
  glow: Glow,
  'border-beam': BorderBeam,
  shine: Shine,
  particles: Particles,
  scanlines: Scanlines,
} as const
