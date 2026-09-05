import { registryCopy } from '@motion-studio/blocks/i18n'
import { type RenderOptions, type RenderResult, render as baseRender } from '@testing-library/react'
import type { ReactElement, ReactNode } from 'react'

import { en } from '../lib/i18n/dictionaries/en'
import { LocaleProvider } from '../lib/i18n/locale-context'
import { DEFAULT_LOCALE } from '../lib/i18n/locales'
import { RegistryDictionary, StudioDictionary } from '../lib/i18n/studio-surface'
import {
  DocsDictionary,
  GalleryDictionary,
  LandingDictionary,
  NavDictionary,
} from '../lib/i18n/surfaces'

export * from '@testing-library/react'

/**
 * The providers a route lays down, in one wrapper for a component test.
 *
 * A component that reads a string throws outside its provider — deliberately, because a silent
 * English fallback is how a missing provider reaches production looking like a translation gap
 * (`create-dictionary-context.tsx`). That strictness is what makes this file necessary: a test
 * renders one component, not a route, so the route's providers have to come from somewhere.
 *
 * English, because a component test is about behaviour. The translations have their own tests —
 * `registry-copy.test.ts` for the registry, `dictionary-parity.test.ts` for the app.
 */
function Providers({ children }: { readonly children: ReactNode }) {
  return (
    <LocaleProvider locale={DEFAULT_LOCALE}>
      <NavDictionary value={en.nav}>
        <LandingDictionary value={en.landing}>
          <GalleryDictionary value={en.gallery}>
            <DocsDictionary value={en.docs}>
              <StudioDictionary value={en.studio}>
                <RegistryDictionary value={{ copy: registryCopy(DEFAULT_LOCALE) }}>
                  {children}
                </RegistryDictionary>
              </StudioDictionary>
            </DocsDictionary>
          </GalleryDictionary>
        </LandingDictionary>
      </NavDictionary>
    </LocaleProvider>
  )
}

export function render(ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>): RenderResult {
  return baseRender(ui, { wrapper: Providers, ...options })
}
