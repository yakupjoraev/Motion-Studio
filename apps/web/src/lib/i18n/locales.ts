/**
 * Two locales, and the list is the source of truth for the routing, the dictionaries and the
 * switch — ADR-360. English is the default because it is the language the product was written in;
 * ADR-361 is what makes it the *unprefixed* one.
 */
export const LOCALES = ['en', 'ru'] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'en'

export const isLocale = (value: string | undefined): value is Locale =>
  value !== undefined && (LOCALES as readonly string[]).includes(value)

/** What `<html lang>` says, and what `Intl` is handed. */
export const HTML_LANG: Record<Locale, string> = {
  en: 'en',
  ru: 'ru',
}

/** The name each locale calls itself — a switch that reads "Russian" to a Russian speaker is worse. */
export const LOCALE_NAME: Record<Locale, string> = {
  en: 'English',
  ru: 'Русский',
}

/** The two-letter badge the compact switch shows when there is no room for the full name. */
export const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN',
  ru: 'RU',
}
