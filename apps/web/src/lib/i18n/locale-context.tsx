'use client'

import { type ReactNode, createContext, useContext, useMemo } from 'react'

import type { Dictionary } from './dictionary'
import { localeHref } from './locale-href'
import type { Locale } from './locales'

export interface LocaleValue {
  readonly locale: Locale
  readonly dictionary: Dictionary
  /** An internal route, prefixed for the current locale — ADR-361. */
  readonly href: (path: string) => string
}

/*
 * No default dictionary: a component that reads strings outside the provider is a bug, and a silent
 * English fallback is how that bug reaches production looking like a translation gap.
 */
const LocaleContext = createContext<LocaleValue | null>(null)

export interface LocaleProviderProps {
  readonly locale: Locale
  /**
   * Handed down from a Server Component, so the strings travel as data in the RSC payload and the
   * client bundle carries neither dictionary (ADR-360).
   */
  readonly dictionary: Dictionary
  readonly children: ReactNode
}

export function LocaleProvider({ locale, dictionary, children }: LocaleProviderProps) {
  const value = useMemo<LocaleValue>(
    () => ({ locale, dictionary, href: (path: string) => localeHref(locale, path) }),
    [locale, dictionary],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleValue {
  const value = useContext(LocaleContext)

  if (value === null) {
    throw new Error('useLocale was called outside LocaleProvider')
  }

  return value
}

/** The dictionary alone, which is what most components want. */
export const useDictionary = (): Dictionary => useLocale().dictionary
