import { lazy } from 'react'

import { HeroAppPreview } from './hero-app-preview/hero-app-preview'
import { HeroAurora } from './hero-aurora/hero-aurora'
import { HeroCentered } from './hero-centered/hero-centered'
import { HeroSplit } from './hero-split/hero-split'
import { HeroTerminal } from './hero-terminal/hero-terminal'

/**
 * `hero-video` is loaded on demand — COMPONENT_LIBRARY.md § Lazy loading names it. It is the only
 * block in this category that ships behaviour rather than markup, and the studio's first-load budget
 * is 250 kB (ENGINEERING_CONTRACT.md § 6). `NodeRenderer` already wraps each node in its own
 * `Suspense` with a fixed-size skeleton, so the swap costs no layout shift.
 */
const HeroVideo = lazy(async () => {
  const module = await import('./hero-video/hero-video')

  return { default: module.HeroVideo }
})

export const components = {
  'hero-centered': HeroCentered,
  'hero-split': HeroSplit,
  'hero-aurora': HeroAurora,
  'hero-video': HeroVideo,
  'hero-terminal': HeroTerminal,
  'hero-app-preview': HeroAppPreview,
} as const
