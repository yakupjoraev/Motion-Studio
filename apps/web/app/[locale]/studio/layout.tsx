import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { registryCopy } from '@motion-studio/blocks/i18n'

import { PANEL_LAYOUT_SCRIPT } from '../../../src/hooks/panel-layout'
import { getDictionary } from '../../../src/lib/i18n/dictionary'
import { DEFAULT_LOCALE, isLocale } from '../../../src/lib/i18n/locales'
import { RegistryDictionary, StudioDictionary } from '../../../src/lib/i18n/studio-surface'
import '../../../src/styles/studio.css'

export interface StudioLayoutProps {
  children: ReactNode
  params: Promise<{ readonly locale: string }>
}

export async function generateMetadata({ params }: StudioLayoutProps): Promise<Metadata> {
  const { locale } = await params
  const { studio } = getDictionary(isLocale(locale) ? locale : DEFAULT_LOCALE)

  return { title: studio.chrome.metaTitle, description: studio.chrome.metaDescription }
}

/**
 * The studio is one client island, so its strings are provided once here rather than page by page:
 * everything under this layout — the shell, the panels, the dialogs — reads the same slice.
 */
export default async function StudioLayout({ children, params }: StudioLayoutProps) {
  const { locale } = await params
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE
  const { studio } = getDictionary(resolved)

  return (
    <StudioDictionary value={studio}>
      <RegistryDictionary value={{ copy: registryCopy(resolved) }}>
        {/*
        The panel widths, restored before the first paint. Same reason as the colour-mode script: a
        width applied in an effect is a width the user watches jump.
      */}
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: a blocking script cannot be a component */}
        <script dangerouslySetInnerHTML={{ __html: PANEL_LAYOUT_SCRIPT }} />
        {children}
      </RegistryDictionary>
    </StudioDictionary>
  )
}
