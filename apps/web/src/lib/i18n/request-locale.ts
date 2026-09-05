import { cache } from 'react'

import { type Dictionary, getDictionary } from './dictionary'
import { DEFAULT_LOCALE, type Locale, isLocale } from './locales'

/**
 * A Server Component nested inside a route cannot read the route's params — only the page and the
 * layout receive them. Rather than thread the locale through every section of the landing page as a
 * prop, the page hands it to a request-scoped store and the sections read it back.
 *
 * `cache()` is what makes that safe: React gives each request (and each prerendered route) its own
 * value, so two locales rendering in the same build cannot see each other's.
 *
 * **Every page calls `setRequestLocale`.** A layout is not enough — Next renders a layout and its
 * page in the same pass rather than one before the other.
 */
const store = cache((): { current: Locale } => ({ current: DEFAULT_LOCALE }))

export function setRequestLocale(locale: string): Locale {
  const resolved = isLocale(locale) ? locale : DEFAULT_LOCALE

  store().current = resolved

  return resolved
}

export const getRequestLocale = (): Locale => store().current

/** What a section of a server-rendered page calls to read its strings. */
export const getRequestDictionary = (): Dictionary => getDictionary(getRequestLocale())
