import { type ComponentType, lazy } from 'react'

/**
 * **Every effect is loaded on demand**, not only the two heavy ones.
 *
 * COMPONENT_LIBRARY.md § Lazy loading names `particles` and `mesh-gradient`, and they are the two
 * that need it on *runtime* cost. The other eleven are here for a different reason, measured: the
 * studio's first-load budget is 250 kB gzip (ENGINEERING_CONTRACT.md § 6) and this category is the
 * one thing on a canvas that a document usually does not carry. A node without effects should not
 * pay for thirteen of them, and `NodeRenderer` already wraps every node in its own `Suspense`.
 *
 * The definitions stay eager — the palette, the inspector and the exporter all read metadata — which
 * is the same split ADR-107 draws for blocks.
 */
const load = <T>(loader: () => Promise<Record<string, unknown>>, name: string) =>
  lazy(async () => {
    const module = await loader()

    return { default: module[name] as ComponentType<T> }
  })

export const components = {
  'aurora-background': load(
    () => import('./aurora-background/aurora-background'),
    'AuroraBackground',
  ),
  'mesh-gradient': load(() => import('./mesh-gradient/mesh-gradient'), 'MeshGradient'),
  'noise-overlay': load(() => import('./noise-overlay/noise-overlay'), 'NoiseOverlay'),
  'grain-overlay': load(() => import('./grain-overlay/grain-overlay'), 'GrainOverlay'),
  'dot-grid': load(() => import('./dot-grid/dot-grid'), 'DotGrid'),
  'grid-lines': load(() => import('./grid-lines/grid-lines'), 'GridLines'),
  spotlight: load(() => import('./spotlight/spotlight'), 'Spotlight'),
  beams: load(() => import('./beams/beams'), 'Beams'),
  glow: load(() => import('./glow/glow'), 'Glow'),
  'border-beam': load(() => import('./border-beam/border-beam'), 'BorderBeam'),
  shine: load(() => import('./shine/shine'), 'Shine'),
  particles: load(() => import('./particles/particles'), 'Particles'),
  scanlines: load(() => import('./scanlines/scanlines'), 'Scanlines'),
} as const
