import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { PANEL_LAYOUT_SCRIPT } from '../../src/hooks/panel-layout'
import '../../src/styles/studio.css'

export const metadata: Metadata = {
  title: 'Studio · Motion Studio',
  description: 'The editor: canvas, inspector, motion, export.',
}

export interface StudioLayoutProps {
  children: ReactNode
}

export default function StudioLayout({ children }: StudioLayoutProps) {
  return (
    <>
      {/*
        The panel widths, restored before the first paint. Same reason as the colour-mode script: a
        width applied in an effect is a width the user watches jump.
      */}
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a blocking script cannot be a component */}
      <script dangerouslySetInnerHTML={{ __html: PANEL_LAYOUT_SCRIPT }} />
      {children}
    </>
  )
}
