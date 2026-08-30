'use client'

import { BREAKPOINTS } from '@motion-studio/schema'
import type { BlockCategory, BlockId, UnknownProps } from '@motion-studio/schema'
import { PRESETS, type PresetId, ThemeScope } from '@motion-studio/theme'
import type { ReactNode } from 'react'

import { BlockRender } from '../block-render'
import { PreviewFrame } from '../preview-frame'
import { PreviewSkeleton } from '../preview-skeleton'

import type { PreviewTheme } from './theme-switcher'
import type { PreviewWidth } from './viewport-switcher'

/** 16 : 10, so the frame keeps its room when the stage inside it changes width. */
const RATIO = 0.625

export interface BlockPreviewProps {
  readonly name: string
  readonly id: BlockId
  readonly category: BlockCategory
  readonly props: UnknownProps
  readonly width: PreviewWidth
  readonly theme: PreviewTheme
  readonly children?: ReactNode
}

/**
 * The block, running, at a breakpoint the visitor chose and in a theme they chose.
 *
 * The `ThemeScope` wraps the stage rather than the page — THEME_ENGINE.md § Scoped themes — so
 * switching a theme writes CSS variables on one element. Nothing unmounts, no chunk is refetched, and
 * a block mid-animation keeps its phase. That is the difference `prompts/52` asks to be checked by
 * eye, and it is the whole reason the theme engine resolves through variables.
 *
 * The stage is not `inert` here. A card shows a picture of a component; this is the component, and a
 * visitor who cannot press its button has not been shown it.
 *
 * It is a labelled `region` because the component brings its own headings — `hero-centered` contains
 * an `h1` — and a reader who walks into a second document deserves to be told. ACCESSIBILITY.md
 * § Landing, gallery, docs says so, and ADR-303 records why the answer is not an iframe.
 */
export function BlockPreview({
  name,
  id,
  category,
  props,
  width,
  theme,
  children,
}: BlockPreviewProps) {
  const frame = BREAKPOINTS[width].frame

  return (
    <section aria-label={`${name}, live preview`}>
      <ThemeScope
        className="overflow-hidden rounded-xl border border-border bg-surface-0"
        theme={PRESETS[theme as PresetId]}
      >
        <PreviewFrame height={Math.round(frame * RATIO)} testId="block-preview-stage" width={frame}>
          <BlockRender category={category} fallback={<PreviewSkeleton />} id={id} props={props}>
            {children}
          </BlockRender>
        </PreviewFrame>
      </ThemeScope>
    </section>
  )
}
