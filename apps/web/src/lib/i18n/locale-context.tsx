'use client'

import { type ReactNode, createContext, useContext, useMemo } from 'react'

import { localeHref } from './locale-href'
import type { Locale } from './locales'

export interface LocaleValue {
  readonly locale: Locale
  /** An internal route, prefixed for the current locale — ADR-361. */
  readonly href: (path: string) => string
}

/*
 * No default: a component that builds a link outside the provider would silently build an English
 * one, and a Russian page full of English links is a bug that looks like a translation gap.
 */
const LocaleContext = createContext<LocaleValue | null>(null)

export interface LocaleProviderProps {
  readonly locale: Locale
  readonly children: ReactNode
}

/**
 * The locale itself — which language, and how to build a link in it. **Not the strings**: those come
 * per surface (`surfaces.tsx`), so a page ships its own dictionary slice and no other.
 */
export function LocaleProvider({ locale, children }: LocaleProviderProps) {
  const value = useMemo<LocaleValue>(
    () => ({ locale, href: (path: string) => localeHref(locale, path) }),
    [locale],
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
