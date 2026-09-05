import { COLOR_MODE_SCRIPT, studioDark } from '@motion-studio/theme'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { notFound } from 'next/navigation'
import type { ReactNode } from 'react'

import { getDictionary } from '../../src/lib/i18n/dictionary'
import { ErrorDictionary } from '../../src/lib/i18n/error-surface'
import { LocaleProvider } from '../../src/lib/i18n/locale-context'
import { HTML_LANG, LOCALES, isLocale } from '../../src/lib/i18n/locales'
import { NavDictionary } from '../../src/lib/i18n/surfaces'
import '../globals.css'
import { ThemeBoot } from '../theme-boot'

/**
 * DESIGN_SYSTEM.md § Typography: self-hosted, `display: swap`, latin + latin-ext.
 *
 * `adjustFontFallback` is where most of a CLS budget goes if you skip it — PERFORMANCE.md § Fonts.
 * It is `next/font`'s default and it is written out because a later edit that turns it off would
 * cost a number nobody would connect back to this line.
 *
 * **Both faces preload.** The mono is not decoration on the landing page: the eyebrow, the stat row
 * and the demo's readout are all set in it and all above the fold, so leaving it to swap late
 * rewrapped the stat row at 1.3 s and moved everything under it — 0.07 of a 0.02 CLS budget,
 * measured (ADR-295).
 *
 * **`cyrillic` joins the subsets** with the second locale (ADR-361). Geist ships it, so a Russian
 * session gets the same face rather than a fallback: without the subset the browser paints Cyrillic
 * in its own serif and the studio's dense chrome shifts under it.
 */
const sans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  adjustFontFallback: true,
  preload: true,
})

const mono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin', 'latin-ext', 'cyrillic'],
  display: 'swap',
  adjustFontFallback: true,
  preload: false,
})

export const metadata: Metadata = {
  title: 'Motion Studio',
  description: 'A visual editor for modern React interfaces.',
}

/** Both locales are built. English is served at `/` by a rewrite — ADR-361. */
export function generateStaticParams(): { locale: string }[] {
  return LOCALES.map((locale) => ({ locale }))
}

export interface RootLayoutProps {
  children: ReactNode
  params: Promise<{ locale: string }>
}

/**
 * The default theme's mode, elevation and glass level, in the HTML the server sends — ADR-318. The
 * theme is known at build time, so the first paint is the theme rather than a step towards it.
 */
const boot = {
  'data-color-mode': studioDark.colorMode === 'system' ? undefined : studioDark.colorMode,
  'data-elevation': studioDark.elevationStyle,
  'data-glass': studioDark.surface.glassLevel,
}

export default async function RootLayout({ children, params }: RootLayoutProps) {
  const { locale } = await params

  // A path like `/de/blocks` reaches this layout with `de` in the segment. It is a 404, not a
  // fallback to English: a URL that quietly serves another language is a URL nobody can share.
  if (!isLocale(locale)) {
    notFound()
  }

  return (
    <html className={`${sans.variable} ${mono.variable}`} lang={HTML_LANG[locale]} {...boot}>
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
        <LocaleProvider locale={locale}>
          <ErrorDictionary value={getDictionary(locale).errors}>
            <NavDictionary value={getDictionary(locale).nav}>{children}</NavDictionary>
          </ErrorDictionary>
        </LocaleProvider>
        <ThemeBoot />
      </body>
    </html>
  )
}
