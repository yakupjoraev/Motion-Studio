import { COLOR_MODE_SCRIPT } from '@motion-studio/theme'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import './globals.css'
import { ThemeBoot } from './theme-boot'

export const metadata: Metadata = {
  title: 'Motion Studio',
  description: 'A visual editor for modern React interfaces.',
}

export interface RootLayoutProps {
  children: ReactNode
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en">
      <head>
        {/*
          The one blocking script in the app — THEME_ENGINE.md § Colour mode. It applies a *stored*
          preference before first paint; the system preference is handled by the stylesheet's own media
          query, so a first visit needs no script at all (ADR-026).
        */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a blocking head script cannot be a component */}
        <script dangerouslySetInnerHTML={{ __html: COLOR_MODE_SCRIPT }} />
      </head>
      <body>
        {children}
        <ThemeBoot />
      </body>
    </html>
  )
}
